#!/bin/bash
# SCRIPT DE DÉMARRAGE - GestionEtudiant

# Couleurs
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 GestionEtudiant - Démarrage${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js détecté: $(node --version)${NC}\n"

# Démarrer le backend
echo -e "${BLUE}📦 Démarrage du BACKEND (port 3000)...${NC}"
cd univ-backend
npm install > /dev/null 2>&1
npm start &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}\n"

# Attendre un moment que le backend démarre
sleep 2

# Démarrer le frontend
echo -e "${BLUE}⚛️  Démarrage du FRONTEND (port 5173)...${NC}"
cd ../frontend
npm install > /dev/null 2>&1
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Applications démarrées!${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "Frontend:  ${YELLOW}http://localhost:5173${NC}"
echo -e "Backend:   ${YELLOW}http://localhost:3000${NC}\n"
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter${NC}\n"

# Garder le script actif
wait $BACKEND_PID $FRONTEND_PID
