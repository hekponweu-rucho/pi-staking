<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\StakingPackage;
use App\Models\Investment;
use App\Models\Claim;
use App\Models\WithdrawalRequest;
use App\Services\StakingService;

class StakingFlowTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function full_cycle_deposit_stake_accrual_claim_compound_withdrawal_request()
    {
        // Arrange: create user and package
        $user = User::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'username' => 'john_doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password'),
            'balance_pi' => 200,
            'current_level' => 'bronze',
        ]);

        $package = StakingPackage::create([
            'name' => 'Bronze',
            'description' => 'Standard staking',
            'daily_rate' => 0.008,
            'min_amount' => 10,
            'max_amount' => null,
            'duration_days' => 30,
            'level_requirement' => 'bronze',
            'is_active' => true,
            'is_discovery_bonus' => false,
            'max_concurrent' => 10,
            'features' => [
                'streak_bonus_eligible' => false,
            ],
            'sort_order' => 0,
        ]);

        // Act: create an investment of 100 PI from funds
        $service = app(StakingService::class);
        $investment = $service->createInvestment($user, $package, 100, 'funds');

        $this->assertEquals('active', $investment->status);
        $this->assertEquals(100.0, (float) $investment->amount);

        // Simulate next day by setting next_claim_at in the past
        $investment->update(['next_claim_at' => now()->subMinute()]);

        // Process claim directly
        $claimAmountBefore = $user->balance_pi;
        $claim = $investment->processClaim();
        $this->assertNotNull($claim);

        $investment->refresh();
        $user->refresh();

        $this->assertEquals(1, $investment->claims_count);
        $this->assertGreaterThan($claimAmountBefore, (float) $user->balance_pi);

        // Compound: reinvest claimed amount back into same package
        $compoundAmount = (float) $claim->final_amount;
        $service->createInvestment($user, $package, $compoundAmount, 'funds');

        $this->assertEquals(2, $user->investments()->count());

        // Create a withdrawal request of 20 PI
        $response = $this->actingAs($user)->postJson('/api/transactions/withdrawal', [
            'amount' => 20,
        ]);
        $response->assertStatus(201);

        $this->assertDatabaseHas('withdrawal_requests', [
            'user_id' => $user->id,
            'amount' => 20,
            'status' => 'pending',
        ]);
    }
}
