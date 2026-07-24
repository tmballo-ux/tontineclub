# Déploiement TontineClub

Il existe deux façons d'utiliser ce dossier `deploy/` :

## 1. VPS partagé TMBSAAS (utilisé actuellement — 54.39.98.173)

TontineClub est hébergé sur le VPS TMBSAAS aux côtés de plusieurs autres
SaaS, derrière le `nginx-proxy` central déjà en place sur le serveur.
Dans ce mode :
- **`docker-compose.yml`** ne lance QUE les conteneurs `tontineclub-backend`
  et `tontineclub-frontend` (pas de nginx/certbot ici — gérés de façon
  centralisée sur le VPS, voir `MASTER_GUIDE_DEPLOIEMENT_TMBSAAS.docx`)
- Les conteneurs sont ensuite connectés au réseau Docker de `nginx-proxy`
  via `docker network connect`
- Un bloc `server {}` est ajouté à la config nginx centrale du VPS
  (`/home/ubuntu/saas-apps/nginx-config/default.conf`)
- Le dossier `nginx/` et les scripts `setup-ssl.sh` / `setup-server.sh`
  de ce dossier **ne sont pas utilisés** dans ce mode (résidus de
  l'option 2 ci-dessous, gardés pour référence)

## 2. Déploiement autonome (serveur dédié uniquement à TontineClub)

Si un jour TontineClub est déplacé vers son propre serveur dédié (plus de
VPS partagé), le dossier `nginx/` et les scripts dans `scripts/` reprennent
leur utilité : `docker-compose.yml` devrait alors être adapté pour
réintégrer les services `nginx` et `certbot` autonomes (voir historique
git pour la version originale de ce fichier, avant l'intégration TMBSAAS).

---
Ports assignés sur le VPS TMBSAAS : **8016** (backend) / **3016** (frontend)
Domaine : **tontineclub.tmbsaas.com**
Base de données : **MongoDB Atlas** (pas de conteneur MongoDB local pour ce projet)
