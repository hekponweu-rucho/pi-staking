<?php

namespace App\Services;

use App\Models\Investment;
use App\Models\StakingPackage;
use App\Models\User;
use App\Models\BonusGrant;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Exception;

class StakingService
{
    public function __construct(
        private UserLevelService $userLevelService,
        private GamificationService $gamificationService,
        private ReferralService $referralService
    ) {}

    /**
     * Créer un nouvel investissement
     */
    public function createInvestment(
        User $user,
        StakingPackage $package,
        float $amount,
        string $source = 'funds'
    ): Investment {
        return DB::transaction(function () use ($user, $package, $amount, $source) {
            // Validations
            $this->validateInvestment($user, $package, $amount, $source);

            // Débiter les fonds selon la source
            $this->debitFunds($user, $amount, $source);

            // Créer l'investissement
            $investment = $this->createInvestmentRecord($user, $package, $amount, $source);

            // Créer la transaction
            $this->createInvestmentTransaction($user, $investment, $amount, $source);

            // Mettre à jour les totaux utilisateur
            $user->increment('total_invested', $amount);

            // Mettre à jour le niveau utilisateur
            $this->userLevelService->updateUserLevel($user);

            // Appliquer la gamification
            $this->gamificationService->handleInvestmentCreated($user, $investment);

            // Activer le parrainage si applicable
            $this->referralService->activateReferral($user, $investment);

            return $investment;
        });
    }

    /**
     * Valider qu'un investissement peut être créé
     */
    private function validateInvestment(
        User $user,
        StakingPackage $package,
        float $amount,
        string $source
    ): void {
        // Vérifier que le package est actif
        if (!$package->is_active) {
            throw new Exception('Ce package de staking n\'est plus disponible.');
        }

        // Vérifier que l'utilisateur peut utiliser ce package
        if (!$package->canBeUsedBy($user)) {
            throw new Exception('Vous ne remplissez pas les conditions pour ce package.');
        }

        // Vérifier que le montant est valide
        if (!$package->isValidAmount($amount)) {
            throw new Exception('Le montant doit être entre ' . $package->min_amount . ' et ' . ($package->max_amount ?? 'illimité') . ' Pi.');
        }

        // Vérifier que l'utilisateur a les fonds suffisants
        if (!$user->canInvest($amount, $source)) {
            throw new Exception('Fonds insuffisants pour cet investissement.');
        }

        // Vérifications spécifiques pour le bonus de découverte
        if ($package->is_discovery_bonus && $source !== 'bonus') {
            throw new Exception('Ce package ne peut être utilisé qu\'avec des fonds bonus.');
        }

        if ($source === 'bonus' && !$package->is_discovery_bonus) {
            throw new Exception('Les fonds bonus ne peuvent être utilisés que pour le package Découverte.');
        }
    }

    /**
     * Obtenir les packages disponibles pour un utilisateur
     */
    public function getAvailablePackages(User $user): array
    {
        $packages = StakingPackage::active()->ordered()->get();
        
        return $packages->filter(function ($package) use ($user) {
            return $package->canBeUsedBy($user);
        })->values()->toArray();
    }

    /**
     * Calculer les statistiques d'investissement pour un utilisateur
     */
    public function getUserInvestmentStats(User $user): array
    {
        $activeInvestments = $user->investments()->active()->get();
        
        return [
            'total_active_investments' => $activeInvestments->count(),
            'total_staked_amount' => $activeInvestments->sum('amount'),
            'total_claimed' => $user->total_claimed,
            'claimable_count' => $activeInvestments
                ->where('next_claim_at', '<=', now())
                ->count(),
        ];
    }

    // Méthodes privées simplifiées pour éviter les dépendances circulaires
    private function debitFunds(User $user, float $amount, string $source): void
    {
        if ($source === 'funds') {
            $user->decrement('balance_pi', $amount);
        }
    }

    private function createInvestmentRecord(
        User $user,
        StakingPackage $package,
        float $amount,
        string $source
    ): Investment {
        $startAt = now();
        $endAt = $package->duration_days ? $startAt->clone()->addDays($package->duration_days) : null;

        return Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $package->id,
            'amount' => $amount,
            'daily_rate' => $package->daily_rate,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'active',
            'source' => $source,
            'next_claim_at' => $startAt->clone()->addDay(),
            'bonus_multiplier' => 1.0,
        ]);
    }

    private function createInvestmentTransaction(
        User $user,
        Investment $investment,
        float $amount,
        string $source
    ): Transaction {
        return Transaction::create([
            'user_id' => $user->id,
            'type' => 'adjustment',
            'category' => 'staking',
            'amount' => -$amount,
            'balance_before' => $user->balance_pi + $amount,
            'balance_after' => $user->balance_pi,
            'status' => 'completed',
            'investment_id' => $investment->id,
            'description' => 'Staking investment created',
            'processed_at' => now(),
        ]);
    }
}
