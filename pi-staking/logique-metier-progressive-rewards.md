# Spécifications de Logique Métier - Progressive Rewards

## 🎯 Vue d'ensemble

Ce document détaille toute la logique métier pour le système Progressive Rewards, incluant les calculs de taux, ajustements automatiques, gamification et gestion des risques.

## 📊 Système de Niveaux et Taux

### 1. Configuration des Niveaux

```yaml
Niveaux:
  Discovery:
    seuil_minimum: 0 Pi
    seuil_maximum: 0.99 Pi (bonus uniquement)
    taux_base: 2.5% quotidien
    frais_depot: 0%
    frais_retrait: 2%
    duree_max: 30 jours
    source_autorisee: bonus_uniquement
    
  Bronze:
    seuil_minimum: 1 Pi
    seuil_maximum: 499.99 Pi
    taux_base: 0.8% quotidien
    frais_depot: 1%
    frais_retrait: 1.5%
    duree_max: 365 jours
    
  Silver:
    seuil_minimum: 500 Pi
    seuil_maximum: 1999.99 Pi
    taux_base: 0.5% quotidien
    frais_depot: 0.8%
    frais_retrait: 1%
    duree_max: 365 jours
    
  Gold:
    seuil_minimum: 2000 Pi
    seuil_maximum: 9999.99 Pi
    taux_base: 0.3% quotidien
    frais_depot: 0.5%
    frais_retrait: 0.8%
    duree_max: 365 jours
    
  Diamond:
    seuil_minimum: 10000 Pi
    seuil_maximum: null
    taux_base: 0.2% quotidien
    frais_depot: 0.3%
    frais_retrait: 0.5%
    duree_max: 365 jours
```

### 2. Calcul du Niveau Utilisateur

```php
class UserLevelCalculator
{
    public function calculateLevel(User $user): UserLevel
    {
        $totalInvested = $this->getTotalActiveInvestments($user);
        
        return match (true) {
            $totalInvested >= 10000 => UserLevel::DIAMOND,
            $totalInvested >= 2000 => UserLevel::GOLD,
            $totalInvested >= 500 => UserLevel::SILVER,
            $totalInvested >= 1 => UserLevel::BRONZE,
            default => UserLevel::DISCOVERY
        };
    }
    
    private function getTotalActiveInvestments(User $user): float
    {
        return $user->investments()
            ->where('status', 'active')
            ->where('source', '!=', 'bonus') // Exclure les investissements bonus
            ->sum('amount');
    }
    
    public function getProgressToNextLevel(User $user): array
    {
        $currentLevel = $this->calculateLevel($user);
        $totalInvested = $this->getTotalActiveInvestments($user);
        
        $nextLevelThreshold = match ($currentLevel) {
            UserLevel::DISCOVERY => 1,
            UserLevel::BRONZE => 500,
            UserLevel::SILVER => 2000,
            UserLevel::GOLD => 10000,
            UserLevel::DIAMOND => null
        };
        
        if ($nextLevelThreshold === null) {
            return ['hasNext' => false];
        }
        
        $remaining = $nextLevelThreshold - $totalInvested;
        $progress = min(100, ($totalInvested / $nextLevelThreshold) * 100);
        
        return [
            'hasNext' => true,
            'nextLevel' => $this->getNextLevel($currentLevel),
            'remaining' => $remaining,
            'progress' => $progress
        ];
    }
}
```

## 🎮 Système de Gamification

### 1. Calcul des Streaks

