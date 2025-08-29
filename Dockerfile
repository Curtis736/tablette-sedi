# Multi-stage build pour optimiser l'image
FROM node:18-alpine AS frontend-build

# Build du frontend React
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Image finale avec Python pour le backend
FROM python:3.11-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    software-properties-common \
    unixodbc \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Installer le driver ODBC SQL Server
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/11/prod bullseye main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Créer l'utilisateur de l'application
RUN useradd -m -u 1000 appuser
WORKDIR /app

# Copier et installer les dépendances Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt pyodbc gunicorn

# Copier le backend
COPY backend/ ./

# Copier le frontend build depuis l'étape précédente
COPY --from=frontend-build /app/frontend/build ./static

# Créer un script pour servir le frontend avec Flask
RUN echo "from flask import Flask, send_from_directory\n\
import os\n\
from app import app as main_app\n\
\n\
@main_app.route('/', defaults={'path': ''})\n\
@main_app.route('/<path:path>')\n\
def serve_frontend(path):\n\
    if path != '' and os.path.exists(os.path.join('/app/static', path)):\n\
        return send_from_directory('/app/static', path)\n\
    else:\n\
        return send_from_directory('/app/static', 'index.html')\n\
\n\
if __name__ == '__main__':\n\
    main_app.run(host='0.0.0.0', port=5000, debug=False)" > app_with_frontend.py

# Changer le propriétaire des fichiers
RUN chown -R appuser:appuser /app
USER appuser

# Variables d'environnement
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Exposer le port
EXPOSE 5000

# Commande de démarrage avec Gunicorn pour la production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app_with_frontend:main_app"] 