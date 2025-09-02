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
        Schema::create('system_alerts', function (Blueprint $table) {
            $table->id();
            $table->enum('level', ['INFO', 'WARNING', 'ERROR', 'CRITICAL', 'EMERGENCY']);
            $table->enum('category', ['financial', 'security', 'performance', 'user_activity', 'system', 'fraud']);
            $table->string('title', 255); // Titre de l'alerte
            $table->text('message'); // Message détaillé
            $table->text('recommendation')->nullable(); // Recommandation d'action
            
            // Contexte et données
            $table->json('context_data')->nullable(); // Données contextuelles
            $table->decimal('threshold_value', 20, 8)->nullable(); // Valeur de seuil déclenchée
            $table->decimal('current_value', 20, 8)->nullable(); // Valeur actuelle
            
            // État de l'alerte
            $table->enum('status', ['new', 'acknowledged', 'investigating', 'resolved', 'ignored'])->default('new');
            $table->timestamp('triggered_at'); // Moment de déclenchement
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            
            // Gestion des utilisateurs
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('resolution_notes')->nullable();
            
            // Notifications
            $table->json('notification_channels')->nullable(); // Canaux de notification
            $table->boolean('email_sent')->default(false);
            $table->boolean('slack_sent')->default(false);
            $table->boolean('sms_sent')->default(false);
            
            // Références optionnelles
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Utilisateur concerné
            $table->foreignId('financial_metric_id')->nullable()->constrained('financial_metrics')->onDelete('set null');
            
            $table->timestamps();
            
            // Index
            $table->index(['level', 'status']);
            $table->index(['category']);
            $table->index(['triggered_at']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_alerts');
    }
};
