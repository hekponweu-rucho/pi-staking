#!/bin/bash

# Script de déploiement pour Pi Staking Frontend
# Usage: ./deploy.sh [environment] [branch]
# Example: ./deploy.sh production main

set -e  # Arrêter le script en cas d'erreur

# Configuration par défaut
ENVIRONMENT="${1:-staging}"
BRANCH="${2:-main}"
PROJECT_NAME="pi-staking-frontend"
BUILD_DIR="dist"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier bun
    if ! command -v bun &> /dev/null; then
        log_warning "Bun n'est pas installé, utilisation de npm"
        PACKAGE_MANAGER="npm"
    else
        PACKAGE_MANAGER="bun"
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi
    
    log_success "Tous les prérequis sont satisfaits"
}

# Validation de l'environnement
validate_environment() {
    log_info "Validation de l'environnement: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production)
            log_success "Environnement valide: $ENVIRONMENT"
            ;;
        *)
            log_error "Environnement invalide: $ENVIRONMENT. Utilisez: development, staging, ou production"
            exit 1
            ;;
    esac
}

# Configuration de l'environnement
setup_environment() {
    log_info "Configuration de l'environnement $ENVIRONMENT..."
    
    # Copier le bon fichier .env
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp ".env.$ENVIRONMENT" ".env"
        log_success "Fichier .env.$ENVIRONMENT copié vers .env"
    else
        log_warning "Fichier .env.$ENVIRONMENT non trouvé, utilisation du fichier .env existant"
    fi
    
    # Exporter NODE_ENV
    export NODE_ENV=$ENVIRONMENT
    log_info "NODE_ENV défini à: $NODE_ENV"
}

# Mise à jour du code source
update_source_code() {
    log_info "Mise à jour du code source depuis la branche $BRANCH..."
    
    # Vérifier le statut git
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Changements non commitées détectés"
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Déploiement annulé"
            exit 1
        fi
    fi
    
    # Checkout de la branche et pull
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
    
    log_success "Code source mis à jour"
}

# Installation des dépendances
install_dependencies() {
    log_info "Installation des dépendances avec $PACKAGE_MANAGER..."
    
    if [ "$PACKAGE_MANAGER" == "bun" ]; then
        bun install --frozen-lockfile
    else
        npm ci
    fi
    
    log_success "Dépendances installées"
}

# Validation de la configuration
validate_config() {
    log_info "Validation de la configuration..."
    
    # Vérifier les variables d'environnement essentielles
    if [ -z "$VITE_API_BASE_URL" ]; then
        log_error "VITE_API_BASE_URL n'est pas défini"
        exit 1
    fi
    
    log_success "Configuration validée"
}

# Build de l'application
build_application() {
    log_info "Build de l'application pour l'environnement $ENVIRONMENT..."
    
    # Nettoyer le dossier de build précédent
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        log_info "Dossier de build précédent supprimé"
    fi
    
    # Build avec le package manager approprié
    if [ "$PACKAGE_MANAGER" == "bun" ]; then
        bun run build
    else
        npm run build
    fi
    
    log_success "Build terminé avec succès"
}

# Tests (optionnel)
run_tests() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log_info "Exécution des tests..."
        
        if [ "$PACKAGE_MANAGER" == "bun" ]; then
            bun run test:ci || {
                log_error "Les tests ont échoué"
                exit 1
            }
        else
            npm run test:ci || {
                log_error "Les tests ont échoué" 
                exit 1
            }
        fi
        
        log_success "Tous les tests sont passés"
    else
        log_warning "Tests ignorés pour l'environnement $ENVIRONMENT"
    fi
}

# Optimisations post-build
optimize_build() {
    log_info "Optimisations post-build..."
    
    # Vérifier la taille du build
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    log_info "Taille du build: $BUILD_SIZE"
    
    # Vérifier la présence des fichiers essentiels
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        log_error "index.html manquant dans le build"
        exit 1
    fi
    
    # Créer un fichier de version
    echo "{
    \"version\": \"$(git describe --tags --always)\",
    \"commit\": \"$(git rev-parse HEAD)\",
    \"branch\": \"$BRANCH\",
    \"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"environment\": \"$ENVIRONMENT\"
}" > "$BUILD_DIR/version.json"
    
    log_success "Optimisations terminées"
}

