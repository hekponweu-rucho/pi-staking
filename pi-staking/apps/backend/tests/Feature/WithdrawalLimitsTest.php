<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use App\Models\User;
use App\Models\WithdrawalRequest;

class WithdrawalLimitsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('admin');
    }

    public function test_minimum_withdrawal_is_2_pi(): void
    {
        $user = User::factory()->create([
            'balance_pi' => 100,
            'current_level' => 'bronze',
        ]);

        $res = $this->actingAs($user, 'sanctum')
            ->postJson('/api/transactions/withdrawal', [
                'amount' => 1.99,
                'withdrawal_address' => 'ADDR',
            ]);

        $res->assertStatus(422);
        $this->assertStringContainsString('2 Pi', $res->json('errors.amount.0'));
    }

    public function test_daily_cap_by_level_is_enforced(): void
    {
        $user = User::factory()->create([
            'balance_pi' => 100,
            'current_level' => 'bronze',
        ]);

        // Simulate an approved withdrawal earlier today of 19 Pi (cap for bronze: 20)
        WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 19.0,
            'status' => 'approved',
            'processed_at' => now(),
        ]);

        $res = $this->actingAs($user, 'sanctum')
            ->postJson('/api/transactions/withdrawal', [
                'amount' => 2.0,
                'withdrawal_address' => 'ADDR',
            ]);

        $res->assertStatus(422);
        $this->assertStringContainsString('Limite quotidienne', $res->json('message'));
    }
}