```php
class StreakCalculator
{
    public function calculateStreakBonus(User $user): float
    {
        $streak = $this->getCurrentStreak($user);
        
        return match (true) {
            $streak >= 90 => 0.0015,  // +0.15% (bonus diamant)
            $streak >= 60 => 0.0012,  // +0.12% (bonus or)
            $streak >= 30 => 0.001,   // +0.1% (bonus argent)
            $streak >= 14 => 0.0008,  // +0.08% (bonus 2 semaines)
            $streak >= 7 => 0.0005,   // +0.05% (bonus 1 semaine)
            default => 0.0
        };
    }
    
    public function updateStreak(User $user, Carbon $claimDate): UserStreak
    {
        $streak = UserStreak::firstOrCreate(['user_id' => $user->id]);
        $yesterday = $claimDate->copy()->subDay();
        
        if ($streak->last_claim_date === null) {
            // Premier claim
            $streak->update([
                'current_streak' => 1,
                'last_claim_date' => $claimDate->toDateString(),
                'streak_started_at' => $claimDate->toDateString()
            ]);
        } elseif ($streak->last_claim_date === $yesterday->toDateString()) {
            // Streak continu
            $newStreak = $streak->current_streak + 1;
            $streak->update([
                'current_streak' => $newStreak,
                'longest_streak' => max($streak->longest_streak, $newStreak),
                'last_claim_date' => $claimDate->toDateString()
            ]);
        } elseif ($streak->last_claim_date === $claimDate->toDateString()) {
            // Déjà claimé aujourd'hui
            return $streak;
        } else {
            // Streak cassé
            $streak->update([
                'current_streak' => 1,
                'last_claim_date' => $claimDate->toDateString(),
                'streak_started_at' => $claimDate->toDateString()
            ]);
        }
        
        // Mettre à jour le bonus utilisateur
        $user->update([
            'streak_bonus' => $this->calculateStreakBonus($user)
        ]);
        
        return $streak->fresh();
    }
    
    public function awardLoyaltyPoints(User $user, float $claimAmount, int $streakDays): void
    {
        $basePoints = (int)($claimAmount * 10); // 10 points par Pi
        $streakMultiplier = match (true) {
            $streakDays >= 90 => 3.0,
            $streakDays >= 30 => 2.0,
            $streakDays >= 7 => 1.5,
            default => 1.0
        };
        
        $totalPoints = (int)($basePoints * $streakMultiplier);
        
        LoyaltyPoint::create([
            'user_id' => $user->id,
            'points' => $totalPoints,
            'source' => 'claim',
            'reference_id' => null, // Sera rempli par le claim ID
            'earned_at' => now()
        ]);
        
        $user->increment('loyalty_points', $totalPoints);
    }
}
```

### 2. Système de Parrainage

```php
class ReferralCalculator
{
    public function calculateReferralBonus(User $referrer, User $referred, Investment $investment): float
    {
        $referrerLevel = app(UserLevelCalculator::class)->calculateLevel($referrer);
        $investmentAmount = $investment->amount;
        
        // Bonus basé sur le niveau du parrain
        $bonusRate = match ($referrerLevel) {
            UserLevel::DIAMOND => 0.15,  // 15%
            UserLevel::GOLD => 0.12,     // 12%
            UserLevel::SILVER => 0.10,   // 10%
            UserLevel::BRONZE => 0.08,   // 8%
            UserLevel::DISCOVERY => 0.05  // 5%
        };
        
        // Bonus réduit si l'investissement est fait avec un bonus
        if ($investment->source === 'bonus') {
            $bonusRate *= 0.5; // 50% de réduction
        }
        
        $bonusAmount = $investmentAmount * $bonusRate;
        
        // Plafond mensuel par niveau
        $monthlyLimit = match ($referrerLevel) {
            UserLevel::DIAMOND => 1000,
            UserLevel::GOLD => 500,
            UserLevel::SILVER => 250,
            UserLevel::BRONZE => 100,
            UserLevel::DISCOVERY => 50
        };
        
        $currentMonthBonus = $this->getMonthlyReferralBonus($referrer);
        $availableBonus = max(0, $monthlyLimit - $currentMonthBonus);
        
        return min($bonusAmount, $availableBonus);
    }
    
    public function processReferralChain(User $referred, Investment $investment): array
    {
        $bonuses = [];
        $currentUser = $referred;
        $level = 1;
        $maxLevels = 3;
        
        while ($level <= $maxLevels && $currentUser->referred_by) {
            $referrer = User::find($currentUser->referred_by);
            if (!$referrer) break;
            
            $bonusAmount = $this->calculateReferralBonus($referrer, $referred, $investment);
            
            if ($bonusAmount > 0) {
                $referral = Referral::create([
                    'referrer_id' => $referrer->id,
                    'referred_id' => $referred->id,
                    'level' => $level,
                    'bonus_amount' => $bonusAmount,
                    'status' => 'qualified',
                    'qualifying_action' => 'investment',
                    'qualified_at' => now()
                ]);
                
                // Créditer le bonus immédiatement
                $referrer->increment('balance_pi', $bonusAmount);
                
                Transaction::create([
                    'user_id' => $referrer->id,
                    'type' => 'referral',
                    'amount' => $bonusAmount,
                    'status' => 'completed',
                    'related_id' => $referral->id,
                    'description' => "Bonus parrainage niveau {$level} - {$referred->username}"
                ]);
                
                $bonuses[] = [
                    'referrer' => $referrer,
                    'level' => $level,
                    'amount' => $bonusAmount
                ];
            }
            
            $currentUser = $referrer;
            $level++;
        }
        
        return $bonuses;
    }
}
```

