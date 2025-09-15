<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'claimable_balance')) {
                $table->decimal('claimable_balance', 16, 8)->default(0)->after('bonus_balance');
            }
            if (!Schema::hasColumn('users', 'claimable_bonus_balance')) {
                $table->decimal('claimable_bonus_balance', 16, 8)->default(0)->after('claimable_balance');
            }
            if (!Schema::hasColumn('users', 'pending_withdrawal')) {
                $table->decimal('pending_withdrawal', 16, 8)->default(0)->after('total_withdrawn');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'claimable_balance')) {
                $table->dropColumn('claimable_balance');
            }
            if (Schema::hasColumn('users', 'claimable_bonus_balance')) {
                $table->dropColumn('claimable_bonus_balance');
            }
            if (Schema::hasColumn('users', 'pending_withdrawal')) {
                $table->dropColumn('pending_withdrawal');
            }
        });
    }
};