<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('address_id')->constrained('deposit_addresses')->cascadeOnDelete();
            $table->decimal('amount', 20, 8)->nullable();
            $table->string('tx_hash')->nullable()->unique();
            $table->enum('status', ['pending', 'confirmed', 'expired', 'failed'])->default('pending');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'user_id', 'address_id', 'tx_hash']);
        });

        // Optional check constraint for amount >= 0 when supported
        try {
            $driver = Schema::getConnection()->getDriverName();
            if (in_array($driver, ['mysql', 'pgsql', 'sqlite'])) {
                Schema::table('deposits', function (Blueprint $table) {
                    $table->check('amount IS NULL OR amount >= 0');
                });
            }
        } catch (\Throwable $e) {
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};