## 💰 Logique de Calcul des Claims

### 1. Calcul Principal

```php
class ClaimCalculator
{
    public function calculateClaimAmount(Investment $investment, User $user): array
    {
        // Vérifications préliminaires
        $this->validateClaimEligibility($investment);
        
        // Calcul de base
        $baseAmount = $investment->amount * $investment->base_rate;
        
        // Bonus de streak
        $streakBonus = $user->streak_bonus;
        $streakAmount = $investment->amount * $streakBonus;
        
        // Bonus événements spéciaux (le cas échéant)
        $eventBonusRate = $this->getActiveEventBonus($user);
        $eventAmount = $investment->amount * $eventBonusRate;
        
        // Bonus de fidélité (basé sur l'ancienneté)
        $loyaltyBonusRate = $this->getLoyaltyBonus($user);
        $loyaltyAmount = $investment->amount * $loyaltyBonusRate;
        
        // Total avant arrondi
        $totalAmount = $baseAmount + $streakAmount + $eventAmount + $loyaltyAmount;
        
        // Arrondi bancaire (éviter les exploits au centime)
        $finalAmount = $this->bankersRound($totalAmount, 8);
        
        return [
            'total_amount' => $finalAmount,
            'base_amount' => $this->bankersRound($baseAmount, 8),
            'streak_amount' => $this->bankersRound($streakAmount, 8),
            'event_amount' => $this->bankersRound($eventAmount, 8),
            'loyalty_amount' => $this->bankersRound($loyaltyAmount, 8),
            'rates_used' => [
                'base_rate' => $investment->base_rate,
                'streak_rate' => $streakBonus,
                'event_rate' => $eventBonusRate,
                'loyalty_rate' => $loyaltyBonusRate
            ]
        ];
    }
    
    private function validateClaimEligibility(Investment $investment): void
    {
        if ($investment->status !== 'active') {
            throw new InvalidClaimException('Investment is not active');
        }
        
        if ($investment->next_claim_available_at && $investment->next_claim_available_at > now()) {
            throw new InvalidClaimException('Claim not yet available');
        }
        
        if ($investment->end_at && $investment->end_at < now()) {
            throw new InvalidClaimException('Investment has expired');
        }
        
        // Vérifier si déjà claimé aujourd'hui
        $todayClaim = Claim::where('investment_id', $investment->id)
            ->where('claimed_for_day', now()->toDateString())
            ->exists();
            
        if ($todayClaim) {
            throw new InvalidClaimException('Already claimed today');
        }
    }
    
    private function bankersRound(float $number, int $precision): float
    {
        $factor = pow(10, $precision);
        return round($number * $factor) / $factor;
    }
    
    private function getLoyaltyBonus(User $user): float
    {
        $accountAge = $user->created_at->diffInDays(now());
        
        return match (true) {
            $accountAge >= 365 => 0.0002, // +0.02% après 1 an
            $accountAge >= 180 => 0.0001, // +0.01% après 6 mois
            default => 0.0
        };
    }
}
```

### 2. Processus de Claim Complet

