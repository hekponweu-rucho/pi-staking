<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staking_packages', function (Blueprint $table) {
            if (!Schema::hasColumn('staking_packages', 'deposit_fee_rate')) {
                $table->decimal('deposit_fee_rate', 8, 6)->default(0.020000)->after('daily_rate');
            }
            if (!Schema::hasColumn('staking_packages', 'performance_fee_rate')) {
                $table->decimal('performance_fee_rate', 8, 6)->default(0.100000)->after('deposit_fee_rate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('staking_packages', function (Blueprint $table) {
            if (Schema::hasColumn('staking_packages', 'performance_fee_rate')) {
                $table->dropColumn('performance_fee_rate');
            }
            if (Schema::hasColumn('staking_packages', 'deposit_fee_rate')) {
                $table->dropColumn('deposit_fee_rate');
            }
        });
    }
};