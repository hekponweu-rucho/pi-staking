<?php

namespace App\Services;

use App\Models\Audit;
use App\Models\Deposit;
use App\Models\DepositAddress;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class DepositService
{
    public function assignAddressForUser(User $user): array
    {
        return DB::transaction(function () use ($user) {
            $this->releaseExpiredReservations();

            $policy = config('deposits.policy_on_rerequest', 'refuse');
            if ($policy === 'refuse') {
                $existing = Deposit::query()
                    ->where('user_id', $user->id)
                    ->where('status', Deposit::STATUS_PENDING)
                    ->whereHas('address', function ($q) {
                        $q->whereNotNull('assigned_to_user_id')
                          ->where('expires_at', '>', now());
                    })
                    ->latest('id')
                    ->first();

                if ($existing) {
                    $expires = optional($existing->address)->expires_at;
                    throw new Exception('Une adresse vous est déjà attribuée jusqu\'à ' . ($expires ? $expires->toDateTimeString() : 'expiration'));
                }
            }

            $address = DepositAddress::query()
                ->free()
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (!$address) {
                throw new Exception('Aucune adresse de dépôt n\'est disponible pour le moment');
            }

            $ttl = (int) config('deposits.reservation_ttl_minutes', 15);
            $address->assigned_to_user_id = $user->id;
            $address->assigned_at = now();
            $address->expires_at = now()->clone()->addMinutes($ttl);
            $address->save();

            $deposit = Deposit::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'amount' => null,
                'tx_hash' => null,
                'status' => Deposit::STATUS_PENDING,
                'confirmed_at' => null,
            ]);

            Log::channel('daily')->info('Adresse de dépôt attribuée', [
                'action' => 'address_allocated',
                'user_id' => $user->id,
                'deposit_id' => $deposit->id,
                'address_id' => $address->id,
                'address' => $address->address,
                'expires_at' => $address->expires_at,
            ]);

            $this->createAudit(
                actorId: $user->id,
                action: 'deposit.address_allocated',
                auditableType: Deposit::class,
                auditableId: $deposit->id,
                event: 'created',
                oldValues: null,
                newValues: [
                    'address_id' => $address->id,
                    'expires_at' => (string) $address->expires_at,
                ],
                metadata: [
                    'address' => $address->address,
                ]
            );

            return [
                'id' => $deposit->id,
                'address' => $address->address,
                'expires_at' => $address->expires_at,
            ];
        });
    }

    public function releaseExpiredReservations(): void
    {
        DB::transaction(function () {
            $expiredAddresses = DepositAddress::expiredReservations()->lockForUpdate()->get();

            foreach ($expiredAddresses as $addr) {
                $pendingDeposits = Deposit::where('address_id', $addr->id)
                    ->where('status', Deposit::STATUS_PENDING)
                    ->get();

                if ($pendingDeposits->isNotEmpty()) {
                    foreach ($pendingDeposits as $dep) {
                        $before = $dep->status;
                        $dep->update(['status' => Deposit::STATUS_EXPIRED]);

                        Log::channel('daily')->info('Dépôt expiré suite à réservation expirée', [
                            'action' => 'deposit_expired',
                            'deposit_id' => $dep->id,
                            'user_id' => $dep->user_id,
                            'address_id' => $addr->id,
                            'status_before' => $before,
                            'status_after' => $dep->status,
                        ]);

                        $this->createAudit(
                            actorId: null,
                            action: 'deposit.status_change',
                            auditableType: Deposit::class,
                            auditableId: $dep->id,
                            event: 'updated',
                            oldValues: ['status' => $before],
                            newValues: ['status' => $dep->status],
                            metadata: [
                                'reason' => 'reservation_expired',
                                'address_id' => $addr->id,
                            ]
                        );
                    }
                }

                $addr->assigned_to_user_id = null;
                $addr->assigned_at = null;
                $addr->expires_at = null;
                $addr->save();

                Log::channel('daily')->info('Réservation d\'adresse libérée', [
                    'action' => 'address_reservation_released',
                    'address_id' => $addr->id,
                    'address' => $addr->address,
                ]);
            }
        });
    }

    public function handleDetectedTransaction(string $address, string $txHash, string $amount, int $confirmations): void
    {
        DB::transaction(function () use ($address, $txHash, $amount, $confirmations) {
            $addr = DepositAddress::query()->where('address', $address)->lockForUpdate()->first();
            if (!$addr) {
                Log::warning('Transaction détectée pour une adresse inconnue', ['address' => $address, 'tx_hash' => $txHash]);
                return;
            }

            $deposit = Deposit::query()
                ->where('address_id', $addr->id)
                ->where('status', Deposit::STATUS_PENDING)
                ->latest('id')
                ->first();

            Log::channel('daily')->info('Transaction détectée', [
                'action' => 'deposit_tx_detected',
                'address' => $address,
                'address_id' => $addr->id,
                'tx_hash' => $txHash,
                'amount' => (float) $amount,
                'confirmations' => $confirmations,
                'pending_deposit_id' => $deposit?->id,
            ]);

            if (!$deposit) {
                return;
            }

            $minConf = (int) config('deposits.confirmations_required', 1);

            if ($addr->expires_at && now()->greaterThan($addr->expires_at)) {
                $before = $deposit->status;
                $deposit->status = Deposit::STATUS_EXPIRED;
                $deposit->save();

                Log::channel('daily')->warning('Transaction vers adresse expirée ignorée', [
                    'action' => 'deposit_ignored_expired',
                    'deposit_id' => $deposit->id,
                    'user_id' => $deposit->user_id,
                    'address_id' => $addr->id,
                    'status_before' => $before,
                    'status_after' => $deposit->status,
                    'tx_hash' => $txHash,
                ]);

                $this->createAudit(
                    actorId: $deposit->user_id,
                    action: 'deposit.ignored_expired_address',
                    auditableType: Deposit::class,
                    auditableId: $deposit->id,
                    event: 'updated',
                    oldValues: ['status' => $before],
                    newValues: ['status' => $deposit->status],
                    metadata: [
                        'tx_hash' => $txHash,
                        'address_id' => $addr->id,
                    ]
                );
                return;
            }

            if ($confirmations < $minConf) {
                // On log l\'observation mais on n\'agit pas encore
                return;
            }

            $amountF = (float) $amount;
            $min = (float) config('deposits.deposit_min', 10);
            $max = (float) config('deposits.deposit_max', 5000);

            // Anti double spend: vérifier si ce tx_hash a déjà été utilisé pour un autre dépôt
            $existingWithHash = Deposit::where('tx_hash', $txHash)->first();
            if ($existingWithHash && $existingWithHash->id !== $deposit->id) {
                $before = $deposit->status;
                $deposit->amount = $amountF;
                // Ne pas définir tx_hash ici pour éviter l\'unicité et marquer comme frauduleux
                $deposit->status = Deposit::STATUS_FAILED;
                $deposit->confirmed_at = now();
                $deposit->save();

                Log::channel('daily')->warning('Double spend suspect détecté: tx_hash réutilisé', [
                    'action' => 'double_spend_detected',
                    'tx_hash' => $txHash,
                    'current_deposit_id' => $deposit->id,
                    'existing_deposit_id' => $existingWithHash->id,
                    'current_user_id' => $deposit->user_id,
                    'existing_user_id' => $existingWithHash->user_id,
                    'status_before' => $before,
                    'status_after' => $deposit->status,
                ]);

                $this->createAudit(
                    actorId: $deposit->user_id,
                    action: 'deposit.double_spend_rejected',
                    auditableType: Deposit::class,
                    auditableId: $deposit->id,
                    event: 'updated',
                    oldValues: ['status' => $before],
                    newValues: ['status' => $deposit->status],
                    metadata: [
                        'tx_hash' => $txHash,
                        'existing_deposit_id' => $existingWithHash->id,
                    ],
                    riskLevel: 'HIGH',
                    requiresReview: true,
                    isSuspicious: true,
                );
                return;
            }

            $before = $deposit->status;

            // Règles min/max
            $deposit->amount = $amountF;
            if ($amountF < $min || $amountF > $max) {
                $deposit->status = Deposit::STATUS_FAILED;
                $deposit->confirmed_at = now();
                // On conserve le tx_hash pour traçabilité si possible
                $deposit->tx_hash = $txHash;
                $deposit->save();

                Log::channel('daily')->warning('Dépôt en dehors des limites', [
                    'action' => 'deposit_out_of_bounds',
                    'deposit_id' => $deposit->id,
                    'user_id' => $deposit->user_id,
                    'amount' => $amountF,
                    'min' => $min,
                    'max' => $max,
                    'tx_hash' => $txHash,
                    'status_before' => $before,
                    'status_after' => $deposit->status,
                ]);

                $this->createAudit(
                    actorId: $deposit->user_id,
                    action: 'deposit.out_of_bounds',
                    auditableType: Deposit::class,
                    auditableId: $deposit->id,
                    event: 'updated',
                    oldValues: ['status' => $before],
                    newValues: ['status' => $deposit->status],
                    metadata: [
                        'amount' => $amountF,
                        'min' => $min,
                        'max' => $max,
                        'tx_hash' => $txHash,
                    ]
                );
                return;
            }

            // Confirmation
            $deposit->status = Deposit::STATUS_CONFIRMED;
            $deposit->confirmed_at = now();
            $deposit->tx_hash = $txHash;
            $deposit->save();

            $user = $deposit->user;
            $beforeBalance = $user->balance_pi;
            $user->increment('balance_pi', $amountF);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'category' => 'deposit',
                'amount' => $amountF,
                'balance_before' => $beforeBalance,
                'balance_after' => $beforeBalance + $amountF,
                'status' => 'completed',
                'reference_id' => (string) $deposit->id,
                'transaction_hash' => $txHash,
                'description' => 'Dépôt Pi confirmé',
                'processed_at' => now(),
            ]);

            Log::channel('daily')->info('Dépôt confirmé', [
                'action' => 'deposit_confirmed',
                'deposit_id' => $deposit->id,
                'user_id' => $user->id,
                'amount' => $amountF,
                'tx_hash' => $txHash,
                'status_before' => $before,
                'status_after' => $deposit->status,
            ]);

            $this->createAudit(
                actorId: $user->id,
                action: 'deposit.confirmed',
                auditableType: Deposit::class,
                auditableId: $deposit->id,
                event: 'updated',
                oldValues: ['status' => $before],
                newValues: ['status' => $deposit->status],
                metadata: [
                    'tx_hash' => $txHash,
                    'amount' => $amountF,
                ]
            );
        });
    }

    private function createAudit(?int $actorId, string $action, string $auditableType, ?int $auditableId, string $event, $oldValues = null, $newValues = null, array $metadata = [], string $riskLevel = 'LOW', bool $requiresReview = false, bool $isSuspicious = false): void
    {
        try {
            if (!class_exists(Audit::class)) {
                return;
            }

            Audit::create([
                'actor_id' => $actorId,
                'action' => $action,
                'auditable_type' => $auditableType,
                'auditable_id' => $auditableId,
                'event' => $event,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => request()->ip() ?? null,
                'user_agent' => request()->userAgent() ?? null,
                'request_id' => request()->header('X-Request-Id') ?? null,
                'risk_level' => $riskLevel,
                'requires_review' => $requiresReview,
                'is_suspicious' => $isSuspicious,
                'metadata' => $metadata,
            ]);
        } catch (\Throwable $e) {
            Log::channel('daily')->warning('Échec d\'audit trail', [
                'error' => $e->getMessage(),
                'action' => $action,
                'auditable_type' => $auditableType,
                'auditable_id' => $auditableId,
            ]);
        }
    }
}
