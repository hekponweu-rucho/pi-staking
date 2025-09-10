<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\User;
use App\Services\DepositService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminDepositController extends Controller
{
    public function __construct(private readonly DepositService $depositService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin');
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 20);
        $status = $request->get('status');
        $userId = $request->get('user_id');
        $address = $request->get('address');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $query = Deposit::with('user')->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }
        if ($userId) {
            $query->where('user_id', $userId);
        }
        if ($address) {
            $query->where('address', 'LIKE', "%{$address}%");
        }
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $deposits = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $deposits,
        ]);
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $deposit = Deposit::findOrFail($id);

        try {
            $updated = $this->depositService->confirm($deposit, $admin);

            return response()->json([
                'success' => true,
                'message' => 'Dépôt confirmé et crédité',
                'data' => $updated,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::channel('daily')->error('Admin deposit confirmation failed', [
                'deposit_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation du dépôt',
            ], 500);
        }
    }

    public function expire(Request $request, int $id): JsonResponse
    {
        $admin = $request->user();
        $deposit = Deposit::findOrFail($id);

        try {
            $updated = $this->depositService->expire($deposit, $admin);

            return response()->json([
                'success' => true,
                'message' => 'Dépôt expiré avec succès',
                'data' => $updated,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::channel('daily')->error('Admin deposit expiration failed', [
                'deposit_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'expiration du dépôt',
            ], 500);
        }
    }
}
