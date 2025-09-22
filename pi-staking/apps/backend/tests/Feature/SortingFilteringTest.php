<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SortingFilteringTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_transactions_sort_and_filter_secure(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        // Seed transactions for two users
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();
        Transaction::factory()->count(2)->create(['user_id' => $u1->id, 'amount' => 10, 'status' => 'completed']);
        Transaction::factory()->count(3)->create(['user_id' => $u2->id, 'amount' => 50, 'status' => 'pending']);

        // Sort by amount desc
        $res = $this->actingAs($admin)->getJson('/api/admin/transactions?sort=amount&order=desc&per_page=5');
        $res->assertOk();
        $data = $res->json('data');
        $this->assertGreaterThanOrEqual($data[1]['amount'], $data[0]['amount']);

        // Filter by user_id
        $res2 = $this->actingAs($admin)->getJson('/api/admin/transactions?user_id='.$u1->id);
        $res2->assertOk();
        foreach ($res2->json('data') as $row) {
            $this->assertSame($u1->id, $row['user_id']);
        }

        // Invalid sort should default to created_at and not error
        $res3 = $this->actingAs($admin)->getJson('/api/admin/transactions?sort=foo\'--&order=asc');
        $res3->assertOk();
    }

    public function test_user_transactions_filter_by_type_and_date(): void
    {
        $user = User::factory()->create();
        Transaction::factory()->create(['user_id' => $user->id, 'type' => 'deposit', 'created_at' => now()->subDays(5)]);
        Transaction::factory()->create(['user_id' => $user->id, 'type' => 'withdrawal', 'created_at' => now()->subDays(1)]);

        $res = $this->actingAs($user)->getJson('/api/transactions?type=withdrawal&start_date='.now()->subDays(2)->toDateString());
        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('withdrawal', $res->json('data.0.type'));
    }
}
