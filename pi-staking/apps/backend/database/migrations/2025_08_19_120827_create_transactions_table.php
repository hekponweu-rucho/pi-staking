<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('transactions', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

        $table->enum('type', ['deposit', 'withdrawal', 'claim', 'bonus', 'referral', 'adjustment', 'fee']); 
        $table->enum('category', ['staking', 'referral', 'bonus', 'withdrawal', 'deposit', 'fee', 'adjustment']);

        $table->decimal('amount', 20, 8);
        $table->decimal('balance_before', 20, 8);
        $table->decimal('balance_after', 20, 8);

        $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'])->default('pending');

        // Références
        $table->string('reference_id', 100)->unique(); // limite la taille
        $table->string('external_reference')->nullable();
        $table->string('transaction_hash')->nullable();

        // Relations optionnelles
        $table->foreignId('investment_id')->nullable()->constrained('investments')->nullOnDelete();
        $table->foreignId('claim_id')->nullable()->constrained('claims')->nullOnDelete();
        $table->foreignId('withdrawal_request_id')->nullable()->constrained('withdrawal_requests')->nullOnDelete();

        // Métadonnées
        $table->json('metadata')->nullable();
        $table->text('description')->nullable();
        $table->text('admin_notes')->nullable();

        // Traçabilité
        $table->timestamp('processed_at')->nullable();
        $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();

        $table->timestamps();

        // Index
        $table->index(['user_id', 'type']);
        $table->index(['status']);
        $table->index(['reference_id']);
        $table->index(['external_reference']);
        $table->index(['processed_at']);
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
