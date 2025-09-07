<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'level_updated_at')) {
                $table->timestamp('level_updated_at')->nullable()->after('current_level');
            }
            if (!Schema::hasColumn('users', 'referred_by')) {
                $table->foreignId('referred_by')->nullable()->after('referral_code')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'total_withdrawn')) {
                $table->decimal('total_withdrawn', 20, 8)->default(0)->after('total_claimed');
            }
            if (!Schema::hasColumn('users', 'loyalty_points')) {
                $table->integer('loyalty_points')->default(0)->after('bonus_balance');
            }
            if (!Schema::hasColumn('users', 'streak_bonus')) {
                $table->decimal('streak_bonus', 6, 4)->default(0)->after('loyalty_points');
            }
            if (!Schema::hasColumn('users', 'total_referrals')) {
                $table->integer('total_referrals')->default(0)->after('referral_code');
            }
            if (!Schema::hasColumn('users', 'referral_earnings')) {
                $table->decimal('referral_earnings', 20, 8)->default(0)->after('total_withdrawn');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('last_activity');
            }
            if (!Schema::hasColumn('users', 'language')) {
                $table->string('language', 5)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'timezone')) {
                $table->string('timezone', 50)->nullable()->after('language');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $drops = [
                'level_updated_at',
                'referred_by',
                'total_withdrawn',
                'loyalty_points',
                'streak_bonus',
                'total_referrals',
                'referral_earnings',
                'last_login_at',
                'timezone',
                'language',
            ];

            foreach ($drops as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};