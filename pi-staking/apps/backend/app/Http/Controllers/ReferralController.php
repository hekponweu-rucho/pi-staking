<?php

namespace App\Http\Controllers;

use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReferralController extends Controller
{
    private ReferralService $referralService;
    
    public function __construct(ReferralService $referralService)
    {
        $this->referralService = $referralService;
    }
    
    /**
     * Obtenir les informations de parrainage de l'utilisateur
     */
    public function getInfo(): JsonResponse
    {
        $user = auth()->user();
        $statistics = $this->referralService->getReferralStatistics($user);
        
        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }
    
    /**
     * Obtenir l'arbre de parrainage
     */
    public function getTree(Request $request): JsonResponse
    {
        $user = auth()->user();
        $levels = $request->input('levels', 3);
        
        $tree = $this->referralService->getReferralTree($user, $levels);
        
        return response()->json([
            'success' => true,
            'data' => $tree
        ]);
    }
    
    /**
     * Obtenir l'historique des commissions
     */
    public function getEarnings(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        $earnings = \App\Models\Transaction::where('user_id', $user->id)
            ->where('type', 'referral_bonus')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
            
        return response()->json([
            'success' => true,
            'data' => $earnings
        ]);
    }
    
    /**
     * Valider un code de parrainage
     */
    public function validateCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:20'
        ]);
        
        $referrer = $this->referralService->validateReferralCode(
            $request->code, 
            auth()->user()
        );
        
        return response()->json([
            'success' => true,
            'data' => [
                'valid' => $referrer !== null,
                'referrer' => $referrer ? [
                    'username' => $referrer->username,
                    'level' => $referrer->current_level
                ] : null
            ]
        ]);
    }
    
    /**
     * Obtenir les statistiques détaillées
     */
    public function getDetailedStats(): JsonResponse
    {
        $user = auth()->user();
        
        $stats = [
            'overview' => $this->referralService->getReferralStatistics($user),
            'tree' => $this->referralService->getReferralTree($user),
            'monthly_progression' => $this->getMonthlyProgression($user),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Progression mensuelle des gains
     */
    private function getMonthlyProgression($user): array
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $startOfMonth = now()->subMonths($i)->startOfMonth();
            $endOfMonth = now()->subMonths($i)->endOfMonth();
            
            $earnings = \App\Models\Transaction::where('user_id', $user->id)
                ->where('type', 'referral_bonus')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount');
                
            $months[] = [
                'month' => $startOfMonth->format('M Y'),
                'earnings' => (float) $earnings,
            ];
        }
        
        return $months;
    }
}