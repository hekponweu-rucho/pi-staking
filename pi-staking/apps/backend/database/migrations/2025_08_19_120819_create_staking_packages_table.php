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
        Schema::create('staking_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->decimal('daily_rate', 8, 6); // Ex: 0.025000 pour 2.5%
            $table->decimal('min_amount', 20, 8)->default(0);
            $table->decimal('max_amount', 20, 8)->nullable();
            $table->integer('duration_days')->default(365); // Durée en jours
            $table->enum('level_requirement', ['discovery', 'bronze', 'silver', 'gold', 'diamond'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_discovery_bonus')->default(false); // Pour le bonus découverte
            $table->integer('max_concurrent')->nullable(); // Nombre max d'investissements simultanés
            $table->json('features')->nullable(); // Fonctionnalités spéciales
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            // Index
            $table->index(['is_active']);
            $table->index(['level_requirement']);
            $table->index(['is_discovery_bonus']);
            $table->index(['sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staking_packages');
    }
};
