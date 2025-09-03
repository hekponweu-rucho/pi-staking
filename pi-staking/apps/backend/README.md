Laravel 11 middleware aliases

In Laravel 11, route middleware aliases must be registered in `bootstrap/app.php` inside the `withMiddleware(...)` closure. The `$routeMiddleware` map in `app/Http/Kernel.php` is no longer used for alias registration.

This app uses Spatie\Permission. The aliases are defined as follows (plus the existing `anti-abuse` alias):

```
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'anti-abuse' => \App\Http\Middleware\AntiAbuseMiddleware::class,
        'role' => \Spatie\Permission\Middlewares\RoleMiddleware::class,
        'permission' => \Spatie\Permission\Middlewares\PermissionMiddleware::class,
        'role_or_permission' => \Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class,
    ]);

    $middleware->statefulApi();
})
```

After changes, clear caches so aliases are picked up:

```
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
```
