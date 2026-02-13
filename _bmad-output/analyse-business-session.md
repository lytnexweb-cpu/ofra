# Analyse Business Ofra — Session du 12 février 2026

## Contexte
Session d'analyse approfondie des features, gates, pricing et stratégie business d'Ofra. Décisions prises par Sam avec l'équipe BMAD en Party Mode.

---

## 1. Inventaire complet des features

### 1.1 Fonctionnalités par domaine

| Domaine | Features | Routes API | Statut |
|---------|----------|-----------|--------|
| Auth & Compte | Inscription, login, reset, vérification email, profil, onboarding | 14 | Complet |
| Clients (CRM) | CRUD, import CSV, lier aux transactions | 7 | Complet |
| Transactions | CRUD, pipeline 8 étapes, avancer/reculer/sauter, annuler/archiver/restaurer | 12 | Complet |
| Offres | CRUD, révisions/contre-offres, accepter/rejeter/retirer | 8 | Complet |
| Conditions | CRUD, résolution, preuves, historique, timeline, advance-check | 12 | Complet |
| Templates conditions | 52 templates, 4 packs, moteur auto-matching, anti-doublon | 6 | Complet |
| Profil de transaction | Type propriété, contexte, financement, lien moteur conditions | 4 | Complet |
| Documents | Upload, catégorisation, validation/rejet, stockage enforced | 7 | Complet |
| Collaboration | Membres (4 niveaux), liens partage publics, invitations | 9 | Complet |
| Notes | CRUD sur transactions | 3 | Complet |
| Dashboard | Résumé stats, urgences conditions | 2 | Complet |
| Export | PDF brandé, email (stub) | 2 | 90% |
| Workflow | Templates de workflow, pipeline configurable | 5 | Complet |
| Admin | Dashboard, CRM abonnés, notes/tâches, gestion forfaits | 15 | Complet |
| Forfaits & Limites | 4 plans, enforcement TX/stockage/users, changement plan | 3 | Complet |
| i18n | FR/EN complet sur toute l'app | — | Complet |
| **Total** | | **~130+** | |

### 1.2 Emails automatiques

**10 emails implémentés :**

| # | Email | Déclencheur | Type |
|---|-------|-------------|------|
| 1 | Bienvenue | Inscription | Fonctionnement |
| 2 | Vérification email | Inscription (expire 24h) | Fonctionnement |
| 3 | Reset mot de passe | Demande utilisateur | Fonctionnement |
| 4 | Résumé quotidien | Chaque matin 8h AT | Rappel |
| 5 | Alerte échéance 48h | 48h avant condition due | Rappel |
| 6 | Offre acceptée | Quand offre acceptée | Transaction |
| 7 | Transaction ferme | Quand TX devient ferme | Transaction |
| 8 | Rappel FINTRAC | Étape "ferme" | Transaction |
| 9 | Célébration closing | Jour de clôture | Transaction |
| 10 | Demande avis Google | 7 jours après closing | Marketing |

**4 emails en stub (logués mais pas envoyés) :**

| # | Email | But | Statut |
|---|-------|-----|--------|
| 11 | Invitation membre | Inviter quelqu'un à une TX | Stub |
| 12 | Récap transaction | Résumé envoyé par email | Stub |
| 13 | Notification offre | Nouvelle offre soumise | Stub |
| 14 | Changement statut TX | Annulation/archivage | Stub |

**Emails planifiés (PRD) :**

| # | Email | Phase | Référence PRD |
|---|-------|-------|---------------|
| 15 | Email du lundi "Votre semaine" | Phase 2 | D50 |
| 16+ | Emails aux avocats, clients, inspecteurs | Phase 3 | D51 |

**Infrastructure email :** BullMQ + Redis, templates FR/EN, layout HTML unifié, système de délais (ex: avis Google 7j après closing).

**Note :** Le système d'envoi est en mode stub — il faut brancher un vrai service (Resend, SendGrid) pour que les emails partent.

### 1.3 FINTRAC

**État actuel :** Un seul email de rappel existe. Pas de formulaire, pas de suivi, pas de stockage pièces.

