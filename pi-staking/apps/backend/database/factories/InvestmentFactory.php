<?php

namespace Database\Factories;

use App\Models\Investment;
use App\Models\User;
use App\Models\StakingPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Investment> */
class InvestmentFactory extends Factory
{
    protected $model = Investment::class;

    public function definition(): array
    {
        $user = User::factory()->create();
        $package = StakingPackage::factory()->create();
        $amount = $this->faker->randomFloat(4, 10, 1000);
        $start = now()->subDays($this->faker->numberBetween(1, 30));
        $end = $start->copy()->addDays($this->faker->numberBetween(30, 120));

        return [
            'user_id' => $user->id,
            'staking_package_id' => $package->id,
            'amount' => $amount,
            'daily_rate' => $package->daily_rate,
            'start_at' => $start,
            'end_at' => $end,
            'status' => $this->faker->randomElement(['active','completed','cancelled']),
            'source' => $this->faker->randomElement(['funds','bonus','claimable','claimable_bonus']),
            'last_claim_at' => null,
            'total_claimed' => 0,
            'claims_count' => 0,
            'next_claim_at' => $start->copy()->addDay(),
            'has_bonus_applied' => false,
            'bonus_multiplier' => 1,
            'metadata' => [],
            'notes' => null,
        ];
    }
}
