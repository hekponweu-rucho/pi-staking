<?php

namespace App\Services;

use App\Models\User;
use App\Models\Investment;
use App\Models\WithdrawalRequest;
use App\Models\Transaction;
use App\Models\UserSecurityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Exception;

class RiskManagementService
{
    /**
     * Limites par défaut du système
     */
    private array $defaultLimits = [
        'max_daily_investments' => 10,
        'max_daily_investment_amount' => 10000,
        'max_single_investment' => 5000,
        'max_daily_withdrawals' => 5,
        'max_daily_withdrawal_amount' => 2000,
        'max_single_withdrawal' => 1000,
        'min_account_age_for_large_operations' => 7, // jours
        'suspicious_velocity_threshold' => 100, // transactions par heure
    ];

    /**
     * Scores de risque par action
     */
    private array $riskScores = [
        'rapid_investment' => 25,
        'large_investment' => 30,
        'unusual_pattern' => 40,
        'multiple_devices' => 20,
        'vpn_usage' => 15,
        'suspicious_timing' => 35,
        'account_age_risk' => 45,
        'withdrawal_velocity' => 50,
    ];

    /**
     * Seuils d'alerte
     */
    private int $warningThreshold = 60;
    private int $suspiciousThreshold = 80;
    private int $blockThreshold = 100;

    /**
     * Valider un investissement avant création
     */
    public function validateInvestment(User $user, float $amount, array $context = []): array
    {
        $risks = [];
        $riskScore = 0;
        
        try {
            // 1. Vérifier les limites d'investissement
            $limitCheck = $this->checkInvestmentLimits($user, $amount);
            if (!$limitCheck['allowed']) {
                return [
                    'allowed' => false,
                    'reason' => $limitCheck['reason'],
                    'risk_score' => 100,
                    'risks' => ['limit_exceeded'],
                ];
            }
            
            // 2. Analyser les patterns d'investissement
            $patternRisk = $this->analyzeInvestmentPatterns($user, $amount, $context);
            $risks = array_merge($risks, $patternRisk['risks']);
            $riskScore += $patternRisk['score'];
            
            // 3. Vérifier l'âge du compte
            $ageRisk = $this->checkAccountAge($user, $amount);
            $risks = array_merge($risks, $ageRisk['risks']);
            $riskScore += $ageRisk['score'];
            
            // 4. Analyser la vélocité des transactions
            $velocityRisk = $this->checkTransactionVelocity($user);
            $risks = array_merge($risks, $velocityRisk['risks']);
            $riskScore += $velocityRisk['score'];
            
            // 5. Vérifier l'utilisation de dispositifs/IP
            if (!empty($context['ip']) || !empty($context['user_agent'])) {
                $deviceRisk = $this->analyzeDeviceFingerprint($user, $context);
                $risks = array_merge($risks, $deviceRisk['risks']);
                $riskScore += $deviceRisk['score'];
            }
            
            // Déterminer l'action basée sur le score
            $action = $this->determineAction($riskScore);
            
            // Enregistrer l'évaluation
            $this->logRiskAssessment($user, 'investment_validation', $riskScore, $risks, [
                'amount' => $amount,
                'action' => $action,
                'context' => $context,
            ]);
            
            return [
                'allowed' => $action !== 'block',
                'action' => $action, // allow, warn, review, block
                'risk_score' => $riskScore,
                'risks' => $risks,
                'requires_review' => $action === 'review',
                'warning_message' => $action === 'warn' ? 'Activité inhabituelle détectée. Surveillance renforcée activée.' : null,
            ];
            
        } catch (Exception $e) {
            Log::error('Risk assessment failed', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);
            
            // En cas d'erreur, permettre mais enregistrer
            return [
                'allowed' => true,
                'action' => 'allow',
                'risk_score' => 0,
                'risks' => ['assessment_error'],
                'warning_message' => 'Évaluation des risques temporairement indisponible.',
            ];
        }
    }

