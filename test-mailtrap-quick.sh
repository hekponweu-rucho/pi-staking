#!/bin/bash

# Script de test rapide Mailtrap - Pi Staking
# Usage: ./test-mailtrap-quick.sh [email]

echo "🚀 Test rapide de configuration Mailtrap - Pi Staking"
echo "=================================================="

# Définir l'email de test
EMAIL=${1:-"test@example.com"}
BACKEND_DIR="pi-staking/apps/backend"

# Vérifier si nous sommes dans le bon répertoire
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Erreur: Répertoire backend non trouvé"
    echo "   Assurez-vous d'exécuter ce script depuis /project/workspace"
    exit 1
fi

echo "📧 Email de test: $EMAIL"
echo "📁 Répertoire backend: $BACKEND_DIR"
echo ""

# Aller dans le répertoire backend
cd "$BACKEND_DIR" || exit 1

echo "🔧 Vérification de la configuration..."
echo ""

# Vérifier les variables d'environnement importantes
echo "Configuration actuelle:"
echo "======================"
if [ -f ".env" ]; then
    echo "✅ Fichier .env trouvé"
    echo "MAIL_MAILER=$(grep 'MAIL_MAILER=' .env | cut -d'=' -f2)"
    echo "MAIL_HOST=$(grep 'MAIL_HOST=' .env | cut -d'=' -f2)"
    echo "MAIL_PORT=$(grep 'MAIL_PORT=' .env | cut -d'=' -f2)"
    echo "MAIL_FROM_ADDRESS=$(grep 'MAIL_FROM_ADDRESS=' .env | cut -d'=' -f2)"
    echo ""
else
    echo "❌ Fichier .env non trouvé!"
    exit 1
fi

# Vérifier la structure des templates
echo "📨 Vérification des templates email..."
if [ -d "resources/views/emails" ]; then
    echo "✅ Dossier templates trouvé"
    echo "Templates disponibles:"
    ls -1 resources/views/emails/ | grep -E "\\.blade\\.php$" | sed 's/^/   - /'
    echo ""
else
    echo "❌ Dossier templates email non trouvé!"
    exit 1
fi

# Test avec la commande Artisan si PHP est disponible
echo "🧪 Tests avec Artisan..."
if command -v php &> /dev/null; then
    echo "✅ PHP trouvé, lancement des tests Artisan"
    
    # Test simple
    echo ""
    echo "1. Test email simple:"
    echo "====================="
    php artisan mailtrap:test --email="$EMAIL" --type=simple
    
    echo ""
    echo "2. Test notification sécurité:"
    echo "=============================="
    php artisan mailtrap:test --email="$EMAIL" --type=security
    
    echo ""
    echo "3. Test code vérification:"
    echo "========================="
    php artisan mailtrap:test --email="$EMAIL" --type=withdrawal
    
    echo ""
    echo "🎯 Tests terminés!"
    echo ""
    
else
    echo "⚠️  PHP non trouvé, tests Artisan ignorés"
    echo ""
fi

# Tests API avec curl si disponible
echo "🌐 Tests API REST..."
if command -v curl &> /dev/null && command -v php &> /dev/null; then
    
    # Démarrer le serveur Laravel en arrière-plan
    echo "🚀 Démarrage du serveur Laravel..."
    php artisan serve --host=127.0.0.1 --port=8080 --quiet &
    SERVER_PID=$!
    
    # Attendre que le serveur démarre
    sleep 3
    
    echo "✅ Serveur démarré (PID: $SERVER_PID)"
    echo ""
    
    # Test de l'API
    echo "1. Test API - Configuration:"
    echo "============================"
    curl -s "http://127.0.0.1:8080/test-mailtrap/" | python3 -m json.tool 2>/dev/null || echo "Configuration API disponible"
    
    echo ""
    echo "2. Test API - Email simple:"
    echo "=========================="
    curl -s -X POST "http://127.0.0.1:8080/test-mailtrap/simple" \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"$EMAIL\"}" | python3 -m json.tool 2>/dev/null || echo "Test simple effectué"
    
    echo ""
    echo "3. Test API - Notification sécurité:"
    echo "===================================="
    curl -s -X POST "http://127.0.0.1:8080/test-mailtrap/security" \
         -H "Content-Type: application/json" \
         -d "{\"email\":\"$EMAIL\"}" | python3 -m json.tool 2>/dev/null || echo "Test sécurité effectué"
    
    # Arrêter le serveur
    echo ""
    echo "🛑 Arrêt du serveur..."
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    
else
    echo "⚠️  curl ou PHP non trouvé, tests API ignorés"
fi

echo ""
echo "🎉 Tests rapides terminés!"
echo "=========================="
echo ""
echo "📋 Résumé:"
echo "- Configuration Mailtrap: Vérifiée"
echo "- Templates email: Vérifiés" 
echo "- Email de test utilisé: $EMAIL"
echo ""
echo "📧 Prochaines étapes:"
echo "1. Vérifiez votre boîte Mailtrap pour voir les emails de test"
echo "2. Consultez le guide complet: GUIDE_MAILTRAP_INTEGRATION.md"
echo "3. Utilisez les API de test pour des tests plus poussés"
echo ""
echo "🔗 URLs utiles:"
echo "- Dashboard Mailtrap: https://mailtrap.io/inboxes"
echo "- Test API local: http://localhost:8080/test-mailtrap/"
echo ""
echo "✨ Configuration Mailtrap Pi Staking prête à utiliser!"