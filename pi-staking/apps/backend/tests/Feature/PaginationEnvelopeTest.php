<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Transaction;
use App\Models\Investment;
use App\Models\Claim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaginationEnvelopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure Sanctum is available
        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
    }

    public function test_admin_users_returns_uniform_paginated_envelope(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(5)->create();

        $res = $this->actingAs($admin)->getJson('/api/admin/users?per_page=2');
        $res->assertOk();
        $res->assertJsonStructure([
            'data',
            'meta' => ['current_page','per_page','total','last_page'],
            'links' => ['next','prev'],
        ]);
        $this->assertCount(2, $res->json('data'));
    }

    public function test_user_investments_returns_uniform_paginated_envelope(): void
    {
        $user = User::factory()->create();
        // Create some investments for user
        Investment::factory()->count(3)->create(['user_id' => $user->id]);

        $res = $this->actingAs($user)->getJson('/api/staking/investments?per_page=2');
        $res->assertOk();
        $res->assertJsonStructure([
            'data',
            'meta' => ['current_page','per_page','total','last_page'],
            'links' => ['next','prev'],
        ]);
        $this->assertCount(2, $res->json('data'));
    }

    public function test_user_transactions_returns_uniform_paginated_envelope(): void
    {
        $user = User::factory()->create();
        Transaction::factory()->count(5)->create(['user_id' => $user->id]);

        $res = $this->actingAs($user)->getJson('/api/transactions?per_page=3');
        $res->assertOk();
        $res->assertJsonStructure([
            'data',
            'meta' => ['current_page','per_page','total','last_page'],
            'links' => ['next','prev'],
        ]);
        $this->assertCount(3, $res->json('data'));
    }
}
