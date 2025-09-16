<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Investment;
use App\Models\StakingPackage;
use App\Models\User;
use App\Services\ClaimService;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ClaimIdempotenceTest extends TestCase
{
    public function test_double_claim_same_day_is_prevented(): void
    {
        $user = User::factory()->create();
        $package = StakingPackage::create([
            'name' => 'Bronze',
            'daily_rate' => 0.001,
            'min_amount' => 10,
            'max_amount' => null,
            'duration_days' => 365,
            'level' => 'bronze',
            'is_active' => true,
            'is_discovery_bonus' => false,
            'features' => [],
            'sort_order' => 1,
        ]);

        $investment = Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $package->id,
            'amount' => 100,
            'daily_rate' => 0.001,
            'start_at' => now()->subDay(),
            'end_at' => null,
            'status' => 'active',
            'source' => 'funds',
            'next_claim_at' => now()->subMinute(),
            'bonus_multiplier' => 1.0,
            'claims_count' => 0,
            'total_claimed' => 0,
        ]);

        $service = app(ClaimService::class);
        $date = now()->toDateString();

        $claim1 = $service->processClaim($user, $investment, $date);
        $claim2 = $service->processClaim($user, $investment, $date);

        $this->assertInstanceOf(Claim::class, $claim1);
        $this->assertInstanceOf(Claim::class, $claim2);

        $this->assertEquals(1, Claim::where('investment_id', $investment->id)->where('claimed_for_day', $date)->count());

        $expected = round(100 * 0.001, 8);
        $user->refresh();
        $this->assertEquals($expected, (float) $user->claimable_balance);
    }
}
