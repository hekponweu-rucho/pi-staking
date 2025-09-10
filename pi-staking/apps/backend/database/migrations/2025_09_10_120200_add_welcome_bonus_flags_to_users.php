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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'welcome_bonus_claimed')) {
                $table->boolean('welcome_bonus_claimed')->default(false)->after('bonus_balance');
            }
            if (!Schema::hasColumn('users', 'welcome_bonus_reinvested')) {
                $table->boolean('welcome_bonus_reinvested')->default(false)->after('welcome_bonus_claimed');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'welcome_bonus_reinvested')) {
                $table->dropColumn('welcome_bonus_reinvested');
            }
            if (Schema::hasColumn('users', 'welcome_bonus_claimed')) {
                $table->dropColumn('welcome_bonus_claimed');
            }
        });
    }
};
