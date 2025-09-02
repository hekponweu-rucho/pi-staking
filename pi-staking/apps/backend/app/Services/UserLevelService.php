<?php

namespace App\Services;

use App\Models\User;

class UserLevelService
{
    private array $levelThresholds = [
        'bronze' => 500,
        'silver' => 2500,
        'gold' => 10000,
        'diamond' => 50000,
    ];

    private array $levelRates = [
        'discovery' => 0.025,
        'bronze' => 0.008,
        'silver' => 0.005,
        'gold' => 0.003,
        'diamond' => 0.002,
    ];

    /**
     * Mettre à jour le niveau d'un utilisateur
     */
    public function updateUserLevel(User $user): bool
    {
        $currentLevel = $user->current_level;
        $newLevel = $this->calculateUserLevel($user->total_invested);
        
        if ($currentLevel !== $newLevel) {
            $user->update([
                'current_level' => $newLevel,
                'level_updated_at' => now(),
            ]);
            
            return true;
        }
        
        return false;
    }

    /**
     * Calculer le niveau basé sur le montant total investi
     */
    public function calculateUserLevel(float $totalInvested): string
    {
        foreach (array_reverse($this->levelThresholds, true) as $level => $threshold) {
            if ($totalInvested >= $threshold) {
                return $level;
            }
        }
        
        return 'discovery';
    }

    /**
     * Obtenir le progrès vers le prochain niveau
     */
    public function getLevelProgress(User $user): array
    {
        $currentLevel = $user->current_level;
        $totalInvested = $user->total_invested;
        
        // Si c'est déjà le niveau maximum
        if ($currentLevel === 'diamond') {
            return [
                'current_level' => $currentLevel,
                'next_level' => null,
                'current_threshold' => $this->levelThresholds['diamond'],
                'next_threshold' => null,
                'progress_percentage' => 100,
                'remaining_amount' => 0,
            ];
        }
        
        $nextLevel = $this->getNextLevel($currentLevel);
        $currentThreshold = $currentLevel === 'discovery' ? 0 : $this->levelThresholds[$currentLevel];
        $nextThreshold = $this->levelThresholds[$nextLevel];
        
        $progressAmount = $totalInvested - $currentThreshold;
        $requiredAmount = $nextThreshold - $currentThreshold;
        $progressPercentage = min(100, ($progressAmount / $requiredAmount) * 100);
        
        return [
            'current_level' => $currentLevel,
            'next_level' => $nextLevel,
            'current_threshold' => $currentThreshold,
            'next_threshold' => $nextThreshold,
            'progress_percentage' => round($progressPercentage, 2),
            'remaining_amount' => $nextThreshold - $totalInvested,
        ];
    }

    /**
     * Obtenir le niveau suivant
     */
    private function getNextLevel(string $currentLevel): ?string
    {
        $levels = ['discovery', 'bronze', 'silver', 'gold', 'diamond'];
        $currentIndex = array_search($currentLevel, $levels);
        
        return $currentIndex !== false && $currentIndex < count($levels) - 1 
            ? $levels[$currentIndex + 1] 
            : null;
    }

    /**
     * Obtenir le taux de rendement pour un niveau
     */
    public function getLevelRate(string $level): float
    {
        return $this->levelRates[$level] ?? 0.0;
    }

    /**
     * Vérifier si un utilisateur peut accéder à un niveau donné
     */
    public function canAccessLevel(User $user, string $requiredLevel): bool
    {
        $levels = ['discovery', 'bronze', 'silver', 'gold', 'diamond'];
        $userLevelIndex = array_search($user->current_level, $levels);
        $requiredLevelIndex = array_search($requiredLevel, $levels);
        
        return $userLevelIndex !== false && $requiredLevelIndex !== false 
            && $userLevelIndex >= $requiredLevelIndex;
    }

