<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Services\DepositService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DepositController extends Controller
{
    public function __construct(private DepositService $depositService)
    {
    }

    public function requestAddress(Request $request): JsonResponse
    {
        $user = $request->user();
        try {
            $result = $this->depositService->assignAddressForUser($user);
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $result['id'],
                    'address' => $result['address'],
                    'expires_at' => $result['expires_at'],
                ],
            ]);
        } catch (\Exception $e) {
            $message = $e->getMessage();
            $code = str_contains($message, 'déjà attribuée') ? 409 : (str_contains($message, 'Aucune adresse') ? 429 : 400);
            return response()->json([
                'success' => false,
                'message' => $message,
            ], $code);
        }
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $deposit = Deposit::with('address')->where('id', $id)->where('user_id', $user->id)->firstOrFail();

        if ($deposit->status === Deposit::STATUS_PENDING) {
            $addr = $deposit->address;
            if ($addr && $addr->expires_at && now()->greaterThan($addr->expires_at)) {
                $deposit->status = Deposit::STATUS_EXPIRED;
                $deposit->save();
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $deposit->status,
                'amount' => $deposit->amount,
                'tx_hash' => $deposit->tx_hash,
                'expires_at' => optional($deposit->address)->expires_at,
                'address' => optional($deposit->address)->address,
            ],
        ]);
    }
}