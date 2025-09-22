<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\UserSecurityLog;
use App\Support\Pagination as P;
use App\Http\Resources\SecurityLogResource;

class SecurityController extends Controller
{
    public function getSecurityLogs(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = P::perPage($request);
        [$sortCol, $sortDir] = P::sort($request, [
            'created_at' => 'created_at',
            'risk_score' => 'risk_score',
            'action' => 'action',
        ], 'created_at', 'desc');

        $query = UserSecurityLog::query()
            ->where('user_id', $user->id);

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->query('start_date')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('end_date')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $paginator = $query->orderBy($sortCol, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        return response()->json(P::envelope($paginator, SecurityLogResource::class, $request));
    }

    public function getSecurityStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = $request->query('days', 30);

        $stats = \App\Models\UserSecurityLog::getSecurityStats($user->id, $days);
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

