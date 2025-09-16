<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\StakingPackage;
use App\Models\Investment;

class ProcessDailyEarningsPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_performance_with_thousands_of_investments(): void
    {
        $this->markTestSkipped('Performance test - enable manually when running locally.');

        $user = \App\Models\User::factory()->create();
        $package = StakingPackage::create([
            'name' => 'Perf',
            'description' => 'Perf package',
            'daily_rate' => 0.01,
            'min_amount' => 1,
            'max_amount' => null,
            'duration_days' => 365,
            'level' => 'bronze',
            'is_active' => true,
            'is_discovery_bonus' => false,
            'max_concurrent' => null,
            'sort_order' => 1,
        ]);

        $now = now();
        $records = [];
        for ($i = 0; $i < 5000; $i++) {
            $records[] = [
                'user_id' => $user->id,
                'staking_package_id' => $package->id,
                'amount' => 10,
                'daily_rate' => 0.01,
                'start_at' => $now,
                'end_at' => null,
                'status' => 'active',
                'source' => 'funds',
                'next_claim_at' => $now,
                'bonus_multiplier' => 1.0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        Investment::insert($records);

        $start = microtime(true);
        $this->artisan('staking:process-daily-earnings')->assertExitCode(0);
        $duration = (microtime(true) - $start) * 1000;

        $this->assertLessThan(60000, $duration, 'Daily earnings processing took too long');
    }
}
