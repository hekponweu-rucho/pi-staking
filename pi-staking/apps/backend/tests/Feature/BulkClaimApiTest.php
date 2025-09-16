<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Investment;
use App\Models\StakingPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkClaimApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Spatie\Permission\Models\Role::findOrCreate('admin');
    }

    public function test_bulk_claim_success_and_idempotence(): void
    {
        $user = User::factory()->create(['claimable_balance' => 0]);

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

        // Two active investments eligible to claim now
        $inv1 = Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $pkg->id,
            'amount' => 50,
            'daily_rate' => 0.01,
            'start_at' => now()->subDay(),
            'status' => 'active',
            'source' => 'funds',
            'next_claim_at' => now()->subMinute(),
            'bonus_multiplier' => 1.0,
            'claims_count' => 0,
            'total_claimed' => 0,
        ]);
        $inv2 = Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $pkg->id,
            'amount' => 100,
            'daily_rate' => 0.01,
            'start_at' => now()->subDay(),
            'status' => 'active',
            'source' => 'funds',
            'next_claim_at' => now()->subMinute(),
            'bonus_multiplier' => 1.0,
            'claims_count' => 0,
            'total_claimed' => 0,
        ]);

        $ids = [$inv1->id, $inv2->id];
        $key = 'test-key-'.uniqid();

        $res = $this->actingAs($user, 'sanctum')
            ->postJson('/api/claims/bulk-claim', [
                'investment_ids' => $ids,
                'idempotency_key' => $key,
            ]);
        $res->assertOk()->assertJson(['success' => true]);
        $total = $res->json('data.total_claimed');
        $this->assertGreaterThan(0, $total);

        $before = $total;

        // Idempotent second call (same key) must return same total and not double-credit
        $res2 = $this->actingAs($user, 'sanctum')
            ->postJson('/api/claims/bulk-claim', [
                'investment_ids' => array_reverse($ids),
                'idempotency_key' => $key,
            ]);
        $res2->assertOk()->assertJson(['success' => true]);
        $this->assertEquals($before, $res2->json('data.total_claimed'));

        $user->refresh();
        $this->assertEquals($before, (float) $user->claimable_balance);
    }

    public function test_bulk_claim_rejects_when_not_claimable(): void
    {
        $user = User::factory()->create();
        $pkg = StakingPackage::create([
            'name' => 'Bronze',
            'daily_rate' => 0.01,
            'min_amount' => 10,
            'max_amount' => 100000,
            'duration_days' => 30,
            'max_duration_days' => 30,
            'level' => 'bronze',
            'is_active' => true,
            'is_discovery_bonus' => false,
            'features' => [],
            'sort_order' => 1,
        ]);
        $inv = Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $pkg->id,
            'amount' => 50,
            'daily_rate' => 0.01,
            'start_at' => now(),
            'status' => 'active',
            'source' => 'funds',
            'next_claim_at' => now()->addHour(),
            'bonus_multiplier' => 1.0,
            'claims_count' => 0,
            'total_claimed' => 0,
        ]);

        $res = $this->actingAs($user, 'sanctum')
            ->postJson('/api/claims/bulk-claim', [
                'investment_ids' => [$inv->id],
                'idempotency_key' => 'k-'.uniqid(),
            ]);
        $res->assertStatus(422)->assertJson(['success' => false]);
        $this->assertEquals(0.0, (float) $user->fresh()->claimable_balance);
    }
}
