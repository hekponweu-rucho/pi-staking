<?php

namespace Tests\Feature;

use App\Models\Investment;
use App\Models\LedgerEntry;
use App\Models\StakingPackage;
use App\Models\User;
use App\Services\ClaimService;
use App\Services\LedgerService;
use Tests\TestCase;

class LedgerTest extends TestCase
{
    public function test_double_entry_sum_zero(): void
    {
        $user = User::factory()->create();
        $ledger = app(LedgerService::class);
        $refId = 'REF-TEST-1';

        $ledger->moveExternalToUser($user->id, 'principal', 100, 'test_tx', $refId);

        $sum = LedgerEntry::where('reference_type', 'test_tx')->where('reference_id', $refId)->sum('delta');
        $this->assertEquals(0.0, (float) $sum);
    }

    public function test_claim_posting_is_balanced(): void
    {
        $user = User::factory()->create();
        $pkg = StakingPackage::create([
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
        $inv = Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => $pkg->id,
            'amount' => 100,
            'daily_rate' => 0.001,
            'start_at' => now()->subDay(),
            'status' => 'active',
            'source' => 'funds',
            'next_claim_at' => now()->subMinute(),
            'bonus_multiplier' => 1.0,
            'claims_count' => 0,
            'total_claimed' => 0,
        ]);

        $claim = app(ClaimService::class)->processClaim($user, $inv, now()->toDateString());

        $sum = LedgerEntry::where('reference_type', 'claim')->where('reference_id', (string) $claim->id)->sum('delta');
        $this->assertEquals(0.0, (float) $sum);
    }
}
