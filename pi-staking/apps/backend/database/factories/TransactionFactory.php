<?php

namespace Database\Factories;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Transaction> */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        $user = User::factory()->create();
        return [
            'user_id' => $user->id,
            'type' => $this->faker->randomElement(['deposit','withdrawal','investment','claim']),
            'category' => 'general',
            'amount' => $this->faker->randomFloat(2, 1, 100),
            'balance_before' => 0,
            'balance_after' => 0,
            'status' => $this->faker->randomElement(['pending','completed','rejected']),
            'description' => $this->faker->sentence(),
        ];
    }
}
