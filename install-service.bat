@echo off
echo ================================
echo Installation Service Windows
echo ================================

echo.
echo 1. Installation de NSSM (Non-Sucking Service Manager)...
if not exist "nssm.exe" (
    echo Téléchargement de NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'"
    powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath '.'"
    copy "nssm-2.24\win64\nssm.exe" .
    del nssm.zip
    rmdir /s /q nssm-2.24
)

echo.
echo 2. Création du script de démarrage...
echo @echo off > start-backend.bat
echo cd /d "%~dp0backend" >> start-backend.bat
echo python app.py >> start-backend.bat

echo @echo off > start-frontend.bat
echo cd /d "%~dp0frontend" >> start-frontend.bat
echo npm start >> start-frontend.bat

echo.
echo 3. Installation du service backend...
nssm install "SuiviMO-Backend" "%CD%\start-backend.bat"
nssm set "SuiviMO-Backend" DisplayName "Suivi Mode Opératoire - Backend"
nssm set "SuiviMO-Backend" Description "API Flask pour le suivi des temps de travail"
nssm set "SuiviMO-Backend" Start SERVICE_AUTO_START

echo.
echo 4. Installation du service frontend...
nssm install "SuiviMO-Frontend" "%CD%\start-frontend.bat"
nssm set "SuiviMO-Frontend" DisplayName "Suivi Mode Opératoire - Frontend"
nssm set "SuiviMO-Frontend" Description "Interface React pour les opérateurs"
nssm set "SuiviMO-Frontend" Start SERVICE_AUTO_START

echo.
echo 5. Démarrage des services...
net start "SuiviMO-Backend"
net start "SuiviMO-Frontend"

echo.
echo ================================
echo ✅ Services installés !
echo ================================
echo.
echo Les services démarreront automatiquement au boot
echo.
echo 🌐 URL d'accès : http://localhost:3000
echo 📱 URL tablettes : http://[IP_SERVEUR]:3000
echo.
echo 📊 Gestion des services :
echo   - Panneau de configuration ^> Services
echo   - Ou : services.msc
echo.
pause 