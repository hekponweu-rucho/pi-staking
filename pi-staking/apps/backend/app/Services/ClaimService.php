<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Investment;
use App\Models\User;
use App\Models\Transaction;
use App\Support\Money;
use App\Support\StructuredLogger;
use App\Support\Metrics;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\QueryException;
use Exception;

class ClaimService
{
    public function __construct(private LedgerService $ledgerService)
    {
    }

    public function processClaim(User $user, Investment $investment, ?string $forDate = null): Claim
    {
        $forDate = $forDate ?: now()->toDateString();
        $lock = Cache::lock('claim:investment:' . $investment->id, 10);

        return $lock->block(5, function () use ($user, $investment, $forDate) {
            return DB::transaction(function () use ($user, $investment, $forDate) {
                $investment = Investment::where('id', $investment->id)->lockForUpdate()->firstOrFail();

                $this->validateClaim($user, $investment, $forDate);

                $baseAmount = Money::mul($investment->amount, $investment->daily_rate);
                $amount = Money::mul($baseAmount, $investment->bonus_multiplier);
                $amount = Money::round($amount);
                $bonusAmount = Money::sub($amount, $baseAmount);

                try {
                    $claim = Claim::firstOrCreate([
                        'investment_id' => $investment->id,
                        'user_id' => $user->id,
                        'claimed_for_day' => $forDate,
                    ], [
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
                } catch (QueryException $e) {
                    $claim = Claim::where('investment_id', $investment->id)
                        ->where('user_id', $user->id)
                        ->where('claimed_for_day', $forDate)
                        ->first();
                    if ($claim) {
                        return $claim;
                    }
                    throw $e;
                }

                if ($claim->wasRecentlyCreated) {
                    if ($investment->source === 'bonus') {
                        $user->increment('claimable_bonus_balance', (float) $amount);
                    } else {
                        $user->increment('claimable_balance', (float) $amount);
                    }
                    $user->increment('total_claimed', (float) $amount);
                    if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'total_earned')) {
                        $user->increment('total_earned', (float) $amount);
                    }

                    $investment->update([
                        'last_claim_at' => now(),
                        'next_claim_at' => now()->addDay(),
                        'total_claimed' => (float) $investment->total_claimed + (float) $amount,
                        'claims_count' => (int) $investment->claims_count + 1,
                    ]);

                    Transaction::create([
                        'user_id' => $user->id,
                        'type' => 'claim',
                        'category' => 'staking',
                        'amount' => 0,
                        'balance_before' => $user->balance_pi,
                        'balance_after' => $user->balance_pi,
                        'status' => 'completed',
                        'investment_id' => $claim->investment_id,
                        'claim_id' => $claim->id,
                        'description' => 'Daily claim credited to claimable balance',
                        'processed_at' => now(),
                        'metadata' => [
                            'credited_to' => $investment->source === 'bonus' ? 'claimable_bonus' : 'claimable',
                            'amount' => (float) $amount,
                        ],
                    ]);

                    \App\Support\StructuredLogger::event('claim_processed', [
                        'user_id' => $user->id,
                        'investment_id' => $investment->id,
                        'amount' => (float) $amount,
                        'outcome' => 'success',
                    ]);
                    \App\Support\Metrics::inc('claims_processed_total');

                    if ($investment->source === 'bonus') {
                        $this->ledgerService->moveExternalToUser($user->id, 'claimable_bonus', $amount, 'claim', (string) $claim->id, [
                            'investment_id' => $investment->id,
                        ]);
                    } else {
                        $this->ledgerService->moveExternalToUser($user->id, 'claimable', $amount, 'claim', (string) $claim->id, [
                            'investment_id' => $investment->id,
                        ]);
                    }

                    if ($investment->end_at && now()->isAfter($investment->end_at)) {
                        $investment->update(['status' => 'completed']);
                    }
                }

                return $claim;
            });
        });
    }

    private function validateClaim(User $user, Investment $investment, ?string $forDate = null): void
    {
        if ($investment->user_id !== $user->id) {
            throw new Exception('Cet investissement ne vous appartient pas.');
        }

        if (!$investment->canClaim()) {
            throw new Exception("Ce claim n'est pas encore disponible.");
        }

        $date = $forDate ?: now()->toDateString();
        $existingClaim = $investment->claims()->where('claimed_for_day', $date)->exists();
        if ($existingClaim) {
            throw new Exception("Vous avez déjà claimé pour cet investissement aujourd'hui.");
        }
    }

    public function getClaimableInvestments(User $user): array
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
            ->values()
            ->toArray();
    }

    public function claimAll(User $user, ?string $forDate = null): array
    {
        $forDate = $forDate ?: now()->toDateString();
        $claimableInvestments = $this->getClaimableInvestments($user);
        $claims = [];
        $errors = [];

        foreach ($claimableInvestments as $investment) {
            try {
                $claims[] = $this->processClaim($user, $investment, $forDate);
            } catch (Exception $e) {
                $errors[] = [
                    'investment_id' => $investment->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'claims' => $claims,
            'errors' => $errors,
            'total_claimed' => collect($claims)->sum('final_amount'),
        ];
    }

    public function getUserClaimStats(User $user): array
    {
        $claimableInvestments = $this->getClaimableInvestments($user);
        $todaysClaims = $user->claims()->whereDate('claimed_at', today())->get();

        return [
            'claimable_count' => count($claimableInvestments),
            'potential_claim_amount' => collect($claimableInvestments)->sum(function ($investment) {
                $base = Money::mul($investment->amount, $investment->daily_rate);
                $amt = Money::mul($base, $investment->bonus_multiplier);
                return (float) Money::round($amt);
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
