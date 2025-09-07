<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // --- Informations personnelles ---
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 50)->nullable()->after('username');
            }

            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 50)->nullable()->after('first_name');
            }

            // --- Colonnes pour le staking ---
            if (!Schema::hasColumn('users', 'referral_code')) {
                $table->string('referral_code', 20)->unique()->nullable()->after('last_name');
            }

            if (!Schema::hasColumn('users', 'current_level')) {
                $table->string('current_level', 20)->default('discovery')->after('referral_code');
            }

            if (!Schema::hasColumn('users', 'balance_pi')) {
                $table->decimal('balance_pi', 16, 8)->default(0)->after('email_verified_at');
            }

            if (!Schema::hasColumn('users', 'bonus_balance')) {
                $table->decimal('bonus_balance', 16, 8)->default(0)->after('balance_pi');
            }

            if (!Schema::hasColumn('users', 'total_invested')) {
                $table->decimal('total_invested', 16, 8)->default(0)->after('bonus_balance');
            }

            if (!Schema::hasColumn('users', 'total_claimed')) {
                $table->decimal('total_claimed', 16, 8)->default(0)->after('total_invested');
            }

            if (!Schema::hasColumn('users', 'kyc_status')) {
                $table->string('kyc_status', 20)->default('pending')->after('total_claimed');
            }

            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('kyc_status');
            }

            // --- Colonnes de sécurité ---
            if (!Schema::hasColumn('users', 'last_activity')) {
                $table->timestamp('last_activity')->nullable()->after('updated_at');
            }

            if (!Schema::hasColumn('users', 'last_login_ip')) {
                $table->ipAddress('last_login_ip')->nullable()->after('last_activity');
            }

            if (!Schema::hasColumn('users', 'last_login_country')) {
                $table->string('last_login_country', 2)->nullable()->after('last_login_ip');
            }

            if (!Schema::hasColumn('users', 'failed_login_attempts')) {
                $table->tinyInteger('failed_login_attempts')->unsigned()->default(0)->after('last_login_country');
            }

            if (!Schema::hasColumn('users', 'locked_until')) {
                $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            }

            // --- Colonnes 2FA ---
            if (!Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false)->after('email_verified_at');
            }
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [
                'first_name',
                'last_name',
                'referral_code',
                'current_level',
                'balance_pi',
                'bonus_balance',
                'total_invested',
                'total_claimed',
                'kyc_status',
                'is_active',
                'last_activity',
                'last_login_ip',
                'last_login_country',
                'failed_login_attempts',
                'locked_until',
                'two_factor_enabled',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};