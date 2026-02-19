# Guide Superadmin — Ofra

> Ce document est le guide de référence pour le superadmin de la plateforme Ofra.
> Dernière mise à jour : 2026-02-18

---

## 1. Accès Admin

- URL : `/admin/login`
- Se connecter avec un compte dont le rôle est `superadmin`
- Après connexion : redirection vers le dashboard Pulse (`/admin`)

Le panneau admin a 3 vues accessibles via la sidebar gauche :
- **Pulse** — Dashboard temps réel
- **Gens** — Gestion des utilisateurs (CRM)
- **Config** — Configuration du site, plans, promos, système

---

## 2. Pulse (Dashboard)

**URL :** `/admin`

Vue d'ensemble de la plateforme avec rafraîchissement automatique toutes les 60 secondes.

### KPIs affichés
| KPI | Description |
|-----|-------------|
| Utilisateurs totaux | Nombre total d'inscrits + variation 30 jours |
| Transactions actives | TX non archivées/annulées + variation 30 jours |
| Fondateurs | X / 25 places utilisées |
| MRR | Revenus mensuels récurrents (placeholder pré-Stripe) |

### Alertes actionnables
- **Essais expirants** — Utilisateurs en trial dont l'abonnement expire dans les 5 prochains jours
- **Paiements en souffrance** — Utilisateurs avec statut `past_due`
- **Conditions en retard** — Nombre de conditions dépassant leur date limite

### Statistiques de conversion
- Répartition Trial / Active / Cancelled
- Taux de conversion trial → paid
- Graphique des inscriptions par semaine (12 dernières semaines)

### Fil d'activité
Les 20 dernières actions sur la plateforme (créations TX, étapes complétées, offres, etc.)

---

## 3. Gens (CRM Utilisateurs)

**URL :** `/admin/gens`

### Segments intelligents
Filtrer les utilisateurs par catégorie en cliquant sur les pills :

| Segment | Description |
|---------|-------------|
| Tous | Tous les utilisateurs |
| Trial J25+ | En essai, expiration proche (25+ jours écoulés) |
| À risque | Engagment faible (inactifs récents) |
| Fondateurs | Utilisateurs avec le flag `isFounder` |
| Nouveaux (7j) | Inscrits dans les 7 derniers jours |
| Impayés | Statut d'abonnement `past_due` |

### Actions sur un utilisateur
Cliquer sur une ligne ouvre le panneau de détail (drawer) :

- **Infos** — Email, plan, date d'inscription, dernière connexion
- **Notes admin** — Ajouter/supprimer des notes internes (CRM)
- **Tâches admin** — Ajouter/supprimer des tâches de suivi

### Actions superadmin uniquement
Via le menu `...` sur chaque ligne :
- **Changer le rôle** — Promouvoir en admin ou rétrograder en user
- **Gérer l'abonnement** — Activer/annuler manuellement

---

## 4. Config

**URL :** `/admin/config`

4 sections collapsibles. Cliquer sur l'en-tête pour ouvrir/fermer.

### 4.1 Mode du site

Contrôle l'état global de la plateforme :

| Mode | Effet |
|------|-------|
| **Live** (vert) | Application accessible normalement |
| **En construction** (jaune) | Bloque l'accès API. Les visiteurs voient la page Coming Soon. Accès possible via code fondateur. Admins/superadmins passent librement. |
| **Maintenance** (rouge) | Bloque l'accès API. Les visiteurs voient la page Maintenance. Admins/superadmins passent librement. |

**Champs configurables :**
- **Code d'accès** — Code que les fondateurs saisissent pour accéder à l'app en mode construction
- **Message personnalisé** — Texte optionnel affiché sur la page Coming Soon
- **Date de lancement** — Alimente le countdown sur la page Coming Soon
- **Points de pitch** — Arguments affichés sur la page Coming Soon (format JSON)
- **Afficher le compteur fondateurs** — Affiche "X/25 places restantes" sur la page Coming Soon

> Cliquer **Sauvegarder** applique les changements immédiatement. Le cache middleware est invalidé.