    /**
     * Valider un retrait avant traitement
     */
    public function validateWithdrawal(User $user, float $amount, array $context = []): array
    {
        $risks = [];
        $riskScore = 0;
        
        try {
            // 1. Vérifier les limites de retrait
            $limitCheck = $this->checkWithdrawalLimits($user, $amount);
            if (!$limitCheck['allowed']) {
                return [
                    'allowed' => false,
                    'reason' => $limitCheck['reason'],
                    'risk_score' => 100,
                    'risks' => ['limit_exceeded'],
                ];
            }
            
            // 2. Vérifier le solde disponible
            if ($user->balance_pi < $amount) {
                return [
                    'allowed' => false,
                    'reason' => 'Solde insuffisant',
                    'risk_score' => 100,
                    'risks' => ['insufficient_balance'],
                ];
            }
            
            // 3. Analyser les patterns de retrait
            $patternRisk = $this->analyzeWithdrawalPatterns($user, $amount);
            $risks = array_merge($risks, $patternRisk['risks']);
            $riskScore += $patternRisk['score'];
            
            // 4. Vérifier la vélocité des retraits
            $velocityRisk = $this->checkWithdrawalVelocity($user);
            $risks = array_merge($risks, $velocityRisk['risks']);
            $riskScore += $velocityRisk['score'];
            
            // 5. Analyser le rapport investissement/retrait
            $ratioRisk = $this->analyzeInvestmentWithdrawalRatio($user, $amount);
            $risks = array_merge($risks, $ratioRisk['risks']);
            $riskScore += $ratioRisk['score'];
            
            $action = $this->determineAction($riskScore);
            
            $this->logRiskAssessment($user, 'withdrawal_validation', $riskScore, $risks, [
                'amount' => $amount,
                'action' => $action,
                'balance' => $user->balance_pi,
            ]);
            
            return [
                'allowed' => $action !== 'block',
                'action' => $action,
                'risk_score' => $riskScore,
                'risks' => $risks,
                'requires_review' => in_array($action, ['review', 'manual_review']),
                'estimated_processing_time' => $this->getEstimatedProcessingTime($action, $riskScore),
            ];
            
        } catch (Exception $e) {
            Log::error('Withdrawal risk assessment failed', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'allowed' => false,
                'action' => 'manual_review',
                'risk_score' => 50,
                'risks' => ['assessment_error'],
                'requires_review' => true,
            ];
        }
    }

    /**
     * Vérifier les limites d'investissement
     */
    private function checkInvestmentLimits(User $user, float $amount): array
    {
        $userLimits = $this->getUserLimits($user);
        
        // Vérifier investissement unique maximum
        if ($amount > $userLimits['max_single_investment']) {
            return [
                'allowed' => false,
                'reason' => sprintf('Montant maximum par investissement: %.2f Pi', $userLimits['max_single_investment']),
            ];
        }
        
        // Vérifier limite quotidienne d'investissement
        $todayInvestments = $user->investments()
            ->whereDate('created_at', today())
            ->sum('amount');
            
        if ($todayInvestments + $amount > $userLimits['max_daily_investment_amount']) {
            return [
                'allowed' => false,
                'reason' => sprintf('Limite quotidienne d\'investissement atteinte: %.2f Pi', $userLimits['max_daily_investment_amount']),
            ];
        }
        
        // Vérifier nombre d'investissements quotidiens
        $todayInvestmentCount = $user->investments()
            ->whereDate('created_at', today())
            ->count();
            
        if ($todayInvestmentCount >= $userLimits['max_daily_investments']) {
            return [
                'allowed' => false,
                'reason' => sprintf('Nombre maximum d\'investissements quotidiens atteint: %d', $userLimits['max_daily_investments']),
            ];
        }
        
        return ['allowed' => true];
    }

    /**
     * Vérifier les limites de retrait
     */
    private function checkWithdrawalLimits(User $user, float $amount): array
    {
        $userLimits = $this->getUserLimits($user);
        
        // Vérifier retrait unique maximum
        if ($amount > $userLimits['max_single_withdrawal']) {
            return [
                'allowed' => false,
                'reason' => sprintf('Montant maximum par retrait: %.2f Pi', $userLimits['max_single_withdrawal']),
            ];
        }
        
        // Vérifier limite quotidienne de retrait
        $todayWithdrawals = $user->withdrawalRequests()
            ->whereDate('created_at', today())
            ->whereIn('status', ['pending', 'processing', 'completed'])
            ->sum('amount');
            
        if ($todayWithdrawals + $amount > $userLimits['max_daily_withdrawal_amount']) {
            return [
                'allowed' => false,
                'reason' => sprintf('Limite quotidienne de retrait atteinte: %.2f Pi', $userLimits['max_daily_withdrawal_amount']),
            ];
        }
        
        return ['allowed' => true];
    }

