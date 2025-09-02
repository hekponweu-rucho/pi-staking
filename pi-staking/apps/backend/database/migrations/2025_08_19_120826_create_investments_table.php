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
    Schema::create('investments', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('staking_package_id')->constrained('staking_packages')->onDelete('restrict');
        $table->decimal('amount', 20, 8);
        $table->decimal('daily_rate', 8, 6);

        // Dates de staking
        $table->dateTime('start_at');
        $table->dateTime('end_at')->nullable();

        $table->enum('status', ['active', 'completed', 'cancelled', 'paused'])->default('active');
        $table->enum('source', ['funds', 'bonus', 'referral'])->default('funds');

        // Suivi des claims
        $table->timestamp('last_claim_at')->nullable();
        $table->decimal('total_claimed', 20, 8)->default(0);
        $table->integer('claims_count')->default(0);
        $table->timestamp('next_claim_at')->nullable();

        // Gamification
        $table->boolean('has_bonus_applied')->default(false);
        $table->decimal('bonus_multiplier', 6, 4)->default(1.0000);

        // Métadonnées
        $table->json('metadata')->nullable();
        $table->text('notes')->nullable();

        $table->timestamps();

        // Index
        $table->index(['user_id', 'status']);
        $table->index(['status', 'end_at']);
        $table->index(['source']);
        $table->index(['last_claim_at']);
        $table->index(['next_claim_at']);
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
