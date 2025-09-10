<?php

namespace App\Console\Commands;

use App\Models\Investment;
use App\Services\ClaimService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessDailyEarnings extends Command
{
    protected $signature = 'staking:process-daily-earnings {--date=}';

    protected $description = 'Calcul et comptabilisation quotidiens des gains de staking';

    public function handle(ClaimService $claimService)
    {
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

        $investments = Investment::with(['user', 'stakingPackage'])
            ->where('status', 'active')
            ->get();

        foreach ($investments as $investment) {
            try {
                // Marquer terminé si arrivé à échéance
                if ($investment->end_at && $runDate->greaterThanOrEqualTo($investment->end_at)) {
                    $investment->update(['status' => 'completed']);
                    $completed++;
                    continue;
                }

                // Sauter si déjà enregistré pour aujourd'hui
                $alreadyClaimedToday = $investment->claims()
                    ->where('claimed_for_day', $today)
                    ->exists();

                if ($alreadyClaimedToday) {
                    $skipped++;
                    continue;
                }

                // Si claim disponible selon la logique existante, traiter via ClaimService
                if ($investment->canClaim()) {
                    $claimService->processClaim($investment->user, $investment);
                    $processed++;
                } else {
                    $skipped++;
                }
            } catch (\Throwable $e) {
                $errors++;
                Log::channel('daily')->error('[staking] Erreur traitement gains', [
                    'investment_id' => $investment->id,
                    'user_id' => $investment->user_id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        Log::channel('daily')->info('[staking] Fin traitement des gains quotidiens', [
            'date' => $today,
            'processed' => $processed,
            'skipped' => $skipped,
            'completed' => $completed,
            'errors' => $errors,
        ]);

        $this->info("Traitement terminé: {$processed} traités, {$skipped} ignorés, {$completed} complétés, {$errors} erreurs.");

        return self::SUCCESS;
    }
}
