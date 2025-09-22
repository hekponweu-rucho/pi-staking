<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Configuration\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Enregistrer le middleware anti-abus
        $middleware->alias([
            'anti-abuse' => \App\Http\Middleware\AntiAbuseMiddleware::class,
            'role' => \Spatie\Permission\Middlewares\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middlewares\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class,
        ]);
        
        // Appliquer Sanctum aux routes API
        $middleware->statefulApi();
    })
    ->withSchedule(function ($schedule) {
        $schedule->command('staking:process-daily-earnings')->dailyAt('02:00')->timezone(config('app.timezone'));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Gestion personnalisée des exceptions pour l'API
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return \App\Exceptions\ApiExceptionHandler::render($request, $e);
            }
        });
    })->create();
