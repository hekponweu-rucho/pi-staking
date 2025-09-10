<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\DepositAddress;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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
                Deposit::where('address_id', $addr->id)
                    ->where('status', Deposit::STATUS_PENDING)
                    ->update(['status' => Deposit::STATUS_EXPIRED]);

                $addr->assigned_to_user_id = null;
                $addr->assigned_at = null;
                $addr->expires_at = null;
                $addr->save();
            }
        });
    }

    public function handleDetectedTransaction(string $address, string $txHash, string $amount, int $confirmations): void
    {
        DB::transaction(function () use ($address, $txHash, $amount, $confirmations) {
            $addr = DepositAddress::query()->where('address', $address)->lockForUpdate()->first();
            if (!$addr) {
                Log::warning('Transaction détectée pour une adresse inconnue', ['address' => $address, 'tx' => $txHash]);
                return;
            }

            $deposit = Deposit::query()
                ->where('address_id', $addr->id)
                ->where('status', Deposit::STATUS_PENDING)
                ->latest('id')
                ->first();

            if (!$deposit) {
                return;
            }

            $minConf = (int) config('deposits.confirmations_required', 1);

            if ($addr->expires_at && now()->greaterThan($addr->expires_at)) {
                $deposit->status = Deposit::STATUS_EXPIRED;
                $deposit->save();
                return;
            }

            if ($confirmations < $minConf) {
                return;
            }

            $amountF = (float) $amount;
            $min = (float) config('deposits.deposit_min', 10);
            $max = (float) config('deposits.deposit_max', 5000);

            $deposit->amount = $amountF;
            $deposit->tx_hash = $txHash;

            if ($amountF < $min || $amountF > $max) {
                $deposit->status = Deposit::STATUS_FAILED;
                $deposit->confirmed_at = now();
                $deposit->save();
                Log::warning('Dépôt en dehors des limites', ['deposit_id' => $deposit->id, 'amount' => $amountF]);
                return;
            }

            $deposit->status = Deposit::STATUS_CONFIRMED;
            $deposit->confirmed_at = now();
            $deposit->save();

            $user = $deposit->user;
            $before = $user->balance_pi;
            $user->increment('balance_pi', $amountF);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'category' => 'deposit',
                'amount' => $amountF,
                'balance_before' => $before,
                'balance_after' => $before + $amountF,
                'status' => 'completed',
                'reference_id' => (string) $deposit->id,
                'transaction_hash' => $txHash,
                'description' => 'Dépôt Pi confirmé',
                'processed_at' => now(),
            ]);

            Log::channel('daily')->info('Dépôt confirmé', [
                'deposit_id' => $deposit->id,
                'user_id' => $user->id,
                'amount' => $amountF,
                'tx_hash' => $txHash,
            ]);
        });
    }
}