<?php

namespace App\Console\Commands;

use App\Models\Investment;
use App\Services\ClaimService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ProcessDailyEarnings extends Command
{
    protected $signature = 'staking:process-daily-earnings {--date=}';

    protected $description = 'Calcul et comptabilisation quotidiens des gains de staking';

    public function handle(ClaimService $claimService)
    {
        $lock = Cache::lock('cron:process_daily_earnings', 600);
        if (!$lock->get()) {
            Log::channel('daily')->warning('[staking] Command already running, exiting', []);
            return self::SUCCESS;
        }
        $start = microtime(true);
        try {
            $runDate = $this->option('date') ? now()->parse($this->option('date')) : now();
            $today = $runDate->toDateString();

            Log::channel('daily')->info('[staking] Début traitement des gains quotidiens', [
                'date' => $today,
                'timestamp' => now()->toDateTimeString(),
            ]);

        $processed = 0;
        $skipped = 0;
        $completed = 0;
        $errors = 0;
        $locked = 0;

        Investment::with(['user', 'stakingPackage'])
            ->where('status', 'active')
            ->where(function ($q) use ($runDate) {
                $q->whereNull('next_claim_at')->orWhere('next_claim_at', '<=', $runDate->copy()->endOfDay());
            })
            ->orderBy('id')
            ->chunkById(500, function ($chunk) use (&$processed, &$skipped, &$completed, &$errors, &$locked, $claimService, $runDate, $today) {
                foreach ($chunk as $investment) {
                    try {
                        if ($investment->end_at && $runDate->greaterThanOrEqualTo($investment->end_at)) {
                            $investment->update(['status' => 'completed']);
                            $completed++;
                            continue;
                        }

                        $alreadyClaimedToday = $investment->claims()
                            ->where('claimed_for_day', $today)
                            ->exists();
                        if ($alreadyClaimedToday) {
                            $skipped++;
                            \App\Support\StructuredLogger::event('claim_skipped', [
                                'user_id' => $investment->user_id,
                                'investment_id' => $investment->id,
                                'outcome' => 'already_claimed',
                            ]);
                            continue;
                        }

                        $lock = \Illuminate\Support\Facades\Cache::lock('claim:investment:' . $investment->id, 10);
                        if (!$lock->get()) {
                            $locked++;
                            continue;
                        }
                        try {
                            if ($investment->canClaim()) {
                                $claimService->processClaim($investment->user, $investment, $today);
                                $processed++;
                            } else {
                                $skipped++;
                                \App\Support\StructuredLogger::event('claim_skipped', [
                                    'user_id' => $investment->user_id,
                                    'investment_id' => $investment->id,
                                    'outcome' => 'not_due',
                                ]);
                            }
                        } finally {
                            optional($lock)->release();
                        }
                    } catch (\Throwable $e) {
                        $errors++;
                        \App\Support\Metrics::inc('claims_failed_total');
                        Log::channel('daily')->error('[staking] Erreur traitement gains', [
                            'investment_id' => $investment->id,
                            'user_id' => $investment->user_id,
                            'message' => $e->getMessage(),
                        ]);
                    }
                }
            });

        Log::channel('daily')->info('[staking] Fin traitement des gains quotidiens', [
            'date' => $today,
            'processed' => $processed,
            'skipped' => $skipped,
            'completed' => $completed,
            'locked' => $locked,
            'errors' => $errors,
        ]);

        $durationMs = (int) round((microtime(true) - $start) * 1000);
        \App\Support\Metrics::observeHistogram('process_daily_earnings_duration_ms', $durationMs);

        $this->info("Traitement terminé: {$processed} traités, {$skipped} ignorés, {$completed} complétés, {$locked} verrouillés, {$errors} erreurs. Durée {$durationMs}ms");

        return self::SUCCESS;
        } finally {
            optional($lock)->release();
        }
    }
}
