<?php

namespace App\Http\Controllers;

use App\Models\DepositAddress;
use App\Models\DepositSession;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDepositController extends Controller
{
    public function listSessions(Request $request)
    {
        $status = $request->query('status');
        $query = DepositSession::with(['user:id,username,email', 'address:id,address,label'])
            ->orderByDesc('created_at');
        if ($status) {
            $query->where('status', $status);
        }
        $sessions = $query->paginate($request->query('per_page', 20));
        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    public function listAddresses()
    {
        return response()->json([
            'success' => true,
            'data' => DepositAddress::orderByDesc('is_active')->orderBy('usage_count')->get(),
        ]);
    }

    public function createAddress(Request $request)
    {
        $validated = $request->validate([
            'address' => 'required|string|max:255|unique:deposit_addresses,address',
            'label' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $address = DepositAddress::create([
            'address' => $validated['address'],
            'label' => $validated['label'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'usage_count' => 0,
        ]);

        return response()->json(['success' => true, 'data' => $address]);
    }

    public function updateAddress(Request $request, int $addressId)
    {
        $address = DepositAddress::findOrFail($addressId);
        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);
        $address->update($validated);
        return response()->json(['success' => true, 'data' => $address]);
    }

    public function deleteAddress(int $addressId)
    {
        $address = DepositAddress::findOrFail($addressId);
        $address->delete();
        return response()->json(['success' => true, 'message' => 'Adresse supprimée']);
    }

    public function confirmSession(Request $request, int $sessionId)
    {
        $validated = $request->validate([
            'credited_amount' => 'required|numeric|min:0.00000001',
            'tx_hash' => 'nullable|string|max:255',
            'external_reference' => 'nullable|string|max:255',
        ]);

        $session = DepositSession::findOrFail($sessionId);
        if ($session->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette session ne peut pas être confirmée.'
            ], 422);
        }

        $user = $session->user;
        DB::transaction(function () use ($session, $user, $validated) {
            $before = $user->balance_pi;
            $amount = (float) $validated['credited_amount'];
            $after = $before + $amount;

            // Créditer le solde utilisateur
            $user->update(['balance_pi' => $after]);

            // Créer la transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'category' => 'deposit',
                'amount' => $amount,
                'balance_before' => $before,
                'balance_after' => $after,
                'status' => 'completed',
                'reference_id' => 'DEP-'.$session->id,
                'external_reference' => $validated['external_reference'] ?? $session->memo,
                'transaction_hash' => $validated['tx_hash'] ?? null,
                'description' => 'Dépôt via session '.$session->id.' (memo '.$session->memo.')',
                'processed_at' => now(),
                'metadata' => [
                    'deposit_session_id' => $session->id,
                    'memo' => $session->memo,
                    'address_id' => $session->deposit_address_id,
                ],
            ]);

            // Mettre à jour la session
            $session->update([
                'status' => 'confirmed',
                'confirmations' => 1,
                'credited_amount' => $amount,
                'tx_hash' => $validated['tx_hash'] ?? null,
                'processed_at' => now(),
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Session confirmée et solde crédité.']);
    }
}
