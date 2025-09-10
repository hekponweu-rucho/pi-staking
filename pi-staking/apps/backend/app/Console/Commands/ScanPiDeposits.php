<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DepositWatcher\DepositWatcherService;

class ScanPiDeposits extends Command
{
    protected $signature = 'pi:scan-deposits';

    protected $description = 'Scanner les dépôts Pi entrants et mettre à jour les statuts';

    public function handle(DepositWatcherService $service)
    {
        $service->scan();
        $this->info('Scan des dépôts Pi terminé');
        return self::SUCCESS;
    }
}