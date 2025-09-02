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
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('action', ['daily_claim', 'investment', 'referral', 'streak_milestone', 'special_event', 'bonus_redemption']);
            $table->integer('points_earned')->default(0); // Points gagnés
            $table->integer('points_spent')->default(0); // Points dépensés
            $table->integer('points_balance')->default(0); // Solde des points
            $table->text('description')->nullable(); // Description de l'action
            
            // Références optionnelles
            $table->foreignId('investment_id')->nullable()->constrained('investments')->onDelete('set null');
            $table->foreignId('claim_id')->nullable()->constrained('claims')->onDelete('set null');
            $table->foreignId('referral_id')->nullable()->constrained('referrals')->onDelete('set null');
            
            // Métadonnées
            $table->json('metadata')->nullable(); // Détails supplémentaires
            
            $table->timestamps();
            
            // Index
            $table->index(['user_id', 'action']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_points');
    }
};
