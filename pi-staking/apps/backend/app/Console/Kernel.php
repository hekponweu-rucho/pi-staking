<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Scan incoming Pi deposits frequently
        $schedule->command('pi:scan-deposits')->everyMinute();

        // Process daily earnings at 00:05 WAT (UTC+1), timezone configurable via env SCHEDULER_TZ
        $tz = env('SCHEDULER_TZ', 'Africa/Lagos');
        $schedule->command('staking:process-daily-earnings')->dailyAt('00:05')->timezone($tz)->withoutOverlapping();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}