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

        $user = User::factory()->create(['balance_pi' => 100.00, 'pending_withdrawal' => 0]);
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'status' => 'pending',
        ]);

        $beforeBalance = (float) $user->balance_pi;
        $user->increment('pending_withdrawal', 50.00);
        $txn = Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => 0,
            'balance_before' => $beforeBalance,
            'balance_after' => $beforeBalance,
            'status' => 'pending',
            'withdrawal_request_id' => $withdrawal->id,
            'description' => 'Demande de retrait (réservation)',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/admin/withdrawals/' . $withdrawal->id, [
                'action' => 'approve',
            ]);

        $response->assertOk();
        $freshUser = $user->fresh();
        $freshTxn = $txn->fresh();
        $this->assertEquals('approved', $withdrawal->fresh()->status);
        $this->assertEquals('completed', $freshTxn->status);
        $this->assertEquals(-50.00, (float) $freshTxn->amount);
        $this->assertEquals($beforeBalance - 50.00, (float)$freshUser->balance_pi);
        $this->assertEquals(0.0, (float)$freshUser->pending_withdrawal);
    }

    public function test_admin_can_reject_withdrawal_and_refund(): void
    {
        $admin = User::factory()->create(['email' => 'admin2@example.com']);
        $admin->assignRole('admin');

        $user = User::factory()->create(['balance_pi' => 80.00, 'pending_withdrawal' => 0]);
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 30.00,
            'status' => 'pending',
        ]);

        $beforeBalance = (float) $user->balance_pi;
        $user->increment('pending_withdrawal', 30.00);
        $txn = Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdrawal',
            'category' => 'withdrawal',
            'amount' => 0,
            'balance_before' => $beforeBalance,
            'balance_after' => $beforeBalance,
            'status' => 'pending',
            'withdrawal_request_id' => $withdrawal->id,
            'description' => 'Demande de retrait (réservation)',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson('/api/admin/withdrawals/' . $withdrawal->id, [
                'action' => 'reject',
                'reason' => 'Invalid address',
            ]);

        $response->assertOk();
        $freshUser = $user->fresh();
        $freshTxn = $txn->fresh();
        $this->assertEquals('rejected', $withdrawal->fresh()->status);
        $this->assertEquals('rejected', $freshTxn->status);
        $this->assertEquals(0.0, (float)$freshUser->pending_withdrawal);
        $this->assertEquals($beforeBalance, (float)$freshUser->balance_pi);
    }
}