# Déploiement selon l'environnement
deploy_to_environment() {
    log_info "Déploiement vers l'environnement $ENVIRONMENT..."
    
    case $ENVIRONMENT in
        development)
            deploy_to_development
            ;;
        staging)
            deploy_to_staging
            ;;
        production)
            deploy_to_production
            ;;
    esac
}

# Déploiement développement (local)
deploy_to_development() {
    log_info "Déploiement en environnement de développement..."
    
    # Démarrer le serveur de développement
    if [ "$PACKAGE_MANAGER" == "bun" ]; then
        log_info "Démarrage du serveur de développement avec bun..."
        bun run dev
    else
        log_info "Démarrage du serveur de développement avec npm..."
        npm run dev
    fi
}

# Déploiement staging
deploy_to_staging() {
    log_info "Déploiement en environnement de staging..."
    
    # Exemple de déploiement vers un serveur de staging
    # Adapter selon votre infrastructure
    log_warning "Configuration du serveur de staging requise"
    log_info "Build disponible dans le dossier: $BUILD_DIR"
    log_info "Copiez le contenu vers votre serveur de staging"
}

# Déploiement production
deploy_to_production() {
    log_info "Déploiement en environnement de production..."
    
    # Confirmation pour la production
    log_warning "Vous êtes sur le point de déployer en PRODUCTION"
    read -p "Êtes-vous sûr de vouloir continuer? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Déploiement en production annulé"
        exit 1
    fi
    
    # Exemple de déploiement vers un serveur de production
    # Adapter selon votre infrastructure
    log_warning "Configuration du serveur de production requise"
    log_info "Build disponible dans le dossier: $BUILD_DIR"
    log_info "Copiez le contenu vers votre serveur de production"
    
    # Exemple avec rsync (à adapter)
    # rsync -avz --delete $BUILD_DIR/ user@production-server:/var/www/html/
}

# Nettoyage post-déploiement
cleanup() {
    log_info "Nettoyage post-déploiement..."
    
    # Restaurer l'environnement de développement si nécessaire
    if [ "$ENVIRONMENT" != "development" ] && [ -f ".env.local" ]; then
        cp ".env.local" ".env"
        log_info "Fichier .env restauré pour le développement"
    fi
    
    log_success "Nettoyage terminé"
}

# Rapport de déploiement
deployment_report() {
    log_success "=== RAPPORT DE DÉPLOIEMENT ==="
    echo -e "${GREEN}✓${NC} Environnement: $ENVIRONMENT"
    echo -e "${GREEN}✓${NC} Branche: $BRANCH"
    echo -e "${GREEN}✓${NC} Commit: $(git rev-parse --short HEAD)"
    echo -e "${GREEN}✓${NC} Taille du build: $(du -sh $BUILD_DIR | cut -f1)"
    echo -e "${GREEN}✓${NC} Temps de build: $(date)"
    
    if [ -f "$BUILD_DIR/version.json" ]; then
        echo -e "${GREEN}✓${NC} Fichier de version créé"
    fi
    
    log_success "Déploiement terminé avec succès!"
}

# Fonction principale
main() {
    log_info "=== DÉPLOIEMENT PI STAKING FRONTEND ==="
    log_info "Environnement: $ENVIRONMENT"
    log_info "Branche: $BRANCH"
    echo
    
    check_requirements
    validate_environment
    setup_environment
    
    # Ne pas mettre à jour le code en développement local
    if [ "$ENVIRONMENT" != "development" ]; then
        update_source_code
    fi
    
    install_dependencies
    validate_config
    
    # Ne pas run les tests en développement pour aller plus vite
    if [ "$ENVIRONMENT" == "production" ]; then
        run_tests
    fi
    
    # Build seulement si pas en mode dev
    if [ "$ENVIRONMENT" != "development" ]; then
        build_application
        optimize_build
    fi
    
    deploy_to_environment
    
    if [ "$ENVIRONMENT" != "development" ]; then
        deployment_report
    fi
    
    cleanup
}

# Gestion des signaux (Ctrl+C)
trap 'log_error "Déploiement interrompu par l\'utilisateur"; exit 1' INT TERM

# Exécution du script principal
main "$@"