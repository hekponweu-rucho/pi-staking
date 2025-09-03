<?php

namespace App\Http\Controllers;

use App\Models\DepositAddress;
use App\Models\DepositSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DepositController extends Controller
{
    public function startDepositSession(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'nullable|numeric|min:0.00000001',
        ]);

        $user = $request->user();

        $address = DepositAddress::where('is_active', true)
            ->orderBy('usage_count', 'asc')
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => "Aucune adresse de dépôt n'est configurée. Veuillez réessayer plus tard."
            ], 422);
        }

        $expiresAt = now()->addMinutes(30);
        $memo = 'U-' . $user->id . '-' . Str::ulid();

        $session = null;
        DB::transaction(function () use ($user, $address, $request, $expiresAt, $memo, &$session) {
            $session = DepositSession::create([
                'user_id' => $user->id,
                'deposit_address_id' => $address->id,
                'memo' => $memo,
                'amount_requested' => $request->input('amount'),
                'status' => 'pending',
                'confirmations_required' => 1,
                'expires_at' => $expiresAt,
            ]);

            $address->increment('usage_count');
        });

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => (string) $session->id,
                'address' => $address->address,
                'memo' => $session->memo,
                'expires_at' => $session->expires_at,
                'confirmations_required' => $session->confirmations_required,
            ]
        ]);
    }

    public function getDepositSessionStatus(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->user();
        $session = DepositSession::where('id', $sessionId)->where('user_id', $user->id)->first();
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session de dépôt introuvable.'
            ], 404);
        }

        if ($session->status === 'pending' && now()->greaterThan($session->expires_at)) {
            $session->update(['status' => 'expired', 'processed_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $session->status,
                'confirmations' => $session->confirmations,
                'credited_amount' => $session->credited_amount,
                'tx_hash' => $session->tx_hash,
                'updated_at' => $session->updated_at,
            ]
        ]);
    }

    public function cancelDepositSession(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->user();
        $session = DepositSession::where('id', $sessionId)->where('user_id', $user->id)->first();
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session de dépôt introuvable.'
            ], 404);
        }

        if ($session->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette session ne peut plus être annulée.'
            ], 422);
        }

        $session->update(['status' => 'cancelled', 'processed_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Session de dépôt annulée.'
        ]);
    }
}