    /**
     * Obtenir les informations complètes de tous les niveaux
     */
    public function getAllLevelsInfo(): array
    {
        return [
            'discovery' => [
                'name' => 'Découverte',
                'threshold' => 0,
                'rate' => $this->levelRates['discovery'],
                'description' => 'Niveau débutant avec bonus de bienvenue',
                'color' => '#10B981',
                'benefits' => [
                    'Accès au bonus de découverte 2.5%',
                    'Package Bonus Découverte disponible',
                ]
            ],
            'bronze' => [
                'name' => 'Bronze',
                'threshold' => $this->levelThresholds['bronze'],
                'rate' => $this->levelRates['bronze'],
                'description' => 'Premier niveau avec investissements réels',
                'color' => '#CD7F32',
                'benefits' => [
                    'Taux de rendement 0.8% quotidien',
                    'Jusquà 3 investissements simultanés',
                    'Bonus de streak disponibles',
                ]
            ],
            'silver' => [
                'name' => 'Argent',
                'threshold' => $this->levelThresholds['silver'],
                'rate' => $this->levelRates['silver'],
                'description' => 'Niveau intermédiaire pour investisseurs confirmés',
                'color' => '#C0C0C0',
                'benefits' => [
                    'Taux de rendement 0.5% quotidien',
                    'Jusquà 5 investissements simultanés',
                    'Multiplicateur de points de fidélité x1.5',
                ]
            ],
            'gold' => [
                'name' => 'Or',
                'threshold' => $this->levelThresholds['gold'],
                'rate' => $this->levelRates['gold'],
                'description' => 'Niveau avancé pour gros investisseurs',
                'color' => '#FFD700',
                'benefits' => [
                    'Taux de rendement 0.3% quotidien',
                    'Jusquà 10 investissements simultanés',
                    'Multiplicateur de points x2.0',
                    'Support prioritaire',
                ]
            ],
            'diamond' => [
                'name' => 'Diamant',
                'threshold' => $this->levelThresholds['diamond'],
                'rate' => $this->levelRates['diamond'],
                'description' => 'Niveau élite pour les plus gros investisseurs',
                'color' => '#B9F2FF',
                'benefits' => [
                    'Taux de rendement 0.2% quotidien stable',
                    'Investissements simultanés illimités',
                    'Multiplicateur de points x3.0',
                    'Gestionnaire de compte dédié',
                    'Limites de retrait personnalisées',
                ]
            ],
        ];
    }

    /**
     * Obtenir les informations détaillées du prochain niveau
     */
    public function getNextLevelInfo(User $user): ?array
    {
        $currentLevel = $user->current_level;
        $nextLevel = $this->getNextLevel($currentLevel);
        
        if (!$nextLevel) {
            return null; // Utilisateur déjà au niveau maximum
        }
        
        $allLevels = $this->getAllLevelsInfo();
        $nextLevelInfo = $allLevels[$nextLevel];
        $progress = $this->getLevelProgress($user);
        
        return [
            'level' => $nextLevel,
            'name' => $nextLevelInfo['name'],
            'threshold' => $nextLevelInfo['threshold'],
            'rate' => $nextLevelInfo['rate'],
            'description' => $nextLevelInfo['description'],
            'color' => $nextLevelInfo['color'],
            'benefits' => $nextLevelInfo['benefits'],
            'progress' => [
                'remaining_amount' => $progress['remaining_amount'],
                'progress_percentage' => $progress['progress_percentage'],
                'current_invested' => $user->total_invested,
                'required_total' => $nextLevelInfo['threshold'],
            ],
            'advantages' => [
                'rate_improvement' => $nextLevelInfo['rate'] - $this->getLevelRate($currentLevel),
                'new_benefits' => $this->getNewBenefits($currentLevel, $nextLevel),
                'investment_limits' => $this->getInvestmentLimitsForLevel($nextLevel),
            ],
        ];
    }

    /**
     * Obtenir les nouveaux avantages débloqués au prochain niveau
     */
    private function getNewBenefits(string $currentLevel, string $nextLevel): array
    {
        $allLevels = $this->getAllLevelsInfo();
        $currentBenefits = $allLevels[$currentLevel]['benefits'] ?? [];
        $nextBenefits = $allLevels[$nextLevel]['benefits'] ?? [];
        
        // Retourner les avantages uniques au prochain niveau
        return array_diff($nextBenefits, $currentBenefits);
    }

    /**
     * Obtenir les limites d'investissement pour un niveau donné
     */
    private function getInvestmentLimitsForLevel(string $level): array
    {
        $baseLimit = 1000;
        $multiplier = match ($level) {
            'discovery' => 1.0,
            'bronze' => 1.0,
            'silver' => 1.5,
            'gold' => 2.0,
            'diamond' => 5.0,
            default => 1.0,
        };
        
        return [
            'max_single_investment' => $baseLimit * $multiplier,
            'max_daily_investment' => $baseLimit * $multiplier * 2,
            'simultaneous_investments' => match ($level) {
                'discovery' => 1,
                'bronze' => 3,
                'silver' => 5,
                'gold' => 10,
                'diamond' => -1, // Illimité
                default => 1,
            },
        ];
    }
}
