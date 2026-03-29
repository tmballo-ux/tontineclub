#!/bin/bash
# ============================================
# TontineClub — Configuration SSL Let's Encrypt
# ============================================

set -e

DOMAIN="api.tmbsaas.com"
EMAIL="t.mballo@gmail.com"

echo "================================================"
echo "  Configuration SSL pour $DOMAIN"
echo "================================================"

# Étape 1 : Démarrer nginx temporairement (HTTP only)
echo "\n[1/3] Démarrage Nginx en mode HTTP..."

# Créer une config temporaire pour le challenge
cat > /tmp/nginx-temp.conf << 'TEMPCONF'
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name api.tmbsaas.com;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 200 'TontineClub API - SSL setup in progress';
            add_header Content-Type text/plain;
        }
    }
}
TEMPCONF

# Lancer nginx temp
docker run -d --name nginx-temp \
    -p 80:80 \
    -v /tmp/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
    -v $(pwd)/certbot/www:/var/www/certbot \
    nginx:1.25-alpine

echo "\n[2/3] Obtention du certificat SSL..."
sleep 3

# Obtenir le certificat
docker run --rm \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo "\n[3/3] Nettoyage..."
docker stop nginx-temp && docker rm nginx-temp

echo ""
echo "================================================"
echo "  ✅ SSL configuré pour $DOMAIN"
echo "  Certificats dans : ./certbot/conf/"
echo "  Prochaine étape : docker compose up -d"
echo "================================================"
