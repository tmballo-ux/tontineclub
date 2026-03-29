#!/bin/bash
# ============================================
# TontineClub — Script de déploiement
# ============================================

set -e

echo "================================================"
echo "  TontineClub — Déploiement Production"
echo "================================================"

# Vérifications
if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production manquant !"
    echo "   Copiez .env.production.example et remplissez les valeurs."
    exit 1
fi

if [ ! -d certbot/conf/live/api.tmbsaas.com ]; then
    echo "❌ Certificats SSL manquants !"
    echo "   Lancez d'abord : bash scripts/setup-ssl.sh"
    exit 1
fi

# Build et démarrage
echo "\n[1/3] Build des images Docker..."
docker compose build --no-cache

echo "\n[2/3] Démarrage des services..."
docker compose up -d

echo "\n[3/3] Vérification..."
sleep 5

# Health check
if curl -sf http://localhost:8001/api/health > /dev/null; then
    echo "✅ API en ligne !"
else
    echo "⚠️  L'API ne répond pas encore, vérifiez les logs :"
    echo "   docker compose logs api"
fi

echo ""
echo "================================================"
echo "  ✅ Déploiement terminé !"
echo "  API : https://api.tmbsaas.com/api/health"
echo "  Docs : https://api.tmbsaas.com/api/docs"
echo "================================================"
echo ""
echo "Commandes utiles :"
echo "  docker compose logs -f api    # Voir les logs"
echo "  docker compose restart api    # Redémarrer l'API"
echo "  docker compose down            # Tout arrêter"
echo "  docker compose up -d           # Tout relancer"
