@echo off
echo ================================
echo Déploiement Docker SIMPLE - Mode Simulation
echo ================================

echo.
echo 1. Vérification de Docker...
docker --version
if %errorlevel% neq 0 (
    echo ❌ Docker n'est pas installé !
    echo Téléchargez Docker Desktop : https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
    pause
    exit /b 1
)

echo.
echo 2. Arrêt des conteneurs existants...
docker-compose -f docker-compose.simple.yml down

echo.
echo 3. Construction de l'image (mode simulation)...
docker-compose -f docker-compose.simple.yml build --no-cache

echo.
echo 4. Démarrage de l'application...
docker-compose -f docker-compose.simple.yml up -d

echo.
echo 5. Vérification du statut...
timeout /t 10
docker-compose -f docker-compose.simple.yml ps

echo.
echo ================================
echo ✅ Application déployée en mode SIMULATION !
echo ================================
echo.
echo 🌐 URL d'accès : http://localhost:8080
echo 📱 URL tablettes : http://[IP_SERVEUR]:8080
echo.
echo ⚠️  MODE SIMULATION ACTIVÉ
echo   - Pas de connexion SQL Server requise
echo   - Données stockées en mémoire
echo   - Parfait pour tester l'interface
echo.
echo 📊 Commandes utiles :
echo   - Voir les logs : docker-compose -f docker-compose.simple.yml logs -f
echo   - Arrêter : docker-compose -f docker-compose.simple.yml down
echo   - Redémarrer : docker-compose -f docker-compose.simple.yml restart
echo.
echo Pour connaître l'IP du serveur : ipconfig
echo.
pause 