```php
class ClaimService
{
    public function processClaim(Investment $investment): Claim
    {
        DB::beginTransaction();
        
        try {
            $user = $investment->user;
            $calculator = new ClaimCalculator();
            
            // Calcul du montant
            $claimDetails = $calculator->calculateClaimAmount($investment, $user);
            
            // Créer le record de claim
            $claim = Claim::create([
                'investment_id' => $investment->id,
                'user_id' => $user->id,
                'claimed_for_day' => now()->toDateString(),
                'amount' => $claimDetails['total_amount'],
                'base_amount' => $claimDetails['base_amount'],
                'bonus_amount' => $claimDetails['streak_amount'] + $claimDetails['event_amount'],
                'streak_bonus' => $claimDetails['streak_amount'],
                'base_rate' => $claimDetails['rates_used']['base_rate'],
                'bonus_rate' => $claimDetails['rates_used']['streak_rate'],
                'status' => 'completed',
                'claimed_at' => now(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);
            
            // Créditer le solde utilisateur
            $user->increment('balance_pi', $claimDetails['total_amount']);
            $user->increment('total_claimed', $claimDetails['total_amount']);
            $user->update(['last_activity' => now()]);
            
            // Mettre à jour l'investissement
            $investment->update([
                'last_claim_at' => now(),
                'next_claim_available_at' => now()->addDay(),
                'claimed_amount' => $investment->claimed_amount + $claimDetails['total_amount'],
                'total_claims' => $investment->total_claims + 1
            ]);
            
            // Mettre à jour le streak
            app(StreakCalculator::class)->updateStreak($user, now());
            
            // Attribuer points de fidélité
            app(StreakCalculator::class)->awardLoyaltyPoints(
                $user, 
                $claimDetails['total_amount'], 
                $user->streak_bonus
            );
            
            // Créer transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'claim',
                'amount' => $claimDetails['total_amount'],
                'status' => 'completed',
                'related_id' => $claim->id,
                'description' => "Claim quotidien - Investment #{$investment->id}"
            ]);
            
            // Events pour notifications temps réel
            event(new ClaimProcessed($claim, $user));
            
            DB::commit();
            
            return $claim;
            
        } catch (Exception $e) {
            DB::rollback();
            
            // Logger l'erreur
            Log::error('Claim processing failed', [
                'investment_id' => $investment->id,
                'user_id' => $investment->user_id,
                'error' => $e->getMessage()
            ]);
            
            throw $e;
        }
    }
}
```

## ⚖️ Système d'Ajustements Automatiques

### 1. Monitoring et Déclencheurs

```php
class RiskMonitoringService
{
    public function checkFinancialHealth(): FinancialHealthStatus
    {
        $metrics = $this->calculateCurrentMetrics();
        
        return new FinancialHealthStatus([
            'liquidity_ratio' => $metrics['liquidity_ratio'],
            'revenue_ratio' => $metrics['revenue_ratio'],
            'growth_rate' => $metrics['growth_rate'],
            'alert_level' => $this->determineAlertLevel($metrics),
            'recommendations' => $this->generateRecommendations($metrics)
        ]);
    }
    
    private function calculateCurrentMetrics(): array
    {
        $totalReserves = $this->getTotalReserves();
        $dailyClaims = $this->getDailyClaims();
        $dailyRevenues = $this->getDailyRevenues();
        $totalTVL = $this->getTotalTVL();
        
        return [
            'total_reserves' => $totalReserves,
            'daily_claims' => $dailyClaims,
            'daily_revenues' => $dailyRevenues,
            'total_tvl' => $totalTVL,
            'liquidity_ratio' => $dailyClaims > 0 ? $totalReserves / $dailyClaims : 999,
            'revenue_ratio' => $dailyClaims > 0 ? $dailyRevenues / $dailyClaims : 0,
            'growth_rate' => $this->calculateGrowthRate()
        ];
    }
    
    private function determineAlertLevel(array $metrics): string
    {
        if ($metrics['liquidity_ratio'] < 10 || $metrics['revenue_ratio'] < 1.0) {
            return 'RED'; // Critique
        }
        
        if ($metrics['liquidity_ratio'] < 20 || $metrics['revenue_ratio'] < 1.1) {
            return 'ORANGE'; // Attention
        }
        
        return 'GREEN'; // Normal
    }
    
    public function shouldTriggerAdjustment(): bool
    {
        $status = $this->checkFinancialHealth();
        
        // Vérifier la fréquence des ajustements récents
        $recentAdjustments = RateAdjustment::where('created_at', '>=', now()->subHours(6))->count();
        
        if ($recentAdjustments >= 3) {
            Log::warning('Too many recent rate adjustments, skipping auto-adjustment');
            return false;
        }
        
        return in_array($status->alert_level, ['ORANGE', 'RED']);
    }
}
```

