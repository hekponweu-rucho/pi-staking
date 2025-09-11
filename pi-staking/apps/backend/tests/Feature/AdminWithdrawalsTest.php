<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminWithdrawalsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('admin');
    }

    public function test_admin_can_approve_withdrawal(): void
    {
        $admin = User::factory()->create(['email' => 'admin@example.com']);
        $admin->assignRole('admin');

        $user = User::factory()->create(['balance_pi' => 100.00]);
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'status' => 'pending',
        ]);

        $beforeBalance = $user->balance_pi;
        $user->decrement('balance_pi', 50.00);
        $txn = Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => -50.00,
            'balance_before' => $beforeBalance,
            'balance_after' => $beforeBalance - 50.00,
            'status' => 'pending',
            'withdrawal_request_id' => $withdrawal->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/admin/withdrawals/' . $withdrawal->id, [
                'action' => 'approve',
            ]);

        $response->assertOk();
        $this->assertEquals('approved', $withdrawal->fresh()->status);
        $this->assertEquals('completed', $txn->fresh()->status);
        $this->assertEquals($beforeBalance - 50.00, (float)$user->fresh()->balance_pi);
    }

    public function test_admin_can_reject_withdrawal_and_refund(): void
    {
        $admin = User::factory()->create(['email' => 'admin2@example.com']);
        $admin->assignRole('admin');

        $user = User::factory()->create(['balance_pi' => 80.00]);
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 30.00,
            'status' => 'pending',
        ]);

        $beforeBalance = $user->balance_pi;
        $user->decrement('balance_pi', 30.00);
        $txn = Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => -30.00,
            'balance_before' => $beforeBalance,
            'balance_after' => $beforeBalance - 30.00,
            'status' => 'pending',
            'withdrawal_request_id' => $withdrawal->id,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/admin/withdrawals/' . $withdrawal->id, [
                'action' => 'reject',
                'reason' => 'Invalid address',
            ]);

        $response->assertOk();
        $this->assertEquals('rejected', $withdrawal->fresh()->status);
        $this->assertEquals('rejected', $txn->fresh()->status);
        $this->assertEquals($beforeBalance, (float)$user->fresh()->balance_pi);
    }
}
