<?php

namespace App\Http\Controllers;

use App\Models\WithdrawalRequest;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminWithdrawalController extends Controller
{
    public function list(Request $request)
    {
        $status = $request->query('status');
        $perPage = (int) $request->query('per_page', 20);

        $query = WithdrawalRequest::with(['user:id,username,email'])
            ->orderByDesc('created_at');
        if ($status) {
            $query->where('status', $status);
        }

        $withdrawals = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    public function complete(Request $request, int $id)
    {
        $validated = $request->validate([
            'tx_hash' => 'nullable|string|max:255',
        ]);

        $wr = WithdrawalRequest::findOrFail($id);
        if (!in_array($wr->status, ['pending','reviewing','approved','processing'])) {
            return response()->json([
                'success' => false,
                'message' => "Cette demande n'est pas dans un état compatible."
            ], 422);
        }

        DB::transaction(function () use ($wr, $validated) {
            // Marquer completed
            $wr->update([
                'status' => 'completed',
                'processed_at' => now(),
                'processed_by' => auth()->id(),
                'transaction_hash' => $validated['tx_hash'] ?? $wr->transaction_hash,
                'is_confirmed' => true,
                'confirmation_count' => 1,
            ]);

            // Mettre à jour la transaction liée
            Transaction::where('withdrawal_request_id', $wr->id)->update([
                'status' => 'completed',
                'processed_at' => now(),
                'transaction_hash' => $validated['tx_hash'] ?? null,
                'processed_by' => auth()->id(),
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Retrait marqué comme complété.']);
    }

    public function reject(Request $request, int $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $wr = WithdrawalRequest::findOrFail($id);
        if ($wr->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Seules les demandes en attente peuvent être rejetées."
            ], 422);
        }

        DB::transaction(function () use ($wr, $validated) {
            $user = $wr->user;
            // Remboursement
            $user->increment('balance_pi', $wr->amount);

            // Rejeter la demande
            $wr->update([
                'status' => 'rejected',
                'processed_at' => now(),
                'processed_by' => auth()->id(),
                'rejection_reason' => $validated['reason'] ?? null,
            ]);

            // Mettre à jour la transaction liée
            Transaction::where('withdrawal_request_id', $wr->id)->update([
                'status' => 'cancelled',
                'processed_at' => now(),
                'admin_notes' => $validated['reason'] ?? null,
                'processed_by' => auth()->id(),
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Retrait rejeté et remboursé.']);
    }
}
