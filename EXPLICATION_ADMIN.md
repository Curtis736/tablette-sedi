# 📋 Explication pour l'Administrateur SQL Server

## 🎯 **Objectif de l'Application**

Cette application permet aux **opérateurs de production** de saisir leurs temps de travail via des tablettes et aux **managers** de consulter les données de production.

## 🔧 **Fonctionnement Technique**

### **Architecture**
- **Frontend** : Interface web React (tablettes opérateurs + PC administration)
- **Backend** : API Flask qui se connecte à SQL Server
- **Base de données** : SQL Server SERVEURERP (même instance que l'ERP SILOG)

### **Flux de données**
1. **Opérateur saisit un Code Lancement (LT)**
2. **Système récupère automatiquement** les informations depuis la table LCTC
3. **Chronomètre démarre automatiquement** pour mesurer le temps de travail
4. **Données enregistrées** dans la base de données distincte SEDI_APP

## 📊 **Bases de données SQL Server Utilisées**

### **1. Base SEDI_ERP (Lecture seule - Tables ERP)**
```sql
-- Permissions nécessaires : SELECT
SELECT [Coderessource], [Designation1] 
FROM [SEDI_ERP].[dbo].[RESSOURC]

SELECT [CodeLancement], [Phase], [CodeRubrique]
FROM [SEDI_ERP].[dbo].[LCTC]
WHERE [CodeLancement] = ?
```
**Usage** : Récupération des données de référence (opérateurs et lancements)

### **2. Base SEDI_APP (Lecture + Écriture - Tables applicatives)**
```sql
-- Permissions nécessaires : CREATE DATABASE, CREATE TABLE, SELECT, INSERT, UPDATE
-- Tables créées automatiquement par l'application :

-- ABTEMPS_OPERATEURS (sessions en cours)
INSERT INTO [SEDI_APP].[dbo].[ABTEMPS_OPERATEURS] 
(Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique, VarNumUtil8, VarNumUtil9, Statut)

-- ABHISTORIQUE_OPERATEURS (historique complet)
INSERT INTO [SEDI_APP].[dbo].[ABHISTORIQUE_OPERATEURS] 
(Ident, DateTravail, CodeLanctImprod, Phase, CodeRubrique, VarNumUtil8, VarNumUtil9, Statut)

-- ABSESSIONS_OPERATEURS (sessions de travail)
INSERT INTO [SEDI_APP].[dbo].[ABSESSIONS_OPERATEURS] 
(Ident, DateDebut, DateFin, CodeLanctImprod, Phase, CodeRubrique, Statut)
```

## 🔐 **Permissions Requises**

### **Utilisateur : QUALITE**
- **Serveur** : SERVEURERP
- **Bases de données** : SEDI_ERP (lecture), SEDI_APP (création + écriture)

### **Permissions spécifiques :**

#### **1. Sur la base SEDI_ERP (Lecture seule)**
```sql
GRANT SELECT ON [SEDI_ERP].[dbo].[RESSOURC] TO [QUALITE]
GRANT SELECT ON [SEDI_ERP].[dbo].[LCTC] TO [QUALITE]
```

#### **2. Sur la base master (Création de base)**
```sql
-- Permissions pour créer la base SEDI_APP
GRANT CREATE ANY DATABASE TO [QUALITE]
```

#### **3. Sur la base SEDI_APP (Création et écriture)**
```sql
-- Permissions pour créer et écrire dans les tables AB*
GRANT CREATE TABLE ON DATABASE::SEDI_APP TO [QUALITE]
GRANT INSERT ON DATABASE::SEDI_APP TO [QUALITE]
GRANT SELECT ON DATABASE::SEDI_APP TO [QUALITE]
GRANT UPDATE ON DATABASE::SEDI_APP TO [QUALITE]
```

#### **4. Permissions spécifiques sur les tables AB**
```sql
-- Une fois les tables créées, permissions spécifiques
USE [SEDI_APP]
GRANT SELECT, INSERT, UPDATE ON [dbo].[ABTEMPS_OPERATEURS] TO [QUALITE]
GRANT SELECT, INSERT, UPDATE ON [dbo].[ABHISTORIQUE_OPERATEURS] TO [QUALITE]
GRANT SELECT, INSERT, UPDATE ON [dbo].[ABSESSIONS_OPERATEURS] TO [QUALITE]
```

## 📈 **Impact Business**

### **Avantages pour la production :**
- ✅ **Suivi temps réel** des opérations
- ✅ **Traçabilité complète** des lancements
- ✅ **Optimisation des processus** grâce aux données collectées
- ✅ **Interface intuitive** pour les opérateurs
- ✅ **Reporting automatique** pour les managers
- ✅ **Séparation complète** : Base SEDI_APP indépendante de l'ERP

### **Données collectées :**
- **Qui** : Opérateur (Ident)
- **Quand** : Date/heure de travail (DateTravail)
- **Quoi** : Code lancement et phase (CodeLanctImprod, Phase)
- **Combien** : Temps de travail (VarNumUtil8 minutes, VarNumUtil9 secondes)
- **Statut** : EN_COURS, TERMINE, PAUSE

## 🚨 **Sécurité**

### **Mesures de sécurité :**
- ✅ **Utilisateur dédié** : QUALITE (pas d'accès admin)
- ✅ **Permissions minimales** : Seulement SELECT/INSERT/UPDATE nécessaires
- ✅ **Pas d'accès DELETE** : Protection contre la suppression accidentelle
- ✅ **Base séparée** : SEDI_APP complètement indépendante de l'ERP
- ✅ **Interface sécurisée** : Mot de passe admin requis

### **Audit trail :**
- Tous les enregistrements sont horodatés
- Traçabilité complète des modifications
- Historique consultable par opérateur
- Séparation claire entre données ERP et données applicatives

## 🔧 **Scripts SQL pour l'Administrateur**

### **1. Vérifier les permissions actuelles :**
```sql
SELECT 
    dp.name AS DatabaseUser,
    dp.type_desc AS UserType,
    sp.name AS DatabaseRole,
    sp.type_desc AS RoleType
FROM sys.database_role_members drm
JOIN sys.database_principals dp ON dp.principal_id = drm.member_principal_id
JOIN sys.database_principals sp ON sp.principal_id = drm.role_principal_id
WHERE dp.name = 'QUALITE'
```

### **2. Accorder les permissions :**
```sql
-- Permissions sur les tables ERP
GRANT SELECT ON [SEDI_ERP].[dbo].[RESSOURC] TO [QUALITE]
GRANT SELECT ON [SEDI_ERP].[dbo].[LCTC] TO [QUALITE]

-- Permissions pour créer la base de données
GRANT CREATE ANY DATABASE TO [QUALITE]

-- Permissions sur la base SEDI_APP (une fois créée)
USE [SEDI_APP]
GRANT CREATE TABLE TO [QUALITE]
GRANT INSERT TO [QUALITE]
GRANT SELECT TO [QUALITE]
GRANT UPDATE TO [QUALITE]
```

### **3. Vérifier que les permissions sont accordées :**
```sql
SELECT 
    p.name AS PrincipalName,
    p.type_desc AS PrincipalType,
    o.name AS ObjectName,
    p2.name AS PermissionName
FROM sys.database_permissions dp
JOIN sys.database_principals p ON dp.grantee_principal_id = p.principal_id
JOIN sys.objects o ON dp.major_id = o.object_id
JOIN sys.database_principals p2 ON dp.grantor_principal_id = p2.principal_id
WHERE p.name = 'QUALITE'
```

## 📞 **Contact Technique**

En cas de problème avec les permissions, l'application affichera des messages d'erreur spécifiques :
- `L'autorisation INSERT a été refusée` → Manque de permission INSERT
- `L'autorisation SELECT a été refusée` → Manque de permission SELECT
- `L'autorisation CREATE DATABASE a été refusée` → Manque de permission CREATE DATABASE
- `L'autorisation CREATE TABLE a été refusée` → Manque de permission CREATE TABLE
- `Nom d'objet non valide` → Base de données ou table inexistante

## ✅ **Test de Validation**

Après avoir accordé les permissions, testez avec :
```sql
-- Test de lecture RESSOURC
SELECT TOP 1 [Coderessource], [Designation1] FROM [SEDI_ERP].[dbo].[RESSOURC]

-- Test de lecture LCTC
SELECT TOP 1 [CodeLancement], [Phase], [CodeRubrique] FROM [SEDI_ERP].[dbo].[LCTC]

-- Test de création base (l'application le fera automatiquement)
-- La base SEDI_APP et les tables AB* seront créées automatiquement au premier démarrage
```

## 🎯 **Conformité avec les recommandations**

✅ **Base de données distincte** : SEDI_APP séparée de l'ERP
✅ **Même instance SQL Server** : Hébergement sur SERVEURERP
✅ **Préfixe AB** : Nommage des tables avec préfixe AB
✅ **Pas d'impact ERP** : Aucune modification des tables ERP existantes
✅ **Séparation complète** : Données applicatives isolées

## 🔄 **Transfert vers SILOG**

Les données collectées dans SEDI_APP peuvent être transférées vers l'ERP SILOG via :
- **Scripts de migration** : Export/Import des données
- **Procédures stockées** : Synchronisation automatique
- **Services d'intégration** : ETL pour le transfert

---

**Note** : Cette application utilise une base de données distincte SEDI_APP pour éviter tout impact sur l'ERP SILOG existant. Les données sont collectées de manière isolée et peuvent être transférées vers SILOG selon les besoins. 