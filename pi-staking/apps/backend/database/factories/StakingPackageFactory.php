<?php

namespace Database\Factories;

use App\Models\StakingPackage;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<StakingPackage> */
class StakingPackageFactory extends Factory
{
    protected $model = StakingPackage::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word(),
            'description' => $this->faker->sentence(),
            'level' => $this->faker->randomElement(['discovery','bronze','silver','gold','diamond']),
            'daily_rate' => $this->faker->randomFloat(6, 0.0001, 0.01),
            'min_amount' => $this->faker->randomFloat(2, 1, 100),
            'max_amount' => null,
            'duration_days' => $this->faker->numberBetween(30, 365),
            'max_duration_days' => $this->faker->numberBetween(30, 365),
            'is_active' => true,
            'is_discovery_bonus' => false,
            'max_concurrent' => null,
            'features' => [],
            'sort_order' => 0,
        ];
    }
}
