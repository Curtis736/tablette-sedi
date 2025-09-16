# Configuration de la base de données SQL Server
DB_CONFIG = {
    'server': 'SERVEURERP',  # Nom du serveur SQL Server
    'database': 'SEDI_APP_INDEPENDANTE',  # Base de données principale avec vues
    'database_app': 'SEDI_APP_INDEPENDANTE',  # Base autonome pour l'application
    'database_fallback': 'SEDI_ERP',  # Base de fallback si SEDI_APP inaccessible 
    'database_erp': 'SEDI_ERP',  # Base ERP SILOG pour accès direct
    'username': 'QUALITE',
    'password': 'QUALITE',
    'driver': '{ODBC Driver 17 for SQL Server}',  # ou '{SQL Server}' selon votre installation
    'trust_server_certificate': 'yes',
    'encrypt': 'yes'
}

# Configuration de l'API Flask
FLASK_CONFIG = {
    'host': '0.0.0.0',
    'port': 5000,
    'debug': True
}

# Messages d'erreur
ERROR_MESSAGES = {
    'connection_failed': 'Impossible de se connecter à SQL Server',
    'query_failed': 'Erreur lors de l\'exécution de la requête',
    'driver_not_found': 'Driver ODBC non trouvé. Installez Microsoft ODBC Driver for SQL Server',
    'server_unreachable': 'Serveur SERVEURERP non accessible',
    'invalid_credentials': 'Identifiants QUALITE/QUALITE incorrects'
}

# Tables de l'application dans la base autonome
APP_TABLES = {
    'temps_travail': '[SEDI_APP_INDEPENDANTE].[dbo].[ABTEMPS_OPERATEURS]',
    'historique': '[SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]',
    'sessions': '[SEDI_APP_INDEPENDANTE].[dbo].[ABSESSIONS_OPERATEURS]'
}

# Tables de fallback dans SEDI_ERP
FALLBACK_TABLES = {
    'temps_travail': '[SEDI_ERP].[dbo].[ABTEMPS_OPERATEURS]',
    'historique': '[SEDI_ERP].[dbo].[ABHISTORIQUE_OPERATEURS]',
    'sessions': '[SEDI_ERP].[dbo].[ABSESSIONS_OPERATEURS]'
}

# Mode de fonctionnement (True = simulation, False = vraies tables)
SIMULATION_MODE = False  # Désactivé pour utiliser la vraie base de données 