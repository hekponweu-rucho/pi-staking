# Pi Staking Platform

Application React/Vite pour la plateforme de staking Pi.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm/yarn/pnpm
- Backend API fonctionnel (Laravel/PHP)

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd pi-staking

# Installer les dépendances
npm install
# ou
yarn install
# ou
pnpm install
```

### Configuration

1. Copier le fichier d'environnement d'exemple :
```bash
cp .env.example .env
```

2. Configurer les variables d'environnement dans `.env` :
```bash
# Configuration de l'API (obligatoire)
VITE_API_BASE_URL=http://localhost:8000

# Optionnel
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
```

### Démarrage du développement

1) Backend (Laravel)
```bash
php artisan migrate --seed
php artisan serve --host=localhost --port=8000
```

2) CORS (Laravel)
```php
'allowed_origins' => [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
],
```

3) Frontend
```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

## 🧭 Navigation et routes

- `/login` Connexion
- `/register` Inscription
- `/dashboard` Dashboard utilisateur (protégé)
- `/staking` Offres de staking et création de position (protégé)

Les routes protégées nécessitent une session valide. Le contexte d'authentification interroge `/api/auth/me` au chargement.

## 🛠 Fonctionnalités

- Configuration API unifiée avec fallback et proxy Vite `/api -> http://localhost:8000`
- Sentry et Analytics optionnels et activés uniquement en production si configurés
- Authentification: login, register, logout, récupération du profil `me`
- Routes protégées avec redirections automatiques et états de chargement
- Dashboard robuste avec garde-fous sur les données

## 📁 Structure du projet

```
src/
├── api/
│   ├── api.ts
│   ├── authService.ts
│   ├── dashboardService.ts
│   ├── securityService.ts
│   └── stakingService.ts
├── components/
│   ├── common/
│   │   └── Navbar.tsx
│   └── dashboard/
│       └── UserDashboardComplete.tsx
├── context/
│   └── AuthContext.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── StakingPage.tsx
├── routes/
│   └── ProtectedRoute.tsx
├── config.ts
├── App.tsx
├── index.css
└── main.tsx
```

## 🐛 Correctifs appliqués

1. Scripts CodeSandbox isolés (pas de redéclaration globale)
2. Variables Analytics/Sentry optionnelles
3. API unifiée via `VITE_API_BASE_URL` (fallback `VITE_API_URL`) + proxy Vite
4. Garde-fous sur `investments.reduce()` et états fallback UI
5. Stub `/public/scout-tag.js`

## 📝 Variables d'environnement

| Variable | Obligatoire | Défaut |
|---------|-------------|--------|
| VITE_API_BASE_URL | Oui | http://localhost:8000 |
| VITE_API_URL | Non | — |
| VITE_SENTRY_DSN | Non | — |
| VITE_ANALYTICS_ID | Non | — |

## 🚨 Dépannage

- CORS: autoriser `http://localhost:5173` côté backend
- API 500/404: vérifier `VITE_API_BASE_URL` et le proxy Vite
- Auth: endpoints attendus `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`

## 🔒 Sécurité

- Requêtes avec `withCredentials`
- Aucune dépendance sensible committée
- Sentry/Analytics désactivés sans variables
