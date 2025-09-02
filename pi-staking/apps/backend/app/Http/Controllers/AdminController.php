<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Investment;
use App\Models\Claim;
use App\Models\Transaction;
use App\Models\StakingPackage;
use App\Models\SystemAlert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Dashboard principal avec métriques générales
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            // Métriques générales
            $totalUsers = User::count();
            $activeUsers = User::where('last_activity', '>=', now()->subDays(30))->count();
            $newUsersToday = User::whereDate('created_at', today())->count();
            $newUsersThisWeek = User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();

            // Métriques financières
            $totalInvested = Investment::where('status', 'active')->sum('amount');
            $totalClaimed = Claim::where('status', 'completed')->sum('final_amount');
            $pendingClaims = Investment::where('status', 'active')
                ->where('next_claim_available_at', '<=', now())
                ->count();
            
            // Calcul du TVL (Total Value Locked)
            $tvl = Investment::where('status', 'active')->sum('amount');
            $dailyVolume = Investment::whereDate('created_at', today())->sum('amount');
            
            // Revenus de la plateforme (frais)
            $platformRevenue = $this->calculatePlatformRevenue();
            
            // Ratios de santé financière
            $liquidityRatio = $this->calculateLiquidityRatio();
            $claimRatio = $totalClaimed > 0 ? ($totalInvested / $totalClaimed) : 0;

            // Alertes système
            $activeAlerts = SystemAlert::where('is_resolved', false)
                ->where('severity', '!=', 'low')
                ->count();

            // Packages les plus populaires
            $popularPackages = StakingPackage::withCount('investments')
                ->orderBy('investments_count', 'desc')
                ->take(3)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_users' => $totalUsers,
                        'active_users' => $activeUsers,
                        'new_users_today' => $newUsersToday,
                        'new_users_week' => $newUsersThisWeek,
                        'active_users_percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
                        'user_growth_rate' => $this->calculateUserGrowthRate(),
                    ],
                    'financial' => [
                        'total_value_locked' => $tvl,
                        'total_invested' => $totalInvested,
                        'total_claimed' => $totalClaimed,
                        'daily_volume' => $dailyVolume,
                        'platform_revenue' => $platformRevenue,
                        'pending_claims' => $pendingClaims,
                        'pending_claims_amount' => $this->calculatePendingClaimsAmount(),
                        'liquidity_ratio' => $liquidityRatio,
                        'claim_ratio' => round($claimRatio, 2),
                    ],
                    'health_indicators' => [
                        'liquidity_status' => $this->getLiquidityStatus($liquidityRatio),
                        'platform_status' => $this->getPlatformStatus(),
                        'active_alerts' => $activeAlerts,
                        'system_load' => $this->getSystemLoad(),
                    ],
                    'popular_packages' => $popularPackages->map(function ($package) {
                        return [
                            'id' => $package->id,
                            'name' => $package->name,
                            'investments_count' => $package->investments_count,
                            'daily_rate' => $package->daily_rate * 100,
                            'total_invested' => Investment::where('package_id', $package->id)
                                ->where('status', 'active')
                                ->sum('amount'),
                        ];
                    }),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques admin',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Analytics détaillés avec graphiques
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d'); // 7d, 30d, 90d, 1y
        
        try {
            $startDate = $this->getStartDateFromPeriod($period);
            
            // Évolution des utilisateurs
            $userEvolution = $this->getUserEvolution($startDate);
            
            // Évolution du TVL
            $tvlEvolution = $this->getTVLEvolution($startDate);
            
            // Évolution des claims vs revenus
            $claimsVsRevenue = $this->getClaimsVsRevenue($startDate);
            
            // Distribution des niveaux utilisateurs
            $userLevels = $this->getUserLevelsDistribution();
            
            // Top packages par performance
            $packagesPerformance = $this->getPackagesPerformance($startDate);
            
            // Analyse des transactions
            $transactionAnalysis = $this->getTransactionAnalysis($startDate);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'start_date' => $startDate->toDateString(),
                    'user_evolution' => $userEvolution,
                    'tvl_evolution' => $tvlEvolution,
                    'claims_vs_revenue' => $claimsVsRevenue,
                    'user_levels' => $userLevels,
                    'packages_performance' => $packagesPerformance,
                    'transaction_analysis' => $transactionAnalysis,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des analytics',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Gestion des utilisateurs
     */
    public function getUsers(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search');
            $level = $request->get('level');
            $status = $request->get('status');
            $perPage = $request->get('per_page', 20);

            $query = User::with(['investments', 'claims'])
                ->withCount(['investments', 'claims'])
                ->orderBy('created_at', 'desc');

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('username', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($level) {
                $query->where('current_level', $level);
            }

            if ($status === 'active') {
                $query->where('last_activity', '>=', now()->subDays(30));
            } elseif ($status === 'inactive') {
                $query->where('last_activity', '<', now()->subDays(30))
                      ->orWhereNull('last_activity');
            }

            $users = $query->paginate($perPage);

            // Enrichir les données utilisateur
            $users->getCollection()->transform(function ($user) {
                $activeInvestments = $user->investments->where('status', 'active');
                $totalClaimed = $user->claims->where('status', 'completed')->sum('final_amount');

                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'current_level' => $user->current_level,
                    'balance_pi' => $user->balance_pi,
                    'total_invested' => $user->total_invested,
                    'total_claimed' => $totalClaimed,
                    'active_investments' => $activeInvestments->count(),
                    'investments_count' => $user->investments_count,
                    'claims_count' => $user->claims_count,
                    'last_activity' => $user->last_activity,
                    'created_at' => $user->created_at,
                    'kyc_status' => $user->kyc_status ?? 'pending',
                    'is_active' => $user->last_activity >= now()->subDays(30),
                    'referral_code' => $user->referral_code,
                    'loyalty_points' => $user->loyalty_points,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Monitoring des transactions
     */
    public function getTransactions(Request $request): JsonResponse
    {
        try {
            $type = $request->get('type');
            $status = $request->get('status');
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $perPage = $request->get('per_page', 20);

            $query = Transaction::with('user')
                ->orderBy('created_at', 'desc');

            if ($type) {
                $query->where('type', $type);
            }

            if ($status) {
                $query->where('status', $status);
            }

            if ($dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            $transactions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Alertes système
     */
    public function getSystemAlerts(): JsonResponse
    {
        try {
            $alerts = SystemAlert::orderBy('severity', 'desc')
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $alerts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des alertes',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Actions administratives sur les utilisateurs
     */
    public function updateUser(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'current_level' => 'sometimes|in:discovery,bronze,silver,gold,diamond',
            'balance_pi' => 'sometimes|numeric|min:0',
            'kyc_status' => 'sometimes|in:pending,verified,rejected',
            'is_active' => 'sometimes|boolean',
        ]);

        try {
            $user->update($request->only([
                'current_level', 'balance_pi', 'kyc_status'
            ]));

            if ($request->has('is_active') && !$request->is_active) {
                // Suspendre l'utilisateur
                $user->update(['suspended_at' => now()]);
            } elseif ($request->has('is_active') && $request->is_active) {
                // Réactiver l'utilisateur
                $user->update(['suspended_at' => null]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'data' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    // === MÉTHODES PRIVÉES POUR LES CALCULS ===

    private function calculatePlatformRevenue(): float
    {
        // Calcul des revenus basé sur les frais de dépôt et de performance
        $depositFees = Investment::where('status', 'active')
            ->join('staking_packages', 'investments.package_id', '=', 'staking_packages.id')
            ->sum(DB::raw('investments.amount * staking_packages.deposit_fee_rate'));

        $performanceFees = Claim::where('status', 'completed')
            ->join('investments', 'claims.investment_id', '=', 'investments.id')
            ->join('staking_packages', 'investments.package_id', '=', 'staking_packages.id')
            ->sum(DB::raw('claims.final_amount * staking_packages.performance_fee_rate'));

        return $depositFees + $performanceFees;
    }

    private function calculateLiquidityRatio(): float
    {
        $totalReserve = 1000000; // À adapter selon votre réserve réelle
        $totalClaimed = Claim::where('status', 'completed')->sum('final_amount');
        $pendingClaims = $this->calculatePendingClaimsAmount();
        
        $totalObligations = $totalClaimed + $pendingClaims;
        
        return $totalObligations > 0 ? ($totalReserve / $totalObligations) : 1.0;
    }

    private function calculatePendingClaimsAmount(): float
    {
        return Investment::where('status', 'active')
            ->where('next_claim_available_at', '<=', now())
            ->join('staking_packages', 'investments.package_id', '=', 'staking_packages.id')
            ->sum(DB::raw('investments.amount * investments.effective_rate'));
    }

    private function calculateUserGrowthRate(): float
    {
        $lastMonthUsers = User::whereDate('created_at', '>=', now()->subDays(60))
            ->whereDate('created_at', '<', now()->subDays(30))
            ->count();
            
        $thisMonthUsers = User::whereDate('created_at', '>=', now()->subDays(30))
            ->count();

        return $lastMonthUsers > 0 ? 
            round((($thisMonthUsers - $lastMonthUsers) / $lastMonthUsers) * 100, 1) : 
            0;
    }

    private function getLiquidityStatus(float $ratio): string
    {
        if ($ratio >= 1.5) return 'excellent';
        if ($ratio >= 1.2) return 'good';
        if ($ratio >= 1.0) return 'adequate';
        return 'warning';
    }

    private function getPlatformStatus(): string
    {
        $criticalAlerts = SystemAlert::where('is_resolved', false)
            ->where('severity', 'critical')
            ->count();

        if ($criticalAlerts > 0) return 'critical';
        
        $highAlerts = SystemAlert::where('is_resolved', false)
            ->where('severity', 'high')
            ->count();

        if ($highAlerts > 5) return 'warning';
        
        return 'healthy';
    }

    private function getSystemLoad(): float
    {
        // Calcul basique de la charge système
        $activeUsers = User::where('last_activity', '>=', now()->subHour())->count();
        $maxCapacity = 1000; // À adapter selon votre infrastructure
        
        return min(($activeUsers / $maxCapacity) * 100, 100);
    }

    private function getStartDateFromPeriod(string $period): Carbon
    {
        return match($period) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '1y' => now()->subYear(),
            default => now()->subDays(30)
        };
    }

    private function getUserEvolution(Carbon $startDate): array
    {
        return User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'users' => $item->count
                ];
            })
            ->toArray();
    }

    private function getTVLEvolution(Carbon $startDate): array
    {
        return Investment::selectRaw('DATE(created_at) as date, SUM(amount) as tvl')
            ->where('created_at', '>=', $startDate)
            ->where('status', 'active')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'tvl' => floatval($item->tvl)
                ];
            })
            ->toArray();
    }

    private function getClaimsVsRevenue(Carbon $startDate): array
    {
        $claims = Claim::selectRaw('DATE(created_at) as date, SUM(final_amount) as claims')
            ->where('created_at', '>=', $startDate)
            ->where('status', 'completed')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $revenue = Investment::selectRaw('DATE(created_at) as date, SUM(amount * 0.02) as revenue') // 2% fee example
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $dates = collect($claims->keys()->merge($revenue->keys()))->unique()->sort();

        return $dates->map(function ($date) use ($claims, $revenue) {
            return [
                'date' => $date,
                'claims' => floatval($claims[$date]->claims ?? 0),
                'revenue' => floatval($revenue[$date]->revenue ?? 0)
            ];
        })->toArray();
    }

    private function getUserLevelsDistribution(): array
    {
        return User::selectRaw('current_level, COUNT(*) as count')
            ->groupBy('current_level')
            ->get()
            ->map(function ($item) {
                return [
                    'level' => $item->current_level,
                    'count' => $item->count,
                    'percentage' => round(($item->count / User::count()) * 100, 1)
                ];
            })
            ->toArray();
    }

    private function getPackagesPerformance(Carbon $startDate): array
    {
        return StakingPackage::with(['investments' => function ($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }])
            ->get()
            ->map(function ($package) {
                $totalInvested = $package->investments->sum('amount');
                $totalClaims = Claim::whereHas('investment', function ($query) use ($package) {
                    $query->where('package_id', $package->id);
                })->where('status', 'completed')->sum('final_amount');

                return [
                    'name' => $package->name,
                    'investments_count' => $package->investments->count(),
                    'total_invested' => $totalInvested,
                    'total_claims' => $totalClaims,
                    'roi' => $totalInvested > 0 ? round(($totalClaims / $totalInvested) * 100, 2) : 0,
                    'daily_rate' => $package->daily_rate * 100
                ];
            })
            ->toArray();
    }

    private function getTransactionAnalysis(Carbon $startDate): array
    {
        $totalTransactions = Transaction::where('created_at', '>=', $startDate)->count();
        
        $byType = Transaction::selectRaw('type, COUNT(*) as count, SUM(ABS(amount)) as volume')
            ->where('created_at', '>=', $startDate)
            ->groupBy('type')
            ->get();

        $byStatus = Transaction::selectRaw('status, COUNT(*) as count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('status')
            ->get();

        return [
            'total_transactions' => $totalTransactions,
            'by_type' => $byType->toArray(),
            'by_status' => $byStatus->toArray(),
            'success_rate' => $totalTransactions > 0 ? 
                round(($byStatus->where('status', 'completed')->sum('count') / $totalTransactions) * 100, 1) : 0
        ];
    }
}