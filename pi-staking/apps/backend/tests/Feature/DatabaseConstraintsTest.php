<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Deposit;
use App\Models\Investment;
use App\Models\LedgerEntry;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\LedgerService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseConstraintsTest extends TestCase
{
    use RefreshDatabase;

    public function test_investment_amount_must_be_positive(): void
    {
        $user = User::factory()->create();
        $this->expectException(QueryException::class);
        Investment::create([
            'user_id' => $user->id,
            'staking_package_id' => 1,
            'amount' => 0,
            'daily_rate' => 0.01,
            'start_at' => now(),
            'status' => 'active',
            'source' => 'funds',
        ]);
    }

    public function test_withdrawal_request_amount_must_be_positive(): void
    {
        $user = User::factory()->create();
        $this->expectException(QueryException::class);
        WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => 0,
            'status' => 'pending',
        ]);
    }

    public function test_deposit_amount_must_be_positive_when_present(): void
    {
        $user = User::factory()->create();
        $addr = \App\Models\DepositAddress::create(['address' => 'ADDR-' . uniqid()]);
        $this->expectException(QueryException::class);
        Deposit::create([
            'user_id' => $user->id,
            'address_id' => $addr->id,
            'amount' => 0,
            'status' => 'pending',
        ]);
    }

    public function test_transactions_idempotency_key_is_unique(): void
    {
        $user = User::factory()->create();
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'deposit',
            'category' => 'deposit',
            'amount' => 10,
            'balance_before' => 0,
            'balance_after' => 10,
            'status' => 'completed',
            'idempotency_key' => 'k-abc',
        ]);

        $this->expectException(QueryException::class);
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'deposit',
            'category' => 'deposit',
            'amount' => 5,
            'balance_before' => 10,
            'balance_after' => 15,
            'status' => 'completed',
            'idempotency_key' => 'k-abc',
        ]);
    }

    public function test_deposits_tx_hash_is_unique(): void
    {
        $user = User::factory()->create();
        $addr = \App\Models\DepositAddress::create(['address' => 'ADDR-' . uniqid()]);
        Deposit::create([
            'user_id' => $user->id,
            'address_id' => $addr->id,
            'amount' => 5,
            'status' => 'confirmed',
            'tx_hash' => '0xabc',
        ]);

        $this->expectException(QueryException::class);
        Deposit::create([
            'user_id' => $user->id,
            'address_id' => $addr->id,
            'amount' => 7,
            'status' => 'confirmed',
            'tx_hash' => '0xabc',
        ]);
    }

    public function test_ledger_double_entry_two_balanced_lines_and_uniqueness(): void
    {
        $user = User::factory()->create();
        $ledger = app(LedgerService::class);

        $txn = Transaction::create([
            'user_id' => $user->id,
            'type' => 'bonus',
            'category' => 'bonus',
            'amount' => 0.5,
            'balance_before' => 0,
            'balance_after' => 0.5,
            'status' => 'completed',
        ]);

        $entries = $ledger->moveExternalToUser($user->id, 'principal', 0.5, 'bonus_grant', (string) $txn->id, [
            'transaction_id' => $txn->id,
        ]);

        $this->assertCount(2, $entries);
        $sum = LedgerEntry::where('transaction_id', $txn->id)->sum('delta');
        $this->assertEquals(0.0, (float) $sum);

        $this->expectException(QueryException::class);
        LedgerEntry::create([
            'user_id' => $user->id,
            'transaction_id' => $txn->id,
            'line_no' => 1,
            'account' => 'external',
            'delta' => -0.5,
            'currency' => 'PI',
            'reference_type' => 'bonus_grant',
            'reference_id' => (string) $txn->id,
            'occurred_at' => now(),
        ]);
    }
}
