# ===== STAGE 1: Build Frontend =====
FROM node:18-bullseye-slim AS frontend-build

WORKDIR /app/frontend

# Copier et installer les dépendances (inclus devDependencies pour react-scripts)
COPY frontend/package*.json ./
RUN npm install

# Copier le code source et construire
COPY frontend/ ./
RUN node node_modules/react-scripts/scripts/build.js

# ===== STAGE 2: Production Flask App =====
FROM python:3.11-slim

# Variables d'environnement
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    ca-certificates \
    unixodbc \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Installer Microsoft ODBC Driver (force Debian 12 pour compatibilité)
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Créer utilisateur non-root
RUN useradd -m -u 1000 appuser

# Répertoire de travail
WORKDIR /app

# Installer les dépendances Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt pyodbc gunicorn

# Copier le code backend
COPY backend/ ./

# Copier le build frontend depuis l'étape précédente
COPY --from=frontend-build /app/frontend/build ./static

# Créer le fichier pour servir le frontend avec Flask
RUN printf 'from flask import send_from_directory\n\
import os\n\
from app import app as main_app\n\
\n\
@main_app.route("/", defaults={"path": ""})\n\
@main_app.route("/<path:path>")\n\
def serve_frontend(path):\n\
    if path != "" and os.path.exists(os.path.join("/app/static", path)):\n\
        return send_from_directory("/app/static", path)\n\
    else:\n\
        return send_from_directory("/app/static", "index.html")\n\
\n\
if __name__ == "__main__":\n\
    main_app.run(host="0.0.0.0", port=5000, debug=False)\n' > app_with_frontend.py

# Changer les permissions
RUN chown -R appuser:appuser /app

# Basculer vers l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5000

# Démarrer avec Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app_with_frontend:main_app"]