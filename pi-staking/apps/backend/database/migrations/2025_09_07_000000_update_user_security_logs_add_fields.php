<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_security_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('user_security_logs', 'severity_level')) {
                $table->string('severity_level')->nullable()->after('action');
            }
            if (!Schema::hasColumn('user_security_logs', 'device_type')) {
                $table->string('device_type', 50)->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('user_security_logs', 'location')) {
                $table->string('location', 255)->nullable()->after('device_type');
            }
            if (!Schema::hasColumn('user_security_logs', 'metadata')) {
                $table->json('metadata')->nullable()->after('location');
            }
            if (!Schema::hasColumn('user_security_logs', 'created_at')) {
                $table->timestamp('created_at')->useCurrent();
            }
            if (!Schema::hasColumn('user_security_logs', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->useCurrentOnUpdate();
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_security_logs', function (Blueprint $table) {
            if (Schema::hasColumn('user_security_logs', 'severity_level')) {
                $table->dropColumn('severity_level');
            }
            if (Schema::hasColumn('user_security_logs', 'device_type')) {
                $table->dropColumn('device_type');
            }
            if (Schema::hasColumn('user_security_logs', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('user_security_logs', 'metadata')) {
                $table->dropColumn('metadata');
            }
            // Intentionally keep timestamps if present
        });
    }
};