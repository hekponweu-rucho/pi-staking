<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SecurityController extends Controller
{
    /**
     * Retourne les logs de sécurité (stub)
     */
    public function getSecurityLogs(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'logs' => [], // À remplacer par la vraie logique plus tard
        ]);
    }

    public function getSecurityStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = $request->query('days', 30); // Default to 30 days

        $stats = \App\Models\UserSecurityLog::getSecurityStats($user->id, $days);
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

