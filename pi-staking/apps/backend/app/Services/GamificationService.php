<?php

namespace App\Services;

use App\Models\User;
use App\Models\Investment;
use App\Models\LoyaltyPoint;
use App\Models\UserStreak;
use App\Models\Claim;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class GamificationService
{
    /**
     * Points accordés par action
     */
    private array $pointsConfig = [
        'daily_claim' => 10,
        'investment' => 50, // Points de base + bonus selon montant
        'referral' => 100,
        'streak_milestone' => 200,
        'special_event' => 500,
    ];

    /**
     * Seuils pour bonus d'investissement
     */
    private array $investmentBonusThresholds = [
        100 => 1.2,   // +20% points pour 100+ Pi
        500 => 1.5,   // +50% points pour 500+ Pi
        1000 => 2.0,  // +100% points pour 1000+ Pi
        5000 => 3.0,  // +200% points pour 5000+ Pi
    ];

    /**
     * Gérer la création d'un nouvel investissement
     */
    public function handleInvestmentCreated(User $user, Investment $investment): void
    {
        DB::transaction(function () use ($user, $investment) {
            // 1. Calculer et attribuer les points de fidélité
            $this->awardInvestmentPoints($user, $investment);
            
            // 2. Mettre à jour le streak d'investissement
            $this->updateInvestmentStreak($user);
            
            // 3. Vérifier les paliers de streak atteints
            $this->checkStreakMilestones($user, 'investment');
            
            // 4. Mettre à jour les statistiques de gamification
            $this->updateUserGamificationStats($user);
        });
    }

    /**
     * Gérer un claim quotidien
     */
    public function handleDailyClaim(User $user, Claim $claim): void
    {
        DB::transaction(function () use ($user, $claim) {
            // 1. Attribuer les points de base pour le claim
            $this->awardClaimPoints($user, $claim);
            
            // 2. Mettre à jour le streak de claim quotidien
            $this->updateDailyClaimStreak($user);
            
            // 3. Vérifier les paliers de streak atteints
            $this->checkStreakMilestones($user, 'daily_claim');
            
            // 4. Appliquer les bonus de streak si applicable
            $this->applyStreakBonus($user);
        });
    }

    /**
     * Attribuer les points pour un investissement
     */
    private function awardInvestmentPoints(User $user, Investment $investment): void
    {
        $basePoints = $this->pointsConfig['investment'];
        $amount = $investment->amount;
        
        // Calculer le multiplicateur basé sur le montant
        $multiplier = 1.0;
        foreach (array_reverse($this->investmentBonusThresholds, true) as $threshold => $bonus) {
            if ($amount >= $threshold) {
                $multiplier = $bonus;
                break;
            }
        }
        
        // Appliquer le multiplicateur de niveau utilisateur
        $levelMultiplier = $this->getLevelPointsMultiplier($user->current_level);
        $finalPoints = intval($basePoints * $multiplier * $levelMultiplier);
        
        // Créer l'enregistrement de points
        $this->createLoyaltyPointRecord($user, [
            'action' => 'investment',
            'points_earned' => $finalPoints,
            'description' => sprintf('Investissement de %.2f Pi (multiplicateur: %.1fx)', $amount, $multiplier),
            'investment_id' => $investment->id,
            'metadata' => [
                'investment_amount' => $amount,
                'base_points' => $basePoints,
                'amount_multiplier' => $multiplier,
                'level_multiplier' => $levelMultiplier,
                'package_type' => $investment->stakingPackage->name ?? 'Unknown',
            ],
        ]);
    }

    /**
     * Attribuer les points pour un claim
     */
    private function awardClaimPoints(User $user, Claim $claim): void
    {
        $basePoints = $this->pointsConfig['daily_claim'];
        $levelMultiplier = $this->getLevelPointsMultiplier($user->current_level);
        $finalPoints = intval($basePoints * $levelMultiplier);
        
        $this->createLoyaltyPointRecord($user, [
            'action' => 'daily_claim',
            'points_earned' => $finalPoints,
            'description' => sprintf('Claim quotidien de %.2f Pi', $claim->final_amount),
            'claim_id' => $claim->id,
            'metadata' => [
                'claim_amount' => $claim->final_amount,
                'base_points' => $basePoints,
                'level_multiplier' => $levelMultiplier,
                'has_streak_bonus' => $claim->streak_bonus > 0,
            ],
        ]);
    }

    /**
     * Mettre à jour le streak d'investissement
     */
    private function updateInvestmentStreak(User $user): void
    {
        $streak = $user->streaks()->firstOrCreate(
            ['type' => 'investment'],
            [
                'current_streak' => 0,
                'longest_streak' => 0,
                'last_activity_date' => null,
                'streak_started_at' => null,
            ]
        );
        
        $today = now()->toDateString();
        $lastActivity = $streak->last_activity_date?->toDateString();
        
        // Si c'est le premier investissement ou continuation du streak
        if (!$lastActivity || $lastActivity !== $today) {
            $streak->increment('current_streak');
            $streak->update([
                'last_activity_date' => $today,
                'streak_started_at' => $streak->streak_started_at ?? now(),
                'longest_streak' => max($streak->longest_streak, $streak->current_streak + 1),
            ]);
        }
    }

    /**
     * Mettre à jour le streak de claim quotidien
     */
    private function updateDailyClaimStreak(User $user): void
    {
        $streak = $user->streaks()->firstOrCreate(
            ['type' => 'daily_claim'],
            [
                'current_streak' => 0,
                'longest_streak' => 0,
                'last_activity_date' => null,
                'streak_started_at' => null,
            ]
        );
        
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $lastActivity = $streak->last_activity_date?->toDateString();
        
        if (!$lastActivity) {
            // Premier claim
            $streak->update([
                'current_streak' => 1,
                'longest_streak' => 1,
                'last_activity_date' => $today,
                'streak_started_at' => now(),
            ]);
        } elseif ($lastActivity === $yesterday) {
            // Continuation du streak
            $streak->increment('current_streak');
            $streak->update([
                'last_activity_date' => $today,
                'longest_streak' => max($streak->longest_streak, $streak->current_streak + 1),
            ]);
        } elseif ($lastActivity !== $today) {
            // Streak cassé, recommencer
            $streak->update([
                'current_streak' => 1,
                'last_activity_date' => $today,
                'streak_started_at' => now(),
                'streak_broken_at' => now(),
            ]);
        }
        
        // Mettre à jour le bonus rate
        $bonusRate = $streak->calculateBonusRate();
        $streak->update(['current_bonus_rate' => $bonusRate]);
    }

    /**
     * Vérifier et récompenser les paliers de streak
     */
    private function checkStreakMilestones(User $user, string $streakType): void
    {
        $streak = $user->streaks()->where('type', $streakType)->first();
        if (!$streak || $streak->current_streak <= $streak->milestone_reached) {
            return;
        }
        
        $milestones = [7, 14, 30, 60, 90, 180, 365];
        foreach ($milestones as $milestone) {
            if ($streak->current_streak >= $milestone && $streak->milestone_reached < $milestone) {
                // Attribuer les points de palier
                $this->awardMilestonePoints($user, $streakType, $milestone);
                
                // Mettre à jour le palier atteint
                $streak->update([
                    'milestone_reached' => $milestone,
                    'milestones_history' => array_merge(
                        $streak->milestones_history ?? [],
                        [[
                            'milestone' => $milestone,
                            'achieved_at' => now()->toISOString(),
                            'streak_length' => $streak->current_streak,
                        ]]
                    ),
                ]);
                
                break; // Un seul palier par vérification
            }
        }
    }

    /**
     * Attribuer les points de palier
     */
    private function awardMilestonePoints(User $user, string $streakType, int $milestone): void
    {
        $basePoints = $this->pointsConfig['streak_milestone'];
        $milestoneMultiplier = $this->getMilestoneMultiplier($milestone);
        $levelMultiplier = $this->getLevelPointsMultiplier($user->current_level);
        $finalPoints = intval($basePoints * $milestoneMultiplier * $levelMultiplier);
        
        $this->createLoyaltyPointRecord($user, [
            'action' => 'streak_milestone',
            'points_earned' => $finalPoints,
            'description' => sprintf('Palier %d jours de streak %s atteint', $milestone, $streakType),
            'metadata' => [
                'streak_type' => $streakType,
                'milestone' => $milestone,
                'base_points' => $basePoints,
                'milestone_multiplier' => $milestoneMultiplier,
                'level_multiplier' => $levelMultiplier,
            ],
        ]);
    }

    /**
     * Appliquer les bonus de streak au profil utilisateur
     */
    private function applyStreakBonus(User $user): void
    {
        $claimStreak = $user->streaks()->where('type', 'daily_claim')->first();
        if (!$claimStreak || !$claimStreak->isActive()) {
            $user->update(['streak_bonus' => 0.0]);
            return;
        }
        
        $bonusRate = $claimStreak->calculateBonusRate();
        $user->update(['streak_bonus' => $bonusRate]);
    }

    /**
     * Créer un enregistrement de points de fidélité
     */
    private function createLoyaltyPointRecord(User $user, array $data): void
    {
        $currentBalance = $user->loyalty_points;
        $newBalance = $currentBalance + $data['points_earned'];
        
        LoyaltyPoint::create(array_merge($data, [
            'user_id' => $user->id,
            'points_balance' => $newBalance,
        ]));
        
        // Mettre à jour le solde de l'utilisateur
        $user->update(['loyalty_points' => $newBalance]);
    }

    /**
     * Obtenir le multiplicateur de points par niveau
     */
    private function getLevelPointsMultiplier(string $level): float
    {
        return match ($level) {
            'discovery' => 1.0,
            'bronze' => 1.0,
            'silver' => 1.5,
            'gold' => 2.0,
            'diamond' => 3.0,
            default => 1.0,
        };
    }

    /**
     * Obtenir le multiplicateur par palier
     */
    private function getMilestoneMultiplier(int $milestone): float
    {
        return match (true) {
            $milestone <= 7 => 1.0,
            $milestone <= 30 => 1.5,
            $milestone <= 90 => 2.0,
            $milestone <= 180 => 3.0,
            default => 5.0,
        };
    }

    /**
     * Mettre à jour les statistiques de gamification de l'utilisateur
     */
    private function updateUserGamificationStats(User $user): void
    {
        // Calculer et mettre à jour les totaux de points
        $totalEarned = $user->loyaltyPoints()->sum('points_earned');
        $totalSpent = $user->loyaltyPoints()->sum('points_spent');
        $currentBalance = $totalEarned - $totalSpent;
        
        $user->update(['loyalty_points' => $currentBalance]);
        
        // Mettre à jour les bonus de streak actifs
        $this->applyStreakBonus($user);
    }

    /**
     * Obtenir le résumé de gamification d'un utilisateur
     */
    public function getUserGamificationSummary(User $user): array
    {
        $streaks = $user->streaks()->get()->keyBy('type');
        $recentPoints = $user->loyaltyPoints()
            ->whereDate('created_at', '>=', now()->subDays(30))
            ->get()
            ->groupBy('action');
        
        return [
            'total_loyalty_points' => $user->loyalty_points,
            'current_streak_bonus' => $user->streak_bonus,
            'level_multiplier' => $this->getLevelPointsMultiplier($user->current_level),
            'streaks' => [
                'daily_claim' => $streaks['daily_claim'] ? [
                    'current_streak' => $streaks['daily_claim']->current_streak,
                    'longest_streak' => $streaks['daily_claim']->longest_streak,
                    'is_active' => $streaks['daily_claim']->isActive(),
                    'current_bonus' => $streaks['daily_claim']->current_bonus_rate,
                    'next_milestone' => $streaks['daily_claim']->getNextMilestone(),
                ] : null,
                'investment' => $streaks['investment'] ? [
                    'current_streak' => $streaks['investment']->current_streak,
                    'longest_streak' => $streaks['investment']->longest_streak,
                    'is_active' => $streaks['investment']->isActive(),
                ] : null,
            ],
            'recent_activity' => [
                'daily_claim_points' => $recentPoints['daily_claim']?->sum('points_earned') ?? 0,
                'investment_points' => $recentPoints['investment']?->sum('points_earned') ?? 0,
                'milestone_points' => $recentPoints['streak_milestone']?->sum('points_earned') ?? 0,
            ],
        ];
    }
}
