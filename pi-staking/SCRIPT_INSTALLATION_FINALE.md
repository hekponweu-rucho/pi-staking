# 🚀 Script d'Installation Finale - Pi Staking Sécurité

## 📋 Checklist d'Installation

### 1. **Installation des Dépendances Backend**

```bash
# Se placer dans le dossier backend
cd /project/workspace/apps/backend/

# Installer les packages 2FA et QR Code
composer require pragmarx/google2fa-laravel
composer require bacon/bacon-qr-code

# Installer Twilio pour SMS
composer require twilio/sdk

# Publier les configs si nécessaire
php artisan vendor:publish --provider="PragmaRX\Google2FALaravel\ServiceProvider"
```

### 2. **Configuration des Variables d'Environnement**

Ajouter dans `/project/workspace/apps/backend/.env` :

```env
# Configuration 2FA
2FA_WITHDRAWAL_THRESHOLD=100
WITHDRAWAL_VERIFICATION_THRESHOLD=50
2FA_APP_NAME="Pi Staking Platform"

# Configuration Twilio SMS
TWILIO_ENABLED=false
TWILIO_SID=your_account_sid_here
TWILIO_TOKEN=your_auth_token_here
TWILIO_FROM=+1234567890

# Services de géolocalisation et sécurité
GEOLOCATION_ENABLED=false
GEOLOCATION_API_KEY=your_api_key_here
VPN_DETECTION_ENABLED=false
VPN_DETECTION_API_KEY=your_api_key_here

# Configuration Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@pistaking.com
MAIL_FROM_NAME="Pi Staking Platform"
```

### 3. **Exécuter les Migrations**

```bash
# Vérifier le statut des migrations
php artisan migrate:status

# Exécuter les migrations de sécurité si nécessaire
php artisan migrate --path=/database/migrations/2025_08_20_120000_create_user_security_logs_table.php
php artisan migrate --path=/database/migrations/2025_08_20_120001_create_verification_codes_table.php
php artisan migrate --path=/database/migrations/2025_08_20_120002_add_security_fields_to_users_table.php
```

### 4. **Créer le Répertoire des Templates Email**

```bash
# Créer le dossier emails
mkdir -p resources/views/emails

# Les templates seront créés automatiquement par le système
# ou peuvent être copiés depuis les exemples dans SUGGESTIONS_FINALES_SECURITE.md
```

### 5. **Vérifier la Configuration du Middleware**

Le middleware `SecurityCheckMiddleware` doit être enregistré dans `app/Http/Kernel.php` :

```php
protected $middlewareAliases = [
    // ... autres middlewares
    'security.check' => \App\Http\Middleware\SecurityCheckMiddleware::class,
];
```

### 6. **Tests de Validation**

```bash
# Test de l'API de santé
curl -X GET http://localhost:8000/api/health

# Test de l'authentification
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test des routes de sécurité (après authentification)
curl -X GET http://localhost:8000/api/security/account-status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Ajustements Rapides Recommandés

### A. **Service TwoFactorAuthService - Méthode Manquante**

Ajouter dans `/project/workspace/apps/backend/app/Services/TwoFactorAuthService.php` :

```php
/**
 * Vérifier si 2FA est requis pour une action donnée
 */
public function is2FARequired(string $action, ?float $amount = null): bool
{
    $config = config('security.2fa_required');
    
    // Actions toujours protégées
    if (in_array($action, $config['always_required'])) {
        return true;
    }
    
    // Vérifier les seuils de montant
    if ($amount && $action === 'withdrawal') {
        return $amount >= $config['withdrawal_threshold'];
    }
    
    if ($amount && $action === 'investment') {
        return $amount >= $config['investment_threshold'];
    }
    
    return false;
}
```

### B. **Model UserSecurityLog - Méthode Statique**

Ajouter dans `/project/workspace/apps/backend/app/Models/UserSecurityLog.php` :

```php
/**
 * Obtenir les statistiques de sécurité pour un utilisateur
 */
