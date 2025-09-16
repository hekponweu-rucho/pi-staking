<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use App\Models\User;
use App\Models\StakingPackage;
use App\Models\Investment;
use App\Support\Rate;

class RateMigrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('admin');
    }

    public function test_migration_updates_active_investments_and_applies_new_rate_on_next_claim(): void
    {
        $user = User::factory()->create([
            'balance_pi' => 0,
            'claimable_balance' => 0,
            'current_level' => 'bronze',
        ]);

        $pkg = StakingPackage::create([
            'name' => 'Bronze',
            'description' => 'Test package',
            'daily_rate' => 0.01, // divergent
            'min_amount' => 0,
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

        $inv = Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $pkg->id,
            'amount' => 100,
            'daily_rate' => 0.01,
            'start_at' => now()->subDays(2),
            'end_at' => now()->addDays(28),
            'status' => 'active',
            'source' => 'funds',
            'next_claim_at' => now()->subMinute(),
            'bonus_multiplier' => 1.0,
        ]);

        \Artisan::call('staking:migrate-rates', ['--dry-run' => true]);
        $this->assertEquals(0.01, (float) $inv->fresh()->daily_rate);

        \Artisan::call('staking:migrate-rates');
        $newRate = Rate::dailyRateFromApy((float) config('staking.apy.bronze', 0.04), (string) config('staking.rate_mode', 'simple'));
        $this->assertEqualsWithDelta($newRate, (float) $inv->fresh()->daily_rate, 1e-12);

        // Process next claim and verify amount matches new rate
        \Artisan::call('staking:process-daily-earnings');
        $user->refresh();
        $this->assertEqualsWithDelta(100 * $newRate, (float) $user->claimable_balance, 1e-8);
    }
}
