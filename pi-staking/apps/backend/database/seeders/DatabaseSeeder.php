<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            InitialStakingPackagesSeeder::class,
            DepositAddressesSeeder::class,
            AdminUserSeeder::class,
            DemoDataSeeder::class,
        ]);

        if (app()->environment(['local', 'development'])) {
        }
    }
}
