# Pi Staking — Monorepo (npm + MySQL)

Objectif: Standardiser l'exécution locale/CI sur npm workspaces, basculer la base sur MySQL, corriger les incohérences backend et aligner le frontend.

## Prérequis
- PHP 8.2+
- Composer
- Node.js 20+
- npm 10+
- MySQL 8 (ou Docker)

## Structure
- apps/backend — API Laravel
- apps/frontend — Frontend Vite + React + TS
- packages/shared-types — Types partagés

## Installation
1) Dépendances JS (monorepo)
- npm install

2) Backend (Laravel)
- cd apps/backend
- composer install
- cp .env.example .env
- php artisan key:generate
- Configurer la section DB (MySQL)
- php artisan migrate --seed

3) Frontend
- cd ../../
- cp apps/frontend/.env.example apps/frontend/.env
- Adapter VITE_API_BASE_URL (http://localhost:8000) et VITE_API_PREFIX (/api)

## Démarrage (dev)
- À la racine du repo:
- npm run dev
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## MySQL + Redis via Docker (optionnel)
- docker compose up -d
- MySQL: 3306 (db: pi_staking_dev / user: pistaking / pass: pistaking_password)
- Redis: 6379
- (Option) Mailhog: 8025 (SMTP: 1025)

## Variables d'environnement
Backend (.env):
- DB_CONNECTION=mysql
- DB_HOST=127.0.0.1
- DB_PORT=3306
- DB_DATABASE=pi_staking_dev
- DB_USERNAME=root
- DB_PASSWORD=secret
- SANCTUM_STATEFUL_DOMAINS=localhost:5173

Frontend (.env):
- VITE_API_BASE_URL=http://localhost:8000
- VITE_API_PREFIX=/api

## Notes
- Rôles/permissions via Spatie (middleware `role:admin`).
- Middleware de sécurité `security.check` enregistré (anti-abus) et appliqué à POST /api/transactions/withdrawal.
- Endpoints admin/referrals fournis (stubs) pour éviter les 500 côté UI.
- Exports avancés (PDF/Excel) laissés en TODO; fallback CSV conservé.
