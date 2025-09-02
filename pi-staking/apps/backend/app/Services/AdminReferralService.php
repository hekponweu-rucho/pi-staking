<?php

namespace App\Services;

use App\Models\User;
use App\Models\Referral;
use App\Models\Investment;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AdminReferralService
{
    /**
     * Obtenir les statistiques globales du système de parrainage
     */
    public function getGlobalStats(): array
    {
        return Cache::remember('admin_referral_global_stats', 300, function () {
            
            // Statistiques principales
            $totalReferrals = Referral::count();
            $qualifiedReferrals = Referral::qualified()->count();
            $totalCommissionsPaid = Referral::where('bonus_paid', true)->sum('bonus_amount');
            $activeReferrers = User::whereHas('sentReferrals', function($query) {
                $query->qualified();
            })->count();
            
            // Statistiques par période
            $today = Carbon::today();
            $thisWeek = Carbon::now()->startOfWeek();
            $thisMonth = Carbon::now()->startOfMonth();
            
            $todayStats = [
                'new_referrals' => Referral::whereDate('created_at', $today)->count(),
                'qualified_referrals' => Referral::whereDate('qualified_at', $today)->count(),
                'commissions_paid' => Referral::whereDate('bonus_paid_at', $today)->sum('bonus_amount'),
            ];
            
            $weekStats = [
                'new_referrals' => Referral::where('created_at', '>=', $thisWeek)->count(),
                'qualified_referrals' => Referral::where('qualified_at', '>=', $thisWeek)->count(),
                'commissions_paid' => Referral::where('bonus_paid_at', '>=', $thisWeek)->sum('bonus_amount'),
            ];
            
            $monthStats = [
                'new_referrals' => Referral::where('created_at', '>=', $thisMonth)->count(),
                'qualified_referrals' => Referral::where('qualified_at', '>=', $thisMonth)->count(),
                'commissions_paid' => Referral::where('bonus_paid_at', '>=', $thisMonth)->sum('bonus_amount'),
            ];
            
            // Taux de conversion
            $conversionRate = $totalReferrals > 0 ? ($qualifiedReferrals / $totalReferrals) * 100 : 0;
            
            return [
                'overview' => [
                    'total_referrals' => $totalReferrals,
                    'qualified_referrals' => $qualifiedReferrals,
                    'active_referrers' => $activeReferrers,
                    'total_commissions_paid' => (float) $totalCommissionsPaid,
                    'conversion_rate' => round($conversionRate, 2),
                    'average_commission_per_referral' => $qualifiedReferrals > 0 ? 
                        round($totalCommissionsPaid / $qualifiedReferrals, 2) : 0,
                ],
                'today' => $todayStats,
                'this_week' => $weekStats,
                'this_month' => $monthStats,
            ];
        });
    }
    
    /**
     * Obtenir les métriques de performance par niveau
     */
    public function getLevelMetrics(): array
    {
        return Cache::remember('admin_referral_level_metrics', 300, function () {
            $metrics = [];
            
            for ($level = 1; $level <= 3; $level++) {
                $levelReferrals = Referral::where('level', $level);
                
                $metrics["level_{$level}"] = [
                    'total_referrals' => $levelReferrals->count(),
                    'qualified_referrals' => $levelReferrals->qualified()->count(),
                    'total_commissions' => (float) $levelReferrals->where('bonus_paid', true)->sum('bonus_amount'),
                    'average_qualifying_investment' => (float) $levelReferrals->qualified()->avg('qualifying_investment'),
                    'commission_rate' => $this->getCommissionRate($level),
                ];
            }
            
            return $metrics;
        });
    }
    
    /**
     * Obtenir les top parrains
     */
    public function getTopReferrers(int $limit = 20): array
    {
        return User::withCount(['sentReferrals as qualified_referrals_count' => function($query) {
                $query->qualified();
            }])
            ->withSum(['sentReferrals as total_commissions_earned' => function($query) {
                $query->where('bonus_paid', true);
            }], 'bonus_amount')
            ->having('qualified_referrals_count', '>', 0)
            ->orderByDesc('total_commissions_earned')
            ->limit($limit)
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'current_level' => $user->current_level,
                    'referral_code' => $user->referral_code,
                    'qualified_referrals_count' => $user->qualified_referrals_count,
                    'total_commissions_earned' => (float) ($user->total_commissions_earned ?? 0),
                    'registration_date' => $user->created_at->format('d/m/Y'),
                    'last_referral_date' => $user->sentReferrals()->latest()->first()?->created_at?->format('d/m/Y'),
                ];
            })->toArray();
    }
    
    /**
     * Obtenir les statistiques de croissance mensuelle
     */
    public function getMonthlyGrowth(int $months = 12): array
    {
        $data = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $startDate = Carbon::now()->subMonths($i)->startOfMonth();
            $endDate = Carbon::now()->subMonths($i)->endOfMonth();
            
            $newReferrals = Referral::whereBetween('created_at', [$startDate, $endDate])->count();
            $qualifiedReferrals = Referral::whereBetween('qualified_at', [$startDate, $endDate])->count();
            $commissionsPaid = Referral::whereBetween('bonus_paid_at', [$startDate, $endDate])
                ->where('bonus_paid', true)
                ->sum('bonus_amount');
            
            $data[] = [
                'month' => $startDate->format('M Y'),
                'month_key' => $startDate->format('Y-m'),
                'new_referrals' => $newReferrals,
                'qualified_referrals' => $qualifiedReferrals,
                'commissions_paid' => (float) $commissionsPaid,
                'conversion_rate' => $newReferrals > 0 ? round(($qualifiedReferrals / $newReferrals) * 100, 2) : 0,
            ];
        }
        
        return $data;
    }
    
    /**
     * Obtenir les dernières activités de parrainage
     */
    public function getRecentActivities(int $limit = 50): array
    {
        $activities = collect();
        
        // Nouveaux parrainages
        $newReferrals = Referral::with(['referrer', 'referred'])
            ->latest()
            ->limit($limit / 2)
            ->get()
            ->map(function($referral) {
                return [
                    'id' => 'referral_' . $referral->id,
                    'type' => 'new_referral',
                    'title' => 'Nouveau parrainage',
                    'description' => "{$referral->referred->username} parrainé par {$referral->referrer->username}",
                    'amount' => null,
                    'level' => $referral->level,
                    'status' => $referral->status,
                    'created_at' => $referral->created_at,
                    'users' => [
                        'referrer' => $referral->referrer->username,
                        'referred' => $referral->referred->username,
                    ],
                ];
            });
        
        // Commissions payées
        $paidCommissions = Transaction::with('user')
            ->where('type', 'referral_bonus')
            ->latest()
            ->limit($limit / 2)
            ->get()
            ->map(function($transaction) {
                $metadata = $transaction->metadata ?? [];
                return [
                    'id' => 'commission_' . $transaction->id,
                    'type' => 'commission_paid',
                    'title' => 'Commission payée',
                    'description' => "Commission niveau {$metadata['level']} pour {$transaction->user->username}",
                    'amount' => (float) $transaction->amount,
                    'level' => $metadata['level'] ?? 1,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at,
                    'users' => [
                        'referrer' => $transaction->user->username,
                        'referred' => User::find($metadata['referred_user_id'] ?? null)?->username ?? 'Inconnu',
                    ],
                ];
            });
        
        return $activities->merge($newReferrals)
            ->merge($paidCommissions)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values()
            ->map(function($activity) {
                $activity['created_at'] = $activity['created_at']->format('d/m/Y H:i:s');
                return $activity;
            })
            ->toArray();
    }
    
    /**
     * Obtenir les alertes système pour le parrainage
     */
    public function getSystemAlerts(): array
    {
        $alerts = [];
        
        // Alertes sur les taux de conversion
        $conversionRate = $this->getConversionRate();
        if ($conversionRate < 20) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Taux de conversion faible',
                'message' => "Le taux de conversion est de {$conversionRate}%, en dessous de la moyenne recommandée de 20%",
                'action_url' => '/admin/referrals/conversion-analysis',
                'priority' => 'medium',
            ];
        }
        
        // Alertes sur les commissions impayées
        $unpaidCommissions = Referral::where('status', 'qualified')
            ->where('bonus_paid', false)
            ->where('qualified_at', '<', Carbon::now()->subHours(24))
            ->count();
            
        if ($unpaidCommissions > 0) {
            $alerts[] = [
                'type' => 'error',
                'title' => 'Commissions impayées',
                'message' => "{$unpaidCommissions} commission(s) en attente de paiement depuis plus de 24h",
                'action_url' => '/admin/referrals/unpaid-commissions',
                'priority' => 'high',
            ];
        }
        
        // Alertes sur l'activité suspecte
        $suspiciousActivity = $this->detectSuspiciousActivity();
        if (!empty($suspiciousActivity)) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Activité suspecte détectée',
                'message' => count($suspiciousActivity) . ' utilisateur(s) avec activité de parrainage suspecte',
                'action_url' => '/admin/referrals/suspicious-activity',
                'priority' => 'high',
            ];
        }
        
        return $alerts;
    }
    
    /**
     * Rechercher des parrainages avec filtres
     */
    public function searchReferrals(array $filters = [], int $perPage = 20): array
    {
        $query = Referral::with(['referrer', 'referred']);
        
        // Filtres
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }
        
        if (!empty($filters['referrer'])) {
            $query->whereHas('referrer', function($q) use ($filters) {
                $q->where('username', 'like', '%' . $filters['referrer'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['referrer'] . '%');
            });
        }
        
        if (!empty($filters['referred'])) {
            $query->whereHas('referred', function($q) use ($filters) {
                $q->where('username', 'like', '%' . $filters['referred'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['referred'] . '%');
            });
        }
        
        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        
        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
        
        if (!empty($filters['min_amount'])) {
            $query->where('bonus_amount', '>=', $filters['min_amount']);
        }
        
        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        return [
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
        ];
    }
    
    /**
     * Obtenir les données pour export
     */
    public function getExportData(string $type = 'all', array $filters = []): array
    {
        switch ($type) {
            case 'referrals':
                return $this->exportReferrals($filters);
            case 'commissions':
                return $this->exportCommissions($filters);
            case 'top_referrers':
                return $this->exportTopReferrers($filters);
            default:
                return $this->exportAll($filters);
        }
    }
    
    /**
     * Obtenir les métriques en temps réel
     */
    public function getRealTimeMetrics(): array
    {
        $lastHour = Carbon::now()->subHour();
        $last24Hours = Carbon::now()->subDay();
        
        return [
            'last_hour' => [
                'new_referrals' => Referral::where('created_at', '>=', $lastHour)->count(),
                'qualified_referrals' => Referral::where('qualified_at', '>=', $lastHour)->count(),
                'commissions_paid' => (float) Referral::where('bonus_paid_at', '>=', $lastHour)
                    ->where('bonus_paid', true)->sum('bonus_amount'),
            ],
            'last_24_hours' => [
                'new_referrals' => Referral::where('created_at', '>=', $last24Hours)->count(),
                'qualified_referrals' => Referral::where('qualified_at', '>=', $last24Hours)->count(),
                'commissions_paid' => (float) Referral::where('bonus_paid_at', '>=', $last24Hours)
                    ->where('bonus_paid', true)->sum('bonus_amount'),
            ],
            'active_users_with_referrals' => User::whereHas('sentReferrals', function($query) use ($last24Hours) {
                $query->where('created_at', '>=', $last24Hours);
            })->count(),
        ];
    }
    
    // Méthodes privées utilitaires
    
    private function getCommissionRate(int $level): string
    {
        $rates = [1 => '5%', 2 => '3%', 3 => '1%'];
        return $rates[$level] ?? '0%';
    }
    
    private function getConversionRate(): float
    {
        $totalReferrals = Referral::count();
        $qualifiedReferrals = Referral::qualified()->count();
        
        return $totalReferrals > 0 ? round(($qualifiedReferrals / $totalReferrals) * 100, 2) : 0;
    }
    
    private function detectSuspiciousActivity(): array
    {
        // Détecter les utilisateurs avec trop de parrainages en peu de temps
        $suspiciousUsers = User::withCount(['sentReferrals as recent_referrals_count' => function($query) {
                $query->where('created_at', '>=', Carbon::now()->subDay());
            }])
            ->having('recent_referrals_count', '>=', 10)
            ->get(['id', 'username', 'email'])
            ->toArray();
            
        return $suspiciousUsers;
    }
    
    private function exportReferrals(array $filters): array
    {
        // Implémentation de l'export des parrainages
        return $this->searchReferrals($filters, 1000)['data'];
    }
    
    private function exportCommissions(array $filters): array
    {
        // Implémentation de l'export des commissions
        return Transaction::with('user')
            ->where('type', 'referral_bonus')
            ->get()
            ->toArray();
    }
    
    private function exportTopReferrers(array $filters): array
    {
        // Implémentation de l'export des top parrains
        return $this->getTopReferrers(100);
    }
    
    private function exportAll(array $filters): array
    {
        return [
            'global_stats' => $this->getGlobalStats(),
            'level_metrics' => $this->getLevelMetrics(),
            'monthly_growth' => $this->getMonthlyGrowth(),
            'top_referrers' => $this->getTopReferrers(50),
        ];
    }
}