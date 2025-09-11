<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\StakingPackage;
use App\Models\Investment;
use App\Models\Claim;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // Create or fetch demo user
            $demo = User::firstOrCreate(
                ['email' => 'demo@progressiverewards.com'],
                [
                    'first_name' => 'Demo',
                    'last_name' => 'User',
                    'username' => 'demo',
                    'password' => Hash::make('demo123!'),
                    'current_level' => 'bronze',
                    'email_verified_at' => now(),
                    'kyc_status' => 'verified',
                    'balance_pi' => 3000,
                    'bonus_balance' => 100,
                    'total_invested' => 0,
                    'total_claimed' => 0,
                ]
            );

            // Ensure roles exist and assign basic user role if available
            if (class_exists(\Spatie\Permission\Models\Role::class)) {
                $userRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'user']);
                if (!$demo->hasRole('user')) {
                    $demo->assignRole('user');
                }
            }

            // Pick a staking package (prefer Bronze, fallback to any active)
            $package = StakingPackage::where('name', 'Bronze')->first()
                ?? StakingPackage::where('is_active', true)->orderBy('sort_order')->first();

            if (!$package) {
                throw new \RuntimeException('No staking package available to seed demo data.');
            }

            $amount = 1000.0;
            $startAt = now()->subDays(5);
            $endAt = $package->duration_days ? $startAt->copy()->addDays($package->duration_days) : null;

            // Create or fetch demo investment
            $investment = Investment::firstOrCreate(
                [
                    'user_id' => $demo->id,
                    'staking_package_id' => $package->id,
                    'amount' => $amount,
                ],
                [
                    'daily_rate' => $package->daily_rate,
                    'start_at' => $startAt,
                    'end_at' => $endAt,
                    'status' => 'active',
                    'source' => 'funds',
                    'last_claim_at' => null,
                    'total_claimed' => 0,
                    'claims_count' => 0,
                    'next_claim_at' => now()->subHour(), // eligible for claim
                    'bonus_multiplier' => 1.0,
                ]
            );

            // Create a processed claim for yesterday if not present
            $claimedForDay = now()->subDay()->toDateString();
            $existingClaim = Claim::where('investment_id', $investment->id)
                ->where('claimed_for_day', $claimedForDay)
                ->first();

            if (!$existingClaim) {
                $baseAmount = $investment->amount * $investment->daily_rate;
                $finalAmount = round($baseAmount * $investment->bonus_multiplier, 8);

                $claim = Claim::create([
                    'investment_id' => $investment->id,
                    'user_id' => $demo->id,
                    'claimed_for_day' => $claimedForDay,
                    'base_amount' => $baseAmount,
                    'bonus_amount' => $finalAmount - $baseAmount,
                    'final_amount' => $finalAmount,
                    'claimed_at' => now()->subHours(1),
                    'status' => 'processed',
                    'daily_rate_applied' => $investment->daily_rate,
                    'streak_bonus' => 0,
                    'streak_days' => 0,
                    'calculation_details' => [
                        'base_calculation' => $baseAmount,
                        'bonus_multiplier' => $investment->bonus_multiplier,
                        'final_amount' => $finalAmount,
                    ],
                ]);

                // Update investment after claim
                $investment->update([
                    'last_claim_at' => $claim->claimed_at,
                    'next_claim_at' => now()->addDay(),
                    'total_claimed' => $investment->total_claimed + $finalAmount,
                    'claims_count' => $investment->claims_count + 1,
                ]);

                // Credit user balance and totals
                $before = $demo->balance_pi;
                $demo->increment('balance_pi', $finalAmount);
                $demo->increment('total_claimed', $finalAmount);

                // Create transaction for the claim
                Transaction::create([
                    'user_id' => $demo->id,
                    'type' => 'claim',
                    'category' => 'staking',
                    'amount' => $finalAmount,
                    'balance_before' => $before,
                    'balance_after' => $before + $finalAmount,
                    'status' => 'completed',
                    'investment_id' => $investment->id,
                    'claim_id' => $claim->id,
                    'description' => 'Claim quotidien - ' . $package->name,
                    'processed_at' => now(),
                ]);
            }
        });
    }
}
