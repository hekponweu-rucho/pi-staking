<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\Claim;
use App\Services\ClaimService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ClaimController extends Controller
{
    public function __construct(
        private ClaimService $claimService
    ) {}

    /**
     * Effectuer un claim pour un investissement spécifique
     */
    public function claimInvestment(Request $request, int $investmentId): JsonResponse
    {
        $user = $request->user();
        
        $investment = $user->investments()->find($investmentId);
        
        if (!$investment) {
            return response()->json([
                'success' => false,
                'message' => 'Investissement introuvable.'
            ], 404);
        }

        try {
            $claim = $this->claimService->processClaim($user, $investment);

            return response()->json([
                'success' => true,
                'message' => 'Réclamation effectuée avec succès !',
                'data' => [
                    'claim' => $claim,
                    'investment' => $investment->fresh(),
                    'user' => $user->fresh(),
                    'next_claim_at' => $investment->next_claim_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Effectuer un claim pour tous les investissements éligibles
     */
    public function claimAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        try {
            $results = $this->claimService->claimAll($user);

            if (empty($results['successful_claims'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun investissement éligible pour le moment.',
                    'data' => [
                        'claimable_investments' => $this->getClaimableInvestments($user),
                    ]
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => sprintf(
                    '%d réclamation(s) effectuée(s) avec succès ! Total réclamé : %.4f Pi',
                    count($results['successful_claims']),
                    $results['total_claimed']
                ),
                'data' => [
                    'successful_claims' => $results['successful_claims'],
                    'failed_claims' => $results['failed_claims'],
                    'total_claimed' => $results['total_claimed'],
                    'user' => $user->fresh(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir la liste des investissements réclamables
     */
    public function getClaimableInvestments(Request $request): JsonResponse
    {
        $user = $request->user();
    $claimableInvestments = $this->computeClaimableInvestments($user);

        return response()->json([
            'success' => true,
            'data' => [
                'claimable_investments' => $claimableInvestments,
                'total_claimable_amount' => $claimableInvestments->sum('next_claim_amount'),
                'claimable_count' => $claimableInvestments->count(),
            ]
        ]);
    }

    /**
     * Obtenir l'historique des claims de l'utilisateur
     */
    public function getClaimHistory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'investment_id' => 'nullable|integer|exists:investments,id',
            'per_page' => 'nullable|integer|min:5|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $perPage = $request->get('per_page', 20);
        
        $query = $user->claims()->with(['investment.stakingPackage']);

        // Filtrer par investissement si spécifié
        if ($request->has('investment_id')) {
            $investmentId = $request->investment_id;
            
            // Vérifier que l'investissement appartient à l'utilisateur
            if (!$user->investments()->where('id', $investmentId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Investissement introuvable.'
                ], 404);
            }
            
            $query->where('investment_id', $investmentId);
        }

        // Filtrer par dates si spécifiées
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $claims = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'claims' => $claims,
                'stats' => $this->computeClaimStats($user),
            ]
        ]);
    }

    public function getClaimStatistics(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    /**
     * Obtenir les statistiques de claims
     */
    public function getClaimStats(Request $request): JsonResponse
    {
        $user = $request->user();
    $stats = $this->computeClaimStats($user);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Simuler les gains potentiels
     */
    public function simulateEarnings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'days' => 'required|integer|min:1|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $days = $request->days;
        
        $activeInvestments = $user->activeInvestments;
        
        if ($activeInvestments->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun investissement actif pour simuler les gains.'
            ], 422);
        }

        $dailyTotal = $activeInvestments->sum(function ($investment) {
            return $investment->calculateDailyReturn();
        });

        $projectedEarnings = $dailyTotal * $days;
        
        return response()->json([
            'success' => true,
            'data' => [
                'simulation' => [
                    'days' => $days,
                    'daily_total' => round($dailyTotal, 4),
                    'projected_earnings' => round($projectedEarnings, 4),
                    'current_balance' => $user->balance_pi,
                    'projected_balance' => round($user->balance_pi + $projectedEarnings, 4),
                ],
                'breakdown_by_investment' => $activeInvestments->map(function ($investment) use ($days) {
                    $dailyReturn = $investment->calculateDailyReturn();
                    return [
                        'investment_id' => $investment->id,
                        'package_name' => $investment->stakingPackage->name,
                        'amount' => $investment->amount,
                        'daily_rate' => $investment->daily_rate,
                        'daily_return' => round($dailyReturn, 4),
                        'projected_return' => round($dailyReturn * $days, 4),
                    ];
                }),
            ]
        ]);
    }

    /**
     * Obtenir le statut des claims aujourd'hui
     */
    public function getTodayStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();
        
        $todayClaims = $user->claims()
            ->whereDate('created_at', $today)
            ->with('investment.stakingPackage')
            ->get();

        $claimableInvestments = $this->getClaimableInvestments($user);
        
        return response()->json([
            'success' => true,
            'data' => [
                'today' => [
                    'date' => $today,
                    'claims_made' => $todayClaims->count(),
                    'total_claimed_today' => $todayClaims->sum('amount'),
                    'claims_detail' => $todayClaims,
                ],
                'available_now' => [
                    'claimable_count' => $claimableInvestments->count(),
                    'total_claimable_amount' => $claimableInvestments->sum('next_claim_amount'),
                    'investments' => $claimableInvestments,
                ],
            ]
        ]);
    }

    /**
     * Méthode helper pour obtenir les investissements réclamables
     */
    private function computeClaimableInvestments($user)
    {
        return $user->activeInvestments
            ->filter(fn($inv) => $inv->canClaim())
            ->map(function ($investment) {
                return [
                    'investment_id' => $investment->id,
                    'package_name' => $investment->stakingPackage->name,
                    'amount' => $investment->amount,
                    'next_claim_amount' => $investment->calculateNextClaimAmount(),
                    'next_claim_at' => $investment->next_claim_at,
                    'can_claim_now' => true,
                ];
            })->values();
    }

    /**
     * Méthode helper pour obtenir les statistiques de claims
     */
    private function computeClaimStats($user): array
    {
        $claims = $user->claims();
        
        return [
            'total_claims' => $claims->count(),
            'total_claimed' => $user->total_claimed,
            'claims_this_week' => $claims->where('created_at', '>=', now()->startOfWeek())->count(),
            'claimed_this_week' => $claims->where('created_at', '>=', now()->startOfWeek())->sum('amount'),
            'claims_this_month' => $claims->where('created_at', '>=', now()->startOfMonth())->count(),
            'claimed_this_month' => $claims->where('created_at', '>=', now()->startOfMonth())->sum('amount'),
            'average_claim_amount' => round($claims->avg('amount') ?? 0, 4),
            'largest_single_claim' => round($claims->max('amount') ?? 0, 4),
            'last_claim_date' => $claims->latest()->value('created_at'),
            'current_streak' => $user->currentStreak?->current_streak ?? 0,
        ];
    }
}