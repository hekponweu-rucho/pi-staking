<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Investment;
use App\Models\Claim;
use App\Models\Transaction;
use App\Services\StakingService;
use App\Services\UserLevelService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(
        private StakingService $stakingService,
        private UserLevelService $userLevelService
    ) {}

    /**
     * Obtenir les données du dashboard principal
     */
    public function getDashboardData(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'activeInvestments.stakingPackage',
            'bonusGrants' => function ($query) {
                $query->where('is_used', false)->where('expires_at', '>', now());
            }
        ]);

        // Statistiques principales
        $mainStats = $this->getMainStats($user);
        
        // Informations de niveau
        $levelInfo = $this->userLevelService->getLevelProgress($user);
        $nextLevelInfo = $this->userLevelService->getNextLevelInfo($user);
        
        // Investissements réclamables
        $claimableInvestments = $user->activeInvestments->filter(fn($inv) => $inv->canClaim());
        
        // Activité récente
        $recentActivity = $this->getRecentActivity($user);
        
        // Projections
        $projections = $this->getProjections($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'stats' => $mainStats,
                'level' => [
                    'current' => $levelInfo,
                    'next' => $nextLevelInfo,
                ],
                'claimable' => [
                    'count' => $claimableInvestments->count(),
                    'total_amount' => $claimableInvestments->sum(fn($inv) => $inv->calculateNextClaimAmount()),
                    'investments' => $claimableInvestments->values(),
                ],
                'recent_activity' => $recentActivity,
                'projections' => $projections,
            ]
        ]);
    }

    /**
     * Obtenir le résumé financier
     */
    public function getFinancialSummary(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $summary = [
            'balances' => [
                'available' => $user->balance_pi,
                'bonus' => $user->bonus_balance,
                'staked' => $user->activeInvestments->sum('amount'),
                'total_portfolio' => $user->balance_pi + $user->activeInvestments->sum('amount'),
            ],
            'lifetime' => [
                'total_invested' => $user->total_invested,
                'total_claimed' => $user->total_claimed,
                'net_profit' => $user->total_claimed - $user->total_invested,
                'roi_percentage' => $user->total_invested > 0 ? 
                    round(($user->total_claimed / $user->total_invested) * 100, 2) : 0,
            ],
            'active_investments' => [
                'count' => $user->activeInvestments->count(),
                'total_value' => $user->activeInvestments->sum('amount'),
                'daily_return' => $user->activeInvestments->sum(fn($inv) => $inv->calculateDailyReturn()),
                'average_rate' => $user->activeInvestments->avg('daily_rate') ?? 0,
            ],
            'performance' => [

                'claims_this_month' => $user->claims()->whereMonth('created_at', now()->month)->sum('final_amount'),
                'investments_this_month' => $user->investments()->whereMonth('created_at', now()->month)->sum('amount'),
                'best_performing_package' => $this->getBestPerformingPackage($user),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }

    /**
     * Obtenir les métriques de performance
     */
    public function getPerformanceMetrics(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Calculs sur différentes périodes
        $metrics = [
            'daily' => $this->getPeriodMetrics($user, 'daily'),
            'weekly' => $this->getPeriodMetrics($user, 'weekly'),
            'monthly' => $this->getPeriodMetrics($user, 'monthly'),
            'yearly' => $this->getPeriodMetrics($user, 'yearly'),
        ];
        
        // Tendances
        $trends = [
            'claims_trend' => $this->getClaimsTrend($user),
            'investment_trend' => $this->getInvestmentTrend($user),
            'balance_evolution' => $this->getBalanceEvolution($user),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'metrics' => $metrics,
                'trends' => $trends,
            ]
        ]);
    }

    /**
     * Obtenir les notifications et alertes
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'activeInvestments',
            'bonusGrants' => function ($query) {
                $query->where('is_used', false);
            }
        ]);

        $notifications = [];

        // Investissements réclamables
        $claimableCount = $user->activeInvestments->filter(fn($inv) => $inv->canClaim())->count();
        if ($claimableCount > 0) {
            $notifications[] = [
                'type' => 'claim_available',
                'title' => 'Réclamations disponibles',
                'message' => "{$claimableCount} investissement(s) prêt(s) à être réclamé(s)",
                'priority' => 'high',
                'action_url' => '/dashboard/claims',
            ];
        }

        // Bonus expirant bientôt
        $expiringBonus = $user->bonusGrants->filter(function ($bonus) {
            return $bonus->expires_at && $bonus->expires_at->diffInDays(now()) <= 7;
        });
        
        if ($expiringBonus->count() > 0) {
            $totalAmount = $expiringBonus->sum('amount');
            $days = $expiringBonus->min('expires_at')->diffInDays(now());
            $notifications[] = [
                'type' => 'bonus_expiring',
                'title' => 'Bonus expirant bientôt',
                'message' => "{$totalAmount} Pi de bonus expire dans {$days} jour(s)",
                'priority' => 'medium',
                'action_url' => '/dashboard/staking',
            ];
        }

        // Progression de niveau
        $levelProgress = $this->userLevelService->getLevelProgress($user);
        if ($levelProgress['progress_percentage'] >= 80) {
            $nextLevel = $this->userLevelService->getNextLevelInfo($user);
            if ($nextLevel) {
                $remaining = $nextLevel['required_investment'] - $user->total_invested;
                $notifications[] = [
                    'type' => 'level_progress',
                    'title' => 'Proche du niveau supérieur',
                    'message' => "Plus que {$remaining} Pi pour atteindre le niveau {$nextLevel['level']}",
                    'priority' => 'low',
                    'action_url' => '/dashboard/level',
                ];
            }
        }

        // Streak de réclamation
        $currentStreak = $user->currentStreak?->current_streak ?? 0;
        if ($currentStreak >= 7) {
            $notifications[] = [
                'type' => 'streak_milestone',
                'title' => 'Belle série !',
                'message' => "Vous avez une série de {$currentStreak} jours consécutifs",
                'priority' => 'low',
                'action_url' => '/dashboard/stats',
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => count($notifications),
            ]
        ]);
    }

    /**
     * Obtenir les données pour les graphiques
     */
    public function getChartsData(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = $request->get('period', '30days');
        
        $days = match($period) {
            '7days' => 7,
            '30days' => 30,
            '90days' => 90,
            '1year' => 365,
            default => 30,
        };
        
        $startDate = now()->subDays($days);
        
        // Évolution du solde
        $balanceEvolution = $this->getBalanceChartData($user, $startDate);
        
        // Claims par jour
        $claimsData = $user->claims()
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($claim) => [
                'date' => $claim->date,
                'amount' => (float) $claim->total,
            ]);

        // Répartition des investissements par package
        $investmentDistribution = $user->activeInvestments
            ->groupBy('stakingPackage.name')
            ->map(function ($investments, $packageName) {
                return [
                    'package' => $packageName,
                    'amount' => $investments->sum('amount'),
                    'count' => $investments->count(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'balance_evolution' => $balanceEvolution,
                'daily_claims' => $claimsData,
                'investment_distribution' => $investmentDistribution,
            ]
        ]);
    }

    // Méthodes privées pour les calculs

    private function getMainStats($user): array
    {
        return [
            'balance_pi' => $user->balance_pi,
            'bonus_balance' => $user->bonus_balance,
            'total_invested' => $user->total_invested,
            'total_claimed' => $user->total_claimed,
            'active_investments_count' => $user->activeInvestments->count(),
            'staked_amount' => $user->activeInvestments->sum('amount'),
            'daily_earnings' => $user->activeInvestments->sum(fn($inv) => $inv->calculateDailyReturn()),
        ];
    }

    private function getRecentActivity($user): array
    {
        $activities = collect();
        
        // Derniers claims
        $recentClaims = $user->claims()->with('investment.stakingPackage')
            ->latest()->limit(5)->get()
            ->map(fn($claim) => [
                'type' => 'claim',
                'description' => "Réclamation de {$claim->final_amount} Pi",
                'amount' => $claim->final_amount,
                'date' => $claim->created_at,
                'package' => $claim->investment->stakingPackage->name ?? '',
            ]);

        // Derniers investissements
        $recentInvestments = $user->investments()->with('stakingPackage')
            ->latest()->limit(5)->get()
            ->map(fn($inv) => [
                'type' => 'investment',
                'description' => "Investissement dans {$inv->stakingPackage->name}",
                'amount' => $inv->amount,
                'date' => $inv->created_at,
                'package' => $inv->stakingPackage->name,
            ]);

        return $activities
            ->concat($recentClaims)
            ->concat($recentInvestments)
            ->sortByDesc('date')
            ->take(10)
            ->values()
            ->toArray();
    }

    private function getProjections($user): array
    {
        $activeInvestments = $user->activeInvestments;
        $dailyReturn = $activeInvestments->sum(fn($inv) => $inv->calculateDailyReturn());
        
        return [
            'daily' => round($dailyReturn, 4),
            'weekly' => round($dailyReturn * 7, 4),
            'monthly' => round($dailyReturn * 30, 4),
            'yearly' => round($dailyReturn * 365, 4),
        ];
    }

    private function getPeriodMetrics($user, $period): array
    {
        $startDate = match($period) {
            'daily' => now()->startOfDay(),
            'weekly' => now()->startOfWeek(),
            'monthly' => now()->startOfMonth(),
            'yearly' => now()->startOfYear(),
        };

        $claims = $user->claims()->where('created_at', '>=', $startDate);
        $investments = $user->investments()->where('created_at', '>=', $startDate);

        return [
            'claims_count' => $claims->count(),
            'claims_amount' => $claims->sum('final_amount'),
            'investments_count' => $investments->count(),
            'investments_amount' => $investments->sum('amount'),
        ];
    }

    private function getClaimsTrend($user): array
    {
        return $user->claims()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(final_amount) as total')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($claim) => [
                'date' => $claim->date,
                'count' => $claim->count,
                'amount' => (float) $claim->total,
            ])
            ->toArray();
    }

    private function getInvestmentTrend($user): array
    {
        return $user->investments()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(amount) as total')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($inv) => [
                'date' => $inv->date,
                'count' => $inv->count,
                'amount' => (float) $inv->total,
            ])
            ->toArray();
    }

    private function getBalanceEvolution($user): array
    {
        // Simplification : calcul basé sur les transactions
        $transactions = $user->transactions()
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at')
            ->get();

        $evolution = [];
        $runningBalance = $user->balance_pi;

        foreach ($transactions->reverse() as $transaction) {
            $runningBalance -= $transaction->amount;
            $evolution[] = [
                'date' => $transaction->created_at->toDateString(),
                'balance' => round($runningBalance, 4),
            ];
        }

        return array_reverse($evolution);
    }

    private function getBalanceChartData($user, $startDate): array
    {
        // Implémentation simplifiée
        return $user->transactions()
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, balance_after as balance')
            ->orderBy('created_at')
            ->get()
            ->map(fn($t) => [
                'date' => $t->date,
                'balance' => (float) $t->balance,
            ])
            ->toArray();
    }

    private function getBestPerformingPackage($user): ?array
    {
        $packagePerformance = $user->investments()
            ->with('stakingPackage')
            ->get()
            ->groupBy('staking_package_id')
            ->map(function ($investments) {
                $totalInvested = $investments->sum('amount');
                $totalClaimed = $investments->sum(fn($inv) => $inv->claims->sum('final_amount'));
                
                return [
                    'package' => $investments->first()->stakingPackage,
                    'total_invested' => $totalInvested,
                    'total_claimed' => $totalClaimed,
                    'roi' => $totalInvested > 0 ? ($totalClaimed / $totalInvested) * 100 : 0,
                ];
            })
            ->sortByDesc('roi')
            ->first();

        return $packagePerformance;
    }

    /**
     * Marquer une notification comme lue
     */
    public function markNotificationAsRead(Request $request, int $notificationId): JsonResponse
    {
        $user = $request->user();
        
        // Ici nous pourrions utiliser un modèle Notification
        // Pour le moment, nous simulons cette fonctionnalité
        
        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue.'
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllNotificationsAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ici nous pourrions marquer toutes les notifications comme lues
        // Pour le moment, nous simulons cette fonctionnalité
        
        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.'
        ]);
    }
}