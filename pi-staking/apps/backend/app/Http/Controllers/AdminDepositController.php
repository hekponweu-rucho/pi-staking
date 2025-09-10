<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\DepositAddress;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminDepositController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,confirmed,expired,failed',
            'user_id' => 'nullable|integer',
            'address' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);

        $perPage = $validated['per_page'] ?? 20;

        $query = Deposit::query()->with(['user', 'address'])->orderByDesc('created_at');

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }
        if (!empty($validated['address'])) {
            $query->whereHas('address', function ($q) use ($validated) {
                $q->where('address', 'like', '%' . $validated['address'] . '%');
            });
        }
        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }
        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $deposits = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $deposits,
        ]);
    }

    public function expire(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();

        return DB::transaction(function () use ($id, $admin) {
            $deposit = Deposit::with('address')->lockForUpdate()->findOrFail($id);

            if ($deposit->status !== Deposit::STATUS_PENDING) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les dépôts en attente peuvent être expirés.'
                ], 422);
            }

            $before = $deposit->status;
            $deposit->status = Deposit::STATUS_EXPIRED;
            $deposit->save();

            // Libérer l'adresse réservée
            if ($deposit->address) {
                $addr = $deposit->address;
                $addr->assigned_to_user_id = null;
                $addr->assigned_at = null;
                $addr->expires_at = null;
                $addr->save();
            }

            Log::channel('daily')->info('Expiration forcée d\'un dépôt (admin)', [
                'action' => 'admin_deposit_expired',
                'admin_id' => $admin->id,
                'deposit_id' => $deposit->id,
                'user_id' => $deposit->user_id,
                'status_before' => $before,
                'status_after' => $deposit->status,
            ]);

            // Audit optionnel
            if (class_exists(\App\Models\Audit::class)) {
                \App\Models\Audit::create([
                    'actor_id' => $admin->id,
                    'action' => 'admin.deposit.expire',
                    'auditable_type' => Deposit::class,
                    'auditable_id' => $deposit->id,
                    'event' => 'updated',
                    'old_values' => ['status' => $before],
                    'new_values' => ['status' => $deposit->status],
                    'metadata' => [
                        'reason' => 'forced_by_admin',
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Dépôt expiré avec succès',
                'data' => $deposit->fresh(['user', 'address']),
            ]);
        });
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.00000001',
            'tx_hash' => 'required|string',
        ]);

        $admin = $request->user();

        return DB::transaction(function () use ($id, $validated, $admin) {
            $deposit = Deposit::with('user')->lockForUpdate()->findOrFail($id);

            if ($deposit->status === Deposit::STATUS_CONFIRMED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce dépôt est déjà confirmé.'
                ], 422);
            }

            // Double spend: refuser si un autre dépôt possède déjà ce hash
            $existing = Deposit::where('tx_hash', $validated['tx_hash'])
                ->where('id', '!=', $deposit->id)
                ->first();
            if ($existing) {
                Log::channel('daily')->warning('Tentative de confirmation admin avec tx_hash déjà utilisé', [
                    'action' => 'admin_confirm_double_spend',
                    'admin_id' => $admin->id,
                    'deposit_id' => $deposit->id,
                    'existing_deposit_id' => $existing->id,
                    'tx_hash' => $validated['tx_hash'],
                ]);

                if (class_exists(\App\Models\Audit::class)) {
                    \App\Models\Audit::create([
                        'actor_id' => $admin->id,
                        'action' => 'admin.deposit.confirm_rejected_double_spend',
                        'auditable_type' => Deposit::class,
                        'auditable_id' => $deposit->id,
                        'event' => 'rejected',
                        'metadata' => [
                            'tx_hash' => $validated['tx_hash'],
                            'existing_deposit_id' => $existing->id,
                        ],
                        'risk_level' => 'HIGH',
                        'requires_review' => true,
                        'is_suspicious' => true,
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Ce hash de transaction est déjà associé à un autre dépôt.'
                ], 422);
            }

            $before = $deposit->status;
            $amount = (float) $validated['amount'];

            // Confirmer et créditer
            $deposit->amount = $amount;
            $deposit->tx_hash = $validated['tx_hash'];
            $deposit->status = Deposit::STATUS_CONFIRMED;
            $deposit->confirmed_at = now();
            $deposit->save();

            $user = $deposit->user;
            $beforeBalance = $user->balance_pi;
            $user->increment('balance_pi', $amount);

            $txn = Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'category' => 'deposit',
                'amount' => $amount,
                'balance_before' => $beforeBalance,
                'balance_after' => $beforeBalance + $amount,
                'status' => 'completed',
                // reference_id auto-généré
                'transaction_hash' => $validated['tx_hash'],
                'description' => 'Confirmation manuelle du dépôt par admin',
                'processed_at' => now(),
                'processed_by' => $admin->id,
            ]);

            Log::channel('daily')->info('Confirmation manuelle d\'un dépôt (admin)', [
                'action' => 'admin_deposit_confirmed',
                'admin_id' => $admin->id,
                'deposit_id' => $deposit->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'tx_hash' => $validated['tx_hash'],
                'status_before' => $before,
                'status_after' => $deposit->status,
            ]);

            if (class_exists(\App\Models\Audit::class)) {
                \App\Models\Audit::create([
                    'actor_id' => $admin->id,
                    'action' => 'admin.deposit.confirm',
                    'auditable_type' => Deposit::class,
                    'auditable_id' => $deposit->id,
                    'event' => 'updated',
                    'old_values' => ['status' => $before],
                    'new_values' => ['status' => $deposit->status],
                    'metadata' => [
                        'amount' => $amount,
                        'tx_hash' => $validated['tx_hash'],
                        'transaction_id' => $txn->id,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Dépôt confirmé avec succès',
                'data' => $deposit->fresh(['user', 'address']),
            ]);
        });
    }
}