**En cours :** Sam travaille sur le lien FINTRAC ↔ Client ↔ Transaction.

**Valeur :** ÉNORME — obligation légale canadienne, aucun concurrent américain ne l'a. C'est un avantage compétitif majeur pour le marché NB/Canada.

### 1.4 Infrastructure technique

- **Backend :** AdonisJS 6, PostgreSQL, Lucid ORM, VineJS, BullMQ + Redis
- **Frontend :** React 19, React Router v7, TanStack Query, Tailwind 4, Radix UI
- **Auth :** Session-based (cookie HTTP-only)
- **Queues :** BullMQ — résumé quotidien (8h), alertes 48h (horaire), automations avec délais
- **Multi-tenancy :** Par organisation, scoping automatique des données
- **Permissions :** 4 niveaux par transaction (viewer/editor/admin/owner)
- **12 services**, **10 middleware**, **27 modèles**, **20 contrôleurs**, **30 pages frontend**

---

## 2. Système de forfaits et limites (Gates)

### 2.1 Limites quantitatives (IMPLÉMENTÉES)

| Limite | Starter (29$) | Solo (49$) | Pro (79$) | Agence (149$) | Enforced |
|--------|:---:|:---:|:---:|:---:|:---:|
| TX actives | 5 | 12 | 25 | ∞ | ✅ Soft limit + 7j grâce |
| Stockage | 1 Go | 3 Go | 10 Go | 25 Go | ✅ Bloque upload |
| Utilisateurs | 1 | 1 | 1 | 3 | ✅ Bloque invitation |
| Historique (mois) | 6 | 12 | ∞ | ∞ | ❌ PAS enforced |

### 2.2 Décision : historyMonths

**Décision : RETIRER de l'affichage.** Raisons :
- Un courtier ne retourne pas voir ses vieilles transactions
- Les bonnes limites bloquent le travail PRÉSENT, pas l'accès au PASSÉ
- Économise du temps de développement
- On garde la colonne en DB mais on ne l'affiche plus sur la page prix

### 2.3 Feature gates — DÉCISION APPROUVÉE PAR SAM ✅

| Feature | Starter (29$) | Solo (49$) | Pro (79$) | Agence (149$) |
|---------|:---:|:---:|:---:|:---:|
| **LIMITES QUANTITATIVES** | | | | |
| Transactions actives | 5 | 12 | 25 | ∞ |
| Stockage | 1 Go | 3 Go | 10 Go | 25 Go |
| Utilisateurs | 1 | 1 | 1 | 3 |
| **CONDITIONS** | | | | |
| Pack Universal (11 templates) | ✅ | ✅ | ✅ | ✅ |
| Packs spécialisés (Rural/Condo/Financé) | ❌ | ✅ | ✅ | ✅ |
| Preuves sur conditions (evidence) | ❌ | ❌ | ✅ | ✅ |
| Historique audit conditions | ❌ | ❌ | ✅ | ✅ |
| **FINTRAC** | | | | |
| Formulaire de base + statut | ✅ | ✅ | ✅ | ✅ |
| Stockage pièces d'identité | ❌ | ✅ | ✅ | ✅ |
| Audit trail FINTRAC 5 ans | ❌ | ❌ | ✅ | ✅ |
| **EXPORT & PARTAGE** | | | | |
| Export PDF | 3/mois | ∞ | ∞ | ∞ |
| Liens de partage | 1/tx | ∞ | ∞ | ∞ |

**Principe :** Gater la valeur PRÉSENTE — ce dont le courtier a BESOIN aujourd'hui pour travailler, pas l'accès au passé.

**Logique de progression :**
- Starter → "J'ai besoin des conditions condo/rural" → SOLO
- Solo → "J'ai besoin de protéger mes transactions" → PRO
- Pro → "J'ai besoin de mon équipe sur l'outil" → AGENCE

**FINTRAC :** Le formulaire de base n'est PAS gaté (obligation légale). Le stockage sécurisé des pièces = Solo+. L'audit trail 5 ans = Pro+.

---

## 3. Analyse concurrentielle

### 3.1 Concurrents directs

