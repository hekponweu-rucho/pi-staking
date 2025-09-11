<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Investment;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Exception;

class ClaimService
{
    /**
     * Effectuer un claim pour un investissement
     */
    public function processClaim(User $user, Investment $investment): Claim
    {
        return DB::transaction(function () use ($user, $investment) {
            // Validations
            $this->validateClaim($user, $investment);

            // Calculer le montant du claim
            $amount = $this->calculateClaimAmount($investment);

            // Créer le claim
            $claim = $this->createClaimRecord($user, $investment, $amount);

            // Créditer le solde utilisateur
            $user->increment('balance_pi', $amount);
            $user->increment('total_claimed', $amount);
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'total_earned')) {
                $user->increment('total_earned', $amount);
            }

            // Mettre à jour l'investissement
            $this->updateInvestmentAfterClaim($investment, $amount);

            // Créer la transaction
            $this->createClaimTransaction($user, $claim, $amount);

            return $claim;
        });
    }

    /**
     * Valider qu'un claim peut être effectué
     */
    private function validateClaim(User $user, Investment $investment): void
    {
        if ($investment->user_id !== $user->id) {
            throw new Exception('Cet investissement ne vous appartient pas.');
        }

        if (!$investment->canClaim()) {
            throw new Exception('Ce claim n\'est pas encore disponible.');
        }

        // Vérifier qu'il n'y a pas déjà un claim pour aujourd'hui
        $existingClaim = $investment->claims()
            ->where('claimed_for_day', now()->toDateString())
            ->exists();

        if ($existingClaim) {
            throw new Exception('Vous avez déjà claimé pour cet investissement aujourd\'hui.');
        }
    }

    /**
     * Calculer le montant du claim
     */
    private function calculateClaimAmount(Investment $investment): float
    {
        $baseAmount = $investment->amount * $investment->daily_rate;
        
        // Appliquer le multiplicateur de bonus
        $amount = $baseAmount * $investment->bonus_multiplier;

        // Arrondir à 8 décimales
        return round($amount, 8);
    }

    /**
     * Créer l'enregistrement du claim
     */
    private function createClaimRecord(User $user, Investment $investment, float $amount): Claim
    {
        $baseAmount = $investment->amount * $investment->daily_rate;
        $bonusAmount = $amount - $baseAmount;

        return Claim::create([
            'investment_id' => $investment->id,
            'user_id' => $user->id,
            'claimed_for_day' => now()->toDateString(),
            'base_amount' => $baseAmount,
            'bonus_amount' => $bonusAmount,
            'final_amount' => $amount,
            'claimed_at' => now(),
            'status' => 'processed',
            'daily_rate_applied' => $investment->daily_rate,
            'calculation_details' => [
                'base_calculation' => $baseAmount,
                'bonus_multiplier' => $investment->bonus_multiplier,
                'final_amount' => $amount,
            ],
        ]);
    }

    /**
     * Mettre à jour l'investissement après le claim
     */
    private function updateInvestmentAfterClaim(Investment $investment, float $amount): void
    {
        $investment->update([
            'last_claim_at' => now(),
            'next_claim_at' => now()->addDay(),
            'total_claimed' => $investment->total_claimed + $amount,
            'claims_count' => $investment->claims_count + 1,
        ]);

        // Vérifier si l'investissement est terminé
        if ($investment->end_at && now()->isAfter($investment->end_at)) {
            $investment->update(['status' => 'completed']);
        }
    }

    /**
     * Créer la transaction de claim
     */
    private function createClaimTransaction(User $user, Claim $claim, float $amount): Transaction
    {
        return Transaction::create([
            'user_id' => $user->id,
            'type' => 'claim',
            'category' => 'staking',
            'amount' => $amount,
            'balance_before' => $user->balance_pi - $amount,
            'balance_after' => $user->balance_pi,
            'status' => 'completed',
            'investment_id' => $claim->investment_id,
            'claim_id' => $claim->id,
            'description' => 'Claim quotidien - ' . $claim->investment->stakingPackage->name,
            'processed_at' => now(),
        ]);
    }

    /**
     * Obtenir tous les investissements claimables pour un utilisateur
     */
    public function getClaimableInvestments(User $user)
    {
        return $user->investments()
            ->with('stakingPackage')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('last_claim_at')
                    ->orWhere('next_claim_at', '<=', now());
            })
            ->get()
            ->filter(function ($investment) {
                return $investment->canClaim();
            })
            ->values();
    }

    /**
     * Claim en masse pour tous les investissements claimables
     */
    public function claimAll(User $user): array
    {
        $claimableInvestments = $this->getClaimableInvestments($user);
        $successful = [];
        $failed = [];

        foreach ($claimableInvestments as $investment) {
            try {
                $successful[] = $this->processClaim($user, $investment);
            } catch (Exception $e) {
                $failed[] = [
                    'investment_id' => $investment->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'successful_claims' => $successful,
            'failed_claims' => $failed,
            'total_claimed' => collect($successful)->sum('final_amount'),
        ];
    }

    /**
     * Obtenir les statistiques de claim pour un utilisateur
     */
    public function getUserClaimStats(User $user): array
    {
        $claimableInvestments = $this->getClaimableInvestments($user);
        $todaysClaims = $user->claims()->whereDate('claimed_at', today())->get();

        return [
            'claimable_count' => $claimableInvestments->count(),
            'potential_claim_amount' => $claimableInvestments->sum(function ($investment) {
                return $this->calculateClaimAmount($investment);
            }),
            'todays_claims_count' => $todaysClaims->count(),
            'todays_claims_amount' => $todaysClaims->sum('final_amount'),
            'total_lifetime_claims' => $user->total_claimed,
            'next_claimable_at' => $user->investments()
                ->active()
                ->where('next_claim_at', '>', now())
                ->min('next_claim_at'),
        ];
    }
}
