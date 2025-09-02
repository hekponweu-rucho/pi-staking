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
        Schema::create('financial_metrics', function (Blueprint $table) {
            $table->id();
            $table->date('date'); // Date de la métrique
            $table->enum('period', ['daily', 'weekly', 'monthly'])->default('daily');
            
            // Métriques financières principales
            $table->decimal('total_user_balance', 20, 8)->default(0); // Solde total des utilisateurs
            $table->decimal('total_staked_amount', 20, 8)->default(0); // Montant total staké
            $table->decimal('total_claimed_today', 20, 8)->default(0); // Total claimé aujourd'hui
            $table->decimal('total_withdrawn_today', 20, 8)->default(0); // Total retiré aujourd'hui
            $table->decimal('total_deposited_today', 20, 8)->default(0); // Total déposé aujourd'hui
            
            // Ratios de risque
            $table->decimal('liquidity_ratio', 8, 6)->default(0); // Ratio de liquidité
            $table->decimal('payout_ratio', 8, 6)->default(0); // Ratio de distribution
            $table->decimal('reserve_ratio', 8, 6)->default(0); // Ratio de réserve
            
            // Métriques utilisateurs
            $table->integer('active_users_count')->default(0); // Utilisateurs actifs
            $table->integer('new_users_count')->default(0); // Nouveaux utilisateurs
            $table->integer('total_investments_count')->default(0); // Nombre d'investissements actifs
            
            // Métriques par niveau
            $table->json('level_distribution')->nullable(); // Distribution par niveau
            $table->json('staking_by_level')->nullable(); // Staking par niveau
            
            // Alertes et seuils
            $table->enum('risk_level', ['GREEN', 'ORANGE', 'RED', 'EMERGENCY'])->default('GREEN');
            $table->json('triggered_alerts')->nullable(); // Alertes déclenchées
            
            // Métadonnées
            $table->json('raw_data')->nullable(); // Données brutes de calcul
            $table->timestamp('calculated_at'); // Moment du calcul
            
            $table->timestamps();
            
            // Contrainte unique par date et période
            $table->unique(['date', 'period']);
            
            // Index
            $table->index(['date']);
            $table->index(['risk_level']);
            $table->index(['calculated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_metrics');
    }
};