### 2. Algorithme d'Ajustement

```php
class AutoRateAdjustmentService
{
    public function calculateAdjustments(FinancialHealthStatus $status): array
    {
        $adjustments = [];
        
        if ($status->alert_level === 'RED') {
            $adjustments = $this->calculateEmergencyAdjustments($status);
        } elseif ($status->alert_level === 'ORANGE') {
            $adjustments = $this->calculatePreventiveAdjustments($status);
        }
        
        return $adjustments;
    }
    
    private function calculateEmergencyAdjustments(FinancialHealthStatus $status): array
    {
        $severity = $this->calculateSeverity($status);
        
        // Réduction universelle basée sur la sévérité
        $reductionRate = match (true) {
            $severity >= 0.8 => 0.003,  // -0.3%
            $severity >= 0.6 => 0.002,  // -0.2%
            default => 0.001            // -0.1%
        };
        
        return [
            [
                'level' => 'all',
                'adjustment_type' => 'emergency',
                'old_rate' => null,
                'new_rate' => null,
                'adjustment_amount' => -$reductionRate,
                'reason' => "Emergency reduction - Liquidity: {$status->liquidity_ratio}d, Revenue: {$status->revenue_ratio}",
                'trigger_metric' => 'liquidity_ratio',
                'trigger_value' => $status->liquidity_ratio
            ]
        ];
    }
    
    private function calculatePreventiveAdjustments(FinancialHealthStatus $status): array
    {
        $adjustments = [];
        
        // Ajustements ciblés par niveau
        if ($status->liquidity_ratio < 25) {
            // Réduire les taux les plus élevés en premier
            $adjustments[] = [
                'level' => 'discovery',
                'adjustment_type' => 'preventive',
                'adjustment_amount' => -0.005, // -0.5%
                'reason' => 'Preventive reduction on highest rates'
            ];
            
            $adjustments[] = [
                'level' => 'bronze',
                'adjustment_type' => 'preventive',
                'adjustment_amount' => -0.001, // -0.1%
                'reason' => 'Preventive reduction on bronze level'
            ];
        }
        
        if ($status->revenue_ratio < 1.05) {
            // Réduction modérée sur tous les niveaux
            foreach (['bronze', 'silver', 'gold', 'diamond'] as $level) {
                $adjustments[] = [
                    'level' => $level,
                    'adjustment_type' => 'preventive',
                    'adjustment_amount' => -0.0005, // -0.05%
                    'reason' => 'Revenue optimization adjustment'
                ];
            }
        }
        
        return $adjustments;
    }
    
    public function applyAdjustments(array $adjustments): array
    {
        $results = [];
        
        foreach ($adjustments as $adjustment) {
            DB::beginTransaction();
            
            try {
                if ($adjustment['level'] === 'all') {
                    $result = $this->applyUniversalAdjustment($adjustment);
                } else {
                    $result = $this->applyLevelAdjustment($adjustment);
                }
                
                $results[] = $result;
                DB::commit();
                
            } catch (Exception $e) {
                DB::rollback();
                Log::error('Rate adjustment failed', [
                    'adjustment' => $adjustment,
                    'error' => $e->getMessage()
                ]);
                
                $results[] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'adjustment' => $adjustment
                ];
            }
        }
        
        return $results;
    }
    
    private function applyLevelAdjustment(array $adjustment): array
    {
        $packages = StakingPackage::where('level', $adjustment['level'])
            ->where('is_active', true)
            ->get();
        
        $affectedCount = 0;
        
        foreach ($packages as $package) {
            $oldRate = $package->daily_rate;
            $newRate = max(0.0001, $oldRate + $adjustment['adjustment_amount']); // Min 0.01%
            
            $package->update(['daily_rate' => $newRate]);
            
            // Enregistrer l'ajustement
            RateAdjustment::create([
                'level' => $adjustment['level'],
                'old_rate' => $oldRate,
                'new_rate' => $newRate,
                'reason' => $adjustment['reason'],
                'adjustment_type' => $adjustment['adjustment_type'],
                'trigger_metric' => $adjustment['trigger_metric'] ?? null,
                'trigger_value' => $adjustment['trigger_value'] ?? null,
                'applied_at' => now(),
                'created_by' => null // Système automatique
            ]);
            
            $affectedCount++;
        }
        
        // Mettre à jour les investissements existants (optionnel)
        if ($affectedCount > 0) {
            $this->updateExistingInvestments($adjustment['level'], $adjustment['adjustment_amount']);
        }
        
        return [
            'success' => true,
            'level' => $adjustment['level'],
            'affected_packages' => $affectedCount,
            'adjustment_amount' => $adjustment['adjustment_amount']
        ];
    }
}
```

