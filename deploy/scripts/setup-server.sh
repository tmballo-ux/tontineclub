#!/bin/bash
# ============================================
# TontineClub — Script d'installation serveur
# Compatible: Ubuntu 22.04 / 24.04 LTS
# ============================================

set -e

echo "================================================"
echo "  TontineClub — Installation du serveur"
echo "================================================"

# 1. Mise à jour système
echo "\n[1/6] Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# 2. Installer Docker
echo "\n[2/6] Installation de Docker..."
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# 3. Installer Docker Compose
echo "\n[3/6] Installation de Docker Compose..."
sudo apt install -y docker-compose-plugin

# 4. Installer utilitaires
echo "\n[4/6] Installation des utilitaires..."
sudo apt install -y curl git ufw

# 5. Configurer le firewall
echo "\n[5/6] Configuration du firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 6. Créer les dossiers
echo "\n[6/6] Création des dossiers..."
mkdir -p ~/tontineclub/certbot/conf
mkdir -p ~/tontineclub/certbot/www

echo ""
echo "================================================"
echo "  ✅ Serveur prêt !"
echo "  Prochaine étape : Configurer DNS puis SSL"
echo "================================================"
