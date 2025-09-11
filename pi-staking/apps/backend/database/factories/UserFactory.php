<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'username' => $this->faker->unique()->userName(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'balance_pi' => 0,
            'bonus_balance' => 0,
            'total_invested' => 0,
            'total_claimed' => 0,
            'total_withdrawn' => 0,
            'current_level' => 'discovery',
            'referral_code' => Str::upper(Str::random(8)),
            'kyc_status' => 'pending',
            'loyalty_points' => 0,
            'streak_bonus' => 0,
            'last_activity' => now(),
        ];
    }
}
