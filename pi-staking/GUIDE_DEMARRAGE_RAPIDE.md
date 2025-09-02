# 🚀 Guide de Démarrage Rapide - Pi Staking Platform

## ⚡ Lancement Immédiat

### 1️⃣ **Démarrer le Backend Laravel**
```bash
cd /project/workspace/apps/backend

# Installer les dépendances
composer install

# Configurer l'environnement
cp .env.example .env
php artisan key:generate

# Configurer la base de données dans .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pi_staking
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Migrer et seeder la base de données
php artisan migrate:fresh --seed

# Démarrer le serveur
php artisan serve
```
**🌐 Backend disponible sur:** `http://localhost:8000`

### 2️⃣ **Démarrer le Frontend React**
```bash
cd /project/workspace/pi-staking-frontend

# Installer les dépendances
bun install

# Configurer l'environnement
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Démarrer le serveur de développement
bun run dev
```
**🌐 Frontend disponible sur:** `http://localhost:3000`

---

## 🎯 **Test Rapide de la Plateforme**

### 🔐 **1. Créer un Compte**
1. Aller sur `http://localhost:3000`
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire d'inscription
4. Se connecter avec les identifiants

### 💰 **2. Tester le Staking**
1. Aller dans l'onglet "Staking"
2. Choisir un package
3. Définir le montant d'investment
4. Confirmer la transaction
5. Vérifier l'investment dans "Mes Investments"

### 🎁 **3. Tester les Claims**
1. Aller dans "Mes Investments"
2. Attendre qu'un claim soit disponible (ou modifier les données en base)
3. Cliquer sur "Réclamer"
4. Vérifier la transaction dans l'historique

---

## 🛠️ **Configuration Avancée**

### 🗄️ **Base de Données**
```sql
-- Créer la base de données
CREATE DATABASE pi_staking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utilisateur recommandé
CREATE USER 'pi_staking'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON pi_staking.* TO 'pi_staking'@'localhost';
FLUSH PRIVILEGES;
```

### 🔧 **Variables d'Environnement Backend**
```env
APP_NAME="Pi Staking Platform"
APP_ENV=local
APP_KEY=base64:your_app_key_here
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pi_staking
DB_USERNAME=pi_staking
DB_PASSWORD=secure_password

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
```

### 🌐 **Variables d'Environnement Frontend**
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Pi Staking Platform"
VITE_APP_VERSION=1.0.0
```

---

## 🐳 **Déploiement avec Docker**

### 📁 **Structure Docker**
```bash
# Démarrer tous les services
docker-compose up -d

# Services disponibles:
# - Backend Laravel: http://localhost:8000
# - Frontend React: http://localhost:3000
# - MySQL: localhost:3306
# - PhpMyAdmin: http://localhost:8080
```

### ⚙️ **Configuration Docker**
Le `docker-compose.yml` est déjà configuré avec:
- PHP 8.2 avec extensions requises
- MySQL 8.0 avec volumes persistants
- Nginx pour le frontend
- Variables d'environnement sécurisées

---

## 🔍 **Données de Test**

### 👤 **Comptes de Test Créés**
Après le seeding, ces comptes sont disponibles:
```
Admin:
- Email: admin@pistaking.com
- Password: password

Utilisateur Test:
- Email: user@test.com  
- Password: password
```

### 📊 **Packages de Staking Pré-configurés**
1. **Package Discovery** (50-500π, 1.5%/jour, 30 jours)
2. **Package Bronze** (500-2000π, 2%/jour, 45 jours)
3. **Package Silver** (2000-5000π, 2.5%/jour, 60 jours)
4. **Package Gold** (5000-15000π, 3%/jour, 90 jours)
5. **Package Diamond** (15000π+, 3.5%/jour, 120 jours)

---

## 🛡️ **Sécurité & Production**

### 🔐 **Avant la Production**
1. **Changer les clés secrètes**:
```bash
php artisan key:generate
php artisan config:clear
```

2. **Configurer HTTPS**:
```env
APP_URL=https://yourdomain.com
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

3. **Optimiser pour la production**:
```bash
# Backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend  
bun run build
```

### 🔍 **Monitoring Recommandé**
- Logs Laravel dans `storage/logs/`
- Monitoring API avec Laravel Telescope (optionnel)
- Surveillance base de données
- Alertes sur erreurs critiques

---

## 🆘 **Résolution de Problèmes**

### ❌ **Erreurs Communes**

**🔗 Erreur CORS:**
```bash
# Dans le backend
php artisan config:clear
# Vérifier config/cors.php
```

**🗄️ Erreur Base de Données:**
```bash
# Vérifier la connexion
php artisan tinker
DB::connection()->getPdo();
```

**🔑 Erreur Authentication:**
```bash
# Régénérer la clé
php artisan key:generate
php artisan config:clear
```

**📦 Erreur Dépendances:**
```bash
# Backend
composer install
composer dump-autoload

# Frontend
rm -rf node_modules
bun install
```

### 🔧 **Commands Utiles**
```bash
# Reset complet de la base de données
php artisan migrate:fresh --seed

# Clear tous les caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Vérifier les routes API
php artisan route:list --path=api

# Tester la connexion à l'API
curl http://localhost:8000/api/health
```

---

## 📞 **Support & Documentation**

### 📚 **Documentation Complète**
- `PLATEFORME_PI_STAKING_COMPLETE.md` - Documentation technique complète
- Commentaires dans le code pour fonctionnalités complexes
- Types TypeScript pour référence API

### 🐛 **Debugging**
1. **Logs Backend**: `storage/logs/laravel.log`
2. **Console Frontend**: F12 > Console
3. **Network Tab**: Vérifier les requêtes API
4. **Laravel Debugbar**: Pour debug avancé

### ✅ **Validation du Fonctionnement**
- [ ] Backend démarre sans erreur
- [ ] Frontend se connecte au backend
- [ ] Inscription/Connexion fonctionnelle
- [ ] Création d'investment possible
- [ ] Claims disponibles après 24h
- [ ] Historique des transactions visible
- [ ] Dashboard affiche les bonnes données

---

## 🎉 **Félicitations !**

Votre **Plateforme Pi Staking** est maintenant opérationnelle ! 

🌟 **Prochaines étapes recommandées:**
1. Personnaliser les packages selon vos besoins
2. Configurer les taux de change Pi/USD
3. Ajouter des fonctionnalités de parrainage
4. Intégrer des notifications push
5. Déployer en production avec HTTPS

**🚀 Bonne utilisation de votre plateforme Pi Staking !**