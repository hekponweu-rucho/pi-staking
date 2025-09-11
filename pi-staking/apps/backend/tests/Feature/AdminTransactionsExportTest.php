<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminTransactionsExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('admin');
    }

    public function test_admin_can_export_transactions_as_csv(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();
        Transaction::factory()->create([
            'user_id' => $user->id,
            'type' => 'deposit',
            'status' => 'completed',
            'amount' => 100.00,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->get('/api/admin/transactions/export');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv');
        $this->assertStringContainsString('ID,Date,Utilisateur,Email,Type,Montant,Statut,Description,Référence', $response->streamedContent());
    }
}
