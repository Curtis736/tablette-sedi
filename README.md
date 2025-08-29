# Application de Suivi Mode Opératoire - SQL Server

Cette application permet de gérer les opérateurs et d'enregistrer leurs temps de travail depuis votre serveur SQL Server avec des interfaces dédiées pour les opérateurs et l'administration.

## Fonctionnalités

- **Connexion SQL Server** : Intégration directe avec votre serveur SERVEURERP
- **Interface Opérateur** : Saisie des temps de travail par tablette
- **Interface d'administration sécurisée** : Accès protégé par mot de passe
- **Liste des opérateurs** : Affichage de tous les opérateurs depuis la table RESSOURC
- **Enregistrement automatique** : Données sauvegardées dans la table abetemps_temp
- **Historique des opérateurs** : Consultation des enregistrements par opérateur
- **Requête SQL intégrée** : Utilise votre requête exacte pour récupérer les opérateurs
- **Interface moderne** : Design responsive et intuitif
- **Statut de connexion** : Indicateur visuel de l'état de la connexion SQL Server

## Structure du projet

```
├── backend/
│   ├── app.py              # API Flask avec connexion SQL Server
│   ├── config.py           # Configuration de la base de données
│   └── requirements.txt    # Dépendances Python
├── frontend/
│   ├── src/
│   │   ├── App.js          # Application React principale
│   │   ├── AdminPage.js    # Page d'administration
│   │   └── index.js        # Point d'entrée React
│   └── package.json        # Dépendances Node.js
├── install.bat             # Script d'installation Windows
└── README.md
```

## Installation et démarrage

### Installation automatique (Windows)

Double-cliquez sur `install.bat` pour installer automatiquement toutes les dépendances et tester la connexion SQL Server.

### Installation manuelle

#### Prérequis

1. **Driver ODBC SQL Server** : Installez [Microsoft ODBC Driver 17 for SQL Server](https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
2. **Python 3.7+** : Assurez-vous que Python est installé
3. **Node.js** : Installez Node.js pour le frontend

#### Backend (Flask)

1. Naviguez vers le dossier backend :
```bash
cd backend
```

2. Installez les dépendances Python :
```bash
pip install -r requirements.txt
```

3. Vérifiez la connexion SQL Server :
```bash
python app.py
```

Le serveur sera accessible sur `http://localhost:5000`

### Frontend (React)

1. Naviguez vers le dossier frontend :
```bash
cd frontend
```

2. Installez les dépendances Node.js :
```bash
npm install
```

3. Démarrez l'application React :
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## Configuration SQL Server

L'application est configurée pour se connecter à votre serveur SQL Server avec les paramètres suivants :

- **Serveur** : SERVEURERP
- **Utilisateur** : QUALITE
- **Mot de passe** : QUALITE
- **Base de données** : master (modifiable dans `backend/config.py`)

Pour modifier ces paramètres, éditez le fichier `backend/config.py`.

## Utilisation

### Interface Opérateur
1. Ouvrez votre navigateur et allez sur `http://localhost:3000`
2. Cliquez sur "Opérateur" dans la navigation
3. Entrez votre code opérateur (ex: OP001)
4. Saisissez un **Code Lancement (LT)** et cliquez sur 🔍 pour récupérer automatiquement les informations depuis la table LCTC
5. Les champs Phase, Type Rubrique et Code Rubrique se remplissent automatiquement
6. Complétez avec le temps de travail :
   - Temps en minutes (obligatoire)
   - Temps en secondes (optionnel)
7. Cliquez sur "Enregistrer les données"

### Interface Administration
1. Cliquez sur "Administration" dans la navigation
2. Entrez le mot de passe : `admin123`
3. Vérifiez que l'indicateur SQL Server affiche "🟢 SQL Server OK"
4. Consultez la liste des opérateurs
5. Cliquez sur "📊 Historique" pour voir les enregistrements d'un opérateur

## Requête SQL utilisée

L'application utilise exactement votre requête SQL :

```sql
SELECT CodeRessource as 'Opérateur', Designation as 'Nom' 
FROM RESSOURC 
WHERE Typeressource='O' and Profilon='O'
```

## API Endpoints

- `GET /api/operateurs` : Récupère la liste des opérateurs
- `GET /api/health` : Vérifie l'état de l'API et de la base de données
- `GET /api/test-connection` : Teste la connexion à SQL Server
- `GET /api/ltc-data/<code>` : Récupère les données LTC pour un code lancement
- `POST /api/enregistrer-temps` : Enregistre les données de temps de travail
- `GET /api/historique-operateur/<id>` : Récupère l'historique d'un opérateur

## Base de données SQL Server

L'application se connecte à votre serveur SQL Server SERVEURERP et utilise :

### Table RESSOURC (Opérateurs)
- `Coderessource` : Code de l'opérateur
- `Designation1` : Nom de l'opérateur
- `Profilon` : Profil en ligne ('O' pour opérateur)
- `Datecreation` : Date de création

### Table LCTC (Lancements)
- `CodeLancement` : Code du lancement
- `Phase` : Phase associée
- `TypeRubrique` : Type de rubrique
- `CodeRubrique` : Code de rubrique

### Table abetemps_temp (Temps de travail)
- `NoEnreg` : Numéro d'enregistrement (auto-incrémenté)
- `Ident` : Identifiant de l'opérateur
- `DateTravail` : Date et heure de l'enregistrement
- `CodeLanctImprod` : Code lancement (récupéré depuis LCTC)
- `Phase` : Phase de travail (récupérée depuis LCTC)
- `VarNumUtil8` : Temps de travail en minutes (saisie opérateur)
- `VarNumUtil9` : Temps de travail en secondes (saisie opérateur)

## Dépannage

### Problèmes de connexion SQL Server

1. **Driver ODBC manquant** : Installez Microsoft ODBC Driver 17 for SQL Server
2. **Serveur inaccessible** : Vérifiez que SERVEURERP est accessible depuis votre machine
3. **Identifiants incorrects** : Vérifiez les paramètres dans `backend/config.py`
4. **Pare-feu** : Autorisez les connexions TCP/IP sur le port 1433
5. **SQL Server** : Activez les connexions TCP/IP dans SQL Server Configuration Manager

## Sécurité

- L'accès à l'administration est protégé par mot de passe
- Les données sont récupérées de manière sécurisée via l'API
- CORS est configuré pour permettre la communication frontend/backend

## Personnalisation

Pour modifier la requête SQL ou ajouter de nouveaux champs, modifiez le fichier `backend/app.py` dans la fonction `get_operateurs()`. 