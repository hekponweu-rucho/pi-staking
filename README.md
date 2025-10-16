# Pi Staking — Production

This repository ships a ready-to-clone production layout (no Docker) to serve the Vite/React frontend and expose the Laravel backend on the same domain using Nginx + PHP-FPM.

- Frontend (Vite/React): `pi-staking/pi-staking-frontend`
- Backend (Laravel): `pi-staking/apps/backend`

Both are served from the same public domain: `https://pi-staking.com`
- Frontend: root of the domain
- Backend API: available under both `/backend/api/*` (preferred) and `/api/*` (compat)

## 1) Environment files (production)
Do not commit secrets in documentation. Fill these variables in your deployment environment files.

### Backend: `pi-staking/apps/backend/.env.production`
Required keys (non-exhaustive):
- APP_NAME
- APP_ENV
- APP_DEBUG
- APP_URL
- FRONTEND_URL
- SANCTUM_STATEFUL_DOMAINS
- DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
- SESSION_DRIVER, SESSION_LIFETIME, SESSION_SECURE_COOKIE
- LOG_CHANNEL, LOG_LEVEL

Notes:
- APP_KEY is not included; generate it on the server (see commands below).
- CORS relies on `FRONTEND_URL` or `FRONTEND_URLS` (see `apps/backend/config/cors.php`).

### Frontend: `pi-staking/pi-staking-frontend/.env.production`
Important production keys:
- VITE_API_BASE_URL (e.g. `https://pi-staking.com`)
- VITE_API_PREFIX (e.g. `/backend/api`)
- VITE_APP_NAME
- VITE_APP_ENVIRONMENT (set to `production`)
- VITE_ENABLE_DEV_TOOLS=false
- VITE_ENABLE_DEBUG_LOGS=false

All other existing variables should be kept as-is unless you need to change them.

## 2) Nginx + PHP-FPM
An example configuration is provided at:

- `docs/nginx/pi-staking.conf`

Key points:
- Root points to the built frontend: `/var/www/pi-staking/pi-staking-frontend/dist`
- SPA fallback via `try_files $uri /index.html`
- Two API locations for compatibility:
  - `/backend/api/*` rewritten to `/api/*` for Laravel
  - `/api/*` directly handled by Laravel
- PHP executed only via the backend entrypoint; direct `*.php` requests are blocked
- Basic security headers are included as an example
- HTTP→HTTPS redirect and ACME challenge locations are provided as commented examples

## 3) Expected server layout
```
/var/www/pi-staking/
  ├─ pi-staking-frontend/            # Frontend project (build to ./dist)
  │   └─ dist/                       # Built assets served by Nginx
  └─ apps/
      └─ backend/                    # Laravel backend
          └─ public/index.php        # Entry point used by Nginx
```

## 4) Laravel production commands (run on the server)
From `pi-staking/apps/backend`:

```
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

Ensure correct permissions for `storage/` and `bootstrap/cache/` and that PHP-FPM (8.2) has access.

## 5) Post-deployment checklist
- [ ] `https://pi-staking.com/backend/api/health` returns `{ "status": "OK" }`
- [ ] API also responds at `https://pi-staking.com/api/*` (compat)
- [ ] CORS works from `https://pi-staking.com` (fetch/axios OK)
- [ ] Authentication, staking packages, transactions endpoints respond (200/401 as expected)
- [ ] `APP_DEBUG=false` is in effect

## 6) How the API path translation works
- Laravel routes stay under `/api` (see `apps/backend/routes/api.php`).
- Nginx rewrites `/backend/api/...` → `/api/...` before passing the request to Laravel.
- No changes to business logic or route prefixes are required in code.

## 7) Frontend configuration integration
- The frontend reads its API settings from `src/lib/config.ts`.
- With `VITE_API_BASE_URL=https://pi-staking.com` and `VITE_API_PREFIX=/backend/api`, the Axios baseURL becomes `https://pi-staking.com/backend/api`.

If you need to adjust anything specific to your hosting, duplicate the provided Nginx example and tune it accordingly.
