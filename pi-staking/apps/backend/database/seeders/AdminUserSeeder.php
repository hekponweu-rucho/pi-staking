<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Créer un utilisateur administrateur par défaut
     */
    public function run(): void
    {
        // Créer les rôles s'ils n'existent pas
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $userRole = Role::firstOrCreate(['name' => 'user']);

        // Créer l'utilisateur administrateur par défaut
        $admin = User::firstOrCreate(
            ['email' => 'admin@progressiverewards.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('admin123!'),
                'referral_code' => 'PI-ADMIN',
                'current_level' => 'diamond',
                'balance_pi' => 10000.0,
                'bonus_balance' => 0,
                'total_invested' => 0,
                'total_claimed' => 0,
                'kyc_status' => 'verified',
                'is_active' => true,
                'email_verified_at' => now(),
                'first_name' => 'Admin',
                'last_name' => 'System',
            ]
        );

        // Assigner le rôle admin
        $admin->assignRole('admin');

        // Créer un utilisateur de test normal
        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'username' => 'testuser',
                'password' => Hash::make('password123'),
                'referral_code' => 'PI-TEST01',
                'current_level' => 'bronze',
                'balance_pi' => 1000.0,
                'bonus_balance' => 100.0,
                'total_invested' => 0,
                'total_claimed' => 0,
                'kyc_status' => 'verified',
                'is_active' => true,
                'email_verified_at' => now(),
                'first_name' => 'Test',
                'last_name' => 'User',
            ]
        );

        // Assigner le rôle utilisateur
        $testUser->assignRole('user');

        // Créer un bonus grant pour l'utilisateur de test
        \App\Models\BonusGrant::firstOrCreate(
            ['user_id' => $testUser->id, 'type' => 'welcome_bonus'],
            [
                'amount' => 50.0,
                'expires_at' => now()->addDays(90),
                'is_used' => false,
                'description' => 'Bonus de bienvenue - 50 Pi pour découvrir le staking',
            ]
        );

        $this->command->info('Utilisateurs par défaut créés :');
        $this->command->info('Admin - Email: admin@progressiverewards.com, Password: admin123!');
        $this->command->info('Test User - Email: test@example.com, Password: password123');
    }
}