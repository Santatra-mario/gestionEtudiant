@echo off
REM 🚀 GestionEtudiant Application Startup Script
REM Created: 18 Mai 2026
REM Description: Démarrage automatisé de l'application complète (Windows)

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════╗
echo ║   🎓 GestionEtudiant App Launcher      ║
echo ║   Démarrage automatisé de l'app        ║
echo ║   Windows Edition                      ║
echo ╚════════════════════════════════════════╝
echo.

REM Couleurs (ANSI si Windows 10+)
for /F %%A in ('copy /Z "%~f0" nul') do set "ESC=%%A"

REM Déterminer le répertoire du script
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 📍 Répertoire courant: %SCRIPT_DIR%
echo.

REM ═════════════════════════════════════════════════════════════
REM Vérification préalable
REM ═════════════════════════════════════════════════════════════

echo ════════════════════════════════════════
echo 🔍 VÉRIFICATIONS PRÉALABLES
echo ════════════════════════════════════════

REM Vérifier Node.js
echo.
echo Vérification de Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé!
    echo ℹ️  Télécharger depuis: https://nodejs.org
    echo Appuyer sur une touche pour quitter...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%I in ('node --version') do set NODE_VERSION=%%I
echo ✅ Node.js trouvé: %NODE_VERSION%

REM Vérifier npm
echo.
echo Vérification de npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installé!
    echo Appuyer sur une touche pour quitter...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%I in ('npm --version') do set NPM_VERSION=%%I
echo ✅ npm trouvé: %NPM_VERSION%
echo.

REM ═════════════════════════════════════════════════════════════
REM Backend
REM ═════════════════════════════════════════════════════════════

echo ════════════════════════════════════════
echo 🔧 BACKEND SETUP
echo ════════════════════════════════════════
echo.

if not exist "univ-backend" (
    echo ❌ Dossier univ-backend non trouvé!
    echo Appuyer sur une touche pour quitter...
    pause >nul
    exit /b 1
)

cd /d "%SCRIPT_DIR%\univ-backend"
echo ℹ️  Répertoire backend: %cd%
echo.

if not exist "node_modules" (
    echo ℹ️  Installation des dépendances backend...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation backend
        echo Appuyer sur une touche pour quitter...
        pause >nul
        exit /b 1
    )
    echo ✅ Dépendances backend installées
) else (
    echo ✅ Dépendances backend trouvées
)

echo.
echo ℹ️  Démarrage du serveur backend...
echo ℹ️  Le serveur tournera sur: http://localhost:3000
echo.

REM Démarrer backend dans une nouvelle fenêtre
start "Backend Server" cmd /k npm start

REM Attendre un peu que le backend démarre
timeout /t 3 /nobreak

REM ═════════════════════════════════════════════════════════════
REM Frontend
REM ═════════════════════════════════════════════════════════════

echo ════════════════════════════════════════
echo 🎨 FRONTEND SETUP
echo ════════════════════════════════════════
echo.

cd /d "%SCRIPT_DIR%\frontend"
echo ℹ️  Répertoire frontend: %cd%
echo.

if not exist "node_modules" (
    echo ℹ️  Installation des dépendances frontend...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation frontend
        echo Appuyer sur une touche pour quitter...
        pause >nul
        exit /b 1
    )
    echo ✅ Dépendances frontend installées
) else (
    echo ✅ Dépendances frontend trouvées
)

echo.
echo ℹ️  Démarrage du serveur frontend...
echo ℹ️  L'app sera accessible sur: http://localhost:5173
echo.

REM Démarrer frontend dans une nouvelle fenêtre
start "Frontend Server" cmd /k npm run dev

timeout /t 3 /nobreak

REM ═════════════════════════════════════════════════════════════
REM Instructions finales
REM ═════════════════════════════════════════════════════════════

cls
echo.
echo ════════════════════════════════════════
echo ✨ APPLICATION DÉMARRÉE!
echo ════════════════════════════════════════
echo.

echo 📍 Accès:
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:3000
echo    API Docs:  http://localhost:3000/api
echo.

echo 👤 Identifiants par défaut:
echo    Email:    admin@example.com
echo    Password: password
echo.

echo 📚 Documentation:
echo    Voir: README_AUDIT.md
echo    Quick ref: QUICK_REFERENCE.md
echo    Guide: GUIDE_UTILISATION.md
echo.

echo 🔧 Commandes utiles:
echo    Stop serveurs: Fermer les fenêtres cmd
echo    DevTools: F12 dans le navigateur
echo    Logs: Voir les fenêtres cmd ouvertes
echo.

REM Ouvrir navigateur
echo ⏳ Ouverture du navigateur...
start http://localhost:5173

echo.
echo ✅ Tous les services sont démarrés!
echo.
echo Les deux serveurs tournent dans des fenêtres séparées:
echo - Backend (http://localhost:3000)
echo - Frontend (http://localhost:5173)
echo.
echo Fermer les fenêtres cmd pour arrêter l'application.
echo.
echo Appuyer sur une touche pour quitter cette fenêtre...
pause >nul
