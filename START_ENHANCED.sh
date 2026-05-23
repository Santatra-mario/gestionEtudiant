#!/bin/bash

# 🚀 GestionEtudiant Application Startup Script
# Created: 18 Mai 2026
# Description: Démarrage automatisé de l'application complète

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   🎓 GestionEtudiant App Launcher      ║"
echo "║   Démarrage automatisé de l'app        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Déterminer le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}📍 Répertoire courant: $SCRIPT_DIR${NC}\n"

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier Node.js
log_info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé!"
    log_info "Télécharger depuis: https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js trouvé: $NODE_VERSION"

# Vérifier npm
log_info "Vérification de npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé!"
    exit 1
fi
NPM_VERSION=$(npm -v)
log_success "npm trouvé: $NPM_VERSION\n"

# Backend
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🔧 BACKEND SETUP${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

if [ ! -d "univ-backend" ]; then
    log_error "Dossier univ-backend non trouvé!"
    exit 1
fi

cd "$SCRIPT_DIR/univ-backend"
log_info "Répertoire backend: $(pwd)"

if [ ! -d "node_modules" ]; then
    log_info "Installation des dépendances backend..."
    npm install
    log_success "Dépendances backend installées"
else
    log_success "Dépendances backend trouvées"
fi

log_info "Démarrage du serveur backend..."
log_info "Le serveur tournera sur: http://localhost:3000"
npm start &
BACKEND_PID=$!
log_success "Backend démarré (PID: $BACKEND_PID)\n"

# Frontend
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🎨 FRONTEND SETUP${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"

cd "$SCRIPT_DIR/frontend"
log_info "Répertoire frontend: $(pwd)"

if [ ! -d "node_modules" ]; then
    log_info "Installation des dépendances frontend..."
    npm install
    log_success "Dépendances frontend installées"
else
    log_success "Dépendances frontend trouvées"
fi

log_info "Démarrage du serveur frontend..."
log_info "L'app sera accessible sur: http://localhost:5173"
npm run dev &
FRONTEND_PID=$!
log_success "Frontend démarré (PID: $FRONTEND_PID)\n"

# Instructions finales
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ APPLICATION DÉMARRÉE!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}\n"

echo -e "${BLUE}📍 Accès:${NC}"
echo "   Frontend:  ${BLUE}http://localhost:5173${NC}"
echo "   Backend:   ${BLUE}http://localhost:3000${NC}"
echo "   API Docs:  ${BLUE}http://localhost:3000/api${NC}\n"

echo -e "${BLUE}👤 Identifiants par défaut:${NC}"
echo "   Email:    ${YELLOW}admin@example.com${NC}"
echo "   Password: ${YELLOW}password${NC}\n"

echo -e "${BLUE}📚 Documentation:${NC}"
echo "   Voir: ${YELLOW}README_AUDIT.md${NC}"
echo "   Quick ref: ${YELLOW}QUICK_REFERENCE.md${NC}"
echo "   Guide: ${YELLOW}GUIDE_UTILISATION.md${NC}\n"

echo -e "${BLUE}🔧 Commandes utiles:${NC}"
echo "   Stop:     ${YELLOW}Ctrl+C${NC}"
echo "   Logs:     ${YELLOW}tail -f npm-debug.log${NC}"
echo "   DevTools: ${YELLOW}F12 dans le navigateur${NC}\n"

echo -e "${YELLOW}⏳ Accès frontend dans 30 secondes...${NC}"
sleep 3

# Ouvrir navigateur si possible
if command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:5173" &
elif command -v open &> /dev/null; then
    # Mac
    open "http://localhost:5173"
elif command -v start &> /dev/null; then
    # Windows
    start "http://localhost:5173"
fi

# Garder les processus en avant-plan
log_success "Tous services démarrés ✨"
echo -e "\n${YELLOW}Appuyer sur Ctrl+C pour arrêter tous les services${NC}\n"

# Cleanup si interruption
trap "
    echo -e '\n${YELLOW}Arrêt de l'\''application...${NC}'
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    log_success 'Services arrêtés'
    exit 0
" SIGINT SIGTERM

# Attendre que tout se termine
wait
