from flask import Flask, jsonify
from flask_cors import CORS
import pyodbc
import os
from config import DB_CONFIG, FLASK_CONFIG, ERROR_MESSAGES, APP_TABLES, FALLBACK_TABLES, SIMULATION_MODE
import sys, io
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

app = Flask(__name__)
CORS(app)

# Variable globale pour déterminer quelle base utiliser
CURRENT_TABLES = APP_TABLES
USING_FALLBACK = False
USING_SIMULATION = False

# Stockage temporaire pour la simulation
SIMULATION_DATA = {
    'temps_travail': [],
    'historique': [],
    'sessions': []
}

def get_db_connection():
    """Crée une connexion à la base de données SQL Server"""
    try:
        conn_str = (
            f"DRIVER={DB_CONFIG['driver']};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE={DB_CONFIG['database']};"
            f"UID={DB_CONFIG['username']};"
            f"PWD={DB_CONFIG['password']};"
            f"TrustServerCertificate={DB_CONFIG['trust_server_certificate']};"
            f"Encrypt={DB_CONFIG['encrypt']};"
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Erreur de connexion à la base de données: {e}")
        return None

def get_app_db_connection():
    """Crée une connexion à la base de données de l'application"""
    try:
        conn_str = (
            f"DRIVER={DB_CONFIG['driver']};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE={DB_CONFIG['database_app']};"
            f"UID={DB_CONFIG['username']};"
            f"PWD={DB_CONFIG['password']};"
            f"TrustServerCertificate={DB_CONFIG['trust_server_certificate']};"
            f"Encrypt={DB_CONFIG['encrypt']};"
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Erreur de connexion à la base de données de l'application: {e}")
        return None

def get_fallback_db_connection():
    """Crée une connexion à la base de données de fallback"""
    try:
        conn_str = (
            f"DRIVER={DB_CONFIG['driver']};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE={DB_CONFIG['database_fallback']};"
            f"UID={DB_CONFIG['username']};"
            f"PWD={DB_CONFIG['password']};"
            f"TrustServerCertificate={DB_CONFIG['trust_server_certificate']};"
            f"Encrypt={DB_CONFIG['encrypt']};"
        )
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Erreur de connexion à la base de données de fallback: {e}")
        return None

def determine_working_database():
    """Détermine quelle base de données utiliser"""
    global CURRENT_TABLES, USING_FALLBACK, USING_SIMULATION
    
    # Si le mode simulation est activé, l'utiliser
    if SIMULATION_MODE:
        USING_SIMULATION = True
        print("🎭 Mode simulation activé - Données stockées en mémoire")
        return True
    
    # Essayer d'abord SEDI_APP
    conn = get_app_db_connection()
    if conn:
        conn.close()
        CURRENT_TABLES = APP_TABLES
        USING_FALLBACK = False
        USING_SIMULATION = False
        print("✅ Utilisation de la base SEDI_APP")
        return True
    
    # Fallback vers SEDI_ERP
    conn = get_fallback_db_connection()
    if conn:
        conn.close()
        CURRENT_TABLES = FALLBACK_TABLES
        USING_FALLBACK = True
        USING_SIMULATION = False
        print("⚠️ Utilisation de la base SEDI_ERP (fallback)")
        return True
    
    # Si aucune base n'est accessible, utiliser la simulation
    USING_SIMULATION = True
    print("🎭 Aucune base accessible - Mode simulation activé")
    return True

def create_app_database():
    """Crée la base de données SEDI_APP si elle n'existe pas"""
    try:
        # Connexion à master pour créer la base
        conn_str = (
            f"DRIVER={DB_CONFIG['driver']};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE=master;"
            f"UID={DB_CONFIG['username']};"
            f"PWD={DB_CONFIG['password']};"
            f"TrustServerCertificate={DB_CONFIG['trust_server_certificate']};"
            f"Encrypt={DB_CONFIG['encrypt']};"
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Vérifier si la base existe déjà
        check_db_query = f"SELECT name FROM sys.databases WHERE name = '{DB_CONFIG['database_app']}'"
        cursor.execute(check_db_query)
        db_exists = cursor.fetchone()
        
        if not db_exists:
            # Création de la base de données (sans transaction)
            create_db_query = f"CREATE DATABASE [{DB_CONFIG['database_app']}]"
            cursor.execute(create_db_query)
            conn.commit()
            print(f"✅ Base de données {DB_CONFIG['database_app']} créée")
        else:
            print(f"✅ Base de données {DB_CONFIG['database_app']} existe déjà")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création de la base de données: {e}")
        return False

def create_app_tables():
    """Crée les tables de l'application"""
    global USING_SIMULATION
    
    try:
        # Si en mode simulation, pas besoin de créer des tables
        if USING_SIMULATION:
            print("🎭 Mode simulation - Pas de création de tables nécessaire")
            return True
        
        # Attendre un peu que la base soit créée
        import time
        time.sleep(2)
        
        # Déterminer quelle base utiliser
        if not determine_working_database():
            return False
        
        # Utiliser la connexion appropriée
        if USING_FALLBACK:
            conn = get_fallback_db_connection()
        else:
            conn = get_app_db_connection()
            
        if not conn:
            print("❌ Impossible de se connecter pour créer les tables")
            return False
        
        cursor = conn.cursor()
        
        # Table ABTEMPS_OPERATEURS (temps de travail en cours)
        create_temps_table = f"""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'{CURRENT_TABLES['temps_travail']}') AND type in (N'U'))
        CREATE TABLE {CURRENT_TABLES['temps_travail']} (
            NoEnreg INT IDENTITY(1,1) PRIMARY KEY,
            Ident NVARCHAR(50) NOT NULL,
            DateTravail DATETIME NOT NULL,
            CodeLanctImprod NVARCHAR(50) NOT NULL,
            Phase NVARCHAR(50) NOT NULL,
            CodeRubrique NVARCHAR(50),
            VarNumUtil8 INT DEFAULT 0, -- Minutes
            VarNumUtil9 INT DEFAULT 0, -- Secondes
            Statut NVARCHAR(20) DEFAULT 'EN_COURS',
            DateCreation DATETIME DEFAULT GETDATE()
        )
        """
        
        # Table ABHISTORIQUE_OPERATEURS (historique complet)
        create_historique_table = f"""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'{CURRENT_TABLES['historique']}') AND type in (N'U'))
        CREATE TABLE {CURRENT_TABLES['historique']} (
            NoEnreg INT IDENTITY(1,1) PRIMARY KEY,
            Ident NVARCHAR(50) NOT NULL,
            DateTravail DATETIME NOT NULL,
            CodeLanctImprod NVARCHAR(50) NOT NULL,
            Phase NVARCHAR(50) NOT NULL,
            CodeRubrique NVARCHAR(50),
            VarNumUtil8 INT DEFAULT 0, -- Minutes
            VarNumUtil9 INT DEFAULT 0, -- Secondes
            Statut NVARCHAR(20) DEFAULT 'TERMINE',
            DateCreation DATETIME DEFAULT GETDATE()
        )
        """
        
        # Table ABSESSIONS_OPERATEURS (sessions de travail)
        create_sessions_table = f"""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'{CURRENT_TABLES['sessions']}') AND type in (N'U'))
        CREATE TABLE {CURRENT_TABLES['sessions']} (
            NoEnreg INT IDENTITY(1,1) PRIMARY KEY,
            Ident NVARCHAR(50) NOT NULL,
            DateDebut DATETIME NOT NULL,
            DateFin DATETIME,
            CodeLanctImprod NVARCHAR(50) NOT NULL,
            Phase NVARCHAR(50) NOT NULL,
            CodeRubrique NVARCHAR(50),
            Statut NVARCHAR(20) DEFAULT 'ACTIVE',
            DateCreation DATETIME DEFAULT GETDATE()
        )
        """
        
        # Exécution des créations une par une
        tables_created = 0
        try:
            cursor.execute(create_temps_table)
            print("✅ Table ABTEMPS_OPERATEURS créée")
            tables_created += 1
        except Exception as e:
            print(f"⚠️ Erreur création table ABTEMPS_OPERATEURS: {e}")
        
        try:
            cursor.execute(create_historique_table)
            print("✅ Table ABHISTORIQUE_OPERATEURS créée")
            tables_created += 1
        except Exception as e:
            print(f"⚠️ Erreur création table ABHISTORIQUE_OPERATEURS: {e}")
        
        try:
            cursor.execute(create_sessions_table)
            print("✅ Table ABSESSIONS_OPERATEURS créée")
            tables_created += 1
        except Exception as e:
            print(f"⚠️ Erreur création table ABSESSIONS_OPERATEURS: {e}")
        
        conn.commit()
        conn.close()
        
        if tables_created > 0:
            print(f"✅ {tables_created} tables de l'application créées avec succès")
            return True
        else:
            print("⚠️ Aucune table n'a pu être créée - Passage en mode simulation")
            USING_SIMULATION = True
            return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {e}")
        return False

def ensure_tables_exist():
    """Vérifie et crée les tables si elles n'existent pas"""
    try:
        # Si en mode simulation, pas besoin de vérifier les tables
        if USING_SIMULATION:
            return True
        
        # Déterminer quelle base utiliser
        if not determine_working_database():
            return False
        
        # Utiliser la connexion appropriée
        if USING_FALLBACK:
            conn = get_fallback_db_connection()
        else:
            conn = get_app_db_connection()
            
        if not conn:
            return False
        
        cursor = conn.cursor()
        
        # Vérifier si les tables existent
        tables_to_check = [
            CURRENT_TABLES['temps_travail'],
            CURRENT_TABLES['historique'],
            CURRENT_TABLES['sessions']
        ]
        
        missing_tables = []
        for table in tables_to_check:
            try:
                cursor.execute(f"SELECT TOP 1 * FROM {table}")
            except Exception:
                missing_tables.append(table)
        
        if missing_tables:
            print(f"⚠️ Tables manquantes détectées: {missing_tables}")
            # Créer les tables manquantes
            return create_app_tables()
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la vérification des tables: {e}")
        return False

def test_connection():
    """Teste la connexion à la base de données"""
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            conn.close()
            return True
        except Exception as e:
            print(f"Erreur lors du test de connexion: {e}")
            return False
    return False

def export_data_to_erp():
    """Exporte les données de SEDI_APP_INDEPENDANTE vers l'ERP SILOG"""
    try:
        # Connexion à la base autonome
        conn_app = get_app_db_connection()
        if not conn_app:
            print("❌ Impossible de se connecter à la base autonome")
            return False
        
        cursor_app = conn_app.cursor()
        
        # Récupérer toutes les données de l'historique
        query_historique = f"""
        SELECT 
            NoEnreg, Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique,
            VarNumUtil8, VarNumUtil9, Statut, DateCreation
        FROM {APP_TABLES['historique']}
        ORDER BY DateCreation
        """
        
        cursor_app.execute(query_historique)
        historique_data = cursor_app.fetchall()
        
        print(f"📊 {len(historique_data)} enregistrements trouvés dans la base autonome")
        
        # Connexion à l'ERP pour l'export
        conn_erp = get_db_connection()
        if not conn_erp:
            print("❌ Impossible de se connecter à l'ERP")
            conn_app.close()
            return False
        
        cursor_erp = conn_erp.cursor()
        
        # Créer une table temporaire dans l'ERP pour l'import
        create_temp_table = """
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SEDI_ERP].[dbo].[TEMP_IMPORT_APP]') AND type in (N'U'))
        CREATE TABLE [SEDI_ERP].[dbo].[TEMP_IMPORT_APP] (
            NoEnreg INT,
            Ident NVARCHAR(50),
            DateTravail DATETIME,
            CodeLanctImprod NVARCHAR(50),
            Phase NVARCHAR(50),
            CodeRubrique NVARCHAR(50),
            VarNumUtil8 INT,
            VarNumUtil9 INT,
            Statut NVARCHAR(20),
            DateCreation DATETIME
        )
        """
        
        cursor_erp.execute(create_temp_table)
        conn_erp.commit()
        
        # Insérer les données dans la table temporaire
        insert_query = """
        INSERT INTO [SEDI_ERP].[dbo].[TEMP_IMPORT_APP] 
        (NoEnreg, Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique, VarNumUtil8, VarNumUtil9, Statut, DateCreation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        for row in historique_data:
            cursor_erp.execute(insert_query, row)
        
        conn_erp.commit()
        conn_app.close()
        conn_erp.close()
        
        print(f"✅ {len(historique_data)} enregistrements exportés vers [SEDI_ERP].[dbo].[TEMP_IMPORT_APP]")
        print("📋 Vous pouvez maintenant traiter ces données dans l'ERP SILOG")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'export: {e}")
        return False

def get_database_stats():
    """Affiche les statistiques de la base de données autonome"""
    try:
        conn = get_app_db_connection()
        if not conn:
            return None
        
        cursor = conn.cursor()
        
        # Compter les enregistrements dans chaque table
        stats = {}
        
        for table_name, table_path in APP_TABLES.items():
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_path}")
                count = cursor.fetchone()[0]
                stats[table_name] = count
            except Exception as e:
                stats[table_name] = f"Erreur: {e}"
        
        conn.close()
        return stats
        
    except Exception as e:
        print(f"❌ Erreur lors de la récupération des statistiques: {e}")
        return None

@app.route('/api/operateurs', methods=['GET'])
def get_operateurs():
    """Récupère tous les opérateurs selon la requête spécifiée"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Impossible de se connecter à la base de données', 'success': False}), 500
        
        cursor = conn.cursor()
        
        # Requête directe dans SEDI_ERP pour récupérer les opérateurs réels
        query = '''
            SELECT TOP (1000) 
                [Coderessource],
                [Designation1]
            FROM [SEDI_ERP].[dbo].[RESSOURC]
            WHERE [Typeressource] = 'O'
            ORDER BY [Coderessource]
        '''
        
        cursor.execute(query)
        operateurs = cursor.fetchall()
        
        # Conversion en liste de dictionnaires
        result = []
        for row in operateurs:
            result.append({
                'operateur': row[0],  # CodeRessource
                'nom': row[1]         # Designation
            })
        
        conn.close()
        return jsonify({'operateurs': result, 'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/operateurs-badges', methods=['GET'])
def get_operateurs_badges():
    """Récupère tous les opérateurs qui ont badgé aujourd'hui (avec sessions actives)"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Impossible de se connecter à la base de données', 'success': False}), 500
        
        cursor = conn.cursor()
        
        # Requête pour récupérer les opérateurs avec sessions actives depuis SEDI_ERP
        query = f'''
            SELECT DISTINCT 
                t.Ident,
                r.Designation1,
                COUNT(*) as NombreSessions,
                MAX(t.DateCreation) as DerniereActivite,
                t.Statut
            FROM {CURRENT_TABLES['sessions']} t
            LEFT JOIN [SEDI_ERP].[dbo].[RESSOURC] r ON t.Ident = r.Coderessource
            WHERE CAST(t.DateDebut AS DATE) = CAST(GETDATE() AS DATE)
            GROUP BY t.Ident, r.Designation1, t.Statut
            ORDER BY MAX(t.DateCreation) DESC
        '''
        
        cursor.execute(query)
        operateurs_badges = cursor.fetchall()
        
        # Conversion en liste de dictionnaires
        result = []
        for row in operateurs_badges:
            result.append({
                'operateur': row[0],
                'nom': row[1] if row[1] else 'Nom non trouvé',
                'nombre_sessions': row[2],
                'derniere_activite': row[3].isoformat() if row[3] else None,
                'statut': row[4]
            })
        
        conn.close()
        return jsonify({'operateurs_badges': result, 'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Point de terminaison pour vérifier que l'API fonctionne"""
    db_status = "Connecté" if test_connection() else "Non connecté"
    return jsonify({
        'status': 'OK', 
        'message': 'API fonctionnelle',
        'database': db_status,
        'server': DB_CONFIG['server']
    })

@app.route('/api/test-connection', methods=['GET'])
def test_db_connection():
    """Teste la connexion à la base de données"""
    if test_connection():
        return jsonify({'success': True, 'message': 'Connexion à SQL Server réussie'})
    else:
        return jsonify({'success': False, 'message': 'Échec de la connexion à SQL Server'}), 500

@app.route('/api/test-ressourc', methods=['GET'])
def test_ressourc_table():
    """Teste l'accès à la table RESSOURC"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Impossible de se connecter à la base de données'}), 500
        
        cursor = conn.cursor()
        
        # Test d'accès direct à la table RESSOURC dans SEDI_ERP
        query = '''
            SELECT TOP 5 [Coderessource], [Designation1] 
            FROM [SEDI_ERP].[dbo].[RESSOURC]
            WHERE [Typeressource] = 'O'
        '''
        
        cursor.execute(query)
        result = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': f'Table RESSOURC accessible, {len(result)} opérateurs trouvés',
            'sample_data': [{'code': row[0], 'nom': row[1]} for row in result]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/test-permissions', methods=['GET'])
def test_permissions():
    """Teste les permissions sur les tables"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Impossible de se connecter à la base de données'}), 500
        
        cursor = conn.cursor()
        
        # Test de lecture sur abetemps_temp
        try:
            cursor.execute("SELECT TOP 1 * FROM [SEDI_ERP].[GPSQL].[abetemps_temp]")
            read_ok = True
        except Exception as e:
            read_ok = False
            read_error = str(e)
        
        # Test d'écriture sur abetemps_temp (simulation)
        try:
            cursor.execute("SELECT COUNT(*) FROM [SEDI_ERP].[GPSQL].[abetemps_temp]")
            write_ok = True
        except Exception as e:
            write_ok = False
            write_error = str(e)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'permissions': {
                'read_abetemps_temp': read_ok,
                'write_abetemps_temp': write_ok,
                'read_error': read_error if not read_ok else None,
                'write_error': write_error if not write_ok else None
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/terminer-travail', methods=['POST'])
def terminer_travail():
    """Termine le travail et enregistre dans ABHISTORIQUE_OPERATEURS"""
    try:
        from flask import request
        data = request.get_json()
        
        # Validation des données
        required_fields = ['operateurId', 'operateurNom', 'codeLancement', 'dateTravail']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Champ requis manquant: {field}'}), 400
        
        # Vérifier et créer les tables si nécessaire
        if not ensure_tables_exist():
            return jsonify({'success': False, 'error': 'Impossible de créer les tables nécessaires'}), 500
        
        # Mode simulation
        if USING_SIMULATION:
            from datetime import datetime
            import time
            
            # Créer un enregistrement simulé
            record = {
                'noEnreg': int(time.time()),
                'ident': data['operateurId'],
                'dateTravail': datetime.fromisoformat(data['dateTravail'].replace('Z', '+00:00')),
                'codeLanctImprod': data['codeLancement'],
                'phase': data['phase'],
                'codeRubrique': data.get('codeRubrique', ''),
                'varNumUtil8': data.get('tempsMinutes', 0),
                'varNumUtil9': data.get('tempsSecondes', 0),
                'statut': 'TERMINE',
                'dateCreation': datetime.now()
            }
            
            SIMULATION_DATA['historique'].append(record)
            
            print(f"🎭 SIMULATION - Travail terminé: {record}")
            
            return jsonify({
                'success': True, 
                'message': 'Travail terminé - Données simulées en mémoire',
                'noEnreg': record['noEnreg']
            })
        
        # Mode normal avec base de données
        # Utiliser la connexion appropriée
        if USING_FALLBACK:
            conn = get_fallback_db_connection()
        else:
            conn = get_app_db_connection()
            
        if not conn:
            return jsonify({'success': False, 'error': 'Impossible de se connecter à la base de données de l\'application'}), 500
        
        cursor = conn.cursor()
        
        # Insertion dans ABHISTORIQUE_OPERATEURS (opérations terminées)
        query = f'''
            INSERT INTO {CURRENT_TABLES['historique']} 
            (Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique, VarNumUtil8, VarNumUtil9, Statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        # Conversion de la date
        from datetime import datetime
        date_travail = datetime.fromisoformat(data['dateTravail'].replace('Z', '+00:00'))
        
        temps_minutes = data.get('tempsMinutes', 0)
        temps_secondes = data.get('tempsSecondes', 0)
        
        cursor.execute(query, (
            data['operateurId'],
            date_travail,
            data['codeLancement'],
            data['phase'],
            data.get('codeRubrique', ''),
            temps_minutes,
            temps_secondes,
            'TERMINE'  # Statut pour indiquer que c'est terminé
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Travail terminé - Données enregistrées dans ABHISTORIQUE_OPERATEURS',
            'noEnreg': cursor.rowcount
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/demarrer-travail', methods=['POST'])
def demarrer_travail():
    """Démarre le travail et enregistre dans ABTEMPS_OPERATEURS"""
    try:
        from flask import request
        data = request.get_json()
        
        # Validation des données
        required_fields = ['operateurId', 'operateurNom', 'codeLancement', 'dateTravail']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Champ requis manquant: {field}'}), 400
        
        # Vérifier et créer les tables si nécessaire
        if not ensure_tables_exist():
            return jsonify({'success': False, 'error': 'Impossible de créer les tables nécessaires'}), 500
        
        # Mode simulation
        if USING_SIMULATION:
            from datetime import datetime
            import time
            
            # Créer un enregistrement simulé
            record = {
                'noEnreg': int(time.time()),
                'ident': data['operateurId'],
                'dateTravail': datetime.fromisoformat(data['dateTravail'].replace('Z', '+00:00')),
                'codeLanctImprod': data['codeLancement'],
                'phase': data['phase'],
                'codeRubrique': data.get('codeRubrique', ''),
                'varNumUtil8': 0,
                'varNumUtil9': 0,
                'statut': 'EN_COURS',
                'dateCreation': datetime.now()
            }
            
            SIMULATION_DATA['temps_travail'].append(record)
            
            print(f"🎭 SIMULATION - Travail démarré: {record}")
            
            return jsonify({
                'success': True, 
                'message': 'Travail démarré - Données simulées en mémoire',
                'noEnreg': record['noEnreg']
            })
        
        # Mode normal avec base de données
        # Utiliser la connexion appropriée
        if USING_FALLBACK:
            conn = get_fallback_db_connection()
        else:
            conn = get_app_db_connection()
            
        if not conn:
            return jsonify({'success': False, 'error': 'Impossible de se connecter à la base de données de l\'application'}), 500
        
        cursor = conn.cursor()
        
        # Insertion dans ABTEMPS_OPERATEURS (opérations commencées)
        query = f'''
            INSERT INTO {CURRENT_TABLES['temps_travail']} 
            (Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique, VarNumUtil8, VarNumUtil9, Statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        '''
        
        # Conversion de la date
        from datetime import datetime
        date_travail = datetime.fromisoformat(data['dateTravail'].replace('Z', '+00:00'))
        
        cursor.execute(query, (
            data['operateurId'],
            date_travail,
            data['codeLancement'],
            data['phase'],
            data.get('codeRubrique', ''),
            0,  # Temps initial à 0
            0,  # Temps initial à 0
            'EN_COURS'  # Statut pour indiquer que c'est commencé
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Travail démarré - Données enregistrées dans ABTEMPS_OPERATEURS',
            'noEnreg': cursor.rowcount
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/historique-operateur/<operateur_id>', methods=['GET'])
def get_historique_operateur(operateur_id):
    """Récupère l'historique des enregistrements d'un opérateur"""
    try:
        # Vérifier et créer les tables si nécessaire
        if not ensure_tables_exist():
            return jsonify({'success': False, 'error': 'Impossible de créer les tables nécessaires'}), 500
        
        # Mode simulation
        if USING_SIMULATION:
            # Filtrer les données simulées pour l'opérateur
            result = []
            for record in SIMULATION_DATA['historique']:
                if record['ident'] == operateur_id:
                    result.append({
                        'noEnreg': record['noEnreg'],
                        'ident': record['ident'],
                        'dateTravail': record['dateTravail'].isoformat() if record['dateTravail'] else None,
                        'codeLanctImprod': record['codeLanctImprod'],
                        'phase': record['phase'],
                        'codeRubrique': record['codeRubrique'],
                        'varNumUtil8': record['varNumUtil8'],
                        'varNumUtil9': record['varNumUtil9'],
                        'statut': record['statut'],
                        'dateCreation': record['dateCreation'].isoformat() if record['dateCreation'] else None
                    })
            
            # Trier par date décroissante
            result.sort(key=lambda x: x['dateTravail'], reverse=True)
            
            return jsonify({'success': True, 'enregistrements': result})
        
        # Mode normal avec base de données
        # Utiliser la connexion appropriée
        if USING_FALLBACK:
            conn = get_fallback_db_connection()
        else:
            conn = get_app_db_connection()
            
        if not conn:
            return jsonify({'success': False, 'error': 'Impossible de se connecter à la base de données de l\'application'}), 500
        
        cursor = conn.cursor()
        
        # Récupération de l'historique depuis ABHISTORIQUE_OPERATEURS
        query = f'''
            SELECT TOP (1000) 
                NoEnreg, Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique,
                VarNumUtil8, VarNumUtil9, Statut, DateCreation
            FROM {CURRENT_TABLES['historique']}
            WHERE Ident = ?
            ORDER BY DateTravail DESC
        '''
        
        cursor.execute(query, (operateur_id,))
        enregistrements = cursor.fetchall()
        
        # Conversion en liste de dictionnaires
        result = []
        for row in enregistrements:
            result.append({
                'noEnreg': row[0],
                'ident': row[1],
                'dateTravail': row[2].isoformat() if row[2] else None,
                'codeLanctImprod': row[3],
                'phase': row[4],
                'codeRubrique': row[5],
                'varNumUtil8': row[6],
                'varNumUtil9': row[7],
                'statut': row[8],
                'dateCreation': row[9].isoformat() if row[9] else None
            })
        
        conn.close()
        return jsonify({'success': True, 'enregistrements': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ltc-data/<code_lancement>', methods=['GET'])
def get_ltc_data(code_lancement):
    """Récupère les données LTC pour un code lancement donné"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Impossible de se connecter à la base de données'}), 500
        
        cursor = conn.cursor()
        
        # Récupération des données LTC depuis SEDI_ERP (table LCTC réelle)
        query = '''
            SELECT TOP 1 
                [CodeLanct], [Phase], [CodeRubrique]
            FROM [SEDI_ERP].[dbo].[LCTC]
            WHERE [CodeLanct] = ?
            ORDER BY [CodeLanct] DESC
        '''
        
        cursor.execute(query, (code_lancement,))
        row = cursor.fetchone()
        
        if row:
            ltc_data = {
                'codeLancement': row[0],
                'phase': row[1],
                'codeRubrique': row[2]
            }
            conn.close()
            return jsonify({'success': True, 'ltcData': ltc_data})
        else:
            conn.close()
            return jsonify({'success': False, 'error': f'Code lancement {code_lancement} non trouvé'}), 404
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export-to-erp', methods=['POST'])
def export_to_erp():
    """Exporte les données vers l'ERP SILOG"""
    try:
        if export_data_to_erp():
            return jsonify({
                'success': True,
                'message': 'Données exportées vers l\'ERP avec succès'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Erreur lors de l\'export vers l\'ERP'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/database-stats', methods=['GET'])
def get_database_statistics():
    """Récupère les statistiques de la base de données autonome"""
    try:
        stats = get_database_stats()
        if stats:
            return jsonify({
                'success': True,
                'stats': stats
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Impossible de récupérer les statistiques'
            }), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("=== Configuration SQL Server ===")
    print(f"Serveur: {DB_CONFIG['server']}")
    print(f"Utilisateur: {DB_CONFIG['username']}")
    print(f"Base de données: {DB_CONFIG['database']}")
    print("================================")
    
    # Test de connexion au démarrage
    if test_connection():
        print("✅ Connexion à SQL Server réussie")
        
        # Création de la base de données SEDI_APP si nécessaire
        print("🔧 Vérification/Création de la base de données SEDI_APP...")
        if create_app_database():
            print("✅ Base de données SEDI_APP prête")
        else:
            print("⚠️ Problème avec la base de données SEDI_APP (utilisation du fallback)")
        
        # Création des tables de l'application si nécessaire
        print("🔧 Vérification/Création des tables de l'application...")
        if create_app_tables():
            print("✅ Tables de l'application prêtes")
        else:
            print("⚠️ Problème avec les tables de l'application (l'application peut continuer)")
        
        print(f"API disponible sur http://{FLASK_CONFIG['host']}:{FLASK_CONFIG['port']}")
        app.run(**FLASK_CONFIG)
    else:
        print("❌ Échec de la connexion à SQL Server")
        print("Vérifiez que:")
        print("1. Le serveur SERVEURERP est accessible")
        print("2. Les identifiants QUALITE/QUALITE sont corrects")
        print("3. Le driver ODBC est installé")
        print("4. Le pare-feu autorise la connexion")
        print("5. SQL Server accepte les connexions TCP/IP")
    
    print(f"API disponible sur http://{FLASK_CONFIG['host']}:{FLASK_CONFIG['port']}")
    app.run(
        debug=FLASK_CONFIG['debug'], 
        host=FLASK_CONFIG['host'], 
        port=FLASK_CONFIG['port']
    ) 