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
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investment_id')->constrained('investments')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('claimed_for_day'); // Jour pour lequel le claim est effectué
            $table->decimal('base_amount', 20, 8); // Montant de base calculé
            $table->decimal('bonus_amount', 20, 8)->default(0); // Bonus appliqués (streak, etc.)
            $table->decimal('final_amount', 20, 8); // Montant final crédité
            $table->timestamp('claimed_at'); // Moment exact du claim
            $table->enum('status', ['pending', 'processed', 'failed', 'cancelled'])->default('processed');
            
            // Détails du calcul
            $table->decimal('daily_rate_applied', 8, 6); // Taux appliqué
            $table->decimal('streak_bonus', 6, 4)->default(0); // Bonus streak appliqué
            $table->integer('streak_days')->default(0); // Nombre de jours de streak
            
            // Anti-fraude
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('session_id')->nullable();
            
            // Métadonnées
            $table->json('calculation_details')->nullable(); // Détails du calcul
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Contraintes uniques pour éviter double claim
            $table->unique(['investment_id', 'claimed_for_day'], 'unique_daily_claim');
            
            // Index pour performance
            $table->index(['user_id', 'claimed_for_day']);
            $table->index(['status']);
            $table->index(['claimed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claims');
    }
};
