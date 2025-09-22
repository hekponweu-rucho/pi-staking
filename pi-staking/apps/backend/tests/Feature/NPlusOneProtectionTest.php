<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Investment;
use App\Models\Claim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class NPlusOneProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_users_no_n_plus_one_on_list(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        // Seed users with related investments and claims
        User::factory()->count(5)->create()->each(function(User $u) {
            Investment::factory()->count(2)->create(['user_id' => $u->id]);
            Claim::factory()->count(3)->create(['user_id' => $u->id]);
        });

        DB::enableQueryLog();
        $this->actingAs($admin)->getJson('/api/admin/users?per_page=5')->assertOk();
        $queries = DB::getQueryLog();
        // Expect a small constant number of queries (base + eager loads + counts)
        $this->assertLessThanOrEqual(12, count($queries), 'Too many queries (potential N+1)');
    }

    public function test_user_investments_no_n_plus_one_on_list(): void
    {
        $user = User::factory()->create();
        Investment::factory()->count(6)->create(['user_id' => $user->id]);

        DB::enableQueryLog();
        $this->actingAs($user)->getJson('/api/staking/investments?per_page=6')->assertOk();
        $queries = DB::getQueryLog();
        $this->assertLessThanOrEqual(8, count($queries), 'Too many queries (potential N+1)');
    }
}
