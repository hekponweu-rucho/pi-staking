<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StakingController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\AdminDepositController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\AdminReferralController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', function () {
    return response()->json(['status' => 'OK', 'timestamp' => now()]);
});

// Routes d'authentification (publiques)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    
    // Routes protégées par authentification
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::post('/update-profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/claim-welcome-bonus', [AuthController::class, 'claimWelcomeBonus']);
    });
});

// Routes protégées par authentification
Route::middleware('auth:sanctum')->group(function () {
    
    // Dashboard utilisateur
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'getDashboardData']);
        Route::get('/financial-summary', [DashboardController::class, 'getFinancialSummary']);
        Route::get('/performance', [DashboardController::class, 'getPerformanceMetrics']);
        Route::get('/notifications', [DashboardController::class, 'getNotifications']);
        Route::patch('/notifications/{id}/read', [DashboardController::class, 'markNotificationAsRead']);
        Route::patch('/notifications/mark-all-read', [DashboardController::class, 'markAllNotificationsAsRead']);
        Route::get('/charts', [DashboardController::class, 'getChartsData']);
    });

    // Gestion du staking
    Route::prefix('staking')->group(function () {
        Route::get('/packages', [StakingController::class, 'getPackages']);
        Route::post('/invest', [StakingController::class, 'createInvestment']);
        Route::get('/investments', [StakingController::class, 'getUserInvestments']);
        Route::get('/investment/{id}', [StakingController::class, 'getInvestmentDetails']);
        Route::post('/calculate-earnings', [StakingController::class, 'calculateEarnings']);
        Route::get('/performance', [StakingController::class, 'getPerformanceHistory']);
    });

    // Gestion des réclamations
    Route::prefix('claims')->group(function () {
        Route::get('/available', [ClaimController::class, 'getClaimableInvestments']);
        Route::post('/{investment}', [ClaimController::class, 'claimInvestment']);
        Route::get('/history', [ClaimController::class, 'getClaimHistory']);
        Route::get('/statistics', [ClaimController::class, 'getClaimStatistics']);
        Route::post('/bulk-claim', [ClaimController::class, 'bulkClaim']);
        Route::post('/simulate-earnings', [ClaimController::class, 'simulateEarnings']);
    });

    // Gestion des transactions
    Route::prefix('transactions')->group(function () {
        Route::get('/', [TransactionController::class, 'getTransactionHistory']);
        Route::get('/limits', [TransactionController::class, 'getLimitsAndStats']);
        Route::get('/stats', [TransactionController::class, 'getTransactionStats']);
        Route::get('/search', [TransactionController::class, 'searchTransactions']);
        Route::get('/{id}', [TransactionController::class, 'getTransactionById']);
        Route::post('/export', [TransactionController::class, 'exportTransactions']);

        // Dépôts (sessions)
        Route::post('/deposits/session', [DepositController::class, 'startDepositSession']);
        Route::get('/deposits/session/{id}', [DepositController::class, 'getDepositSessionStatus']);
        Route::post('/deposits/session/{id}/cancel', [DepositController::class, 'cancelDepositSession']);
        
        // Retrait avec vérifications de sécurité
        Route::post('/withdrawal', [TransactionController::class, 'createWithdrawal'])
            ->middleware('security.check:withdrawal');
            
        Route::get('/withdrawals', [TransactionController::class, 'getWithdrawalRequests']);
        Route::patch('/withdrawal/{id}/cancel', [TransactionController::class, 'cancelWithdrawal']);
    });

    // Système de parrainage
    Route::prefix('referrals')->group(function () {
        Route::get('/info', [ReferralController::class, 'getInfo']);
        Route::get('/tree', [ReferralController::class, 'getTree']);
        Route::get('/earnings', [ReferralController::class, 'getEarnings']);
        Route::get('/stats', [ReferralController::class, 'getDetailedStats']);
        Route::post('/validate-code', [ReferralController::class, 'validateCode']);
    });

    // Profil utilisateur
    Route::prefix('user')->group(function () {
        Route::get('/profile', [DashboardController::class, 'getDashboardData']); // Réutilise les données du dashboard
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/referrals', [DashboardController::class, 'getDashboardData']);
        Route::get('/level', [DashboardController::class, 'getDashboardData']);
        Route::get('/statistics', [DashboardController::class, 'getDashboardData']);
    });

    // Routes de sécurité avancée
    Route::prefix('security')->group(function () {
        
        // Configuration et gestion 2FA
        Route::prefix('2fa')->group(function () {
            Route::post('/setup', [SecurityController::class, 'setup2FA']);
            Route::post('/confirm', [SecurityController::class, 'confirm2FA']);
            Route::post('/verify', [SecurityController::class, 'verify2FA']);
            Route::post('/disable', [SecurityController::class, 'disable2FA']);
            Route::get('/status', function() {
                $user = auth()->user();
                return response()->json([
                    'success' => true,
                    'data' => [
                        'enabled' => $user->two_factor_enabled,
                        'enabled_at' => $user->two_factor_enabled_at,
                        'backup_codes_count' => $user->two_factor_backup_codes ? 
                            count(json_decode(decrypt($user->two_factor_backup_codes))) : 0
                    ]
                ]);
            });
        });
        
        // Vérifications pour retraits
        Route::prefix('withdrawal')->group(function () {
            Route::post('/initiate-verification', [SecurityController::class, 'initiateWithdrawalVerification']);
            Route::post('/confirm-verification', [SecurityController::class, 'confirmWithdrawalVerification']);
            Route::get('/limits', function() {
                $user = auth()->user();
                $limits = [
                    'bronze' => 100,
                    'silver' => 500,
                    'gold' => 2000,
                    'platinum' => 10000
                ];
                
                $todayWithdrawn = \DB::table('transactions')
                    ->where('user_id', $user->id)
                    ->where('type', 'withdrawal')
                    ->where('status', 'completed')
                    ->whereDate('created_at', today())
                    ->sum('amount');
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'daily_limit' => $limits[$user->current_level] ?? $limits['bronze'],
                        'used_today' => $todayWithdrawn,
                        'remaining' => max(0, ($limits[$user->current_level] ?? $limits['bronze']) - $todayWithdrawn),
                        'level' => $user->current_level
                    ]
                ]);
            });
        });
        
        // Logs d'activité et historique de sécurité
        Route::get('/logs', [SecurityController::class, 'getSecurityLogs']);
        Route::get('/activity', function() {
            $user = auth()->user();
            $recentActivity = \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->action_description,
                        'ip_address' => $log->ip_address,
                        'device_type' => $log->device_type,
                        'location' => $log->location,
                        'risk_score' => $log->risk_score,
                        'severity' => $log->severity_level,
                        'created_at' => $log->created_at->format('d/m/Y H:i:s'),
                        'metadata' => $log->metadata
                    ];
                });
                
            return response()->json([
                'success' => true,
                'data' => $recentActivity
            ]);
        });
        
        // Statistiques de sécurité personnelles
        Route::get('/stats', function() {
            $user = auth()->user();
            $stats = \App\Models\UserSecurityLog::getSecurityStats($user->id, 30);
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        });
        
        // Préférences de sécurité
        Route::get('/preferences', function() {
            $user = auth()->user();
            $preferences = $user->security_preferences ?? [
                'email_notifications' => true,
                'sms_notifications' => false,
                'login_alerts' => true,
                'transaction_alerts' => true,
                'weekly_summary' => true
            ];
            
            return response()->json([
                'success' => true,
                'data' => $preferences
            ]);
        });
        
        Route::patch('/preferences', function() {
            $user = auth()->user();
            $preferences = request()->validate([
                'email_notifications' => 'boolean',
                'sms_notifications' => 'boolean',
                'login_alerts' => 'boolean',
                'transaction_alerts' => 'boolean',
                'weekly_summary' => 'boolean'
            ]);
            
            $user->update(['security_preferences' => $preferences]);
            
            return response()->json([
                'success' => true,
                'message' => 'Préférences de sécurité mises à jour'
            ]);
        });
        
        // Vérification du statut de sécurité du compte
        Route::get('/account-status', function() {
            $user = auth()->user();
            
            $securityScore = 0;
            $recommendations = [];
            
            // Vérifier 2FA
            if ($user->two_factor_enabled) {
                $securityScore += 40;
            } else {
                $recommendations[] = 'Activez l\'authentification à deux facteurs';
            }
            
            // Vérifier téléphone
            if ($user->phone_verified) {
                $securityScore += 20;
            } else {
                $recommendations[] = 'Vérifiez votre numéro de téléphone';
            }
            
            // Vérifier activité récente
            $lastActivity = $user->last_activity;
            if ($lastActivity && $lastActivity->diffInDays(now()) < 30) {
                $securityScore += 20;
            }
            
            // Vérifier mot de passe récent
            if ($user->updated_at->diffInDays(now()) < 90) {
                $securityScore += 20;
            } else {
                $recommendations[] = 'Changez votre mot de passe régulièrement';
            }
            
            // Niveau de sécurité
            $level = 'Faible';
            if ($securityScore >= 80) $level = 'Excellent';
            elseif ($securityScore >= 60) $level = 'Bon';
            elseif ($securityScore >= 40) $level = 'Moyen';
            
            return response()->json([
                'success' => true,
                'data' => [
                    'score' => $securityScore,
                    'level' => $level,
                    'recommendations' => $recommendations,
                    'two_factor_enabled' => $user->two_factor_enabled,
                    'phone_verified' => $user->phone_verified,
                    'last_password_change' => $user->updated_at->format('d/m/Y'),
                    'last_activity' => $lastActivity ? $lastActivity->format('d/m/Y H:i') : 'Jamais'
                ]
            ]);
        });
    });

    // Routes administrateur
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        
        // Dashboard admin principal
        Route::get('/dashboard', [AdminController::class, 'getDashboardStats']);
        Route::get('/analytics', [AdminController::class, 'getAnalytics']);
        
        // Gestion des utilisateurs
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        Route::get('/users/{user}/details', function($userId) {
            $user = \App\Models\User::with(['investments', 'claims', 'transactions'])
                ->findOrFail($userId);
            return response()->json(['success' => true, 'data' => $user]);
        });
        
        // Monitoring des transactions
        Route::get('/transactions', [AdminController::class, 'getTransactions']);
        Route::patch('/transactions/{transaction}/status', function($transactionId) {
            $transaction = \App\Models\Transaction::findOrFail($transactionId);
            $transaction->update(['status' => request('status')]);
            return response()->json(['success' => true, 'data' => $transaction]);
        });

        // Dépôts (administration)
        Route::prefix('deposits')->group(function () {
            Route::get('/addresses', [AdminDepositController::class, 'listAddresses']);
            Route::post('/addresses', [AdminDepositController::class, 'createAddress']);
            Route::patch('/addresses/{id}', [AdminDepositController::class, 'updateAddress']);
            Route::delete('/addresses/{id}', [AdminDepositController::class, 'deleteAddress']);

            Route::get('/sessions', [AdminDepositController::class, 'listSessions']);
            Route::post('/sessions/{id}/confirm', [AdminDepositController::class, 'confirmSession']);
        });
            $transaction = \App\Models\Transaction::findOrFail($transactionId);
            $transaction->update(['status' => request('status')]);
            return response()->json(['success' => true, 'data' => $transaction]);
        });
        
        // Gestion des packages
        Route::get('/packages', function() {
            $packages = \App\Models\StakingPackage::withCount('investments')
                ->with(['investments' => function($query) {
                    $query->where('status', 'active');
                }])
                ->get();
            return response()->json(['success' => true, 'data' => $packages]);
        });
        Route::post('/packages', function() {
            $validated = request()->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'level' => 'required|in:discovery,bronze,silver,gold,diamond',
                'daily_rate' => 'required|numeric|min:0|max:1',
                'min_amount' => 'required|numeric|min:0',
                'max_amount' => 'nullable|numeric|min:0',
                'max_duration_days' => 'required|integer|min:1',
                'deposit_fee_rate' => 'required|numeric|min:0|max:1',
                'performance_fee_rate' => 'required|numeric|min:0|max:1',
                'is_active' => 'required|boolean'
            ]);
            
            $package = \App\Models\StakingPackage::create($validated);
            return response()->json(['success' => true, 'data' => $package]);
        });
        Route::patch('/packages/{package}', function($packageId) {
            $package = \App\Models\StakingPackage::findOrFail($packageId);
            $package->update(request()->only([
                'name', 'description', 'daily_rate', 'min_amount', 'max_amount',
                'max_duration_days', 'deposit_fee_rate', 'performance_fee_rate', 'is_active'
            ]));
            return response()->json(['success' => true, 'data' => $package]);
        });
        
        // Système d'alertes
        Route::get('/alerts', [AdminController::class, 'getSystemAlerts']);
        Route::post('/alerts', function() {
            $alert = \App\Models\SystemAlert::create([
                'title' => request('title'),
                'message' => request('message'),
                'severity' => request('severity', 'medium'),
                'type' => request('type', 'general'),
                'is_resolved' => false
            ]);
            return response()->json(['success' => true, 'data' => $alert]);
        });
        Route::patch('/alerts/{alert}/resolve', function($alertId) {
            $alert = \App\Models\SystemAlert::findOrFail($alertId);
            $alert->update(['is_resolved' => true, 'resolved_at' => now()]);
            return response()->json(['success' => true, 'data' => $alert]);
        });
        
        // Rapports et exports
        Route::get('/reports/users', function() {
            $users = \App\Models\User::with(['investments', 'claims'])
                ->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'username' => $user->username,
                        'email' => $user->email,
                        'level' => $user->current_level,
                        'balance' => $user->balance_pi,
                        'total_invested' => $user->total_invested,
                        'total_claimed' => $user->claims->sum('amount'),
                        'active_investments' => $user->investments->where('status', 'active')->count(),
                        'created_at' => $user->created_at->format('Y-m-d'),
                        'last_activity' => $user->last_activity?->format('Y-m-d H:i:s'),
                    ];
                });
            
            return response()->json(['success' => true, 'data' => $users]);
        });
        
        Route::get('/reports/financial', function() {
            $data = [
                'total_tvl' => \App\Models\Investment::where('status', 'active')->sum('amount'),
                'total_claimed' => \App\Models\Claim::where('status', 'completed')->sum('amount'),
                'pending_claims' => \App\Models\Investment::where('status', 'active')
                    ->where('next_claim_available_at', '<=', now())->count(),
                'daily_volume' => \App\Models\Investment::whereDate('created_at', today())->sum('amount'),
                'monthly_volume' => \App\Models\Investment::whereBetween('created_at', [
                    now()->startOfMonth(), now()->endOfMonth()
                ])->sum('amount'),
                'packages_performance' => \App\Models\StakingPackage::withCount('investments')
                    ->get()
                    ->map(function($package) {
                        return [
                            'name' => $package->name,
                            'investments_count' => $package->investments_count,
                            'total_invested' => $package->investments()->where('status', 'active')->sum('amount'),
                            'daily_rate' => $package->daily_rate * 100,
                        ];
                    })
            ];
            
            return response()->json(['success' => true, 'data' => $data]);
        });
        
        // Gestion du système de parrainage (Administration)
        Route::prefix('referrals')->group(function () {
            Route::get('/dashboard', [AdminReferralController::class, 'getDashboard']);
            Route::get('/stats/global', [AdminReferralController::class, 'getGlobalStats']);
            Route::get('/stats/levels', [AdminReferralController::class, 'getLevelMetrics']);
            Route::get('/stats/monthly-growth', [AdminReferralController::class, 'getMonthlyGrowth']);
            Route::get('/stats/realtime', [AdminReferralController::class, 'getRealTimeMetrics']);
            Route::get('/top-referrers', [AdminReferralController::class, 'getTopReferrers']);
            Route::get('/recent-activities', [AdminReferralController::class, 'getRecentActivities']);
            Route::get('/system-alerts', [AdminReferralController::class, 'getSystemAlerts']);
            Route::get('/search', [AdminReferralController::class, 'searchReferrals']);
            Route::post('/export', [AdminReferralController::class, 'exportData']);
            Route::patch('/{referral}/manage', [AdminReferralController::class, 'manageReferral']);
        });
        
        // Configuration système
        Route::get('/config', function() {
            return response()->json([
                'success' => true,
                'data' => [
                    'app_name' => config('app.name'),
                    'app_version' => '1.0.0',
                    'maintenance_mode' => false,
                    'registration_enabled' => true,
                    'min_withdrawal' => 10,
                    'max_withdrawal' => 100000,
                    'platform_fee_rate' => 0.02,
                ]
            ]);
        });
        Route::patch('/config', function() {
            // Ici vous pourriez sauvegarder la config en base ou dans un fichier
            return response()->json(['success' => true, 'message' => 'Configuration mise à jour']);
        });
    });
});

// Route de fallback pour les erreurs 404 API
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Endpoint API non trouvé'
    ], 404);
});
