<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\StakingPackage;
use App\Models\BonusGrant;
use App\Models\Investment;

class BonusFlowTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function welcome_bonus_claim_and_discovery_investment_and_claim()
    {
        $user = User::create([
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'username' => 'alice',
            'email' => 'alice@example.com',
            'password' => bcrypt('password'),
            'balance_pi' => 0,
            'bonus_balance' => 0,
            'current_level' => 'discovery',
        ]);

        // Claim welcome bonus (50 Pi)
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/auth/claim-welcome-bonus');
        $response->assertStatus(200);

        $user->refresh();
        $this->assertTrue((bool) $user->welcome_bonus_claimed);
        $this->assertEquals(50.0, (float) $user->bonus_balance);
        $this->assertDatabaseHas('bonus_grants', [
            'user_id' => $user->id,
            'type' => 'welcome',
            'is_used' => false,
        ]);

        // Ensure discovery package exists
        $package = StakingPackage::create([
            'name' => 'Discovery',
            'description' => 'Package de découverte',
            'daily_rate' => 0.025,
            'min_amount' => 0,
            'max_amount' => null,
            'duration_days' => 30,
            'level_requirement' => 'discovery',
            'is_active' => true,
            'is_discovery_bonus' => true,
            'max_concurrent' => 1,
            'features' => [ 'uses_bonus_funds' => true ],
            'sort_order' => -10,
        ]);

        // Reinvest bonus into discovery
        $reinvest = $this->actingAs($user, 'sanctum')->postJson('/api/staking/reinvest-bonus');
        $reinvest->assertStatus(201);

        $user->refresh();
        $this->assertTrue((bool) $user->welcome_bonus_reinvested);
        $this->assertEquals(0.0, (float) $user->bonus_balance);

        $investment = Investment::first();
        $this->assertNotNull($investment);
        $this->assertEquals('bonus', $investment->source);
        $this->assertEquals('active', $investment->status);

        // Make the claim available and process it
        $investment->update(['next_claim_at' => now()->subMinute()]);
        $claim = $investment->processClaim();
        $this->assertNotNull($claim);
    }
}
