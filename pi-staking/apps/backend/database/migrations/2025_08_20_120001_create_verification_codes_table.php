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
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('method', ['email', 'sms', 'voice', 'push'])->index(); // Méthode d'envoi
            $table->string('code'); // Code hashé
            $table->string('action', 100)->index(); // withdrawal, login_verification, etc.
            $table->decimal('amount', 15, 8)->nullable(); // Montant si applicable (pour retraits)
            $table->timestamp('expires_at')->index(); // Date d'expiration
            $table->timestamp('used_at')->nullable()->index(); // Date d'utilisation
            $table->tinyInteger('attempts')->default(0); // Nombre de tentatives
            $table->tinyInteger('max_attempts')->default(3); // Nombre max de tentatives
            $table->json('metadata')->nullable(); // Métadonnées (IP, user agent, etc.)
            $table->timestamps();

            // Index composites pour optimiser les requêtes
            $table->index(['user_id', 'method', 'action', 'expires_at'], 'user_method_action_expires');
            $table->index(['user_id', 'action', 'used_at']);
            $table->index(['expires_at', 'used_at']); // Pour le nettoyage
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};