## 🔒 Validation et Contrôles de Sécurité

### 1. Validations Métier

```php
class BusinessRuleValidator
{
    public function validateInvestment(array $data, User $user): void
    {
        // Montant minimum/maximum selon le niveau
        $level = app(UserLevelCalculator::class)->calculateLevel($user);
        $limits = $this->getLevelLimits($level);
        
        if ($data['amount'] < $limits['min_amount']) {
            throw new ValidationException("Minimum investment for {$level->value} is {$limits['min_amount']} Pi");
        }
        
        if ($limits['max_amount'] && $data['amount'] > $limits['max_amount']) {
            throw new ValidationException("Maximum investment for {$level->value} is {$limits['max_amount']} Pi");
        }
        
        // Vérifier les fonds disponibles
        if ($data['source'] === 'funds') {
            if ($user->balance_pi < $data['amount']) {
                throw new ValidationException('Insufficient balance');
            }
        } elseif ($data['source'] === 'bonus') {
            $availableBonus = $this->getAvailableBonusAmount($user);
            if ($availableBonus < $data['amount']) {
                throw new ValidationException('Insufficient bonus balance');
            }
        }
        
        // Limite d'investissements simultanés
        $activeInvestments = $user->investments()->where('status', 'active')->count();
        $maxInvestments = $this->getMaxInvestments($level);
        
        if ($activeInvestments >= $maxInvestments) {
            throw new ValidationException("Maximum {$maxInvestments} active investments allowed");
        }
        
        // KYC requis pour gros montants
        if ($data['amount'] >= 1000 && $user->kyc_status !== 'verified') {
            throw new ValidationException('KYC verification required for investments >= 1000 Pi');
        }
    }
    
    public function validateWithdrawal(array $data, User $user): void
    {
        // Montant minimum
        if ($data['amount'] < 20) {
            throw new ValidationException('Minimum withdrawal is 20 Pi');
        }
        
        // Solde disponible (exclure les fonds bloqués)
        $availableBalance = $this->getAvailableBalance($user);
        if ($data['amount'] > $availableBalance) {
            throw new ValidationException('Insufficient available balance');
        }
        
        // Limite quotidienne
        $dailyWithdrawn = $this->getDailyWithdrawnAmount($user);
        $dailyLimit = $this->getDailyWithdrawalLimit($user);
        
        if ($dailyWithdrawn + $data['amount'] > $dailyLimit) {
            throw new ValidationException("Daily withdrawal limit exceeded ({$dailyLimit} Pi)");
        }
        
        // KYC requis
        if ($user->kyc_status !== 'verified') {
            throw new ValidationException('KYC verification required for withdrawals');
        }
        
        // Vérification d'adresse wallet
        if (!$this->isValidWalletAddress($data['wallet_address'])) {
            throw new ValidationException('Invalid wallet address');
        }
    }
    
    private function getAvailableBalance(User $user): float
    {
        $totalBalance = $user->balance_pi;
        $lockedInInvestments = $user->investments()
            ->where('status', 'active')
            ->sum('amount');
        
        return max(0, $totalBalance - $lockedInInvestments);
    }
}
```

