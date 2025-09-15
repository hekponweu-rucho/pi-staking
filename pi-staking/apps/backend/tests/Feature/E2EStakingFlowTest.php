<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\DepositAddress;
use App\Models\WithdrawalRequest;
use App\Models\Investment;
use App\Models\StakingPackage;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class E2EStakingFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('admin');
    }

    public function test_funds_flow_end_to_end(): void
    {
        $admin = User::factory()->create(['email' => 'admin@example.com']);
        $admin->assignRole('admin');

        $user = User::factory()->create([
            'balance_pi' => 0,
            'bonus_balance' => 0,
            'claimable_balance' => 0,
            'claimable_bonus_balance' => 0,
            'pending_withdrawal' => 0,
        ]);

        // Packages
        $bronze = StakingPackage::create([
            'name' => 'Bronze',
            'description' => 'Standard funds package',
            'daily_rate' => 0.01,
            'min_amount' => 10,
            'max_amount' => 100000,
            'duration_days' => 30,
            'max_duration_days' => 30,
            'level' => 'bronze',
            'is_active' => true,
            'is_discovery_bonus' => false,
            'max_concurrent' => 5,
            'features' => [],
            'sort_order' => 1,
        ]);

        // Provision a deposit address
        $addr = DepositAddress::create([
            'address' => 'TST_ADDR_1',
            'is_active' => true,
        ]);

        // User requests a deposit address
        $res = $this->actingAs($user, 'sanctum')
            ->postJson('/api/deposit/request');
        $res->assertOk();
        $depositId = $res->json('data.id');

        // Admin confirms deposit (credits balance)
        $confirm = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/deposits/{$depositId}/confirm", [
                'amount' => 100,
                'tx_hash' => 'tx_funds_flow_'.uniqid(),
            ]);
        $confirm->assertOk();
        $this->assertEquals(100.0, (float) $user->fresh()->balance_pi);

        // Stake 50 from funds
        $stake = $this->actingAs($user, 'sanctum')
            ->postJson('/api/staking/invest', [
                'staking_package_id' => $bronze->id,
                'amount' => 50,
                'source' => 'funds',
            ]);
        $stake->assertCreated();
        /** @var Investment $investment */
        $investment = Investment::latest('id')->first();
        $this->assertNotNull($investment);
        $this->assertEquals('funds', $investment->source);
        $this->assertEquals(50.0, (float) $investment->amount);
        $this->assertEquals(50.0, (float) $user->fresh()->balance_pi);

        // Make claim available now and run daily earnings (idempotent)
        $investment->update([
            'start_at' => now()->subDay(),
            'next_claim_at' => now()->subMinute(),
        ]);

        \Artisan::call('staking:process-daily-earnings');
        $user->refresh();
        $this->assertEquals(0.5, (float) $user->claimable_balance);
        $this->assertEquals(0.0, (float) $user->claimable_bonus_balance);

        // Re-run (idempotence)
        \Artisan::call('staking:process-daily-earnings');
        $this->assertEquals(0.5, (float) $user->fresh()->claimable_balance);

        // Reinvest from claimable into Bronze
        $reinvest = $this->actingAs($user, 'sanctum')
            ->postJson('/api/staking/reinvest', [
                'staking_package_id' => $bronze->id,
                'amount' => 0.5,
                'source' => 'claimable',
            ]);
        $reinvest->assertCreated();
        $user->refresh();
        $this->assertEquals(0.0, (float) $user->claimable_balance);

        // Create a withdrawal request by reserving funds (simulate request API)
        $this->assertEquals(50.0, (float) $user->balance_pi);
        $amountW = 10.0;
        $beforePending = (float) $user->pending_withdrawal;
        $user->increment('pending_withdrawal', $amountW);
        $wr = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => $amountW,
            'status' => 'pending',
        ]);
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => 0,
            'balance_before' => $user->balance_pi,
            'balance_after' => $user->balance_pi,
            'status' => 'pending',
            'withdrawal_request_id' => $wr->id,
            'description' => 'Demande de retrait (réservation)',
            'metadata' => [
                'reserved_amount' => $amountW,
                'pending_before' => $beforePending,
                'pending_after' => $beforePending + $amountW,
            ],
        ]);

        // Admin approves -> debit definitive
        $approve = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/withdrawals/{$wr->id}", [
                'action' => 'approve',
            ]);
        $approve->assertOk();
        $user->refresh();
        $this->assertEquals(40.0, (float) $user->balance_pi);
        $this->assertEquals(0.0, (float) $user->pending_withdrawal);

        // New reservation then reject -> funds unlocked
        $user->increment('pending_withdrawal', 5.0);
        $wr2 = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 5.0,
            'status' => 'pending',
        ]);
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => 0,
            'balance_before' => $user->balance_pi,
            'balance_after' => $user->balance_pi,
            'status' => 'pending',
            'withdrawal_request_id' => $wr2->id,
        ]);
        $reject = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/withdrawals/{$wr2->id}", [
                'action' => 'reject',
                'reason' => 'manual_test',
            ]);
        $reject->assertOk();
        $user->refresh();
        $this->assertEquals(40.0, (float) $user->balance_pi);
        $this->assertEquals(0.0, (float) $user->pending_withdrawal);
    }

    public function test_bonus_flow_end_to_end(): void
    {
        $admin = User::factory()->create(['email' => 'admin2@example.com']);
        $admin->assignRole('admin');

        $user = User::factory()->create([
            'balance_pi' => 0,
            'bonus_balance' => 0,
            'claimable_balance' => 0,
            'claimable_bonus_balance' => 0,
            'pending_withdrawal' => 0,
            'welcome_bonus_claimed' => false,
            'welcome_bonus_reinvested' => false,
        ]);

        // Discovery package
        $discovery = StakingPackage::create([
            'name' => 'Discovery',
            'description' => 'Discovery-only (bonus)',
            'daily_rate' => 0.025,
            'min_amount' => 0,
            'max_amount' => 100000,
            'duration_days' => 30,
            'max_duration_days' => 30,
            'level' => 'discovery',
            'is_active' => true,
            'is_discovery_bonus' => true,
            'max_concurrent' => 1,
            'features' => ['uses_bonus_funds' => true],
            'sort_order' => -10,
        ]);

        // Claim welcome bonus
        $claimBonus = $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/claim-welcome-bonus');
        $claimBonus->assertOk();
        $this->assertEquals(50.0, (float) $user->fresh()->bonus_balance);

        // Stake discovery using bonus
        $stake = $this->actingAs($user, 'sanctum')
            ->postJson('/api/staking/invest', [
                'staking_package_id' => $discovery->id,
                'amount' => 50,
                'source' => 'bonus',
            ]);
        $stake->assertCreated();
        $investment = Investment::latest('id')->first();
        $this->assertEquals('bonus', $investment->source);
        $this->assertEquals(0.0, (float) $user->fresh()->bonus_balance);

        // Make claim available and process scheduler
        $investment->update([
            'start_at' => now()->subDay(),
            'next_claim_at' => now()->subMinute(),
        ]);
        \Artisan::call('staking:process-daily-earnings');
        $user->refresh();
        $expected = round(50 * 0.025, 8);
        $this->assertEquals($expected, (float) $user->claimable_bonus_balance);

        // Reinvest from claimable_bonus -> compound into existing bonus investment
        $rein = $this->actingAs($user, 'sanctum')
            ->postJson('/api/staking/reinvest', [
                'staking_package_id' => $discovery->id,
                'amount' => $expected,
                'source' => 'claimable_bonus',
            ]);
        $rein->assertCreated();
        $user->refresh();
        $this->assertEquals(0.0, (float) $user->claimable_bonus_balance);
        $this->assertEquals(50 + $expected, (float) $investment->fresh()->amount);

        // Reserve withdrawal and admin reject (to test unlock)
        $user->increment('pending_withdrawal', 5.0);
        $wr = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 5.0,
            'status' => 'pending',
        ]);
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => 0,
            'balance_before' => $user->balance_pi,
            'balance_after' => $user->balance_pi,
            'status' => 'pending',
            'withdrawal_request_id' => $wr->id,
        ]);
        $rej = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/withdrawals/{$wr->id}", [
                'action' => 'reject',
                'reason' => 'manual_test',
            ]);
        $rej->assertOk();
        $this->assertEquals(0.0, (float) $user->fresh()->pending_withdrawal);
    }
}
