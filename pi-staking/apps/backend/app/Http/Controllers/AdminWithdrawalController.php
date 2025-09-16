<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Support\StructuredLogger;
use App\Support\Metrics;

class AdminWithdrawalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|in:pending,reviewing,approved,processing,completed,rejected,cancelled',
            'user_id' => 'nullable|integer',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);

        $perPage = $validated['per_page'] ?? 20;

        $query = WithdrawalRequest::query()->with('user')->orderByDesc('created_at');

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        } else {
            $query->whereIn('status', ['pending', 'reviewing']);
        }
        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }
        if (!empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }
        if (!empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $withdrawals = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'required_if:action,reject|string|max:500',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($id, $admin, $validated) {
            /** @var WithdrawalRequest $withdrawal */
            $withdrawal = WithdrawalRequest::with('user')->lockForUpdate()->findOrFail($id);

            $beforeStatus = $withdrawal->status;

            // Idempotency: if already processed with same state, return success
            if ($validated['action'] === 'approve' && in_array($withdrawal->status, ['approved', 'processing', 'completed'])) {
                return response()->json([
                    'success' => true,
                    'message' => 'Déjà approuvé/pris en charge',
                    'data' => $withdrawal,
                ]);
            }
            if ($validated['action'] === 'reject' && $withdrawal->status === 'rejected') {
                return response()->json([
                    'success' => true,
                    'message' => 'Déjà rejeté',
                    'data' => $withdrawal,
                ]);
            }

            $user = $withdrawal->user;

            if ($validated['action'] === 'approve') {
                // Ensure a transaction exists, and debit if not reserved
                $txn = Transaction::where('withdrawal_request_id', $withdrawal->id)->lockForUpdate()->first();

                if (!$txn) {
                    // Cas rare: pas de transaction de réservation
                    $beforeBalance = (float) $user->balance_pi;
                    if ($beforeBalance < (float) $withdrawal->amount) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant pour débiter lors de l\'approbation.'
                        ], 422);
                    }
                    $user->decrement('balance_pi', $withdrawal->amount);
                    // Réduire la réservation si présente
                    if ((float) $user->pending_withdrawal >= (float) $withdrawal->amount) {
                        $user->decrement('pending_withdrawal', $withdrawal->amount);
                    }
                    $txn = Transaction::create([
                        'user_id' => $user->id,
                        'type' => 'withdrawal',
                        'category' => 'withdrawal',
                        'amount' => -$withdrawal->amount,
                        'balance_before' => $beforeBalance,
                        'balance_after' => $beforeBalance - $withdrawal->amount,
                        'status' => 'pending',
                        'withdrawal_request_id' => $withdrawal->id,
                        'description' => 'Retrait approuvé manuellement',
                    ]);
                } else {
                    // Transaction de réservation existante: convertir en débit et débiter maintenant
                    $beforeBalance = (float) $user->balance_pi;
                    if ($beforeBalance < (float) $withdrawal->amount) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Solde insuffisant pour débiter lors de l\'approbation.'
                        ], 422);
                    }
                    $user->decrement('balance_pi', $withdrawal->amount);
                    // Réduire la réservation
                    if ((float) $user->pending_withdrawal >= (float) $withdrawal->amount) {
                        $user->decrement('pending_withdrawal', $withdrawal->amount);
                    }
                    $txn->amount = -$withdrawal->amount;
                    $txn->balance_before = $beforeBalance;
                    $txn->balance_after = $beforeBalance - (float) $withdrawal->amount;
                    $txn->description = $txn->description ?: 'Retrait approuvé manuellement';
                }

                // Mark as approved/completed (no external payout automation here)
                $withdrawal->status = 'approved';
                $withdrawal->processed_at = now();
                $withdrawal->processed_by = $admin->id;
                if (!empty($validated['admin_notes'])) {
                    $withdrawal->admin_notes = $validated['admin_notes'];
                }
                $withdrawal->save();

                $txn->status = 'completed';
                $txn->processed_at = now();
                $txn->processed_by = $admin->id;
                $txn->admin_notes = $validated['admin_notes'] ?? null;
                $txn->save();

                app(\App\Services\LedgerService::class)->moveUserToExternal($user->id, 'pending_withdrawal', $withdrawal->amount, 'withdrawal', (string) $withdrawal->id, [
                    'transaction_id' => $txn->id,
                ]);

                Log::channel('daily')->info('Approbation admin d\'un retrait', [
                    'action' => 'admin_withdrawal_approved',
                    'admin_id' => $admin->id,
                    'withdrawal_id' => $withdrawal->id,
                    'user_id' => $user->id,
                    'amount' => $withdrawal->amount,
                    'status_before' => $beforeStatus,
                    'status_after' => $withdrawal->status,
                ]);
                StructuredLogger::event('withdrawal_approved', [
                    'user_id' => $user->id,
                    'amount' => (float) $withdrawal->amount,
                    'outcome' => 'success',
                    'meta' => ['withdrawal_id' => $withdrawal->id, 'admin_id' => $admin->id]
                ]);
                Metrics::inc('withdrawals_approved_total');

                if (class_exists(\App\Models\Audit::class)) {
                    \App\Models\Audit::create([
                        'actor_id' => $admin->id,
                        'action' => 'admin.withdrawal.approve',
                        'auditable_type' => WithdrawalRequest::class,
                        'auditable_id' => $withdrawal->id,
                        'event' => 'updated',
                        'old_values' => ['status' => $beforeStatus],
                        'new_values' => ['status' => $withdrawal->status],
                        'metadata' => [
                            'transaction_id' => $txn->id,
                        ],
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Retrait approuvé',
                    'data' => $withdrawal->fresh('user'),
                ]);
            }

            // Reject path
            if (!in_array($withdrawal->status, ['pending', 'reviewing'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Seuls les retraits en attente peuvent être rejetés.'
                ], 422);
            }

            // Refund reserved funds if they were reserved
            $txn = Transaction::where('withdrawal_request_id', $withdrawal->id)->lockForUpdate()->first();
            if ($txn) {
                // Si un débit a déjà eu lieu (cas rare), rembourser
                if ((float) $txn->amount < 0) {
                    $user->increment('balance_pi', abs((float) $txn->amount));
                }
                // Libérer la réservation
                if ((float) $user->pending_withdrawal >= (float) $withdrawal->amount) {
                    $user->decrement('pending_withdrawal', $withdrawal->amount);
                }
                $txn->status = 'rejected';
                $txn->processed_at = now();
                $txn->processed_by = $admin->id;
                $txn->admin_notes = $validated['reason'];
                $txn->save();
            } else {
                // Pas de transaction trouvée: libérer la réservation si présente
                if ((float) $user->pending_withdrawal >= (float) $withdrawal->amount) {
                    $user->decrement('pending_withdrawal', $withdrawal->amount);
                }
            }

            $withdrawal->status = 'rejected';
            $withdrawal->rejection_reason = $validated['reason'] ?? null;
            $withdrawal->reviewed_at = now();
            $withdrawal->reviewed_by = $admin->id;
            if (!empty($validated['admin_notes'])) {
                $withdrawal->admin_notes = $validated['admin_notes'];
            }
            $withdrawal->save();

            app(\App\Services\LedgerService::class)->move($user->id, 'pending_withdrawal', $user->id, 'principal', $withdrawal->amount, 'withdrawal_reject', (string) $withdrawal->id, [
                'transaction_id' => $txn?->id,
            ]);

            Log::channel('daily')->info('Rejet admin d\'un retrait', [
                'action' => 'admin_withdrawal_rejected',
                'admin_id' => $admin->id,
                'withdrawal_id' => $withdrawal->id,
                'user_id' => $user->id,
                'amount' => $withdrawal->amount,
                'reason' => $validated['reason'] ?? null,
                'status_before' => $beforeStatus,
                'status_after' => $withdrawal->status,
            ]);
            StructuredLogger::event('withdrawal_declined', [
                'user_id' => $user->id,
                'amount' => (float) $withdrawal->amount,
                'outcome' => 'declined',
                'meta' => ['withdrawal_id' => $withdrawal->id, 'admin_id' => $admin->id, 'reason' => $validated['reason'] ?? null]
            ]);
            Metrics::inc('withdrawals_rejected_total');

            if (class_exists(\App\Models\Audit::class)) {
                \App\Models\Audit::create([
                    'actor_id' => $admin->id,
                    'action' => 'admin.withdrawal.reject',
                    'auditable_type' => WithdrawalRequest::class,
                    'auditable_id' => $withdrawal->id,
                    'event' => 'updated',
                    'old_values' => ['status' => $beforeStatus],
                    'new_values' => ['status' => $withdrawal->status],
                    'metadata' => [
                        'reason' => $validated['reason'] ?? null,
                        'transaction_id' => $txn?->id,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Retrait rejeté et fonds remis à disposition',
                'data' => $withdrawal->fresh('user'),
            ]);
        });
    }
}