### 4.2 Plans

Affiche les 4 plans Ofra (Starter, Solo, Pro, Agence) en lecture seule avec :
- Nombre d'abonnés par plan
- Prix mensuel / annuel
- Limites de transactions

**Action : "Appliquer aux existants"**
Permet de mettre à jour le prix locké (`planLockedPrice`) de tous les utilisateurs non-fondateurs sur un plan donné. Processus en 2 étapes :
1. Saisir une raison (min. 3 caractères)
2. Taper `APPLIQUER` pour confirmer

> Les fondateurs (`isFounder = true`) sont **toujours exclus** de cette action. Leur prix est garanti à vie.

### 4.3 Codes promo

Gestion CRUD des codes promotionnels :

| Champ | Description |
|-------|-------------|
| Code | Identifiant unique (auto-majuscules) |
| Type | `percent` (% de réduction), `fixed` (montant fixe), `free_months` (mois gratuits) |
| Valeur | Montant de la réduction |
| Utilisations max | Limite d'utilisations (vide = illimité) |
| Date début / fin | Période de validité optionnelle |

- **Créer** un code via le bouton "Nouveau code"
- **Désactiver** un code via l'icône poubelle (soft-delete : le code reste visible mais inactif)
- Les codes sont validables publiquement via `POST /api/promo-codes/validate`

### 4.4 Système

Métriques de santé serveur :
- **Statut global** — Opérationnel / Dégradé / Erreur
- **Base de données** — Statut connexion
- **Runtime** — Version Node.js
- **Uptime** — Temps depuis le dernier redémarrage
- **Mémoire** — Utilisation heap

Rafraîchissement automatique toutes les 30 secondes.

---

## 5. Pages publiques contrôlées

### Coming Soon (`/coming-soon`)
Affichée automatiquement quand le mode du site est `coming_soon` :
- Animation typewriter avec pitch
- Countdown vers la date de lancement
- Compteur de places fondateurs restantes
- Formulaire de code d'accès fondateur
- Formulaire d'inscription email waitlist

### Maintenance (`/maintenance`)
Affichée automatiquement quand le mode du site est `maintenance` :
- Message rassurant (données en sécurité)
- Contact support

---

## 6. Checklist jour de lancement (20 mars 2026)

1. [ ] Vérifier que tous les fondateurs (25 max) ont reçu leur code
2. [ ] Tester le code d'accès sur la page Coming Soon
3. [ ] Vérifier les KPIs dans Pulse (données de test nettoyées)
4. [ ] Configurer GA4 via Google Tag Manager
5. [ ] Dans Config → Mode du site : basculer de **En construction** à **Live**
6. [ ] Vérifier que `/` affiche le dashboard (pas la page Coming Soon)
7. [ ] Tester une inscription complète (register → onboarding → dashboard)
8. [ ] Vérifier les emails transactionnels (vérification, reset password)
9. [ ] Surveiller Pulse pendant les premières heures

---

## 7. FAQ Superadmin

**Q : Que se passe-t-il si je change le mode en maintenance pendant que des utilisateurs sont connectés ?**
R : Les appels API suivants retourneront une erreur 503 et le frontend les redirigera vers `/maintenance`. Les sessions restent valides — quand le mode repasse en `live`, les utilisateurs peuvent continuer sans se reconnecter.

**Q : Puis-je modifier les prix des plans ?**
R : Pas directement dans l'UI actuelle. Les prix sont gérés en base de données. Utilisez "Appliquer aux existants" pour propager un changement de prix déjà fait en DB.

**Q : Comment ajouter un nouveau fondateur ?**
R : Le flag `isFounder` est sur le profil utilisateur. Actuellement géré en DB directement. L'UI d'édition de ce flag sera ajoutée post-lancement.

**Q : Les admins (non-superadmin) peuvent-ils voir les données sensibles ?**
R : Les admins peuvent lire toutes les données (Pulse, Gens, Config) mais ne peuvent PAS modifier les settings du site, les codes promo, les rôles des utilisateurs, ni appliquer des changements de prix.
