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

Staging DB

- Normalisation du schéma et intégrité (PostgreSQL):
  - Checks: `investments.amount > 0`, `investments.daily_rate BETWEEN 0 AND 1`, `staking_packages.daily_rate BETWEEN 0 AND 1`, `staking_packages.duration_days > 0`, `claims.final_amount > 0` (avec `base_amount >= 0`, `bonus_amount >= 0`), `withdrawal_requests.amount > 0`, `deposits.amount IS NULL OR amount > 0`, `ledger_entries.delta <> 0`.
  - Enums PG: colonnes `status`/`type`/`source` converties en enums natifs (`withdrawal_status`, `investment_status`, `investment_source`, `transaction_type`, `transaction_status`, `claim_status`, `ledger_account`).
  - Unicité: `transactions.idempotency_key` (nullable, unique), `deposits.tx_hash` (unique), `ledger_entries (transaction_id, line_no)` unique (partiel pour `transaction_id IS NOT NULL`), `verification_codes (user_id, action, code)` unique.
  - Indexes: `investments(user_id,status)`, `(status,end_at)`, `next_claim_at`; `transactions(user_id,created_at)`; `claims(user_id,created_at)`; `withdrawal_requests(user_id,status)`.
- Dédoublonnage `withdrawal_requests`:
  - Migration de correction unique qui aligne la table, ajoute `withdrawal_address`, `note`, `requested_at` et applique les contraintes et index idempotents.
- Idempotency applicative:
  - `transactions.idempotency_key` peuplée au besoin (`deposit:<tx_hash>`, `withdrawal:reserve:<id>`, `withdrawal:execute:<id>`). Le service Ledger enregistre désormais `transaction_id`/`line_no` pour les mouvements debit/credit.

