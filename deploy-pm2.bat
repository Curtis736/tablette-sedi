@echo off
echo ================================
echo Déploiement PM2 - Suivi Mode Opératoire
echo ================================

echo.
echo 1. Installation de PM2...
npm install -g pm2
npm install -g pm2-windows-startup

echo.
echo 2. Configuration du démarrage automatique...
pm2-startup install

echo.
echo 3. Création du dossier de logs...
if not exist "logs" mkdir logs

echo.
echo 4. Démarrage des applications...
pm2 start ecosystem.config.js

echo.
echo 5. Sauvegarde de la configuration...
pm2 save

echo.
echo 6. Statut des applications...
pm2 status

echo.
echo ================================
echo ✅ Application déployée avec PM2 !
echo ================================
echo.
echo 🌐 URL d'accès : http://localhost:3000
echo 📱 URL tablettes : http://[IP_SERVEUR]:3000
echo.
echo 📊 Commandes PM2 utiles :
echo   - Statut : pm2 status
echo   - Logs : pm2 logs
echo   - Redémarrer : pm2 restart all
echo   - Arrêter : pm2 stop all
echo   - Monitoring : pm2 monit
echo.
pause 