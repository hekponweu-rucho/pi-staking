<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Créer les packages de staking
        $this->call([
            InitialStakingPackagesSeeder::class,
            AdminUserSeeder::class,
            DemoDataSeeder::class,
        ]);
        
        // Optionnel : créer des utilisateurs factices pour les tests
        if (app()->environment(['local', 'development'])) {
            // User::factory(50)->create();
        }
    }
}
