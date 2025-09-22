<?php

namespace Database\Factories;

use App\Models\Claim;
use App\Models\Investment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Claim> */
class ClaimFactory extends Factory
{
    protected $model = Claim::class;

    public function definition(): array
    {
        $investment = Investment::factory()->create();
        $user = $investment->user;
        $final = $this->faker->randomFloat(8, 0.01, 10);
        return [
            'investment_id' => $investment->id,
            'user_id' => $user->id,
            'claimed_for_day' => now()->toDateString(),
            'base_amount' => $final,
            'bonus_amount' => 0,
            'final_amount' => $final,
            'claimed_at' => now(),
            'status' => 'processed',
            'daily_rate_applied' => $investment->daily_rate,
            'streak_bonus' => 0,
            'streak_days' => 0,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'testing',
            'calculation_details' => [],
            'notes' => null,
        ];
    }
}
