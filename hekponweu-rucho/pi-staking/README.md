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

# Configuration optionnelle
VITE_SENTRY_DSN=your-sentry-dsn-here
VITE_ANALYTICS_ID=your-analytics-id-here
```

### Démarrage du développement

#### 1. Démarrer le backend (Laravel)

```bash
# Dans le dossier backend
cd backend

# Installer les dépendances PHP
composer install

# Configurer la base de données
php artisan migrate --seed

# Démarrer le serveur de développement
php artisan serve --host=localhost --port=8000
```

#### 2. Configurer CORS (Laravel)

Assurez-vous que votre backend autorise les requêtes depuis `http://localhost:5173` (port Vite par défaut).

Dans `config/cors.php` :
```php
'allowed_origins' => [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
],
```

#### 3. Démarrer le frontend

```bash
# Démarrer le serveur de développement Vite
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

L'application sera accessible sur `http://localhost:5173`

## 🛠 Fonctionnalités

### Configuration robuste
- Variables d'environnement optionnelles pour Sentry et Analytics
- Configuration API unifiée avec fallback
- Proxy Vite automatique pour `/api/*` → `http://localhost:8000`

### Composants sécurisés
- Dashboard utilisateur avec gestion d'erreurs
- Sécurisation des opérations sur tableaux (reduce, map, filter)
- États de chargement et d'erreur appropriés

### Services API
- Instance Axios unifiée avec intercepteurs
- Services typés pour dashboard, staking, sécurité
- Gestion d'erreurs centralisée

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Linting
npm run lint
```

## 📁 Structure du projet

```
src/
├── api/                    # Services API
│   ├── api.ts             # Instance Axios principale
│   ├── dashboardService.ts # Service dashboard
│   ├── stakingService.ts   # Service staking
│   └── securityService.ts  # Service sécurité
├── components/
│   └── dashboard/
│       └── UserDashboardComplete.tsx
├── config.ts              # Configuration centralisée
├── main.tsx              # Point d'entrée
├── App.tsx               # Composant principal
└── index.css             # Styles de base
```

## 🐛 Correctifs appliqués

Cette version corrige les erreurs suivantes :

1. **Duplication 'isIFramePreview'** : Scripts CodeSandbox encapsulés dans IIFE
2. **Variables manquantes** : VITE_ANALYTICS_ID et VITE_SENTRY_DSN rendues optionnelles
3. **Erreurs API 500** : Configuration unifiée avec proxy Vite
4. **Crash investments.reduce()** : Garde-fous et vérification des types
5. **404 scout-tag.js** : Stub ajouté dans `/public/`

## 🔒 Sécurité

- Validation des données côté frontend
- Gestion d'erreurs API appropriée
- Variables d'environnement sensibles optionnelles
- CORS configuré pour le développement

## 📝 Variables d'environnement

| Variable | Obligatoire | Défaut | Description |
|----------|-------------|--------|-------------|
| `VITE_API_BASE_URL` | ✅ | `http://localhost:8000` | URL de base de l'API |
| `VITE_API_URL` | ❌ | - | Alternative à API_BASE_URL |
| `VITE_SENTRY_DSN` | ❌ | - | DSN Sentry (prod uniquement) |
| `VITE_ANALYTICS_ID` | ❌ | - | ID Analytics (prod uniquement) |

## 🚨 Dépannage

### Erreur CORS
- Vérifiez que le backend autorise `http://localhost:5173`
- Redémarrez le serveur backend après modification de la config CORS

### API non accessible
- Vérifiez que le backend fonctionne sur `http://localhost:8000`
- Vérifiez la variable `VITE_API_BASE_URL` dans `.env`

### Erreurs TypeScript
- Exécutez `npm run lint` pour identifier les problèmes
- Vérifiez que tous les types sont correctement importés

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request