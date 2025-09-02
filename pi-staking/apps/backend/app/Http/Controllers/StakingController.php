<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\StakingPackage;
use App\Services\StakingService;
use App\Services\UserLevelService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class StakingController extends Controller
{
    public function __construct(
        private StakingService $stakingService,
        private UserLevelService $userLevelService
    ) {}

    /**
     * Obtenir la liste des packages de staking disponibles
     */
    public function getPackages(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $packages = $this->stakingService->getAvailablePackages($user);
            return $this->success([
                'packages' => $packages,
                'user_level' => $user->current_level,
                'level_info' => $this->userLevelService->getLevelProgress($user),
            ]);
        } catch (\Throwable $e) {
            return $this->exception($e, 'Erreur lors du chargement des packages');
        }
    }

    /**
     * Créer un nouvel investissement
     */
    public function createInvestment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'package_id' => 'required|integer|exists:staking_packages,id',
            'amount' => 'required|numeric|min:0.01',
            'source' => 'required|in:funds,bonus',
        ], [
            'package_id.required' => 'Le package de staking est requis.',
            'package_id.exists' => 'Package de staking invalide.',
            'amount.required' => 'Le montant est requis.',
            'amount.min' => 'Le montant minimum est de 0.01 Pi.',
            'source.required' => 'La source de financement est requise.',
            'source.in' => 'Source de financement invalide (funds ou bonus).',
        ]);

        if ($validator->fails()) {
            return $this->fail('Erreurs de validation', 422, $validator->errors());
        }

        $user = $request->user();
        $package = StakingPackage::find($request->package_id);
        
        if (!$package) {
            return $this->fail('Package de staking introuvable.', 404);
        }

        try {
            $investment = $this->stakingService->createInvestment(
                $user,
                $package,
                $request->amount,
                $request->source
            );

            $investment->load('stakingPackage');

            return $this->success([
                'investment' => $investment,
                'user' => $user->fresh(['activeInvestments', 'bonusGrants']),
            ], 'Investissement créé avec succès !', 201);

        } catch (\Throwable $e) {
            return $this->fail($e->getMessage(), 422);
        }
    }

    /**
     * Obtenir la liste des investissements de l'utilisateur
     */
    public function getUserInvestments(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:active,completed,cancelled',
            'per_page' => 'nullable|integer|min:5|max:100',
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
        
        $query = $user->investments()->with(['stakingPackage', 'claims']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $investments = $query->latest()->paginate($perPage);

        // Ajouter les informations calculées
        $investments->getCollection()->transform(function ($investment) {
            $investment->can_claim_now = $investment->canClaim();
            $investment->next_claim_amount = $investment->calculateNextClaimAmount();
            $investment->total_claimed = $investment->claims->sum('amount');
            $investment->progress_percentage = $investment->progress_percentage;
            $investment->remaining_days = $investment->remaining_days;
            return $investment;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'investments' => $investments,
                'stats' => $this->stakingService->getUserInvestmentStats($user),
            ]
        ]);
    }

    /**
     * Obtenir les détails d'un investissement spécifique
     */
    public function getInvestmentDetails(Request $request, int $investmentId): JsonResponse
    {
        $user = $request->user();
        
        $investment = $user->investments()
            ->with(['stakingPackage', 'claims' => function ($query) {
                $query->latest();
            }])
            ->find($investmentId);

        if (!$investment) {
            return response()->json([
                'success' => false,
                'message' => 'Investissement introuvable.'
            ], 404);
        }

        // Enrichir avec les données calculées
        $investmentData = $investment->toArray();
        $investmentData['can_claim_now'] = $investment->canClaim();
        $investmentData['next_claim_amount'] = $investment->calculateNextClaimAmount();
        $investmentData['total_claimed'] = $investment->claims->sum('amount');
        $investmentData['progress_percentage'] = $investment->progress_percentage;
        $investmentData['remaining_days'] = $investment->remaining_days;
        $investmentData['daily_return'] = $investment->calculateDailyReturn();
        
        return response()->json([
            'success' => true,
            'data' => [
                'investment' => $investmentData,
                'claims_history' => $investment->claims->take(10),
            ]
        ]);
    }

    /**
     * Calculer les gains potentiels pour un montant donné
     */
    public function calculatePotentialEarnings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'package_id' => 'required|integer|exists:staking_packages,id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $package = StakingPackage::find($request->package_id);
        $amount = $request->amount;
        
        if (!$package->isValidAmount($amount)) {
            return response()->json([
                'success' => false,
                'message' => 'Montant invalide pour ce package.'
            ], 422);
        }

        $dailyReturn = $amount * $package->daily_rate;
        $totalDays = $package->duration_days ?? 365; // Par défaut 1 an si pas de limite
        $totalReturn = $dailyReturn * $totalDays;
        $totalProfit = $totalReturn - $amount;
        $profitPercentage = ($totalProfit / $amount) * 100;

        return response()->json([
            'success' => true,
            'data' => [
                'package' => $package,
                'calculation' => [
                    'initial_amount' => $amount,
                    'daily_rate' => $package->daily_rate,
                    'daily_return' => round($dailyReturn, 4),
                    'total_days' => $totalDays,
                    'total_return' => round($totalReturn, 4),
                    'total_profit' => round($totalProfit, 4),
                    'profit_percentage' => round($profitPercentage, 2),
                    'roi_annual' => round(($dailyReturn * 365 / $amount) * 100, 2),
                ],
            ]
        ]);
    }

    /**
     * Obtenir les statistiques globales de staking
     */
    public function getStakingStats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $stats = $this->stakingService->getUserInvestmentStats($user);
        
        // Ajouter des statistiques supplémentaires
        $activeInvestments = $user->activeInvestments;
        $todayClaimable = $activeInvestments->filter(fn($inv) => $inv->canClaim())->sum(fn($inv) => $inv->calculateNextClaimAmount());
        $weeklyProjection = $activeInvestments->sum('amount') * 7 * ($activeInvestments->avg('daily_rate') ?? 0);
        $monthlyProjection = $activeInvestments->sum('amount') * 30 * ($activeInvestments->avg('daily_rate') ?? 0);
        
        $extendedStats = array_merge($stats, [
            'today_claimable' => round($todayClaimable, 4),
            'weekly_projection' => round($weeklyProjection, 4),
            'monthly_projection' => round($monthlyProjection, 4),
            'average_daily_rate' => round($activeInvestments->avg('daily_rate') ?? 0, 4),
            'portfolio_distribution' => $activeInvestments->groupBy('stakingPackage.name')
                ->map(function ($investments, $packageName) {
                    return [
                        'package' => $packageName,
                        'count' => $investments->count(),
                        'total_amount' => $investments->sum('amount'),
                        'percentage' => 0, // Sera calculé côté frontend
                    ];
                })->values(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $extendedStats
        ]);
    }

    /**
     * Obtenir l'historique des performances
     */
    public function getPerformanceHistory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'period' => 'nullable|in:7days,30days,90days,1year',
            'metric' => 'nullable|in:claims,investments,balance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $period = $request->get('period', '30days');
        $metric = $request->get('metric', 'claims');
        
        // Calculer les dates
        $days = match($period) {
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            '1year' => 365,
            default => 30,
        };
        
        $startDate = now()->subDays($days);
        
        $history = [];
        
        if ($metric === 'claims') {
            $claims = $user->claims()
                ->where('created_at', '>=', $startDate)
                ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get();
                
            $history = $claims->map(function ($claim) {
                return [
                    'date' => $claim->date,
                    'value' => (float) $claim->total,
                ];
            });
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'metric' => $metric,
                'history' => $history,
            ]
        ]);
    }
}