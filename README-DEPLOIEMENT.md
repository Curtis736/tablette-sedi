# 🚀 Guide de Déploiement pour Tablettes

## ✅ **Solution Simple Recommandée**

### **1. Démarrage Rapide**
```bash
# Double-cliquer sur ce fichier :
start-production.bat
```

### **2. Configuration automatique**
- ✅ **Backend Flask** : Port 5000
- ✅ **Frontend React** : Port 3000
- ✅ **Mode de base de données** : Configuré dans `backend/config.py`

### **3. Accès depuis les tablettes**
```
URL : http://[IP_DU_SERVEUR]:3000

Exemples :
- http://192.168.1.100:3000
- http://10.0.0.50:3000
```

## 🌐 **Trouver l'IP du serveur**

### **Windows**
```cmd
ipconfig | findstr "IPv4"
```

### **Résultat exemple**
```
Adresse IPv4. . . . . . . . . . . . . . : 192.168.1.100
```
➡️ **URL tablettes** : `http://192.168.1.100:3000`

## 📱 **Configuration Tablettes**

### **1. Connexion WiFi**
- Connecter la tablette au même réseau que le serveur

### **2. Navigateur**
- Ouvrir Chrome/Edge/Safari
- Saisir l'URL : `http://[IP_SERVEUR]:3000`

### **3. Mode App (Optionnel)**
- **Android** : Menu ⋮ → "Ajouter à l'écran d'accueil"
- **iPad** : Partager → "Sur l'écran d'accueil"

## 🔄 **Maintenir l'application active**

### **Option A : Laisser les fenêtres ouvertes**
- Garder les 2 fenêtres CMD ouvertes
- Simple mais nécessite que l'utilisateur reste connecté

### **Option B : Service Windows (avec droits admin)**
```cmd
# Exécuter en tant qu'administrateur
install-service.bat
```

### **Option C : Tâche programmée**
1. **Ouvrir** : Gestionnaire des tâches → Bibliothèque du planificateur de tâches
2. **Créer une tâche de base**
3. **Déclencheur** : Au démarrage
4. **Action** : Démarrer un programme
5. **Programme** : `C:\chemin\vers\start-production.bat`

## ⚠️ **Configuration Réseau**

### **Pare-feu Windows**
```cmd
# Ouvrir les ports (en tant qu'administrateur)
netsh advfirewall firewall add rule name="SuiviMO-Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="SuiviMO-Frontend" dir=in action=allow protocol=TCP localport=3000
```

### **Test de connectivité**
```cmd
# Depuis une tablette, tester :
ping [IP_SERVEUR]
```

## 🗄️ **Configuration Base de Données**

### **Mode Simulation (par défaut)**
- Parfait pour tester l'interface
- Données stockées en mémoire
- Pas de SQL Server requis

### **Mode Production (SQL Server)**
Modifier `backend/config.py` :
```python
SIMULATION_MODE = False  # Activer SQL Server
```

## 📊 **URLs Importantes**

- **🏠 Accueil** : `http://[IP]:3000`
- **👷 Opérateur** : `http://[IP]:3000/operateur`
- **⚙️ Administration** : `http://[IP]:3000/admin`
- **🔧 API Santé** : `http://[IP]:5000/api/health`

## 🛠️ **Dépannage**

### **Problème : Page ne charge pas**
1. Vérifier que les 2 services sont démarrés
2. Tester : `http://localhost:3000` depuis le serveur
3. Vérifier le pare-feu
4. Redémarrer avec `start-production.bat`

### **Problème : Erreur SQL Server**
1. Activer le mode simulation dans `config.py`
2. Ou configurer correctement SQL Server

### **Problème : Tablette ne se connecte pas**
1. Vérifier que tablette et serveur sont sur le même réseau
2. Tester : `ping [IP_SERVEUR]` depuis la tablette
3. Vérifier le pare-feu Windows

## 📞 **Support**

- **Mode simulation** : Fonctionne toujours, parfait pour tester
- **Logs** : Consultables dans les fenêtres CMD
- **Redémarrage** : Fermer les fenêtres et relancer `start-production.bat` 