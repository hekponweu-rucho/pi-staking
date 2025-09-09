<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staking_packages', function (Blueprint $table) {
            if (!Schema::hasColumn('staking_packages', 'max_duration_days')) {
                $table->integer('max_duration_days')->default(365)->after('duration_days');
            }
            if (!Schema::hasColumn('staking_packages', 'level')) {
                $table->string('level', 50)->default('bronze')->after('duration_days');
            }
        });

        if (Schema::hasColumn('staking_packages', 'level_requirement')) {
            try {
                DB::table('staking_packages')->whereNotNull('level_requirement')->update([
                    'level' => DB::raw('level_requirement')
                ]);
            } catch (\Throwable $e) {
            }

            try {
                Schema::table('staking_packages', function (Blueprint $table) {
                    if (Schema::hasColumn('staking_packages', 'level_requirement')) {
                        $table->dropIndex(['level_requirement']);
                    }
                });
            } catch (\Throwable $e) {
            }

            Schema::table('staking_packages', function (Blueprint $table) {
                if (Schema::hasColumn('staking_packages', 'level_requirement')) {
                    $table->dropColumn('level_requirement');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('staking_packages', function (Blueprint $table) {
            if (!Schema::hasColumn('staking_packages', 'level_requirement')) {
                $table->enum('level_requirement', ['discovery', 'bronze', 'silver', 'gold', 'diamond'])->nullable()->after('duration_days');
                $table->index(['level_requirement']);
            }
        });

        if (Schema::hasColumn('staking_packages', 'level')) {
            try {
                DB::table('staking_packages')->whereNotNull('level')->update([
                    'level_requirement' => DB::raw('level')
                ]);
            } catch (\Throwable $e) {
            }

            Schema::table('staking_packages', function (Blueprint $table) {
                if (Schema::hasColumn('staking_packages', 'level')) {
                    $table->dropColumn('level');
                }
            });
        }

        Schema::table('staking_packages', function (Blueprint $table) {
            if (Schema::hasColumn('staking_packages', 'max_duration_days')) {
                $table->dropColumn('max_duration_days');
            }
        });
    }
};
