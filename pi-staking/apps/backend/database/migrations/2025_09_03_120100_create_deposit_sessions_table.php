<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposit_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('deposit_address_id')->constrained('deposit_addresses')->onDelete('cascade');
            $table->string('memo')->unique();
            $table->decimal('amount_requested', 20, 8)->nullable();
            $table->enum('status', ['pending','confirmed','expired','cancelled'])->default('pending');
            $table->unsignedInteger('confirmations_required')->default(1);
            $table->unsignedInteger('confirmations')->default(0);
            $table->decimal('credited_amount', 20, 8)->nullable();
            $table->string('tx_hash')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id','status']);
            $table->index(['expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposit_sessions');
    }
};
