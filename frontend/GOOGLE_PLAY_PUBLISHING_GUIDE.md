# 📱 Guide de Publication TontineClub sur Google Play Store

## Configuration Actuelle

L'application est configurée avec:
- **Package Android**: `com.tontineclub.app`
- **Version**: 1.0.0
- **Version Code**: 1
- **API Android**: Compatible avec les versions récentes requises par Google Play

## Étapes pour Publier sur Google Play Store

### 1️⃣ Exporter le Code depuis Emergent

1. Dans Emergent, cliquez sur **"Save to GitHub"** (icône GitHub en haut)
2. Connectez votre compte GitHub
3. Créez un nouveau repository ou utilisez un existant
4. Le code complet sera exporté vers votre GitHub

### 2️⃣ Configurer votre Environnement Local

```bash
# Cloner le repository
git clone https://github.com/votre-username/tontineclub.git
cd tontineclub/frontend

# Installer les dépendances
npm install -g eas-cli
npm install

# Se connecter à Expo
eas login
```

### 3️⃣ Configurer le Projet Expo

```bash
# Initialiser EAS pour votre projet
eas init

# Cela va créer un projectId unique pour votre app
# Mettez à jour app.json avec ce projectId
```

### 4️⃣ Créer les Icônes de l'Application

**Icônes requises:**
- `icon.png` - 1024x1024 pixels (icône principale)
- `adaptive-icon.png` - 1024x1024 pixels (icône adaptative Android)
- `splash-icon.png` - 288x288 pixels (écran de chargement)

**Outil recommandé:** https://www.appicon.co/ ou Figma

**Design suggéré pour TontineClub:**
- Cercle bleu (#2563EB) avec "TC" en blanc
- Ou une icône de tirelire/portefeuille stylisée

### 5️⃣ Générer le Fichier .aab pour le Play Store

```bash
# Build de production pour Android
eas build -p android --profile production

# Cela va:
# - Compiler l'application native
# - Générer la clé de signature (stockée par Expo)
# - Produire le fichier .aab

# Télécharger le .aab une fois le build terminé
eas build:download -p android
```

### 6️⃣ Créer un Compte Google Play Developer

1. Allez sur https://play.google.com/console/
2. Créez un compte développeur (frais unique de 25$)
3. Complétez les informations de votre profil

### 7️⃣ Préparer les Assets pour le Play Store

**Captures d'écran requises:**
- Minimum 2 captures d'écran
- Taille: 1080x1920 pixels (portrait) recommandée
- Écrans suggérés:
  - Écran d'accueil
  - Tableau de bord
  - Liste des tontines
  - Détail d'une tontine
  - Écran des paiements

**Icône Play Store:**
- 512x512 pixels PNG sans transparence

**Bannière (Feature Graphic):**
- 1024x500 pixels

### 8️⃣ Soumettre l'Application

1. **Créer une nouvelle application** dans la Play Console
2. **Configurer la fiche Play Store:**
   - Titre: TontineClub
   - Description courte: Gérez vos tontines en toute simplicité
   - Description complète: (voir ci-dessous)
   - Catégorie: Finance
   - Balises: tontine, épargne, gestion financière

3. **Téléverser le fichier .aab**
4. **Compléter la politique de confidentialité** (obligatoire)
5. **Répondre au questionnaire de contenu**
6. **Définir les pays de distribution**
7. **Soumettre pour révision**

### 📝 Description suggérée pour le Play Store

**Description courte (80 caractères max):**
```
Gérez vos tontines facilement: cotisations, membres, calendrier des tours.
```

**Description complète:**
```
TontineClub est l'application idéale pour gérer vos tontines de manière simple, transparente et organisée.

✨ FONCTIONNALITÉS PRINCIPALES

📋 Création de Tontines
- Définissez le nom, montant et fréquence (hebdo/mensuel)
- Invitez vos membres par email
- Choisissez l'ordre des bénéficiaires manuellement ou par tirage aléatoire

💰 Suivi des Cotisations
- Chaque membre annonce son paiement
- Le bénéficiaire confirme la réception
- Historique complet de toutes les transactions

👥 Gestion des Membres
- Invitations avec acceptation/refus
- Calendrier clair des tours
- Notifications automatiques

📊 Tableau de Bord
- Vue d'ensemble de vos tontines
- Invitations en attente
- Rappels de cotisation

🔒 Simple et Sécurisé
- Pas de paiement en ligne dans l'app
- Vous gérez vos paiements dans la vraie vie
- L'app assure le suivi et la transparence

Parfait pour les tontines familiales, entre amis ou collègues!

Téléchargez TontineClub et simplifiez la gestion de vos tontines dès aujourd'hui.
```

## ⚠️ Points Importants

### Backend / Serveur
L'application nécessite un backend fonctionnel. Vous devrez:
1. Déployer le backend sur un serveur cloud (Railway, Render, AWS, etc.)
2. Configurer une base de données MongoDB (MongoDB Atlas recommandé)
3. Mettre à jour l'URL du backend dans l'application avant le build

### Variables d'Environnement pour Production
Créez un fichier `.env.production`:
```
EXPO_PUBLIC_BACKEND_URL=https://votre-backend-production.com
```

### Politique de Confidentialité
Google Play exige une politique de confidentialité. Créez-en une qui couvre:
- Données collectées (email, téléphone, nom)
- Utilisation des données
- Protection des données
- Contact

## 📞 Support

Pour toute question sur le processus de publication:
- Documentation Expo: https://docs.expo.dev/submit/android/
- Console Google Play: https://support.google.com/googleplay/android-developer/

---
*Ce guide est spécifique à l'application TontineClub développée sur Emergent.*
