<?php

namespace App\Console\Commands;

use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Console\Command;

class ReconcileUsers extends Command
{
    protected $signature = 'finance:reconcile-users {--dry-run}';

    protected $description = 'Recalcule les soldes à partir du ledger et compare avec la table users.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $this->info('Reconciliation des utilisateurs ' . ($dry ? '(dry-run)' : ''));

        $discrepancies = [];
        $totalUsers = 0;

        User::chunkById(500, function ($chunk) use (&$discrepancies, &$totalUsers, $dry) {
            foreach ($chunk as $user) {
                $totalUsers++;
                $sums = LedgerEntry::where('user_id', $user->id)
                    ->selectRaw('account, COALESCE(SUM(delta),0) as total')
                    ->groupBy('account')
                    ->pluck('total', 'account');

                $principal = (float) ($sums['principal'] ?? 0);
                $bonus = (float) ($sums['bonus'] ?? 0);
                $claimable = (float) ($sums['claimable'] ?? 0);
                $claimableBonus = (float) ($sums['claimable_bonus'] ?? 0);
                $pending = (float) ($sums['pending_withdrawal'] ?? 0);

                $derivedBalancePi = $principal + $pending;

                $diffs = [];
                $this->compare('balance_pi', $derivedBalancePi, (float) $user->balance_pi, $diffs);
                $this->compare('bonus_balance', $bonus, (float) $user->bonus_balance, $diffs);
                $this->compare('claimable_balance', $claimable, (float) $user->claimable_balance, $diffs);
                $this->compare('claimable_bonus_balance', $claimableBonus, (float) $user->claimable_bonus_balance, $diffs);
                $this->compare('pending_withdrawal', $pending, (float) $user->pending_withdrawal, $diffs);

                if (!empty($diffs)) {
                    $discrepancies[$user->id] = $diffs;
                    $this->warn("User {$user->id} discrepancies: " . json_encode($diffs));
                }

                if (!$dry && empty($diffs)) {
                    // nothing to do
                }
            }
        });

        if (empty($discrepancies)) {
            $this->info("Reconciliation OK. Aucun écart sur {$totalUsers} utilisateur(s).");
            return self::SUCCESS;
        }

        $this->error('Des écarts ont été détectés.');
        $this->line(json_encode($discrepancies, JSON_PRETTY_PRINT));
        return self::SUCCESS;
    }

    private function compare(string $label, float $derived, float $actual, array &$diffs): void
    {
        $eps = 1e-8;
        $delta = $derived - $actual;
        if (abs($delta) > $eps) {
            $diffs[$label] = [
                'derived' => round($derived, 8),
                'actual' => round($actual, 8),
                'delta' => round($delta, 8),
            ];
        }
    }
}
