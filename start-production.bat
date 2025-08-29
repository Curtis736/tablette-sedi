@echo off
title Suivi Mode Operatoire - Production
echo ========================================
echo    Suivi Mode Operatoire - Production
echo ========================================
echo.

echo Démarrage du backend Flask...
start "Backend-Flask" cmd /k "cd backend && python app.py"

timeout /t 3

echo Démarrage du frontend React...
start "Frontend-React" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo ✅ Application démarrée !
echo ========================================
echo.
echo 🌐 URL d'accès : http://localhost:3000
echo 📱 URL tablettes : http://[VOTRE_IP]:3000
echo.
echo 💡 Pour connaître votre IP :
ipconfig | findstr "IPv4"
echo.
echo ⚠️  Gardez ces fenêtres ouvertes pour maintenir l'application active
echo.
pause 