<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StakingPackage;

class InitialStakingPackagesSeeder extends Seeder
{
    public function run(): void
    {
        // Discovery bonus package
        StakingPackage::firstOrCreate(['name' => 'Discovery'], [
            'description' => 'Bonus découverte pour tester le staking',
            'level' => 'discovery',
            'min_amount' => 10,
            'max_amount' => 50,
            'duration_days' => 7,
            'max_duration_days' => 7,
            'daily_rate' => 0.025,
            'is_active' => true,
            'is_discovery_bonus' => true,
            'features' => [
                'streak_bonus_eligible' => true,
                'one_time_only' => true
            ],
            'sort_order' => 0,
        ]);

        StakingPackage::firstOrCreate(['name' => 'Bronze'], [
            'description' => 'Entrée de gamme',
            'level' => 'bronze',
            'min_amount' => 100,
            'max_amount' => 1000,
            'duration_days' => 30,
            'max_duration_days' => 30,
            'daily_rate' => 0.005,
            'is_active' => true,
            'is_discovery_bonus' => false,
            'features' => [
                'streak_bonus_eligible' => true
            ],
            'sort_order' => 10,
        ]);

        StakingPackage::firstOrCreate(['name' => 'Silver'], [
            'description' => 'Taux amélioré',
            'level' => 'silver',
            'min_amount' => 1001,
            'max_amount' => 5000,
            'duration_days' => 60,
            'max_duration_days' => 60,
            'daily_rate' => 0.007,
            'is_active' => true,
            'is_discovery_bonus' => false,
            'features' => [
                'streak_bonus_eligible' => true
            ],
            'sort_order' => 20,
        ]);

        StakingPackage::firstOrCreate(['name' => 'Gold'], [
            'description' => 'Pour utilisateurs avancés',
            'level' => 'gold',
            'min_amount' => 5001,
            'max_amount' => 20000,
            'duration_days' => 90,
            'max_duration_days' => 90,
            'daily_rate' => 0.01,
            'is_active' => true,
            'is_discovery_bonus' => false,
            'features' => [
                'streak_bonus_eligible' => true,
                'priority_support' => true
            ],
            'sort_order' => 30,
        ]);
    }
}
