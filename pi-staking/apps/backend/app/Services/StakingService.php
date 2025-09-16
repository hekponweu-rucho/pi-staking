<?php

namespace App\Services;

use App\Support\Rate;

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
        string $source = 'funds' // funds|bonus|claimable|claimable_bonus
    ): Investment {
        return DB::transaction(function () use ($user, $package, $amount, $source) {
            // Validations
            $this->validateInvestment($user, $package, $amount, $source);

            // Débiter les fonds selon la source
            $this->debitFunds($user, $amount, $source);

            // Mapper la source d'origine pour l'investissement
            $origin = in_array($source, ['funds', 'claimable'], true) ? 'funds' : 'bonus';

            // Créer l'investissement
            $investment = $this->createInvestmentRecord($user, $package, $amount, $origin);

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
        if (!$package->is_active) {
            throw new Exception('Ce package de staking n\'est plus disponible.');
        }

        if (!$package->canBeUsedBy($user)) {
            throw new Exception('Vous ne remplissez pas les conditions pour ce package.');
        }

        if (!$package->isValidAmount($amount)) {
            throw new Exception('Le montant doit être entre ' . $package->min_amount . ' et ' . ($package->max_amount ?? 'illimité') . ' Pi.');
        }

        if (!$user->canInvest($amount, $source)) {
            throw new Exception('Fonds insuffisants pour cet investissement.');
        }

        // Règles spécifiques bonus Discovery
        if (in_array($source, ['bonus', 'claimable_bonus'], true) && !$package->is_discovery_bonus) {
            throw new Exception('Les fonds bonus et leurs gains ne peuvent être utilisés que pour le package Découverte.');
        }

        if ($source === 'bonus') {
            // Anti-abus: un seul investissement créé directement depuis bonus par utilisateur
            $hasBonusInvestment = Investment::where('user_id', $user->id)
                ->where('source', 'bonus')
                ->exists();
            if ($hasBonusInvestment) {
                throw new Exception('Vous avez déjà utilisé votre bonus de bienvenue pour un investissement.');
            }
            // Expiration du bonus: refuser si tous les bonus sont expirés
            $activeGrant = \App\Models\BonusGrant::where('user_id', $user->id)
                ->whereIn('type', ['welcome', 'welcome_bonus'])
                ->available()
                ->first();
            if (!$activeGrant) {
                throw new Exception('Votre bonus de bienvenue n\'est pas disponible ou a expiré.');
            }
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
            return;
        }
        if ($source === 'bonus') {
            $user->decrement('bonus_balance', $amount);
            return;
        }
        if ($source === 'claimable') {
            $user->decrement('claimable_balance', $amount);
            return;
        }
        if ($source === 'claimable_bonus') {
            $user->decrement('claimable_bonus_balance', $amount);
            return;
        }
    }

    private function createInvestmentRecord(
        User $user,
        StakingPackage $package,
        float $amount,
        string $origin
    ): Investment {
        $startAt = now();

        $level = $package->level ?: 'bronze';
        $apy = (float) config("staking.apy.$level", 0.04);
        $mode = (string) config('staking.rate_mode', 'simple');
        $dailyRate = Rate::dailyRateFromApy($apy, $mode);

        $endAt = $package->duration_days ? $startAt->clone()->addDays($package->duration_days) : null;
        if ($origin === 'bonus' && $package->is_discovery_bonus) {
            $endAt = $startAt->clone()->addDays((int) config('staking.bonus.discovery_days', 90));
        }

        return Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $package->id,
            'amount' => $amount,
            'daily_rate' => $dailyRate,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'active',
            'source' => $origin,
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
        if ($source === 'funds') {
            return Transaction::create([
                'user_id' => $user->id,
                'type' => 'adjustment',
                'category' => 'staking',
                'amount' => -$amount,
                'balance_before' => $user->balance_pi + $amount,
                'balance_after' => $user->balance_pi,
                'status' => 'completed',
                'investment_id' => $investment->id,
                'description' => 'Staking investment created (funds)',
                'processed_at' => now(),
                'metadata' => [
                    'source' => 'funds',
                ],
            ]);
        }

        if ($source === 'claimable') {
            return Transaction::create([
                'user_id' => $user->id,
                'type' => 'adjustment',
                'category' => 'staking',
                'amount' => 0,
                'balance_before' => $user->balance_pi,
                'balance_after' => $user->balance_pi,
                'status' => 'completed',
                'investment_id' => $investment->id,
                'description' => 'Reinvest from claimable balance',
                'processed_at' => now(),
                'metadata' => [
                    'source' => 'claimable',
                    'claimable_before' => (float) $user->claimable_balance + $amount,
                    'claimable_after' => (float) $user->claimable_balance,
                ],
            ]);
        }

        // Pour les bonus et bonus claimable: ne pas impacter le solde disponible
        return Transaction::create([
            'user_id' => $user->id,
            'type' => 'adjustment',
            'category' => 'staking',
            'amount' => 0,
            'balance_before' => $user->balance_pi,
            'balance_after' => $user->balance_pi,
            'status' => 'completed',
            'investment_id' => $investment->id,
            'description' => $source === 'claimable_bonus' ? 'Reinvest from claimable bonus' : 'Staking investment created (bonus funds)',
            'processed_at' => now(),
            'metadata' => [
                'source' => $source === 'claimable_bonus' ? 'claimable_bonus' : 'bonus',
                'claimable_bonus_before' => $source === 'claimable_bonus' ? ((float) $user->claimable_bonus_balance + $amount) : null,
                'claimable_bonus_after' => $source === 'claimable_bonus' ? (float) $user->claimable_bonus_balance : null,
            ],
        ]);
    }
}