| Concurrent | Prix base | Devise | TX incluses | Cible | Forces |
|-----------|:---------:|:------:|:-----------:|-------|--------|
| Dotloop (Zillow) | Gratuit → 32$/mo | USD | 10 → ∞ | Agents US | eSign, intégrations MLS |
| SkySlope | 25-60$/user/mo | USD | 10 → ∞ | Brokerages US | Compliance, audit |
| Paperless Pipeline | 60$/mo | USD | 5 | TC & brokers | Users illimités, commissions |
| Open To Close | 99-399$/mo | USD | ∞ | Teams & TC | Automations, triggers |
| Shaker | Prix caché | USD | ? | Teams & brokers | CRM intégré, checklists |
| ListedKit | 10$/TX | USD | Pay-per-use | TC indépendants | IA, zéro gate |
| Lone Wolf | Prix caché | USD | ∞ | Gros brokerages | Enterprise, multi-bureau |

### 3.2 Ce que les concurrents gatent

| Feature gatée | Qui le fait | Tier premium |
|--------------|-------------|-------------|
| Rapports / Analytics | Dotloop, SkySlope, Open To Close, Shaker | Teams / Pro |
| Automations avancées | Open To Close, Shaker | Pro / Scale |
| Branding personnalisé | Dotloop | Teams |
| Compliance workflows | Dotloop, SkySlope | Teams / Business+ |
| Checklists illimitées | Shaker | Advanced |

### 3.3 Avantage compétitif Ofra

**Aucun concurrent n'a :**
- 52 templates de conditions pré-construits par contexte juridique NB
- Moteur auto-matching conditions ↔ profil transaction
- Preuves attachées aux conditions avec audit trail
- Niveaux de criticité (bloquant/requis/recommandé)
- FINTRAC (réglementation canadienne)
- Bilingue FR/EN natif

**Positionnement :** NB First, Canada-focused, intelligence des conditions comme moat.

### 3.4 Comparaison prix (USD équivalent)

| Outil | Prix agent solo | Ce qu'il offre |
|-------|:--------------:|----------------|
| Dotloop Premium | 32 USD | eSign + checklists basiques |
| SkySlope Pro | 40 USD | TX illimitées + compliance |
| Paperless Pipeline | 60 USD | 5 TX + commissions |
| Open To Close Grow | 99 USD | Automations basiques |
| **Ofra Solo** | **~36 USD (49 CAD)** | **12 TX + 41 templates + moteur auto + export + partage** |

**Constat :** Ofra offre PLUS de valeur pour MOINS cher que tous les concurrents.

---

## 4. Stratégie de prix

### 4.1 Décision : garder les prix actuels au lancement

**Raisons :**
1. Nouveau sur le marché → prix bas = moins de friction
2. Les fondateurs gardent leur prix à vie (founder pricing)
3. La valeur perçue augmentera avec FINTRAC, rapports, emails réels

### 4.2 Roadmap prix suggérée

| Phase | Timing | Starter | Solo | Pro | Agence |
|-------|--------|:-------:|:----:|:---:|:------:|
| Lancement | Maintenant | 29$ | 49$ | 79$ | 149$ |
| Post-FINTRAC + Stripe | +3 mois | 39$ | 59$ | 99$ | 179$ |
| Maturité | +6 mois | 49$ | 79$ | 129$ | 199$ |

*Tous les prix en CAD. Les fondateurs conservent leur prix initial.*

---

## 5. Améliorations prioritaires identifiées

### 5.1 Haute valeur (font upgrader)

| Amélioration | Impact | Effort estimé |
|-------------|--------|---------------|
| FINTRAC complet (formulaire + suivi + stockage) | Obligation légale, unique au Canada | 3-5 jours |
| Rapports / Analytics | Tous les concurrents le gatent premium | 3-4 jours |
| Notifications in-app | Standard SaaS, améliore rétention | 2-3 jours |
| Branding sur exports PDF | Dotloop le gate en Teams | 1 jour |

### 5.2 Bonne valeur (améliorent l'expérience)

