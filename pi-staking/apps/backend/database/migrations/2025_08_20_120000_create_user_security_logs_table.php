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
        Schema::create('user_security_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('action', 100)->index(); // Type d'action (login, 2fa_setup, withdrawal, etc.)
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('location', 255)->nullable(); // Pays/Ville détectée
            $table->string('device_type', 50)->nullable(); // Mobile, Desktop, Tablet
            $table->json('metadata')->nullable(); // Données additionnelles
            $table->decimal('risk_score', 3, 2)->default(0)->index(); // Score de risque 0-1
            $table->enum('status', ['normal', 'flagged', 'reviewed'])->default('normal');
            $table->timestamp('created_at');
            $table->timestamp('updated_at')->nullable();

            // Index composites pour optimiser les requêtes
            $table->index(['user_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index(['risk_score', 'created_at']);
            $table->index(['ip_address', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_security_logs');
    }
};