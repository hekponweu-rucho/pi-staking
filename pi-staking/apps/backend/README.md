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

FinOps

- Politique d’arrondi centralisée via `config/finance.php`:
  - `rounding_mode`: `half_even` par défaut (banquier), options: `half_up`, `floor`
  - `scale`: 8 décimales
- Utilitaires monétaires `App\Support\Money` (wrappers BCMath): `add`, `sub`, `mul`, `div`, `cmp`, `round`, `formatPi`.
- Grand livre (double-entrée) table `ledger_entries` (comptes: `principal`, `bonus`, `claimable`, `claimable_bonus`, `pending_withdrawal`, `fees`, `external`).
  - Service `App\Services\LedgerService` avec `post`, `move`, `moveExternalToUser`, `moveUserToExternal`.
  - Intégrations clés:
    - Dépôt: `external -> principal`
    - Staking (création / reinvest): `principal|bonus|claimable|claimable_bonus -> external`
    - Claim quotidien: `external -> claimable|claimable_bonus`
    - Retrait (réservation): `principal -> pending_withdrawal`, (approbation): `pending_withdrawal -> external`, (annulation/rejet): `pending_withdrawal -> principal`
- Réconciliation: `php artisan finance:reconcile-users --dry-run` reconstruit les soldes à partir du ledger et compare aux colonnes `users`. Le solde `balance_pi` est dérivé comme `principal + pending_withdrawal`.