    /**
     * Analyser les patterns d'investissement
     */
    private function analyzeInvestmentPatterns(User $user, float $amount, array $context): array
    {
        $risks = [];
        $score = 0;
        
        // Vérifier les investissements rapides
        $recentInvestments = $user->investments()
            ->where('created_at', '>=', now()->subHour())
            ->count();
            
        if ($recentInvestments >= 3) {
            $risks[] = 'rapid_investment';
            $score += $this->riskScores['rapid_investment'];
        }
        
        // Vérifier les gros montants inhabituels
        $avgInvestment = $user->investments()->avg('amount') ?? 0;
        if ($avgInvestment > 0 && $amount > ($avgInvestment * 5)) {
            $risks[] = 'large_investment';
            $score += $this->riskScores['large_investment'];
        }
        
        // Vérifier les patterns temporels suspects
        $timePattern = $this->analyzeTimePattern($user);
        if ($timePattern['suspicious']) {
            $risks[] = 'suspicious_timing';
            $score += $this->riskScores['suspicious_timing'];
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Vérifier l'âge du compte
     */
    private function checkAccountAge(User $user, float $amount): array
    {
        $risks = [];
        $score = 0;
        
        $accountAgeDays = $user->created_at->diffInDays(now());
        $minAge = $this->defaultLimits['min_account_age_for_large_operations'];
        
        if ($accountAgeDays < $minAge && $amount > 1000) {
            $risks[] = 'account_age_risk';
            $score += $this->riskScores['account_age_risk'];
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Vérifier la vélocité des transactions
     */
    private function checkTransactionVelocity(User $user): array
    {
        $risks = [];
        $score = 0;
        
        // Compter les transactions de la dernière heure
        $recentTransactions = $user->transactions()
            ->where('created_at', '>=', now()->subHour())
            ->count();
            
        if ($recentTransactions > $this->defaultLimits['suspicious_velocity_threshold']) {
            $risks[] = 'high_velocity';
            $score += 60; // Score élevé pour vélocité suspecte
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Analyser l'empreinte de l'appareil
     */
    private function analyzeDeviceFingerprint(User $user, array $context): array
    {
        $risks = [];
        $score = 0;
        
        // Cache key pour stocker les appareils de l'utilisateur
        $cacheKey = "user_devices_{$user->id}";
        $userDevices = Cache::get($cacheKey, []);
        
        $currentFingerprint = $this->generateDeviceFingerprint($context);
        
        // Vérifier si c'est un nouvel appareil
        if (!in_array($currentFingerprint, $userDevices)) {
            $risks[] = 'new_device';
            $score += 10;
            
            // Ajouter à la liste des appareils
            $userDevices[] = $currentFingerprint;
            Cache::put($cacheKey, $userDevices, now()->addDays(30));
        }
        
        // Détecter l'usage de VPN (simplification - en production, utiliser des services tiers)
        if ($this->detectVpnUsage($context['ip'] ?? '')) {
            $risks[] = 'vpn_usage';
            $score += $this->riskScores['vpn_usage'];
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Analyser les patterns de retrait
     */
    private function analyzeWithdrawalPatterns(User $user, float $amount): array
    {
        $risks = [];
        $score = 0;
        
        // Vérifier les retraits rapides successifs
        $recentWithdrawals = $user->withdrawalRequests()
            ->where('created_at', '>=', now()->subHours(2))
            ->count();
            
        if ($recentWithdrawals >= 2) {
            $risks[] = 'rapid_withdrawals';
            $score += 30;
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Vérifier la vélocité des retraits
     */
    private function checkWithdrawalVelocity(User $user): array
    {
        $risks = [];
        $score = 0;
        
        $dailyWithdrawals = $user->withdrawalRequests()
            ->whereDate('created_at', today())
            ->count();
            
        if ($dailyWithdrawals >= 3) {
            $risks[] = 'withdrawal_velocity';
            $score += $this->riskScores['withdrawal_velocity'];
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Analyser le ratio investissement/retrait
     */
    private function analyzeInvestmentWithdrawalRatio(User $user, float $amount): array
    {
        $risks = [];
        $score = 0;
        
        $totalInvested = $user->total_invested;
        $totalWithdrawn = $user->withdrawalRequests()
            ->where('status', 'completed')
            ->sum('amount');
            
        // Si l'utilisateur essaie de retirer plus qu'il n'a investi
        if ($totalWithdrawn + $amount > $totalInvested * 1.5) {
            $risks[] = 'suspicious_withdrawal_ratio';
            $score += 40;
        }
        
        return ['risks' => $risks, 'score' => $score];
    }

    /**
     * Obtenir les limites personnalisées de l'utilisateur
     */
    private function getUserLimits(User $user): array
    {
        $limits = $this->defaultLimits;
        
        // Ajuster selon le niveau utilisateur
        $multiplier = match ($user->current_level) {
            'silver' => 1.5,
            'gold' => 2.0,
            'diamond' => 5.0,
            default => 1.0,
        };
        
        // Appliquer le multiplicateur aux limites monétaires
        $limits['max_single_investment'] *= $multiplier;
        $limits['max_daily_investment_amount'] *= $multiplier;
        $limits['max_single_withdrawal'] *= $multiplier;
        $limits['max_daily_withdrawal_amount'] *= $multiplier;
        
        return $limits;
    }

    /**
     * Déterminer l'action basée sur le score de risque
     */
    private function determineAction(int $riskScore): string
    {
        return match (true) {
            $riskScore >= $this->blockThreshold => 'block',
            $riskScore >= $this->suspiciousThreshold => 'manual_review',
            $riskScore >= $this->warningThreshold => 'review',
            $riskScore > 30 => 'warn',
            default => 'allow',
        };
    }

    /**
     * Enregistrer l'évaluation des risques
     */
    private function logRiskAssessment(User $user, string $action, int $riskScore, array $risks, array $metadata = []): void
    {
        UserSecurityLog::create([
            'user_id' => $user->id,
            'event_type' => 'risk_assessment',
            'description' => sprintf('Évaluation des risques pour %s - Score: %d', $action, $riskScore),
            'ip_address' => request()->ip() ?? 'unknown',
            'user_agent' => request()->userAgent() ?? 'unknown',
            'metadata' => array_merge($metadata, [
                'action' => $action,
                'risk_score' => $riskScore,
                'risks' => $risks,
                'timestamp' => now()->toISOString(),
            ]),
        ]);
    }

    /**
     * Analyser les patterns temporels
     */
    private function analyzeTimePattern(User $user): array
    {
        $recentTimes = $user->investments()
            ->where('created_at', '>=', now()->subDays(7))
            ->pluck('created_at')
            ->map(fn($time) => $time->format('H'))
            ->toArray();
            
        // Détecter si tous les investissements sont faits à la même heure (bot)
        $uniqueHours = array_unique($recentTimes);
        $suspicious = count($recentTimes) > 5 && count($uniqueHours) <= 2;
        
        return ['suspicious' => $suspicious, 'pattern' => $uniqueHours];
    }

    /**
     * Générer une empreinte d'appareil
     */
    private function generateDeviceFingerprint(array $context): string
    {
        $components = [
            $context['user_agent'] ?? 'unknown',
            $context['ip'] ?? 'unknown',
            $context['accept_language'] ?? 'unknown',
        ];
        
        return hash('sha256', implode('|', $components));
    }

    /**
     * Détecter l'usage de VPN (simplification)
     */
    private function detectVpnUsage(string $ip): bool
    {
        // En production, utiliser des services comme IPQualityScore, etc.
        // Pour le moment, juste vérifier quelques ranges VPN connus
        $vpnRanges = [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ];
        
        return false; // Simplification
    }

    /**
     * Estimer le temps de traitement basé sur l'action
     */
    private function getEstimatedProcessingTime(string $action, int $riskScore): string
    {
        return match ($action) {
            'allow' => 'Immédiat',
            'warn' => '< 5 minutes',
            'review' => '15-30 minutes',
            'manual_review' => '2-24 heures',
            'block' => 'Bloqué - contactez le support',
            default => 'Inconnu',
        };
    }

    /**
     * Obtenir les statistiques de risque pour l'administration
     */
    public function getRiskStatistics(): array
    {
        $last24h = now()->subDay();
        $last7days = now()->subWeek();
        
        return [
            'recent_high_risk_users' => UserSecurityLog::where('event_type', 'risk_assessment')
                ->where('created_at', '>=', $last24h)
                ->whereRaw('JSON_EXTRACT(metadata, "$.risk_score") >= ?', [$this->suspiciousThreshold])
                ->distinct('user_id')
                ->count('user_id'),
            'blocked_transactions_today' => UserSecurityLog::where('event_type', 'risk_assessment')
                ->where('created_at', '>=', $last24h)
                ->whereRaw('JSON_EXTRACT(metadata, "$.action") = "block"')
                ->count(),
            'average_risk_score' => UserSecurityLog::where('event_type', 'risk_assessment')
                ->where('created_at', '>=', $last7days)
                ->selectRaw('AVG(JSON_EXTRACT(metadata, "$.risk_score")) as avg_score')
                ->value('avg_score') ?? 0,
            'top_risk_factors' => UserSecurityLog::where('event_type', 'risk_assessment')
                ->where('created_at', '>=', $last7days)
                ->selectRaw('JSON_EXTRACT(metadata, "$.risks") as risk_factors')
                ->get()
                ->pluck('risk_factors')
                ->flatten()
                ->countBy()
                ->sortByDesc(function ($value) {
                    return $value;
                })
                ->take(10)
                ->toArray(),
        ];
    }
}
