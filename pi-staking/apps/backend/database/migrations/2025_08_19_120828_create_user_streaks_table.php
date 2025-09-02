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
        Schema::create('user_streaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['daily_claim', 'login', 'investment']);
            $table->integer('current_streak')->default(0); // Streak actuel
            $table->integer('longest_streak')->default(0); // Plus long streak
            $table->date('last_activity_date')->nullable(); // Dernière activité
            $table->timestamp('streak_started_at')->nullable(); // Début du streak actuel
            $table->timestamp('streak_broken_at')->nullable(); // Dernière interruption
            
            // Bonus appliqués
            $table->decimal('current_bonus_rate', 6, 4)->default(0); // Bonus actuel (ex: 0.0500 pour 5%)
            $table->integer('milestone_reached')->default(0); // Dernier palier atteint
            
            // Métadonnées
            $table->json('milestones_history')->nullable(); // Historique des paliers
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Contrainte unique par utilisateur et type
            $table->unique(['user_id', 'type']);
            
            // Index
            $table->index(['type', 'current_streak']);
            $table->index(['last_activity_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_streaks');
    }
};
