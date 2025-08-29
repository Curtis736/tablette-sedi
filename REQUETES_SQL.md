# 📋 Requêtes SQL pour consulter les données

## 🗄️ Base de données autonome : SEDI_APP_INDEPENDANTE

### 📊 **Statistiques générales**
```sql
-- Compter les enregistrements par table
SELECT 'ABTEMPS_OPERATEURS' as TableName, COUNT(*) as Count 
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABTEMPS_OPERATEURS]
UNION ALL
SELECT 'ABHISTORIQUE_OPERATEURS' as TableName, COUNT(*) as Count 
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
UNION ALL
SELECT 'ABSESSIONS_OPERATEURS' as TableName, COUNT(*) as Count 
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABSESSIONS_OPERATEURS]
```

### 👥 **Travaux en cours (opérateurs actifs)**
```sql
SELECT 
    Ident as Operateur,
    DateTravail,
    CodeLanctImprod as CodeLT,
    Phase,
    CodeRubrique,
    VarNumUtil8 as TempsMinutes,
    VarNumUtil9 as TempsSecondes,
    Statut,
    DateCreation
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABTEMPS_OPERATEURS]
WHERE Statut = 'EN_COURS'
ORDER BY DateCreation DESC
```

### 📋 **Historique complet (tous les travaux terminés)**
```sql
SELECT 
    Ident as Operateur,
    DateTravail,
    CodeLanctImprod as CodeLT,
    Phase,
    CodeRubrique,
    VarNumUtil8 as TempsMinutes,
    VarNumUtil9 as TempsSecondes,
    Statut,
    DateCreation
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
ORDER BY DateCreation DESC
```

### 👤 **Historique par opérateur**
```sql
-- Remplacer '140972' par le code opérateur souhaité
SELECT 
    Ident as Operateur,
    DateTravail,
    CodeLanctImprod as CodeLT,
    Phase,
    CodeRubrique,
    VarNumUtil8 as TempsMinutes,
    VarNumUtil9 as TempsSecondes,
    Statut,
    DateCreation
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
WHERE Ident = '140972'
ORDER BY DateCreation DESC
```

### 📅 **Travaux par date**
```sql
-- Travaux du jour
SELECT 
    Ident as Operateur,
    CodeLanctImprod as CodeLT,
    Phase,
    CodeRubrique,
    VarNumUtil8 as TempsMinutes,
    VarNumUtil9 as TempsSecondes,
    Statut
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
WHERE CAST(DateTravail AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY DateCreation DESC
```

### ⏱️ **Temps de travail total par opérateur**
```sql
SELECT 
    Ident as Operateur,
    COUNT(*) as NombreTravaux,
    SUM(VarNumUtil8) as TotalMinutes,
    SUM(VarNumUtil9) as TotalSecondes,
    SUM(VarNumUtil8) + (SUM(VarNumUtil9) / 60) as TotalHeures
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
GROUP BY Ident
ORDER BY TotalHeures DESC
```

### 📊 **Statistiques par phase**
```sql
SELECT 
    Phase,
    COUNT(*) as NombreTravaux,
    AVG(VarNumUtil8) as TempsMoyenMinutes,
    SUM(VarNumUtil8) as TempsTotalMinutes
FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
GROUP BY Phase
ORDER BY NombreTravaux DESC
```

## 🔄 **Après export vers l'ERP**

### 📥 **Données exportées (table temporaire)**
```sql
-- Voir toutes les données exportées
SELECT * FROM [SEDI_ERP].[dbo].[TEMP_IMPORT_APP]
ORDER BY DateCreation DESC
```

### 📊 **Statistiques des données exportées**
```sql
SELECT 
    COUNT(*) as TotalEnregistrements,
    COUNT(DISTINCT Ident) as NombreOperateurs,
    COUNT(DISTINCT CodeLanctImprod) as NombreLancements,
    MIN(DateCreation) as PremiereDonnee,
    MAX(DateCreation) as DerniereDonnee
FROM [SEDI_ERP].[dbo].[TEMP_IMPORT_APP]
```

## 🗂️ **Tables de référence ERP**

### 👥 **Liste des opérateurs**
```sql
SELECT 
    Coderessource as Operateur,
    Designation1 as Nom
FROM [SEDI_ERP].[dbo].[RESSOURC]
ORDER BY Coderessource
```

### 📋 **Données LCTC (Lancements)**
```sql
SELECT TOP 1000
    CodeLancement,
    Phase,
    CodeRubrique
FROM [SEDI_ERP].[dbo].[LCTC]
ORDER BY CodeLancement DESC
```

## 🔧 **Maintenance et nettoyage**

### 🧹 **Nettoyer les données anciennes**
```sql
-- Supprimer les données de plus de 30 jours
DELETE FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
WHERE DateCreation < DATEADD(day, -30, GETDATE())

-- Supprimer les sessions anciennes
DELETE FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABSESSIONS_OPERATEURS]
WHERE DateCreation < DATEADD(day, -7, GETDATE())
```

### 📊 **Vérifier l'intégrité des données**
```sql
-- Trouver les enregistrements sans opérateur
SELECT * FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
WHERE Ident IS NULL OR Ident = ''

-- Trouver les enregistrements sans code lancement
SELECT * FROM [SEDI_APP_INDEPENDANTE].[dbo].[ABHISTORIQUE_OPERATEURS]
WHERE CodeLanctImprod IS NULL OR CodeLanctImprod = ''
```

## 📱 **Interface web**

### 🌐 **URLs d'accès**
- **Interface Opérateur** : `http://localhost:3000/operateur`
- **Interface Admin** : `http://localhost:3000/admin`
- **API Backend** : `http://localhost:5000`

### 🔐 **Identifiants**
- **Admin** : `admin123`
- **Opérateur** : Code opérateur (ex: 140972) 