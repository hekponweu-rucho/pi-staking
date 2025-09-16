<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\Investment;
use App\Models\StakingPackage;
use App\Support\Rate;

class MigrateRates extends Command
{
    protected $signature = 'staking:migrate-rates {--dry-run}';

    protected $description = 'Met à jour les daily_rate des investissements actifs selon APY et mode en configuration';

    public function handle(): int
    {
        $mode = (string) config('staking.rate_mode', 'simple');
        $dryRun = (bool) $this->option('dry-run');

        $this->info('Migration des rates démarrée');
        $updated = 0;
        $skipped = 0;

        // Mettre à jour les packages pour aligner daily_rate sur l'APY
        $packages = StakingPackage::all();
        foreach ($packages as $pkg) {
            $level = $pkg->level ?: 'bronze';
            $apy = (float) config("staking.apy.$level", 0.04);
            $newDaily = Rate::dailyRateFromApy($apy, $mode);
            $oldDaily = (float) $pkg->daily_rate;
            if (abs($newDaily - $oldDaily) >= 1e-12 && !$dryRun) {
                $pkg->update(['daily_rate' => $newDaily]);
            }
        }

        $investments = Investment::with('stakingPackage')
            ->where('status', 'active')
            ->get();

        foreach ($investments as $inv) {
            $level = $inv->stakingPackage->level ?? 'bronze';
            $apy = (float) config("staking.apy.$level", 0.04);
            $newDaily = Rate::dailyRateFromApy($apy, $mode);
            $oldDaily = (float) $inv->daily_rate;

            if (abs($newDaily - $oldDaily) < 1e-12) {
                $skipped++;
                continue;
            }

            if (!$dryRun) {
                $before = ['daily_rate' => $oldDaily];
                $inv->update(['daily_rate' => $newDaily]);

                if (class_exists(\App\Models\Audit::class)) {
                    \App\Models\Audit::create([
                        'actor_id' => null,
                        'action' => 'investment.rate_migrated',
                        'auditable_type' => Investment::class,
                        'auditable_id' => $inv->id,
                        'event' => 'updated',
                        'old_values' => $before,
                        'new_values' => ['daily_rate' => $newDaily],
                        'metadata' => [
                            'level' => $level,
                            'mode' => $mode,
                            'timestamp' => now()->toDateTimeString(),
                        ],
                    ]);
                }

                Log::channel('daily')->info('[staking] Migration rate', [
                    'investment_id' => $inv->id,
                    'user_id' => $inv->user_id,
                    'level' => $level,
                    'old_daily_rate' => $oldDaily,
                    'new_daily_rate' => $newDaily,
                ]);
            }

            $updated++;
        }

        $this->info("Migration terminée: {$updated} mis à jour, {$skipped} inchangés. Mode: {$mode}." );
        return self::SUCCESS;
    }
}
