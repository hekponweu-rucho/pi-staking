<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Investment;
use App\Models\StakingPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReinvestQuickApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_reinvest_quick_requires_balance(): void
    {
        $user = User::factory()->create(['claimable_balance' => 0]);
        $res = $this->actingAs($user, 'sanctum')->postJson('/api/staking/reinvest-quick');
        $res->assertStatus(422)->assertJson(['success' => false]);
    }

    public function test_reinvest_quick_invests_from_claimable(): void
    {
        $user = User::factory()->create(['claimable_balance' => 25]);

        $pkg = StakingPackage::create([
            'name' => 'Bronze',
            'description' => 'Std',
            'daily_rate' => 0.01,
            'min_amount' => 10,
            'max_amount' => 100000,
            'duration_days' => 30,
            'max_duration_days' => 30,
            'level' => 'bronze',
            'is_active' => true,
            'is_discovery_bonus' => false,
            'max_concurrent' => 10,
            'features' => [],
            'sort_order' => 1,
        ]);

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/staking/reinvest-quick');
        $res->assertCreated()->assertJson(['success' => true]);
        $user->refresh();
        $this->assertEquals(0.0, (float) $user->claimable_balance);
        $this->assertDatabaseCount('investments', 1);
        /** @var Investment $inv */
        $inv = Investment::first();
        $this->assertEquals('funds', $inv->source); // origin mapped
        $this->assertEquals(25.0, (float) $inv->amount);
    }
}
