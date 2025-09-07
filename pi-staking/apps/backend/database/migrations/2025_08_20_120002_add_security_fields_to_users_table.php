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
            // Champs pour l'authentification à deux facteurs
            if (!Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false)->after('email_verified_at');
            }
            if (!Schema::hasColumn('users', 'two_factor_secret')) {
                $table->text('two_factor_secret')->nullable()->after('two_factor_enabled');
            }
            if (!Schema::hasColumn('users', 'two_factor_secret_temp')) {
                $table->text('two_factor_secret_temp')->nullable()->after('two_factor_secret');
            }
            if (!Schema::hasColumn('users', 'two_factor_backup_codes')) {
                $table->text('two_factor_backup_codes')->nullable()->after('two_factor_secret_temp');
            }
            if (!Schema::hasColumn('users', 'two_factor_enabled_at')) {
                $table->timestamp('two_factor_enabled_at')->nullable()->after('two_factor_backup_codes');
            }

            // Champs pour la vérification téléphone
            if (!Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'phone_verified')) {
                $table->boolean('phone_verified')->default(false)->after('phone_number');
            }
            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('phone_verified');
            }

            // Champs pour la sécurité avancée
            if (!Schema::hasColumn('users', 'temp_2fa_verification')) {
                $table->text('temp_2fa_verification')->nullable()->after('two_factor_enabled_at');
            }
            if (!Schema::hasColumn('users', 'temp_withdrawal_verification')) {
                $table->text('temp_withdrawal_verification')->nullable()->after('temp_2fa_verification');
            }
            if (!Schema::hasColumn('users', 'last_security_check')) {
                $table->timestamp('last_security_check')->nullable()->after('temp_withdrawal_verification');
            }
            if (!Schema::hasColumn('users', 'security_preferences')) {
                $table->json('security_preferences')->nullable()->after('last_security_check');
            }

            // Champs pour le tracking de sécurité
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
                $table->tinyInteger('failed_login_attempts')->default(0)->after('last_login_country');
            }
            if (!Schema::hasColumn('users', 'locked_until')) {
                $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            }

            // Index
            $table->index('two_factor_enabled', 'users_two_factor_enabled_index');
            $table->index('phone_verified', 'users_phone_verified_index');
            $table->index('last_activity', 'users_last_activity_index');
            $table->index(['failed_login_attempts', 'locked_until'], 'users_failed_login_locked_until_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Suppression des index
            $table->dropIndex(['users_two_factor_enabled_index']);
            $table->dropIndex(['users_phone_verified_index']);
            $table->dropIndex(['users_last_activity_index']);
            $table->dropIndex(['users_failed_login_locked_until_index']);

            // Suppression des colonnes
            $table->dropColumn([
                'two_factor_enabled',
                'two_factor_secret',
                'two_factor_secret_temp',
                'two_factor_backup_codes',
                'two_factor_enabled_at',
                'phone_number',
                'phone_verified',
                'phone_verified_at',
                'temp_2fa_verification',
                'temp_withdrawal_verification',
                'last_security_check',
                'security_preferences',
                'last_activity',
                'last_login_ip',
                'last_login_country',
                'failed_login_attempts',
                'locked_until'
            ]);
        });
    }
};