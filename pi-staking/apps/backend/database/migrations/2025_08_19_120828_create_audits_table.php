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
        Schema::create('audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('set null'); // Qui a effectué l'action
            $table->string('action', 100); // Type d'action
            $table->string('auditable_type'); // Type d'entité concernée
            $table->unsignedBigInteger('auditable_id')->nullable(); // ID de l'entité
            $table->string('event'); // Événement (created, updated, deleted, etc.)
            
            // Données avant/après
            $table->json('old_values')->nullable(); // Anciennes valeurs
            $table->json('new_values')->nullable(); // Nouvelles valeurs
            
            // Contexte de l'action
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('session_id')->nullable();
            $table->string('request_id')->nullable(); // ID de requête pour traçage
            
            // Risque et sécurité
            $table->enum('risk_level', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])->default('LOW');
            $table->boolean('requires_review')->default(false);
            $table->boolean('is_suspicious')->default(false);
            
            // Métadonnées
            $table->json('metadata')->nullable(); // Données supplémentaires
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Index pour performance
            $table->index(['actor_id', 'action']);
            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['event']);
            $table->index(['risk_level']);
            $table->index(['requires_review']);
            $table->index(['is_suspicious']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audits');
    }
};
