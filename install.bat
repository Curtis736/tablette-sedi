@echo off
echo ========================================
echo Installation de l'application SQL Server
echo ========================================

echo.
echo 1. Installation des dependances Python...
cd backend
pip install -r requirements.txt

echo.
echo 2. Verification du driver ODBC...
python -c "import pyodbc; print('pyodbc installe avec succes')"

echo.
echo 3. Test de connexion a SQL Server...
python -c "
import pyodbc
try:
    conn_str = 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=SERVEURERP;DATABASE=master;UID=QUALITE;PWD=QUALITE;TrustServerCertificate=yes;Encrypt=yes;'
    conn = pyodbc.connect(conn_str)
    print('✅ Connexion a SQL Server reussie')
    conn.close()
except Exception as e:
    print('❌ Erreur de connexion:', str(e))
    print('Verifiez que:')
    print('- Le serveur SERVEURERP est accessible')
    print('- Les identifiants QUALITE/QUALITE sont corrects')
    print('- Le driver ODBC est installe')
"

echo.
echo 4. Installation des dependances Node.js...
cd ../frontend
npm install

echo.
echo ========================================
echo Installation terminee !
echo ========================================
echo.
echo Pour demarrer l'application:
echo 1. Backend: cd backend && python app.py
echo 2. Frontend: cd frontend && npm start
echo.
pause 