<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StakingPackage;

class InitialStakingPackagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        StakingPackage::firstOrCreate(['name' => 'Bronze'], [
            'min_amount' => 100,
            'max_amount' => 1000,
            'duration_days' => 30,
            'daily_rate' => 0.005, // 0.5%
            'is_active' => true,
        ]);

        StakingPackage::firstOrCreate(['name' => 'Silver'], [
            'min_amount' => 1001,
            'max_amount' => 5000,
            'duration_days' => 60,
            'daily_rate' => 0.007, // 0.7%
            'is_active' => true,
        ]);

        StakingPackage::firstOrCreate(['name' => 'Gold'], [
            'min_amount' => 5001,
            'max_amount' => 20000,
            'duration_days' => 90,
            'daily_rate' => 0.01, // 1.0%
            'is_active' => true,
        ]);
    }
}
