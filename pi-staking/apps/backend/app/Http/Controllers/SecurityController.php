<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SecurityController extends Controller
{
    /**
     * Retourne les logs de sécurité récents
     */
    public function getSecurityLogs(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $logs = \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get();

            return $this->success(['logs' => $logs]);
        } catch (\Throwable $e) {
            return $this->exception($e, 'Erreur lors de la récupération des logs de sécurité');
        }
    }

    public function getSecurityStats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $days = (int) $request->query('days', 30);
            $stats = \App\Models\UserSecurityLog::getSecurityStats($user->id, $days);
            return $this->success($stats, 'Statistiques de sécurité');
        } catch (\Throwable $e) {
            return $this->exception($e, 'Erreur lors de la récupération des statistiques de sécurité');
        }
    }
}

