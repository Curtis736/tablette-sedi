@echo off
echo ================================
echo Déploiement Docker - Suivi Mode Opératoire
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
docker-compose down

echo.
echo 3. Construction de l'image...
docker-compose build --no-cache

echo.
echo 4. Démarrage de l'application...
docker-compose up -d

echo.
echo 5. Vérification du statut...
timeout /t 10
docker-compose ps

echo.
echo ================================
echo ✅ Application déployée !
echo ================================
echo.
echo 🌐 URL d'accès : http://localhost:5000
echo 📱 URL tablettes : http://[IP_SERVEUR]:5000
echo.
echo 📊 Commandes utiles :
echo   - Voir les logs : docker-compose logs -f
echo   - Arrêter : docker-compose down
echo   - Redémarrer : docker-compose restart
echo.
echo Pour connaître l'IP du serveur : ipconfig
echo.
pause 