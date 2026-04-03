# 🚀 TontineClub — Guide de Publication Google Play

## ✅ Configuration Production (PRÊTE)

| Paramètre | Valeur |
|---|---|
| **Nom** | TontineClub |
| **Package Android** | `com.tontineclub.app` |
| **versionCode** | 1 |
| **versionName** | 1.0.0 |
| **Build Type** | `.aab` (Android App Bundle) |
| **Gradle** | `:app:bundleRelease` |
| **Icône** | Logo officiel TontineClub |
| **Splash** | Logo sur fond bleu (#2563EB) |
| **Permissions** | CAMERA, READ_MEDIA_IMAGES, INTERNET, ACCESS_NETWORK_STATE |
| **minSdkVersion** | 21 (géré par Expo) |
| **targetSdkVersion** | 35 (dernière stable, géré par Expo SDK 54) |

---

## 📋 PRÉREQUIS (sur votre machine)

1. **Node.js** 18+ installé → [nodejs.org](https://nodejs.org)
2. **Un compte Expo** → Créez-en un sur [expo.dev](https://expo.dev)
3. **EAS CLI** installé :
   ```bash
   npm install -g eas-cli
   ```

---

## 🔧 PROCÉDURE PAS À PAS

### Étape 1 — Récupérer le code source
Téléchargez le code du projet depuis Emergent (bouton "Download Code" ou via Git).

### Étape 2 — Se connecter à Expo
```bash
cd frontend
eas login
```
Entrez vos identifiants Expo (email + mot de passe).

### Étape 3 — Configurer le projet Expo
```bash
eas build:configure --platform android
```
Cela va :
- Créer un `projectId` unique dans votre compte Expo
- Mettre à jour `app.json` avec ce projectId

> ⚠️ **IMPORTANT** : Quand il vous demande le `projectId`, acceptez la création automatique.

### Étape 4 — Lancer le build production .AAB
```bash
eas build --platform android --profile production
```

Le système va vous poser quelques questions :
- **"Generate a new Android Keystore?"** → Répondez **Yes**
  (EAS génère et stocke la clé automatiquement. Vous utiliserez ensuite Google Play App Signing.)
- Le build démarre dans le cloud Expo (~10-15 min)
- Un lien de téléchargement du `.aab` vous sera fourni à la fin

### Étape 5 — Télécharger le .AAB
Une fois le build terminé, EAS affiche un lien :
```
Build complete: https://expo.dev/artifacts/eas/xxxxx.aab
```
Cliquez pour télécharger le fichier `.aab`.

---

## 📱 UPLOAD SUR GOOGLE PLAY CONSOLE

### Étape 6 — Créer l'application
1. Allez sur [Google Play Console](https://play.google.com/console)
2. **Toutes les applications** → **Créer une application**
3. Nom : **TontineClub**
4. Langue par défaut : Français
5. Type : Application
6. Gratuite / Payante : selon votre choix

### Étape 7 — Activer Google Play App Signing
1. Allez dans **Configuration** → **Intégrité de l'application**
2. Section **Signature de l'application par Google Play** → Accepter

### Étape 8 — Créer un test interne
1. Allez dans **Tests** → **Tests internes**
2. **Créer une release**
3. **Uploader le fichier .aab** téléchargé à l'étape 5
4. Ajoutez des notes de version (ex: "Version initiale 1.0.0")
5. **Enregistrer** puis **Examiner la release**

### Étape 9 — Ajouter des testeurs
1. Dans **Tests internes** → **Testeurs**
2. Créez une liste de testeurs avec les emails Google
3. Partagez le lien d'inscription au test

---

## ⚠️ AVANT DE PUBLIER EN PRODUCTION

Avant de passer de "test interne" à "production", Google Play exige :
- ✅ Fiche Play Store complète (description, captures d'écran, icône)
- ✅ Politique de confidentialité (URL)
- ✅ Déclaration de sécurité des données
- ✅ Classification du contenu
- ✅ Tarification et distribution

> 💡 Les captures d'écran et la fiche graphique sont déjà générées dans `/assets/playstore/`.

---

## 🔑 IMPORTANT — URL BACKEND

Le build est configuré avec l'URL backend :
```
EXPO_PUBLIC_BACKEND_URL=https://auth-flow-sync-1.preview.emergentagent.com
```

> ⚠️ Pour la production finale, vous devrez déployer votre backend sur un hébergement permanent (Railway, Render, VPS, etc.) et mettre à jour cette URL dans `eas.json` → `build.production.env`.

---

## 📞 EN CAS DE PROBLÈME

| Problème | Solution |
|---|---|
| "Keystore error" | Supprimez le keystore via `eas credentials --platform android` et regénérez |
| Build échoue | Vérifiez les logs dans le dashboard [expo.dev](https://expo.dev) |
| "Package name already exists" | Changez `com.tontineclub.app` dans `app.json` |
| Upload rejeté par Play Store | Vérifiez que c'est bien un `.aab` (pas `.apk`) |

---

## 🎯 RÉSUMÉ — COMMANDES À LANCER

```bash
# 1. Installer EAS CLI
npm install -g eas-cli

# 2. Se connecter
cd frontend
eas login

# 3. Configurer
eas build:configure --platform android

# 4. Builder (génère le .AAB)
eas build --platform android --profile production

# 5. Télécharger le .aab et uploader sur Google Play Console
```

Durée estimée : **~20 minutes** (dont ~12 min de build dans le cloud).
