<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Investment;
use App\Models\Claim;
use App\Models\Transaction;
use App\Models\StakingPackage;
use App\Models\SystemAlert;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function listPackages(Request $request): JsonResponse
    {
        $perPage = \App\Support\Pagination::perPage($request);
        [$sortCol, $sortDir] = \App\Support\Pagination::sort($request, [
            'name' => 'name',
            'created_at' => 'created_at',
            'daily_rate' => 'daily_rate',
            'min_amount' => 'min_amount',
            'level' => 'level',
        ], 'created_at', 'desc');

        $query = StakingPackage::query()
            ->withCount('investments')
            ->with(['investments' => function($q){ $q->where('status', 'active'); }]);

        if (!is_null($request->query('is_active'))) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOL));
        }
        if ($level = $request->query('level')) {
            $query->where('level', $level);
        }

        $paginator = $query->orderBy($sortCol, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        return response()->json(\App\Support\Pagination::envelope($paginator, \App\Http\Resources\StakingPackageResource::class, $request));
    }

    public function getDashboardStats(): JsonResponse
    {
        try {
            // Users overview
            $totalUsers = User::count();
            $activeUsers = User::where('last_activity', '>=', now()->subDays(30))->count();
            $newUsersToday = User::whereDate('created_at', today())->count();
            $newUsersThisWeek = User::where('created_at', '>=', now()->startOfWeek())->count();

            $users = [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'new_today' => $newUsersToday,
                'new_this_week' => $newUsersThisWeek,
            ];

            // Métriques financières détaillées
            $totalInvested = Investment::where('status', 'active')->sum('amount');
            $totalClaimed = Claim::where('status', 'completed')->sum('final_amount');
            $pendingClaims = Investment::where('status', 'active')
                ->where('next_claim_at', '<=', now())
                ->count();
            $tvl = Investment::where('status', 'active')->sum('amount');
            $dailyVolume = Investment::whereDate('created_at', today())->sum('amount');
            $platformRevenue = $this->calculatePlatformRevenue();
            $liquidityRatio = $this->calculateLiquidityRatio();
            $claimRatio = $totalClaimed > 0 ? ($totalInvested / $totalClaimed) : 0;
            // Totaux simplifiés (branche)
            $investments = [
                'total' => Investment::count(),
                'active' => Investment::where('status', 'active')->count(),
                'total_amount' => (float) Investment::sum('amount'),
            ];

            $tvl = (float) Investment::where('status', 'active')->sum('amount');

            $claims = [
                'total' => Claim::count(),
                'processed' => Claim::where('status', 'processed')->count(),
            ];

            $transactionsData = null;
            if (Schema::hasTable('transactions')) {
                $transactionsData = [
                    'total' => Transaction::count(),
                    'volume' => (float) Transaction::sum('amount'),
                ];
            }

            $packagesCount = StakingPackage::count();
            $popularPackages = StakingPackage::withCount('investments')
                ->orderByDesc('investments_count')
                ->take(5)
                ->get();

            $activeAlerts = SystemAlert::where('is_resolved', false)->count();

            $start = now()->subMonths(12)->startOfMonth();
            $months = [];
            for ($i = 0; $i < 12; $i++) {
                $months[] = $start->copy()->addMonths($i)->format('Y-m');
            }

            $invAgg = Investment::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"), DB::raw('COUNT(*) as cnt'), DB::raw('SUM(amount) as amt'))
                ->where('created_at', '>=', $start)
                ->groupBy('ym')
                ->orderBy('ym')
                ->get()
                ->keyBy('ym');

            $investmentsByMonth = [];
            $investmentVolumeByMonth = [];
            foreach ($months as $ym) {
                $investmentsByMonth[] = [
                    'month' => $ym,
                    'count' => (int) ($invAgg[$ym]->cnt ?? 0),
                ];
                $investmentVolumeByMonth[] = [
                    'month' => $ym,
                    'amount' => (float) ($invAgg[$ym]->amt ?? 0),
                ];
            }

            $claimAgg = Claim::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"), DB::raw('COUNT(*) as cnt'), DB::raw('SUM(final_amount) as amt'))
                ->where('status', 'processed')
                ->where('created_at', '>=', $start)
                ->groupBy('ym')
                ->orderBy('ym')
                ->get()
                ->keyBy('ym');

            $claimsByMonth = [];
            $claimVolumeByMonth = [];
            foreach ($months as $ym) {
                $claimsByMonth[] = [
                    'month' => $ym,
                    'count' => (int) ($claimAgg[$ym]->cnt ?? 0),
                ];
                $claimVolumeByMonth[] = [
                    'month' => $ym,
                    'amount' => (float) ($claimAgg[$ym]->amt ?? 0),
                ];
            }

            $transactionVolumeByMonth = null;
            if (Schema::hasTable('transactions')) {
                $txAgg = Transaction::select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"), DB::raw('SUM(amount) as amt'))
                    ->where('created_at', '>=', $start)
                    ->groupBy('ym')
                    ->orderBy('ym')
                    ->get()
                    ->keyBy('ym');
                $tmp = [];
                foreach ($months as $ym) {
                    $tmp[] = [
                        'month' => $ym,
                        'amount' => (float) ($txAgg[$ym]->amt ?? 0),
                    ];
                }
                $transactionVolumeByMonth = $tmp;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    // Fusion des deux structures : détails + totaux
                    'overview' => [
                        'total_users' => $totalUsers,
                        'active_users' => $activeUsers,
                        'new_users_today' => $newUsersToday,
                        'new_users_week' => $newUsersThisWeek,
                        'active_users_percentage' => $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100, 1) : 0,
                        'user_growth_rate' => $this->calculateUserGrowthRate(),
                        'pending_withdrawals' => WithdrawalRequest::where('status', 'pending')->count(),
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
                            'total_invested' => Investment::where('staking_package_id', $package->id)
                                ->where('status', 'active')
                                ->sum('amount'),
                        ];
                    }),
                    // Ajout des totaux simplifiés de la branche
                    'users' => $users,
                    'investments' => $investments,
                    'tvl' => $tvl,
                    'claims' => $claims ?? null,
                    'transactions' => $transactionsData ?? null,
                    'packages' => $packagesCount ?? null,
                    'charts' => array_filter([
                        'investmentsByMonth' => $investmentsByMonth ?? null,
                        'investmentVolumeByMonth' => $investmentVolumeByMonth ?? null,
                        'claimsByMonth' => $claimsByMonth ?? null,
                        'claimVolumeByMonth' => $claimVolumeByMonth ?? null,
                        'transactionVolumeByMonth' => $transactionVolumeByMonth ?? null,
                    ]),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Admin dashboard error', ['message' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques admin'
            ], 500);
        }
    }

    public function getAnalytics(Request $request): JsonResponse
    {
        $period = $request->get('period', '30d');
        try {
            $startDate = $this->getStartDateFromPeriod($period);
            $userEvolution = $this->getUserEvolution($startDate);
            $tvlEvolution = $this->getTVLEvolution($startDate);
            $claimsVsRevenue = $this->getClaimsVsRevenue($startDate);
            $userLevels = $this->getUserLevelsDistribution();
            $packagesPerformance = $this->getPackagesPerformance($startDate);
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

    public function getUsers(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search');
            $level = $request->query('level');
            $status = $request->query('status');

            $perPage = \App\Support\Pagination::perPage($request);
            [$sortCol, $sortDir] = \App\Support\Pagination::sort($request, [
                'created_at' => 'created_at',
                'id' => 'id',
                'username' => 'username',
                'email' => 'email',
                'current_level' => 'current_level',
                'last_activity' => 'last_activity',
                'total_invested' => 'total_invested',
                'total_claimed' => 'total_claimed',
            ], 'created_at', 'desc');

            $query = User::with(['investments', 'claims'])
                ->withCount(['investments', 'claims']);

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
                $query->where(function($q){
                    $q->where('last_activity', '<', now()->subDays(30))
                      ->orWhereNull('last_activity');
                });
            }

            $paginator = $query->orderBy($sortCol, $sortDir)
                ->paginate($perPage)
                ->withQueryString();

            return response()->json(\App\Support\Pagination::envelope($paginator, \App\Http\Resources\AdminUserResource::class, $request));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function getTransactions(Request $request): JsonResponse
    {
        try {
            $type = $request->query('type');
            $status = $request->query('status');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            $userId = $request->query('user_id');
            $minAmount = $request->query('min_amount');
            $maxAmount = $request->query('max_amount');

            $perPage = \App\Support\Pagination::perPage($request);
            [$sortCol, $sortDir] = \App\Support\Pagination::sort($request, ['created_at','amount','status','type','id'], 'created_at', 'desc');

            $query = Transaction::with('user');

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
            if ($userId) {
                $query->where('user_id', $userId);
            }
            if ($minAmount !== null) {
                $query->where('amount', '>=', $minAmount);
            }
            if ($maxAmount !== null) {
                $query->where('amount', '<=', $maxAmount);
            }

            $paginator = $query->orderBy($sortCol, $sortDir)
                ->paginate($perPage)
                ->withQueryString();

            return response()->json(\App\Support\Pagination::envelope($paginator, \App\Http\Resources\TransactionResource::class, $request));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des transactions',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function exportTransactionsCsv(Request $request)
    {
        $type = $request->get('type');
        $status = $request->get('status');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $userId = $request->get('user_id');
        $minAmount = $request->get('min_amount');
        $maxAmount = $request->get('max_amount');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSort = ['created_at','amount','status','type','id'];
        if (!in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'created_at';
        }

        $query = Transaction::with('user');
        if ($type) $query->where('type', $type);
        if ($status) $query->where('status', $status);
        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('created_at', '<=', $dateTo);
        if ($userId) $query->where('user_id', $userId);
        if ($minAmount !== null) $query->where('amount', '>=', $minAmount);
        if ($maxAmount !== null) $query->where('amount', '<=', $maxAmount);

        $filename = 'admin_transactions_' . now()->format('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ];

        $callback = function () use ($query, $sortBy, $sortDir) {
            $handle = fopen('php://output', 'w');
            // English headers, UTC timestamps
            fputcsv($handle, ['id','user_email','type','status','amount','tx_hash','reference_id','created_at_utc']);
            $query->orderBy($sortBy, $sortDir)->chunk(500, function ($rows) use ($handle) {
                foreach ($rows as $tx) {
                    $createdUtc = optional($tx->created_at)?->copy()->setTimezone('UTC')->format('Y-m-d H:i:s');
                    fputcsv($handle, [
                        $tx->id,
                        optional($tx->user)->email,
                        $tx->type,
                        $tx->status,
                        $tx->amount,
                        $tx->transaction_hash,
                        $tx->reference_id,
                        $createdUtc,
                    ]);
                }
            });
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
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

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'current_level' => 'sometimes|in:discovery,bronze,silver,gold,diamond',
            'balance_pi' => 'sometimes|numeric|min:0',
            'kyc_status' => 'sometimes|in:pending,verified,rejected',
            'is_active' => 'sometimes|boolean',
            'reset_two_factor' => 'sometimes|boolean',
        ]);

        try {
            $admin = $request->user();
            $old = $user->only(['current_level','balance_pi','kyc_status','suspended_at']);

            $user->update($request->only([
                'current_level', 'balance_pi', 'kyc_status'
            ]));

            if ($request->has('is_active') && !$request->boolean('is_active')) {
                $user->update(['suspended_at' => now()]);
            } elseif ($request->has('is_active') && $request->boolean('is_active')) {
                $user->update(['suspended_at' => null]);
            }

            if ($request->boolean('reset_two_factor')) {
                $user->update([
                    'two_factor_enabled' => false,
                    'two_factor_enabled_at' => null,
                    'two_factor_backup_codes' => null,
                ]);
            }

            if (class_exists(\App\Models\Audit::class)) {
                \App\Models\Audit::create([
                    'actor_id' => $admin->id,
                    'action' => 'admin.user.update',
                    'auditable_type' => User::class,
                    'auditable_id' => $user->id,
                    'event' => 'updated',
                    'old_values' => $old,
                    'new_values' => $user->only(['current_level','balance_pi','kyc_status','suspended_at']),
                    'metadata' => [
                        'reset_two_factor' => $request->boolean('reset_two_factor'),
                    ],
                ]);
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

    private function calculatePlatformRevenue(): float
    {
        // Calcul des revenus basé sur les frais de dépôt et de performance (fusion)
        $depositFees = Investment::where('status', 'active')
            ->join('staking_packages', 'investments.staking_package_id', '=', 'staking_packages.id')
            ->sum(DB::raw('investments.amount * staking_packages.deposit_fee_rate'));

        $performanceFees = Claim::where('status', 'completed')
            ->join('investments', 'claims.investment_id', '=', 'investments.id')
            ->join('staking_packages', 'investments.staking_package_id', '=', 'staking_packages.id')
            ->sum(DB::raw('claims.final_amount * staking_packages.performance_fee_rate'));

        return $depositFees + $performanceFees;
    }

    private function calculateLiquidityRatio(): float
    {
        $totalReserve = 1000000;
        $totalClaimed = Claim::where('status', 'processed')->sum('final_amount');
        $pendingClaims = $this->calculatePendingClaimsAmount();
        $totalObligations = $totalClaimed + $pendingClaims;
        return $totalObligations > 0 ? ($totalReserve / $totalObligations) : 1.0;
    }

    private function calculatePendingClaimsAmount(): float
    {
        return Investment::where('status', 'active')
            ->where('next_claim_at', '<=', now())
            ->join('staking_packages', 'investments.staking_package_id', '=', 'staking_packages.id')
            ->sum(DB::raw('investments.amount * investments.daily_rate'));
    }

    private function calculateUserGrowthRate(): float
    {
        $lastMonthUsers = User::whereDate('created_at', '>=', now()->subDays(60))
            ->whereDate('created_at', '<', now()->subDays(30))
            ->count();
        $thisMonthUsers = User::whereDate('created_at', '>=', now()->subDays(30))
            ->count();
        return $lastMonthUsers > 0 ? round((($thisMonthUsers - $lastMonthUsers) / $lastMonthUsers) * 100, 1) : 0;
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
        $activeUsers = User::where('last_activity', '>=', now()->subHour())->count();
        $maxCapacity = 1000;
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
            ->where('status', 'processed')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $revenue = Investment::selectRaw('DATE(created_at) as date, SUM(amount * 0.02) as revenue')
            ->where('created_at', '>=', $startDate)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $dates = collect($claims->keys()->merge($revenue->keys()))->unique()->sort();

        return $dates->map(function ($date) use ($claims, $revenue) {
            return [
                'date' => $date,
                'claims' => floatval(optional($claims->get($date))->claims ?? 0),
                'revenue' => floatval(optional($revenue->get($date))->revenue ?? 0)
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
                    $query->where('staking_package_id', $package->id);
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
