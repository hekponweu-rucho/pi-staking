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
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('amount', 20, 8); // Montant demandé
            $table->decimal('fee_amount', 20, 8)->default(0); // Frais de retrait
            $table->decimal('net_amount', 20, 8); // Montant net à recevoir
            $table->enum('status', ['pending', 'reviewing', 'approved', 'processing', 'completed', 'rejected', 'cancelled']);
            
            // Adresse de destination
            $table->string('destination_address')->nullable();
            $table->string('destination_type')->nullable(); // wallet, exchange, etc.
            
            // Traçabilité administrateur
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Transaction blockchain
            $table->string('transaction_hash')->nullable();
            $table->integer('confirmation_count')->default(0);
            $table->boolean('is_confirmed')->default(false);
            
            // Raison en cas de rejet
            $table->text('rejection_reason')->nullable();
            $table->text('admin_notes')->nullable();
            
            // Métadonnées de sécurité
            $table->ipAddress('request_ip')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('security_checks')->nullable(); // Résultats des vérifications
            
            $table->timestamps();
            
            // Index
            $table->index(['user_id', 'status']);
            $table->index(['status']);
            $table->index(['reviewed_at']);
            $table->index(['processed_at']);
            $table->index(['transaction_hash']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};
