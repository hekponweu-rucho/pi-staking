<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DepositService
{
    public function detect(array $data): Deposit
    {
        $userId = $data['user_id'];
        $address = $data['address'];
        $amount = (float) $data['amount'];
        $txHash = $data['tx_hash'] ?? null;
        $detectedAt = $data['detected_at'] ?? now();

        if ($txHash) {
            $existingWithTx = Deposit::where('tx_hash', $txHash)->first();
            if ($existingWithTx) {
                if ($existingWithTx->user_id !== $userId || $existingWithTx->address !== $address) {
                    Log::channel('daily')->warning('Double spend suspected: tx_hash reused for different user/address', [
                        'user_id' => $userId,
                        'existing_deposit_id' => $existingWithTx->id,
                        'existing_user_id' => $existingWithTx->user_id,
                        'address' => $address,
                        'existing_address' => $existingWithTx->address,
                        'tx_hash' => $txHash,
                        'amount' => $amount,
                    ]);

                    if (class_exists(Audit::class)) {
                        Audit::create([
                            'actor_id' => null,
                            'action' => 'deposit.double_spend_detected',
                            'auditable_type' => Deposit::class,
                            'auditable_id' => $existingWithTx->id,
                            'event' => 'detected',
                            'old_values' => null,
                            'new_values' => ['tx_hash' => $txHash, 'user_id' => $userId, 'address' => $address],
                            'risk_level' => 'CRITICAL',
                            'requires_review' => true,
                            'is_suspicious' => true,
                            'metadata' => ['incoming_amount' => $amount],
                        ]);
                    }

                    throw ValidationException::withMessages([
                        'tx_hash' => ['Double spend detected: hash already used by another deposit.']
                    ]);
                }

                // Idempotent: return existing deposit
                return $existingWithTx;
            }
        }

        // Try to locate a pending allocation for this address
        $existingPending = Deposit::where('address', $address)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->first();

        if ($existingPending) {
            // If expired, mark as expired and do not credit
            if ($existingPending->isExpired()) {
                $existingPending->update([
                    'status' => 'expired',
                    'detected_at' => $detectedAt,
                    'tx_hash' => $txHash,
                ]);

                Log::channel('daily')->info('Deposit to expired address detected, marking expired', [
                    'user_id' => $existingPending->user_id,
                    'deposit_id' => $existingPending->id,
                    'address' => $address,
                    'tx_hash' => $txHash,
                    'amount' => $amount,
                    'status_before' => 'pending',
                    'status_after' => 'expired',
                ]);

                if (class_exists(Audit::class)) {
                    Audit::create([
                        'actor_id' => null,
                        'action' => 'deposit.expired_on_detection',
                        'auditable_type' => Deposit::class,
                        'auditable_id' => $existingPending->id,
                        'event' => 'updated',
                        'old_values' => ['status' => 'pending'],
                        'new_values' => ['status' => 'expired'],
                        'risk_level' => 'LOW',
                        'requires_review' => false,
                        'is_suspicious' => false,
                        'metadata' => ['tx_hash' => $txHash, 'amount' => $amount],
                    ]);
                }

                return $existingPending;
            }

            // Attach detection details to the pending deposit
            $existingPending->update([
                'amount' => $amount,
                'tx_hash' => $txHash,
                'detected_at' => $detectedAt,
            ]);

            Log::channel('daily')->info('Deposit transaction detected', [
                'user_id' => $existingPending->user_id,
                'deposit_id' => $existingPending->id,
                'address' => $address,
                'tx_hash' => $txHash,
                'amount' => $amount,
                'status' => $existingPending->status,
            ]);

            return $existingPending;
        }

        // No existing allocation, create a new pending deposit record
        $deposit = Deposit::create([
            'user_id' => $userId,
            'address' => $address,
            'amount' => $amount,
            'status' => 'pending',
            'tx_hash' => $txHash,
            'detected_at' => $detectedAt,
        ]);

        Log::channel('daily')->info('Deposit allocation created on detection', [
            'user_id' => $userId,
            'deposit_id' => $deposit->id,
            'address' => $address,
            'tx_hash' => $txHash,
            'amount' => $amount,
        ]);

        if (class_exists(Audit::class)) {
            Audit::create([
                'actor_id' => null,
                'action' => 'deposit.detected',
                'auditable_type' => Deposit::class,
                'auditable_id' => $deposit->id,
                'event' => 'created',
                'old_values' => null,
                'new_values' => $deposit->only(['user_id','address','amount','tx_hash','status']),
                'risk_level' => 'LOW',
                'requires_review' => false,
                'is_suspicious' => false,
                'metadata' => null,
            ]);
        }

        return $deposit;
    }

    public function confirm(Deposit $deposit, User $admin): Deposit
    {
        if ($deposit->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending deposits can be confirmed.']
            ]);
        }

        if ($deposit->isExpired()) {
            throw ValidationException::withMessages([
                'expires_at' => ['Cannot confirm an expired deposit.']
            ]);
        }

        $user = $deposit->user;

        DB::transaction(function () use ($deposit, $user, $admin) {
            $balanceBefore = $user->balance_pi;
            $user->increment('balance_pi', $deposit->amount);

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'category' => 'deposit',
                'amount' => $deposit->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceBefore + $deposit->amount,
                'status' => 'completed',
                'transaction_hash' => $deposit->tx_hash,
                'description' => 'Confirmation manuelle du dépôt',
                'processed_at' => now(),
                'processed_by' => $admin->id,
                'metadata' => [
                    'deposit_id' => $deposit->id,
                    'address' => $deposit->address,
                ],
            ]);

            $deposit->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);
        });

        Log::channel('daily')->info('Deposit manually confirmed', [
            'admin_id' => $admin->id,
            'user_id' => $deposit->user_id,
            'deposit_id' => $deposit->id,
            'tx_hash' => $deposit->tx_hash,
            'amount' => $deposit->amount,
            'status_before' => 'pending',
            'status_after' => 'confirmed',
        ]);

        if (class_exists(Audit::class)) {
            Audit::create([
                'actor_id' => $admin->id,
                'action' => 'deposit.confirmed',
                'auditable_type' => Deposit::class,
                'auditable_id' => $deposit->id,
                'event' => 'updated',
                'old_values' => ['status' => 'pending'],
                'new_values' => ['status' => 'confirmed'],
                'risk_level' => 'LOW',
                'requires_review' => false,
                'is_suspicious' => false,
                'metadata' => ['tx_hash' => $deposit->tx_hash, 'amount' => $deposit->amount],
            ]);
        }

        return $deposit->fresh();
    }

    public function expire(Deposit $deposit, User $admin): Deposit
    {
        if ($deposit->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending deposits can be expired.']
            ]);
        }

        DB::transaction(function () use ($deposit, $admin) {
            $user = $deposit->user;

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'category' => 'deposit',
                'amount' => 0,
                'balance_before' => $user->balance_pi,
                'balance_after' => $user->balance_pi,
                'status' => 'cancelled',
                'transaction_hash' => $deposit->tx_hash,
                'description' => 'Expiration du dépôt (non crédité)',
                'processed_at' => now(),
                'processed_by' => $admin->id,
                'metadata' => [
                    'deposit_id' => $deposit->id,
                    'address' => $deposit->address,
                ],
            ]);

            $deposit->update([
                'status' => 'expired',
            ]);
        });

        Log::channel('daily')->info('Deposit expired by admin', [
            'admin_id' => $admin->id,
            'user_id' => $deposit->user_id,
            'deposit_id' => $deposit->id,
            'tx_hash' => $deposit->tx_hash,
            'amount' => $deposit->amount,
            'status_before' => 'pending',
            'status_after' => 'expired',
        ]);

        if (class_exists(Audit::class)) {
            Audit::create([
                'actor_id' => $admin->id,
                'action' => 'deposit.expired',
                'auditable_type' => Deposit::class,
                'auditable_id' => $deposit->id,
                'event' => 'updated',
                'old_values' => ['status' => 'pending'],
                'new_values' => ['status' => 'expired'],
                'risk_level' => 'LOW',
                'requires_review' => false,
                'is_suspicious' => false,
            ]);
        }

        return $deposit->fresh();
    }
}
