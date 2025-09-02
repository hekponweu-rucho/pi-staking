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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->onDelete('cascade'); // Parrain
            $table->foreignId('referred_id')->constrained('users')->onDelete('cascade'); // Filleul
            $table->integer('level')->default(1); // Niveau de parrainage (1, 2, 3...)
            $table->decimal('bonus_amount', 20, 8)->default(0); // Bonus accordé
            $table->boolean('bonus_paid')->default(false); // Bonus versé
            $table->timestamp('bonus_paid_at')->nullable();
            $table->enum('status', ['pending', 'qualified', 'paid', 'cancelled'])->default('pending');
            
            // Conditions de qualification
            $table->decimal('qualifying_investment', 20, 8)->nullable(); // Investissement qualifiant
            $table->timestamp('qualified_at')->nullable(); // Date de qualification
            $table->text('qualification_notes')->nullable();
            
            // Traçabilité
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Contrainte unique pour éviter les doublons
            $table->unique(['referrer_id', 'referred_id']);
            
            // Index
            $table->index(['referrer_id', 'status']);
            $table->index(['referred_id']);
            $table->index(['level']);
            $table->index(['bonus_paid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