### 2. Détection d'Anomalies

```php
class AnomalyDetectionService
{
    public function detectSuspiciousActivity(User $user, string $action, array $context = []): float
    {
        $score = 0.0;
        
        // Fréquence d'actions
        $score += $this->checkActionFrequency($user, $action);
        
        // Patterns de comportement
        $score += $this->checkBehaviorPatterns($user, $action, $context);
        
        // Multi-comptes potentiels
        $score += $this->checkMultiAccountIndicators($user);
        
        // Géolocalisation suspecte
        $score += $this->checkGeolocationAnomalies($user);
        
        // Timing suspects
        $score += $this->checkTimingAnomalies($user, $action);
        
        // Enregistrer si score élevé
        if ($score >= 0.7) {
            $this->logSuspiciousActivity($user, $action, $score, $context);
        }
        
        return $score;
    }
    
    private function checkActionFrequency(User $user, string $action): float
    {
        $timeframes = [
            'last_hour' => now()->subHour(),
            'last_day' => now()->subDay()
        ];
        
        $score = 0.0;
        
        foreach ($timeframes as $period => $since) {
            $count = Audit::where('actor_id', $user->id)
                ->where('action', $action)
                ->where('created_at', '>=', $since)
                ->count();
            
            $threshold = match ($action) {
                'claim' => $period === 'last_hour' ? 5 : 50,
                'withdrawal' => $period === 'last_hour' ? 3 : 10,
                'investment' => $period === 'last_hour' ? 10 : 100,
                default => 100
            };
            
            if ($count > $threshold) {
                $score += 0.3;
            }
        }
        
        return min(1.0, $score);
    }
    
    private function checkMultiAccountIndicators(User $user): float
    {
        $score = 0.0;
        
        // Même IP récente
        $sameIpUsers = User::whereIn('id', function($query) use ($user) {
            $query->select('actor_id')
                ->from('audits')
                ->where('ip_address', request()->ip())
                ->where('actor_id', '!=', $user->id)
                ->where('created_at', '>=', now()->subDays(7));
        })->count();
        
        if ($sameIpUsers > 2) {
            $score += 0.4;
        }
        
        // Patterns de noms similaires
        $similarNames = User::where('id', '!=', $user->id)
            ->where(function($query) use ($user) {
                $query->where('username', 'LIKE', substr($user->username, 0, 5) . '%')
                      ->orWhere('email', 'LIKE', '%' . explode('@', $user->email)[0] . '%');
            })
            ->count();
        
        if ($similarNames > 0) {
            $score += 0.2;
        }
        
        return min(1.0, $score);
    }
}
```

## 📈 Métriques et KPIs

### 1. Calcul des Métriques Quotidiennes

