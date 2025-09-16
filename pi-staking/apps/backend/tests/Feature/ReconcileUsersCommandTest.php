<?php

namespace Tests\Feature;

use App\Models\Investment;
use App\Models\StakingPackage;
use App\Models\User;
use App\Services\ClaimService;
use App\Services\LedgerService;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ReconcileUsersCommandTest extends TestCase
{
    public function test_reconcile_reports_no_diff_after_standard_ops(): void
    {
        $user = User::factory()->create();
        $ledger = app(LedgerService::class);

        $ledger->moveExternalToUser($user->id, 'principal', 120, 'deposit', 'D1');
        $user->increment('balance_pi', 120);

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
        $inv = app(\App\Services\StakingService::class)->createInvestment($user, $pkg, 50, 'funds');

        $claim = app(ClaimService::class)->processClaim($user, $inv, now()->toDateString());

        $ledger->move($user->id, 'principal', $user->id, 'pending_withdrawal', 10, 'withdrawal_request', 'W1');
        $user->increment('pending_withdrawal', 10);

        Artisan::call('finance:reconcile-users --dry-run');
        $output = Artisan::output();
        $this->assertStringContainsString('Aucun écart', $output);
    }
}