| Amélioration | Impact | Effort estimé |
|-------------|--------|---------------|
| Recherche globale | UX de base manquante | 1-2 jours |
| Brancher envoi emails réel (Resend/SendGrid) | 10 emails prêts mais ne s'envoient pas | 1 jour |
| Compléter les 4 emails stub | Invitation, récap, offre, statut | 1-2 jours |
| App mobile / PWA | Courtiers sur la route | 5-10 jours |

---

## 6. Essai gratuit — DÉCISION

### Modèle retenu : 30 jours + 1 TX + features Pro

| Paramètre | Valeur |
|-----------|--------|
| Durée | 30 jours |
| Transactions | 1 (total créées, PAS actives) |
| Features | Toutes — niveau Pro |
| Après expiration | TX en lecture seule, doit choisir un plan |
| Anti-contournement | COUNT total TX créées (supprimées incluses) |
| 2e compte | Pas bloqué — friction naturelle suffisante |

### UX du trial
- Jour 1 : "Créez votre première transaction gratuitement — toutes les features Pro pendant 30 jours"
- Jour 22 : Bandeau jaune "Il vous reste 8 jours d'essai"
- Jour 30 : "Essai terminé. Votre TX reste en lecture seule. Choisissez un forfait."
- 2e TX : "Vous avez utilisé votre transaction d'essai. Choisissez un forfait."

### Implémentation technique
- Champ `User.trialEndsAt: DateTime | null` (inscription + 30j)
- Pendant trial : `planId` = Pro temporairement, `maxTransactions` = 1
- PlanLimitMiddleware : si `trialEndsAt` passé ET pas de plan payé → bloquer
- COUNT sans filtre de statut pour empêcher le cycle supprimer/recréer

---

## 7. Intégration Stripe (PROCHAINE CONVERSATION)

### Architecture prévue

```
COURTIER → clique "Choisir Solo 49$"
    → Stripe Checkout Session (page de paiement hébergée)
    → Courtier entre sa carte
    → Stripe webhook → Ofra met à jour user.planId
    → Gates se déverrouillent automatiquement
```

### Ce qu'il faut construire

| Morceau | Description | Effort |
|---------|-------------|:------:|
| Checkout | Bouton plan → redirige vers Stripe Checkout | ~2h |
| Webhooks | Stripe notifie Ofra quand paiement passe/échoue → update planId | ~3h |
| Portail client | Gérer carte, annuler, changer plan via Stripe Customer Portal | ~1h |
| Renouvellement | Charge auto mensuelle. Échec → grace period | ~2h |

### Champs à ajouter sur User

```
user.stripeCustomerId      → "cus_abc123"
user.stripeSubscriptionId  → "sub_xyz789"
user.subscriptionStatus    → "active" | "past_due" | "canceled" | "trialing"
```

### Principe clé

Les feature gates vérifient `user.planId` dans la DB. Stripe ne fait que CHANGER ce `planId` quand le courtier paye. Les gates et Stripe sont **indépendants** — les gates marchent déjà avec le changement de plan manuel (`POST /me/plan`).

---

## 8. Décisions prises par Sam

- [x] ✅ Tableau de feature gates approuvé (section 2.3)
- [x] ✅ historyMonths retiré de la page pricing
- [x] ✅ FINTRAC : base gratuite pour tous, stockage pièces = Solo+, audit trail = Pro+
- [x] ✅ Essai gratuit : 30 jours, 1 TX total, features Pro, anti-contournement par COUNT total
- [x] ✅ Stripe = prochaine conversation dédiée après les gates
- [ ] Confirmer la roadmap prix
- [ ] Décider les améliorations à implémenter en premier

## 9. Ordre d'implémentation

1. **MAINTENANT** → Feature gates (packs conditions, evidence, exports, share links)
2. **ENSUITE** → Stripe (conversation dédiée)
3. **APRÈS** → Essai gratuit 30 jours, FINTRAC complet, emails réels

---

*Document généré lors de la session Party Mode du 12 février 2026*
*Agents participants : Mary (Analyst), John (PM), Winston (Architect), Sally (UX), Paige (Tech Writer), Murat (Test Architect)*
