# TontineClub - Product Requirements Document

## Vue d'ensemble
Application mobile de gestion de tontine en français, construite avec Expo React Native (Frontend) et FastAPI/MongoDB (Backend).

## Fonctionnalités clés
- **Authentification** : Inscription, Connexion, Mot de passe oublié, Profil utilisateur
- **Gestion de tontines** : Création, modification, suppression, démarrage
- **Invitations** : Envoi, acceptation, refus d'invitations
- **Cycles & Cotisations** : Gestion des cycles de paiement, déclaration/confirmation
- **Dashboard** : Résumé financier, statistiques, tontines récentes
- **Notifications** : Système de notifications in-app
- **Abonnement** : Essai gratuit de 7 jours, système de paywall
- **Administration** : Panel admin HTML pour gérer les utilisateurs

## Architecture
- Frontend : Expo React Native + Expo Router + Zustand (state management)
- Backend : FastAPI + Motor (Async MongoDB)
- Database : MongoDB locale

## Audit Auth/Logout (Dernière modification)
### Problème résolu
Le flux de déconnexion laissait l'application dans un "dirty state" avec des données résiduelles et une navigation instable.

### Corrections appliquées
1. **tontineStore.ts** : Ajout de `reset()` pour purger toutes les données tontine au logout
2. **authStore.ts** : Refonte de `logout()` — reset synchrone de l'état auth PUIS des stores, puis nettoyage storage
3. **_layout.tsx** : Auth Guard centralisé avec `useSegments` + `useEffect` + render-time guard
4. **subscriptionStore.ts** : Guard dans `fetchStatus()` pour empêcher la restauration d'état pendant/après logout
5. **login.tsx / register.tsx** : Navigation centralisée via Root Layout (pas de `router.replace` manuel)
6. **profile.tsx** : Logout simplifié — s'appuie sur le Root Layout guard

### Tests validés
- ✅ Welcome screen visible quand non connecté
- ✅ Login → Dashboard avec données utilisateur correctes
- ✅ Logout → Redirect propre vers Welcome
- ✅ Route protégée /(tabs) bloquée quand non authentifié
- ✅ Re-login avec session propre

## Tâches à venir
- Optimisation N+1 queries (dashboard/tontines enriched)
- Implémentation react-native-iap (Google Play Billing)
- Exports PDF/Excel
- Score de fiabilité / algorithme
- Rôles d'administration avancés