```php
class FinancialMetricsCalculator
{
    public function calculateDailyMetrics(Carbon $date): FinancialMetric
    {
        return FinancialMetric::updateOrCreate(
            ['metric_date' => $date->toDateString()],
            [
                'total_users' => $this->getTotalUsers($date),
                'active_users' => $this->getActiveUsers($date),
                'new_users' => $this->getNewUsers($date),
                'total_tvl' => $this->getTotalTVL($date),
                'daily_claims' => $this->getDailyClaims($date),
                'daily_deposits' => $this->getDailyDeposits($date),
                'daily_withdrawals' => $this->getDailyWithdrawals($date),
                'daily_revenues' => $this->getDailyRevenues($date),
                'total_reserves' => $this->getTotalReserves($date),
                'available_liquidity' => $this->getAvailableLiquidity($date),
                'liquidity_ratio' => $this->calculateLiquidityRatio($date),
                'revenue_ratio' => $this->calculateRevenueRatio($date),
                'growth_rate' => $this->calculateGrowthRate($date),
                'churn_rate' => $this->calculateChurnRate($date),
                'discovery_tvl' => $this->getTVLByLevel('discovery', $date),
                'bronze_tvl' => $this->getTVLByLevel('bronze', $date),
                'silver_tvl' => $this->getTVLByLevel('silver', $date),
                'gold_tvl' => $this->getTVLByLevel('gold', $date),
                'diamond_tvl' => $this->getTVLByLevel('diamond', $date),
                'alert_level' => $this->calculateAlertLevel($date),
                'calculated_at' => now()
            ]
        );
    }
    
    private function getDailyRevenues(Carbon $date): float
    {
        // Frais de dépôt
        $depositFees = Transaction::where('type', 'fee')
            ->whereDate('created_at', $date)
            ->where('description', 'LIKE', '%deposit%')
            ->sum('amount');
        
        // Frais de retrait
        $withdrawalFees = Transaction::where('type', 'fee')
            ->whereDate('created_at', $date)
            ->where('description', 'LIKE', '%withdrawal%')
            ->sum('amount');
        
        // Frais de performance (10% des gains)
        $performanceFees = Claim::whereDate('created_at', $date)
            ->sum('amount') * 0.1;
        
        // Revenus DeFi estimés (sera remplacé par des données réelles)
        $defiYield = $this->estimateDefiYield($date);
        
        return $depositFees + $withdrawalFees + $performanceFees + $defiYield;
    }
    
    private function calculateLiquidityRatio(Carbon $date): float
    {
        $reserves = $this->getTotalReserves($date);
        $dailyClaims = $this->getDailyClaims($date);
        
        return $dailyClaims > 0 ? $reserves / $dailyClaims : 999;
    }
    
    private function calculateRevenueRatio(Carbon $date): float
    {
        $revenues = $this->getDailyRevenues($date);
        $claims = $this->getDailyClaims($date);
        
        return $claims > 0 ? $revenues / $claims : 0;
    }
}
```

## 🚨 Gestion des Urgences

### 1. Plan d'Urgence Automatique

```php
class EmergencyResponseService
{
    public function handleCriticalAlert(SystemAlert $alert): void
    {
        switch ($alert->type) {
            case 'financial_risk':
                $this->handleFinancialCrisis($alert);
                break;
                
            case 'liquidity_crisis':
                $this->handleLiquidityCrisis($alert);
                break;
                
            case 'security_breach':
                $this->handleSecurityBreach($alert);
                break;
        }
    }
    
    private function handleFinancialCrisis(SystemAlert $alert): void
    {
        // Stopper nouveaux investissements
        Cache::put('investments_disabled', true, now()->addHours(6));
        
        // Réduction d'urgence des taux
        $adjustmentService = app(AutoRateAdjustmentService::class);
        $adjustments = $adjustmentService->calculateEmergencyAdjustments(
            json_decode($alert->metadata, true)
        );
        $adjustmentService->applyAdjustments($adjustments);
        
        // Notification équipe
        $this->notifyEmergencyTeam($alert);
        
        // Activer mode dégradé
        $this->activateDegradedMode();
    }
    
    private function handleLiquidityCrisis(SystemAlert $alert): void
    {
        // Bloquer tous les retraits
        Cache::put('withdrawals_disabled', true, now()->addHours(2));
        
        // Réduction drastique des taux
        $this->applyEmergencyRateReduction(0.005); // -0.5%
        
        // Activer délais de retrait étendus
        Cache::put('extended_withdrawal_delay', 48, now()->addHours(24)); // 48h
        
        // Notification immédiate
        $this->sendCriticalAlert($alert);
    }
}
```

## 🎯 Conclusion

Cette spécification couvre tous les aspects critiques de la logique métier :

✅ **Calculs de taux progressifs** avec validation complète  
✅ **Système de gamification** (streaks, parrainage, fidélité)  
✅ **Ajustements automatiques** basés sur les métriques financières  
✅ **Détection d'anomalies** et prévention de fraude  
✅ **Validation métier** et contrôles de sécurité  
✅ **Gestion d'urgence** automatisée  
✅ **Calcul des métriques** et KPIs en temps réel  

**Phase suivante** : Conception du système de monitoring et d'alertes financières pour surveiller en continu la santé de la plateforme.