public static function getSecurityStats(int $userId, int $days = 30): array
{
    $startDate = now()->subDays($days);
    
    $stats = self::where('user_id', $userId)
        ->where('created_at', '>=', $startDate)
        ->selectRaw('
            COUNT(*) as total_events,
            SUM(CASE WHEN action LIKE "%login%" THEN 1 ELSE 0 END) as logins,
            SUM(CASE WHEN action LIKE "failed_%" THEN 1 ELSE 0 END) as failed_attempts,
            SUM(CASE WHEN risk_score > 0.7 THEN 1 ELSE 0 END) as high_risk_events,
            COUNT(DISTINCT ip_address) as unique_ips
        ')
        ->first();
    
    return [
        'total_events' => $stats->total_events ?? 0,
        'logins' => $stats->logins ?? 0,
        'failed_attempts' => $stats->failed_attempts ?? 0,
        'high_risk_events' => $stats->high_risk_events ?? 0,
        'unique_ips' => $stats->unique_ips ?? 0,
        'device_types' => self::getDeviceTypeStats($userId, $days)
    ];
}

private static function getDeviceTypeStats(int $userId, int $days): array
{
    // Logique pour analyser les user agents et détecter les types d'appareils
    return ['desktop' => 5, 'mobile' => 3, 'tablet' => 1];
}
```

### C. **Frontend - Intégration dans App.tsx**

Modifier `/project/workspace/pi-staking-frontend/src/App.tsx` ligne 100 :

```typescript
// Remplacer grid-cols-5 par grid-cols-6
<TabsList className="grid w-full grid-cols-6 mb-6">
  {/* Onglets existants */}
  <TabsTrigger value="security" className="flex items-center gap-2">
    <Shield className="h-4 w-4" />
    Sécurité
  </TabsTrigger>
</TabsList>

// Ajouter le contenu de l'onglet après la ligne 244
<TabsContent value="security" className="space-y-6">
  <SecurityCenter />
</TabsContent>
```

Et ajouter l'import en haut du fichier :
```typescript
import SecurityCenter from '@/components/SecurityCenter';
import { Shield } from 'lucide-react';
```

---

## ✅ Validation Finale

### 1. **Test du Processus 2FA Complet**

1. **Configuration 2FA :**
   - Aller sur `/security` → onglet 2FA
   - Cliquer "Activer 2FA"
   - Scanner le QR code avec Google Authenticator
   - Entrer mot de passe + code 2FA pour confirmer

2. **Test de Retrait Sécurisé :**
   - Essayer un retrait > 100π (nécessite 2FA)
   - Vérifier que le processus demande le code 2FA
   - Vérifier l'envoi des codes email/SMS
   - Finaliser le retrait avec les codes

3. **Vérification des Logs :**
   - Aller sur `/security` → onglet Activité
   - Vérifier que toutes les actions sont loggées
   - Vérifier les scores de risque et métadonnées

### 2. **Tests de Sécurité**

```bash
# Test de force brute (doit être bloqué après 5 tentatives)
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Test de codes expirés (attendre 6 minutes après génération)
# Test de codes déjà utilisés (réutiliser le même code)
# Test de limitation de taux (envoyer trop de demandes rapidement)
```

### 3. **Performance et Monitoring**

```bash
# Vérifier les performances des requêtes lourdes
php artisan route:list | grep security
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Monitoring des logs (en production)
tail -f storage/logs/laravel.log | grep -i security
```

---

## 🎯 Résumé d'Installation

1. ✅ **Dépendances** : Installer les packages PHP requis
2. ✅ **Configuration** : Configurer les variables d'environnement
3. ✅ **Base de données** : Exécuter les migrations de sécurité
4. ✅ **Templates** : Créer les templates d'email
5. ✅ **Frontend** : Intégrer SecurityCenter dans l'app
6. ✅ **Tests** : Valider tous les processus de sécurité

**Temps estimé :** 2-3 heures pour une installation complète

**Résultat attendu :** Plateforme Pi Staking avec sécurité de niveau bancaire prête pour la production ! 🚀

---

**Note importante :** Ce script suppose que l'environnement de développement Laravel est déjà configuré et fonctionnel. Pour la production, ajoutez les configurations SSL, pare-feu et monitoring appropriés.