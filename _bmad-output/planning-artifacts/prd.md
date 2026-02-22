---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-vision', 'step-04-pricing', 'step-05-ux', 'step-06-mockups', 'step-07-implementation', 'step-08-tests', 'step-09-roadmap']
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-ofra-2026-01-25.md
  - project-context.md
  - docs/pricing-strategy.md (SUPPRIMÉ — remplacé par ce PRD)
  - docs/visual-strategy.md
  - docs/business-logic-calculations.md
  - docs/roadmap.md (SUPPRIMÉ — remplacé par ce PRD)
  - _bmad-output/session-2026-02-02-ux-refonte.md
workflowType: 'prd'
version: '2.32'
date: '2026-02-21'
author: 'Sam + Équipe BMAD (Party Mode)'
status: 'SOURCE DE VÉRITÉ'
supersedes:
  - docs/pricing-strategy.md (SUPPRIMÉ du repo)
  - docs/roadmap.md (SUPPRIMÉ du repo)
  - project-context.md (section SaaS Pricing — mis à jour)
---

# PRD v2 — Ofra : Copilote de l'Agent Immobilier NB

> **CE DOCUMENT EST LA SOURCE DE VÉRITÉ UNIQUE**
> Tout conflit avec un autre document se résout en faveur de ce PRD.
> Dernière mise à jour : 2026-02-21 (v2.33)
> Auteur : Sam + Équipe BMAD (Party Mode)
>
> **Version actuelle — v2.34 (2026-02-21) :**
> - §9.2.4 ENRICHI : Cockpit adaptatif acheteur — 6 vues par workflowStep, CTA unique par écran, redirection post-onboarding vers TX
> - §L.5 Refonte onboarding agent (3 étapes action → profil + import FollowUpBoss + 1ère TX) — validé
> - §9.2.2 Scénario acheteur (7 étapes dans Ofra) — validé
> - §9.2.3 Scénario vendeur (9 étapes, invitations, BidRound, acceptation cascade) — validé
> - §9.2.4 Refonte page transaction (page adaptative par workflowStep, S0 avant S1) — validé + cockpit acheteur détaillé
> - §9.2.5 Conditions enrichies + outils post-offre (P0→P3) — validé
> - §9.2.6 Architecture technique commune (PDF, eSign, sécurité, modèles DB)
> - §9.2.7 Sprint plan unifié S0→S8 (~18-22 jours)
> - Phase 2 "Les Connexions" : 12/12 features DONE (C1-C12)
> - Phase 1 : 8/8 blocs pré-lancement DONE, déployé sur Fly.io
>
> **Historique versions :**
> - v2.26-v2.28 : Phase 2 complétée (12 features), audit offre, notification loop
> - v2.19-v2.25 : Auth flows, a11y, onboarding, dark mode retiré, Stripe en cours
> - v2.9-v2.18 : Bloc 9 admin, SiteMode, audits (sécurité, conformité, cohérence), tests 277+327
> - v2.1-v2.8 : Pricing, infra Fly.io, offres intelligentes, audits, déploiement
> - Historique détaillé : consulter git log ou `memory/session-*`

---

## 1. Vision & Proposition de Valeur

### 1.1 Vision

> **"Ofra est le copilote de l'agent immobilier au Nouveau-Brunswick. Il protège ses commissions en s'assurant qu'aucune deadline n'est ratée, qu'aucune condition n'est oubliée. L'agent dort tranquille."**
>
> **Principe directeur post-lancement :** "L'agent ne veut pas gérer des modules. Il veut gérer un dossier : client → propriété → offre(s) → conditions → pros → closing." Chaque feature doit s'intégrer dans ce flux naturel, pas exister en silo.

### 1.2 Proposition de Valeur

**Avant :** "Un assistant intelligent qui suggère les bonnes conditions" (feature)
**Maintenant :** **"Ne ratez plus jamais une deadline, dormez tranquille"** (émotion)

Ofra ne vend pas de la gestion de données. Ofra vend de la **réduction d'anxiété** et de la **protection de commissions**.

### 1.3 Différenciateur Fondamental

| Ce qu'Ofra EST | Ce qu'Ofra N'EST PAS |
|----------------|---------------------|
| Copilote post-signature | CRM de prospection |
| Assurance anti-oubli | Outil de gestion de données |
| Spécialiste NB | Solution US adaptée |
| Simple et focalisé | ERP complexe |

### 1.4 Moat Compétitif (Avantage Défendable)

| Avantage | Pourquoi c'est défendable |
|----------|--------------------------|
| **Règles NBREC** | Aucun SaaS US/ontarien ne va investir pour 1 500 agents au NB |
| **Bilingue FR/EN natif** | Obligatoire légalement dans beaucoup de transactions NB |
| **Contexte rural NB** | Puits, fosse septique, droit de passage — conditions uniques |
| **Communauté petite et connectée** | 5 agents convaincus = tout le monde le sait en 2 mois |
| **FINTRAC intégré** | Conformité identité acheteur/vendeur automatisée — aucun concurrent NB ne l'a |
| **Portail client** | Lien sécurisé lecture seule pour que le client suive son dossier — fidélise l'agent ET le client |
| **Formulaires NBREA pré-remplis** | Génération PDF à partir des données Ofra — élimine la saisie manuelle dans les formulaires réglementaires |
| **Canadian-built** | Tendance "Buy Canadian", FINTRAC-ready, prix en CAD, **100% hébergé au Canada** (serveurs Toronto) |

### 1.5 Jobs-to-Be-Done (JTBD)

| Job | Contexte | Résultat |
|-----|----------|----------|
| **"Ne rien oublier"** | 8+ transactions actives, deadlines qui se chevauchent | Zéro commission perdue par oubli |
| **"Savoir en 5 secondes"** | Client appelle pour un update, agent est en visite | Réponse instantanée, perception pro |
| **"Dormir tranquille"** | Dimanche soir, l'agent vérifie mentalement ses dossiers | Dashboard urgences = tranquillité |
| **"Prouver ma diligence"** | Broker demande un update, litige potentiel | Audit trail complet |
| **"Onboarder vite"** | Offre acceptée, avalanche de conditions | < 5 min avec suggestions assistées |

---

## 2. Pricing (Source de Vérité)

### 2.1 Structure des Plans

| Plan | Mensuel | Annuel (−17%) | TX actives | Stockage | Historique |
|------|---------|--------------|-----------|----------|------------|
| **Starter** | 29$/mois | 290$/an (~24$/mo) | 5 | 1 Go | 6 mois |
| **Solo** | 49$/mois | 490$/an (~41$/mo) | 12 | 3 Go | 12 mois |
| **Pro** | 79$/mois | 790$/an (~66$/mo) | 25 | 10 Go | Illimité |
| **Agence** | 149$/mois | 1 490$/an (~124$/mo) | Illimité | 25 Go | Illimité |

**Note :** Tous les prix sont en dollars canadiens (CAD). Le plan Agence est **Phase 2** — grisé/pointillés au lancement avec un bouton "Me notifier".

### 2.2 Identité des Plans

| Plan | Persona | Phrase d'identification |
|------|---------|----------------------|
| Starter | Agent temps partiel, débutant | "Je fais ça à côté" |
| Solo | Agent débutant actif, en croissance | "Je lance ma pratique" |
| Pro | Agent établi, pipeline chargé | "J'ai un pipeline chargé" |
| Agence | Petite équipe (Phase 2) | "On travaille en équipe" |

### 2.3 Essai Gratuit 30 Jours (D53)

| Règle | Détail |
|-------|--------|
| Durée | **30 jours** à partir de l'inscription |
| Transactions | **1 seule** (non recyclable — archiver ne libère pas de place) |
| Features | **Pro complet** (toutes features débloquées) |
| Carte de crédit | **Non requise** à l'inscription — seulement au choix du plan |
| J30-J33 (soft wall) | Lecture seule + bandeau "Choisissez un forfait" |
| J33+ (hard wall) | Seule la page pricing est accessible |
| Rappels | J7, J21, J27 ("X jours restants dans votre essai") |

**Pourquoi Pro complet :** L'agent doit voir la vraie valeur (preuves, FINTRAC, audit) pour être convaincu. Un trial Starter = produit castré = churn. L'anchoring psychologique fait le reste au moment du choix.

### 2.4 Programme Fondateur (25 places) — Beta Fermée avec Code (D53)

| Règle | Détail |
|-------|--------|
| **Accès** | **Beta fermée — code d'invitation requis** (ex: `OFRA-FOUNDER-2026`) |
| Places | 25 maximum |
| Essai | **30 jours gratuits** (même trial que tout le monde) |
| Prix | **Prix du jour garanti à vie** — pas de réduction %, le prix de lancement ne bouge jamais |
| Applicable à | **TOUT plan** (Starter, Solo, Pro) |
| Le prix suit l'upgrade | ✅ Oui — `plan_locked_price` = prix du plan au moment du choix |
| Badge visible | ✅ "Membre Fondateur #X/25" dans l'app |
| Engagement | 15 minutes de feedback par mois |
| Annulation | **Perd le statut fondateur définitivement** |
| Changement de plan sans annuler | **Garde le statut fondateur** |

#### Accès Fermé

Le programme fondateur est un **programme d'accès fermé**. Avant le lancement public (**20 mars 2026**) :
- Le site est en mode `coming_soon` — la page de lancement est la seule visible
- L'accès à `/signup` nécessite un **code d'accès global** validé sur la page Coming Soon
- Seuls les porteurs du code peuvent s'inscrire
- Le code est distribué manuellement par Sam aux 25 agents sélectionnés
- Après le 20 mars, le site bascule en mode `live` et le signup devient public

#### Stratégie de Prix

Ofra a vocation à **augmenter ses prix** une fois implanté (grosse valeur pour le courtier). Les fondateurs gardent leur prix de lancement pour toujours. Cela crée :
- **Urgence** : "Les prix vont augmenter, inscrivez-vous maintenant"
- **Loyauté** : Le fondateur ne quitte jamais (son prix est imbattable)
- **Simplicité Stripe** : Pas de coupons, pas de calcul % — un seul prix locké par user

#### Pitch Fondateur

> "25 premiers agents — votre prix est garanti à vie. Quand Ofra grandira et que nos prix augmenteront, le vôtre ne bougera jamais. Vous nous aidez à construire, on vous protège."

### 2.5 Modèle de Données Pricing

```typescript
// Table: plans (lue depuis la DB, modifiable via admin)
interface Plan {
  id: number
  name: string                    // 'Starter', 'Solo', 'Pro', 'Agence'
  slug: string                    // 'starter', 'solo', 'pro', 'agency'
  monthly_price: number           // en cents CAD
  annual_price: number            // en cents CAD
  max_transactions: number | null // null = illimité
  max_storage_mb: number
  history_months: number | null   // null = illimité
  max_users: number               // 1 pour Starter/Solo/Pro, 3 pour Agence
  is_active: boolean
  display_order: number
  created_at: DateTime
  updated_at: DateTime
}

// Sur le User
interface UserPlanFields {
  plan_id: number | null          // FK vers plans (null = trial en cours)
  is_founder: boolean             // flag indépendant du plan
  billing_cycle: 'monthly' | 'annual'
  plan_locked_price: number | null // prix au moment de la souscription (garanti à vie)
  grace_period_start: DateTime | null  // début soft limit si dépassement
  trial_ends_at: DateTime | null  // D53: fin du trial (inscription + 30j), null = pas de trial
  trial_tx_used: boolean          // D53: true si la 1 TX du trial a été créée
}
```

### 2.6 Feature Gates (Audit 2026-02-13)

| Feature | Plan minimum | Mécanisme backend | Statut |
|---------|-------------|-------------------|--------|
| TX actives limit | Par plan (5/12/25/∞) | `PlanLimitMiddleware` + grace 7j | ✅ |
| Condition Packs auto | Solo+ | `PlanService.meetsMinimum('solo')` dans `condition_templates_controller` | ✅ |
| Evidence / Preuves | Pro+ | `PlanService.meetsMinimum('pro')` dans `conditions_controller` (3 endpoints) | ✅ |
| Audit History | Pro+ | `PlanService.meetsMinimum('pro')` dans `conditions_controller:history` | ✅ |
| PDF Exports/mois | Starter=3 | Compteur + gate dans export controller | ✅ |
| Share Links/TX | Starter=1 | Compteur + gate dans share controller | ✅ |
| FINTRAC identity | Solo+ | `PlanService.meetsMinimum('solo')` dans `fintrac_controller:complete+resolve` | ✅ |
| Frontend hook | Tous | `useSubscription()` + `SoftLimitBanner.tsx` | ✅ |
| Storage quota | Par plan | Tracking seulement (pas bloquant, Phase 2) | 🟡 |
| Users per account | 1/1/1/3 | Schema seulement (Agence Phase 2) | 🟡 |

---

## 3. Règles Billing

### 3.1 Soft Limit (7 jours de grâce)

| Événement | Comportement |
|-----------|-------------|
| Agent atteint la limite TX | Création **autorisée** + bandeau d'avertissement |
| Bandeau | "Vous avez dépassé votre limite. Passez au plan supérieur ou archivez une transaction dans les 7 jours." |
| Après 7 jours | Nouvelles créations **bloquées** (transactions existantes intactes) |
| Agent revient sous la limite | `grace_period_start` reset à null |
| Upgrade depuis le bandeau | **Instantané**, en 3 clics maximum |

### 3.2 Upgrade

- Instantané, self-service
- Le bouton d'upgrade apparaît **là où la limite est atteinte** (bandeau, pas dans les settings)
- Le prix garanti à vie (`plan_locked_price`) est recalculé au prix du jour du nouveau plan

### 3.3 Downgrade

- **Bloqué** si `active_transactions > new_plan.max_transactions`
- Modal explicative : "Presque ! Archivez X transactions d'abord"
- Le calcul est fait pour l'agent (18 actives − 12 limite = 6 à archiver)
- Bouton "Voir mes transactions actives" filtre par ancienneté

### 3.4 Prix Lockés

- Changement de prix dans l'admin = **nouveaux abonnés seulement**
- Abonnés existants conservent leur prix (`plan_locked_price`)
- Action manuelle "Appliquer aux existants" avec confirmation obligatoire

### 3.5 Essai Gratuit 30 Jours (D53)

```
INSCRIPTION (J0)
├── Email + mot de passe (pas de CC)
├── Onboarding 3 étapes action (§L.5 — refonte v2.33)
└── Accès Pro complet, 1 TX max

TRIAL (J1-J30)
├── Toutes features débloquées (niveau Pro)
├── 1 transaction seulement (non recyclable)
├── Rappels email à J7, J21, J27
└── Badge "Essai gratuit — X jours restants"

SOFT WALL (J30-J33)
├── Lecture seule (données visibles, pas de modification)
└── Bandeau : "Votre essai est terminé. Choisissez un forfait."

HARD WALL (J33+)
├── Seule la page pricing est accessible
└── Données en sécurité, restaurées au choix du plan
```

**Logique backend :**
- `trial_ends_at` = `created_at + 30 jours` (set à l'inscription)
- `trial_tx_used` = `true` dès la 1ère TX créée (bloque les suivantes)
- `PlanLimitMiddleware` : si `plan_id = null` ET `trial_ends_at > now` → mode trial
- Soft wall : `trial_ends_at < now` ET `trial_ends_at + 3j > now` → lecture seule
- Hard wall : `trial_ends_at + 3j < now` ET `plan_id = null` → redirect pricing

### 3.6 Facturation Annuelle

- Rabais standard : **−17%** (équivalent 2 mois gratuits)
- Toggle mensuel/annuel sur la page pricing
- Prix barrés visibles (ex: ~~348$/an~~ 290$/an)
- Fondateur : même rabais annuel (−17%), mais sur un prix de base déjà garanti à vie

---

## 4. Refonte UX — Décisions Validées

### 4.1 Index des Décisions

| ID | Décision | Statut | Source |
|----|----------|--------|--------|
| D32 | Timeline verticale interactive (fin des onglets) | ✅ Partiellement codé | Session 2026-02-02 |
| D33 | Documents = preuves de conditions | ✅ Fusionné dans D41 | Session 2026-02-02 |
| D34 | Offres → résumé dans header post-acceptation | ✅ Validé | Session 2026-02-02 |
| D35 | Historique → drawer, Notes → secondaire | ✅ Validé | Session 2026-02-02 |
| D36 | Archivage automatique transactions terminées | ✅ Validé | Session 2026-02-02 |
| D37 | Deadlines relatives dans templates | ✅ Codé | Session 2026-02-02 |
| D38 | Conditions éditables (deadline + note) | ✅ Codé | Session 2026-02-02 |
| D39 | Pack conditions optionnel (opt-in) | ✅ Codé | Session 2026-02-02 |
| D40 | ~~Onboarding 5 étapes~~ → **Refonte 3 étapes action** (§L.5 v2.33) | ✅ Codé | Implémenté 2026-02-21 : OnboardingPage 3 étapes, FollowUpBoss service, inscription légère, i18n FR/EN |
| D41 | Garde-fous validation 3 niveaux + preuves | ✅ Codé | Session 2026-02-03 |
| **D42** | **Dashboard urgences (🔴🟡🟢) comme home** | **✅ Codé** | `DashboardPage.tsx` + `DashboardUrgencies.tsx` + `dashboard_controller.urgencies` |
| **D43** | **Bloc "Valeur protégée" (commissions sauvées)** | **📋 Phase 2** | Brainstorm 2026-02-06 |
| **D44** | **Mode assisté (remplace auto/manuel binaire)** | **✅ Codé** | `autoConditionsEnabled` flag + `SuggestionsPanel.tsx` |
| **D45** | **Admin dashboard pricing (modifier sans code)** | **✅ Codé** | `AdminPlansPage.tsx` + `admin_plans_controller.ts` |
| **D46** | **4 forfaits (Starter/Solo/Pro/Agence)** | **✅ Codé** | `plans_seeder.ts` + `PricingPage.tsx` + `Plan` model |
| **D47** | **Facturation annuelle (−17%)** | **✅ Backend** | Prix annuels en DB, toggle frontend à câbler avec Stripe |
| **D48** | **Fondateur = flag sur user, pas plan spécial** | **✅ Codé** | `is_founder` boolean sur User, `plan_locked_price`, badge prévu |
| **D49** | **Soft limit 7 jours de grâce** | **✅ Codé** | `PlanLimitMiddleware` + `grace_period_start` + `SoftLimitBanner.tsx` |
| **D50** | **Email du lundi "Votre semaine"** | **📋 Phase 2** | Brainstorm 2026-02-06 |
| **D51** | **Alertes push/SMS deadlines critiques** | **📋 Phase 2** | Brainstorm 2026-02-06 |
| **D52** | **FINTRAC identity gate Solo+** | **✅ Codé** | `fintrac_controller.ts:complete()` + `resolve()` — `PlanService.meetsMinimum('solo')` |
| **D53** | **Trial 30j gratuit (1 TX, Pro complet) + Prix garanti à vie fondateur** | **✅ Codé** | Migration `trial_tx_used`, `TrialGuardMiddleware` soft/hard wall, `PlanLimitMiddleware` trial mode, `TrialBanner`, registration init 30j, subscription endpoint enrichi. Reste : emails rappel J7/J21/J27 (Bloc 6). |
| **D54** | **Gestionnaire de liens partagés (à côté de 🔔 dans le header)** | **📋 À coder** | Icône dédiée ou section dans header pour voir tous les liens actifs, valider expiration, révoquer un lien. Pas uniquement offres — extensible à tous les partages. |
| **D55** | **Liens de partage multi-parties (avocat, inspecteur, notaire, etc.)** | **📋 Phase 2** | Étendre le système de share links au-delà des offres : créer des liens de consultation pour les autres parties impliquées (avocat, inspecteur, notaire, courtier hypothécaire). Chaque lien = accès lecture seule à une vue filtrée de la transaction. |
| **D56** | **Infrastructure 100% canadienne** | **✅ Déployé** | Fly.io (`yyz` Toronto) + Fly Postgres (`yyz`). Frontend nginx proxy `/api/` → backend via réseau privé Fly. Emails via Brevo SMTP. Stockage fichiers S3-compatible Canada TBD (DO Spaces ou AWS `ca-central-1`). LPRPDE/PIPEDA conforme. |
| **D57** | **Admin dashboard 3 vues (Pulse/Gens/Config)** | **📋 À coder** | Refonte complète admin : (1) **Pulse** = KPIs + alertes actionnables + fil d'activité live + badge mode site, check quotidien. (2) **Gens** = CRM subscribers avec smart segments (Trial J25+, À risque, Fondateurs, Nouveaux, Impayés) + drawer détail avec timeline activité + notes/tâches. (3) **Config** = Plans éditables + SiteMode + Codes promo + System health. Mobile = lecture seule. Remplace les 5 pages admin actuelles (Dashboard, Subscribers, Plans, Activity, System). Maquettes M-ADM-01 à M-ADM-05. |
| **D58** | **SiteMode 3 états (live/coming_soon/maintenance) + beta fermée fondateurs** | **📋 À coder** | Middleware `SiteModeMiddleware` avec 3 états : `live` (tout le monde), `coming_soon` (page teaser lancement avec countdown, code d'accès anticipé, waitlist email, pitch points — admins bypass), `maintenance` (admins seuls, 503). Table `site_settings` (key/value). Admin personnalise : message, date de lancement (countdown), bullet points pitch, compteur fondateurs visible/caché. **Programme fondateur = beta fermée** : code d'accès global requis (ex: `OFRA-FOUNDER-2026`), `/signup` inaccessible sans code en mode `coming_soon`. Page dark theme premium avec FOMO (countdown + places restantes). **Lancement public : 20 mars 2026** — admin bascule `site_mode` de `coming_soon` à `live`, signup ouvert à tous. Toggle depuis admin Config. |
| **D59** | **Codes promotionnels** | **📋 À coder** | Table `promo_codes` : code, type (percent/fixed/free_months), value, max_uses, current_uses, valid_from, valid_until, eligible_plans (json), active, stripe_coupon_id. CRUD admin dans vue Config. Champ "code promo" dans le flow inscription. Miroir Stripe coupon à la création. Non cumulable avec statut Fondateur (prix locké > promo). Use cases : partenariat courtage, événements NBREA, referral organique. |
| **D60** | **Liste d'attente email (page coming soon)** | **📋 À coder** | Table `waitlist_emails` : email, source ('coming_soon_page'), created_at. Formulaire sur la page Coming Soon : "Soyez les premiers informés". Lead capture + compteur fondateurs restants. Exportable CSV depuis admin. |
| **D61** | **Admin isolé — pas d'accès au monde client** | **✅ Fait** | Suppression du bouton "Retour à l'app" (`AdminLayout.tsx`). L'admin est un espace fermé, aucun pont vers le dashboard courtier. Si besoin support client → drawer read-only dans vue Gens (Phase 2). Deux contextes, deux comptes si nécessaire. |
| **D62** | **Retrait complet du dark mode** | **✅ Fait** | Le dark mode n'a jamais été audité visuellement, double la complexité CSS (`dark:*` dans ~50 fichiers), et n'est pas demandé par le marché cible (courtiers NB 35-60 ans). Suppression de : toutes classes `dark:*`, `ThemeContext`, toggle Settings, config Tailwind `darkMode`. Un seul thème light à maintenir et tester. |
| **D63** | **Pricing : redirect externe → page in-app (2 phases)** | **✅ Phase 1 fait / 📋 Phase 2 avec Stripe** | **Phase 1 (pré-Stripe)** : La route `/pricing` dans l'app redirige vers `ofra.ca/pricing` (site marketing). Les CTAs TrialBanner, SoftLimitBanner et AccountPage ouvrent `ofra.ca/pricing` en nouvel onglet. Le hard wall redirige vers `/account` (tab Abonnement). **Phase 2 (post-Stripe)** : Remplacer la redirect par une vraie page `/pricing` in-app avec les 4 cartes plans (Starter 29$/Solo 49$/Pro 79$/Agence 149$), toggle mensuel/annuel, bouton S'abonner → Stripe Checkout. Tous les CTAs pointent alors vers `/pricing` interne. |

### 4.2 Principes UX

```
1. "5 SECONDES" — L'agent sait où il en est sans cliquer
2. "CE QUI BRÛLE D'ABORD" — Urgences en premier, toujours
3. "UN SEUL CHEMIN" — Pas de choix superflu, un flow linéaire
4. "LE MOBILE DANS L'AUTO" — Tout fonctionne avec un pouce
5. "PROUVER LA VALEUR" — Ofra montre ce qu'il a protégé
```

### 4.3 Règles Responsive

| Breakpoint | Device | Navigation | Layout |
|-----------|--------|------------|--------|
| < 640px | Mobile | Bottom nav (Home/TX/Clients/⚙️) + hamburger | 1 colonne, cards full-width |
| 640-1024px | Tablette | Comme mobile mais plus large | 1-2 colonnes, modals max-width 600px |
| > 1024px | Desktop | Top nav horizontal | 2+ colonnes, sidebar possible |

---

## 5. Maquettes (à refaire)

> **Les 20 maquettes Phase 1 ont été supprimées (v2.32).** Elles couvraient : Dashboard (A1-A3), Transaction Timeline (B1-B3), Mode Assisté (C1), Modal Création TX (E1), Admin (G2, M-ADM-01 à M-ADM-05), Pricing (H1-H3), Paramètres (K2), Soft Limit (14), Downgrade (15).
>
> **Nouvelles maquettes à créer (session dédiée) :**
> - Page transaction adaptative par workflowStep (§9.2.4)
> - CreateOfferModal 3 étapes acheteur (§9.2.2)
> - Panneau offres vendeur + gestionnaire invitations (§9.2.3)
> - BidRound / "Best and final" (§9.2.3)
> - Cartes conditions enrichies (§9.2.5)
> - Page de réponse partie adverse refaite (§9.2.2)
> - Comparateur d'offres enrichi (§9.2.3)
>
> **Phase 1 (déjà codée) :** Les écrans existants (Dashboard, Admin, Pricing, Auth) restent en production tels quels. Le code est la référence.

**Inventaire des maquettes à créer — Flow offre (35 éléments, validé 2026-02-21) :**

**Écrans Ofra — Transaction acheteuse (7) :**

| # | Écran | Détail |
|---|-------|--------|
| A1 | Panneau Offres — état vide acheteur | "Aucune offre" + bouton "Préparer une offre" |
| A2 | CreateOfferModal — Étape 1/3 Formulaire | Client auto-rempli, toggle destinataire, prix/dépôt/conditions |
| A3 | CreateOfferModal — Étape 2/3 Preview + Signature | PDF NBREA, résumé, zone eSignature |
| A4 | CreateOfferModal — Étape 3/3 Confirmation | "Offre envoyée" + résumé |
| A5 | Panneau Offres — offre active | NegotiationThread (R1, R2...), statut temps réel |
| A6 | Répondre à une contre-offre | Même flow 3 étapes, pré-rempli |
| A7 | Enregistrer réponse vendeur (hors-système) | 3 boutons : contre-offre / accepté / refusé |

**Écrans Ofra — Transaction vendeuse (8) :**

| # | Écran | Détail |
|---|-------|--------|
| V1 | Panneau Offres — état vide vendeur | "Aucune offre reçue" + "Inviter" + "Enregistrer manuellement" |
| V2 | Gestionnaire d'invitations | Tableau suivi, formulaire invitation, statuts envoyé/ouvert/soumis |
| V3 | Enregistrer offre manuellement | Formulaire + upload PDF |
| V4 | Panneau Offres — offres reçues | Liste avec colonnes prix/dépôt/clôture/conditions/statut |
| V5 | Comparateur d'offres | Plein écran, côte à côte, "Meilleur" par critère |
| V6 | Répondre à une offre | Accepter (+ eSign) / Contre-offre / Refuser |
| V7 | Acceptation cascade | "X offres en attente — refuser et notifier ?" |
| V8 | BidRound — Lancer une ronde | Message, deadline, courtiers sélectionnés |

**Pages publiques — partagées (7) :**

| # | Page | Détail |
|---|------|--------|
| P1 | Vérification email | "Entrez votre courriel pour accéder" |
| P2 | Vue offre + 3 boutons | PDF + Accepter / Contre-offrir / Refuser |
| P3 | Acceptation + eSignature | Zone signature, confirmation |
| P4 | Formulaire contre-offre | Prix, clôture, message, signature |
| P5 | Confirmation refus | Motif optionnel |
| P6 | Soumission d'offre (intake) | Formulaire complet via lien invitation |
| P7 | Révision d'offre (BidRound) | Modifier son offre avant la deadline |

**Emails (10) :**

| # | Email | Destinataire |
|---|-------|-------------|
| E1 | "Offre d'achat — {adresse}" + PDF | Courtier vendeur |
| E2 | "Contre-offre reçue" | Courtier acheteur |
| E3 | "Offre acceptée" | Courtier acheteur |
| E4 | "Offre refusée" | Courtier acheteur |
| E5 | "Invitation à soumettre une offre" | Courtier acheteur invité |
| E6 | "Nouvelle offre reçue" | Courtier vendeur |
| E7 | "Contre-offre — {adresse}" | Courtier acheteur |
| E8 | "Offre acceptée — {adresse}" | Courtier acheteur |
| E9 | "Offre non retenue" | Courtiers refusés (cascade) |
| E10 | "Meilleure offre finale demandée" | Tous courtiers actifs (BidRound) |

**PDFs (3) :**

| # | PDF | Contexte |
|---|-----|---------|
| D1 | Agreement of Purchase & Sale (NBREA) | Offre initiale |
| D2 | Contre-offre | Quand une partie contre-offre |
| D3 | Acceptation | Quand une partie accepte + signe |

---
## 6. Spécifications Comportementales (sans maquette)

### 6.1 D1-D5 — Validation Conditions (déjà codé D41)

| Niveau | Comportement | Modal | Preuve | Escape |
|--------|-------------|-------|--------|--------|
| 🔴 Blocking | Modal complète | Oui | Demandée | Raison + checkbox + phrase "je confirme sans preuve" |
| 🟡 Required | Modal simple | Oui | Optionnelle | Direct |
| 🟢 Recommended | Toggle direct | Non | — | — |

### 6.2 États ConditionCard (déjà codé)

| État | Affichage |
|------|-----------|
| Pending + deadline OK | ○ titre · X jours · [✏️] [Valider ✓] |
| Pending + overdue | ○ titre · 🔴 Xj en retard · ⚠️ message · [✏️] [Valider ✓] |
| Complété + preuve | ✅ titre · date · 📎 preuve · 🔒 |
| Complété sans preuve (escape) | ⚠️ titre · "Complété sans preuve" · raison visible · 🔒 |

### 6.3 B4 — Transaction Complétée

- Toutes les étapes ✅
- Message : "Transaction complétée le [date]. Félicitations !"
- Aucun bouton d'action
- Archivage automatique après X jours (D36)

### 6.4 B5 — Transaction Annulée

- Bandeau rouge : "Transaction annulée le [date]"
- Lecture seule
- Pas de bouton d'action

### 6.5 Auth (I1-I4) — Existant, pas de changement

Login, inscription, forgot/reset password — fonctionnels et testés.

### 6.6 Clients (F1-F4) — Existant, pas de changement

CRUD clients + import CSV — fonctionnels et testés.

### 6.7 Loading/Error/Empty States (L1-L4) — Design system existant

Skeletons, spinners, toasts, 404, 500 — fonctionnels avec le design system visual-strategy.md.

### 6.8 Rôles & Permissions Admin/Superadmin (Bloc 9)

Le système distingue 3 rôles : `user`, `admin`, `superadmin`. Le champ `role` est un enum sur le modèle `User`.

#### Superadmin exclusif

| Capacité | Endpoint | UI |
|----------|----------|-----|
| Changer le mode du site (live/coming_soon/maintenance) | `PUT /api/admin/site-settings` | Config → Mode du site |
| Modifier code d'accès fondateur | `PUT /api/admin/site-settings` | Config → Mode du site |
| Modifier message custom, date lancement, pitch points | `PUT /api/admin/site-settings` | Config → Mode du site |
| Créer un code promo | `POST /api/admin/promo-codes` | Config → Codes promo |
| Modifier un code promo | `PUT /api/admin/promo-codes/:id` | Config → Codes promo |
| Désactiver un code promo | `DELETE /api/admin/promo-codes/:id` | Config → Codes promo |
| Appliquer prix plan aux abonnés existants | `POST /api/admin/plans/:id/apply-to-existing` | Config → Plans |
| Changer le rôle d'un utilisateur (user ↔ admin seulement) | `PATCH /api/admin/subscribers/:id/role` | Gens → Drawer (dropdown sans option superadmin) |
| Gérer abonnement d'un user (activer/suspendre/résilier) | `PATCH /api/admin/subscribers/:id/subscription` | Gens → Drawer |
| Prolonger trial / accorder délai (+N jours) | `PATCH /api/admin/subscribers/:id/extend` | Gens → Drawer → boutons +7j/+14j/custom |
| Toggle statut fondateur | `PATCH /api/admin/subscribers/:id/founder` | Gens → Drawer → toggle badge doré |

#### Admin + Superadmin (lecture + CRM)

| Capacité | UI |
|----------|-----|
| Dashboard Pulse (KPIs, alertes, activité, conversion) | Pulse |
| Voir les settings du site (lecture seule) | Config |
| Voir les codes promo (lecture seule) | Config |
| Voir/exporter la waitlist (CSV) | Config |
| Voir le changelog des plans | Config → Plans |
| Gérer abonnés (recherche, segments, notes, tâches) | Gens |
| Voir métriques système | Config → Système |

#### Règles de sécurité rôles

- **Superadmin** : Seul rôle attribué manuellement en DB. **JAMAIS** proposé dans l'UI. Maximum 2 personnes.
- **Admin** : Promu/rétrogradé par superadmin via le drawer Gens. Réservé aux gestionnaires d'agence (plan Agence).
- **User** : Rôle par défaut à l'inscription. Courtiers standards.
- Le dropdown rôle dans le drawer affiche uniquement `user` et `admin`. L'option `superadmin` est **interdite** dans l'UI.

#### Non implémenté (post-lancement)

- Édition directe des prix de plans (UI simplifiée dans Bloc 9 — lecture seule)
- Création/suppression de plans
- Gestion des templates de conditions
- Audit log détaillé (prévu Sprint 3 pipeline conditions)
- Hard-delete utilisateur
- Impersonation (login "en tant que" un user)

---

## 7. Plan d'Implémentation (10 jours)

### 7.1 Timeline

| Jour | Tâche | Écrans | Backend | Frontend | Tests |
|------|-------|--------|---------|----------|-------|
| **1** | Dashboard urgences | A1, A2, A3 | Endpoint `/dashboard/urgencies` | Nouveau composant DashboardUrgencies | Tests endpoint + composant |
| **2** | Timeline verticale (partie 1) | B1 | — (données existantes) | Refactor tabs → timeline, étape courante expanded | Tests composant |
| **3** | Timeline verticale (partie 2) | B2, B3 | — | Étapes passées 🔒, bouton Avancer conditionnel | Tests états |
| **4** | Suggestions + Création | C1, E1 | — (API existe) | Slide-in panel + bottom sheet + modal simplifiée | Tests flow |
| **5** | Admin plans (migration) | G2 | Migration `plans` + CRUD API + admin middleware | — | Tests API |
| **6** | Admin plans (frontend) | G2 | — | Page admin avec formulaires éditables + logs | Tests composant |
| **7** | Page pricing publique | H1, H2, H3 | Endpoint public `GET /plans` | Page pricing + toggle + bannière | Tests composant |
| **8** | Abonnement + Soft limit | K2, #14, #15 | Middleware plan check + grace period | Page settings + bandeau + modal downgrade | Tests middleware |
| **9** | Polish | Tous | — | Responsive, animations, edge cases | — |
| **10** | Tests + validation | — | — | — | Tests E2E, tests manuels avec 2-3 agents |

### 7.2 Endpoints Nouveaux

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/dashboard/urgencies` | Conditions urgentes triées | User |
| GET | `/api/plans` | Plans actifs (public) | Public |
| GET | `/api/admin/plans` | Tous les plans (admin) | Admin |
| PUT | `/api/admin/plans/:id` | Modifier un plan | Admin |
| POST | `/api/admin/plans` | Créer un plan | Admin |
| GET | `/api/admin/plan-changes` | Historique des changements | Admin |
| GET | `/api/me/subscription` | Plan actuel + utilisation | User |
| POST | `/api/me/subscription/change` | Changer de plan | User |
| GET | `/api/admin/pulse` | KPIs agrégés + alertes + conversion trial + fondateurs | Superadmin |
| GET | `/api/admin/plan-changes` | Historique changements paginé (query: `planId`, `page`, `limit`) | Admin |
| POST | `/api/admin/plans/:id/apply-to-existing` | Bulk update prix existants (exclut fondateurs, type-to-confirm) | Superadmin |
| GET | `/api/admin/site-settings` | Mode site + code d'accès + message | Admin |
| PUT | `/api/admin/site-settings` | Modifier mode/code/message | Superadmin |
| POST | `/api/site/validate-code` | Valider code d'accès (public, mode construction) | Public |
| GET | `/api/admin/promo-codes` | Liste codes promo | Admin |
| POST | `/api/admin/promo-codes` | Créer un code promo (+ miroir Stripe coupon) | Superadmin |
| PUT | `/api/admin/promo-codes/:id` | Modifier un code promo | Superadmin |
| DELETE | `/api/admin/promo-codes/:id` | Désactiver un code promo | Superadmin |
| POST | `/api/promo-codes/validate` | Valider un code promo (inscription) | Public |
| POST | `/api/waitlist` | Inscrire email liste d'attente (page construction) | Public |
| GET | `/api/admin/waitlist` | Liste emails d'attente + export | Admin |
| GET | `/api/admin/activity-feed` | Fil d'activité global paginé (20 dernières actions) | Admin |

### 7.3 Migrations Nouvelles

| # | Migration | Tables/Colonnes |
|---|-----------|----------------|
| 1 | `create_plans_table` | plans (id, name, slug, monthly_price, annual_price, max_transactions, max_storage_mb, history_months, max_users, is_active, display_order) |
| 2 | `add_plan_fields_to_users` | users + plan_id, is_founder, billing_cycle, plan_locked_price, grace_period_start |
| 3 | `create_plan_changes_table` | plan_changes (id, plan_id, admin_user_id, field, old_value, new_value, reason, created_at) |
| 4 | `create_site_settings_table` | site_settings (id, key, value, updated_by, updated_at). Keys initiales : `site_mode` ('coming_soon'), `access_code` ('OFRA-FOUNDER-2026'), `custom_message` (''), `launch_date` ('2026-03-20'), `pitch_points` ('[]' — JSON array de strings), `show_founder_count` ('true') |
| 5 | `create_promo_codes_table` | promo_codes (id, code UNIQUE, type enum('percent','fixed','free_months'), value decimal, max_uses int nullable, current_uses int default 0, valid_from date nullable, valid_until date nullable, eligible_plans jsonb nullable, active boolean default true, stripe_coupon_id string nullable, created_at, updated_at) |
| 6 | `add_promo_code_to_users` | users + promo_code_id (FK nullable vers promo_codes) |
| 7 | `create_waitlist_emails_table` | waitlist_emails (id, email UNIQUE, source string default 'construction_page', created_at) |

### 7.4 Stripe Billing — Décisions Techniques (validées 2026-02-13)

**Approche :** Custom intégré, PAS de Stripe hosted.

| Choix | Décision | Raison |
|-------|----------|--------|
| **Checkout** | Stripe Elements (custom, inline dans l'app) | UX intégrée, contrôle total, cohérent avec maquette K2 |
| **Gestion abonnement** | Page custom (`AccountPage.tsx` onglet Abonnement) | PAS de Stripe Customer Portal — tout dans l'app |
| **Trial fondateur** | Logique app (pas de coupons Stripe) | `is_founder` + `plan_locked_price` déjà en DB, l'app calcule et envoie le bon prix à Stripe |
| **Prorating** | Stripe prorating natif sur upgrade/downgrade | Simplifie les calculs, Stripe gère les crédits |

**In Scope (Lancement) :**
- Stripe Elements : formulaire carte inline dans l'app
- `stripe_customer_id` + `stripe_subscription_id` sur User (migration)
- Création Stripe Customer automatique à l'inscription
- Création Subscription Stripe au choix de plan (fin trial ou achat direct)
- Webhooks : `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Changement de plan (upgrade/downgrade) avec prorating Stripe
- Annulation d'abonnement (cancel at period end)
- Page Abonnement custom (K2) : carte, plan actuel, usage, changer plan, passer annuel, annuler
- Trial 30j fondateur géré 100% côté app
- Prix lockés (`plan_locked_price`) calculés côté app → envoyés à Stripe
- Sync statut local ↔ Stripe via webhooks

**Out of Scope (Lancement) :**
- Factures PDF custom (Stripe les génère automatiquement)
- Remboursements admin via l'app (via Stripe Dashboard)
- Tax/GST/HST automatique (Stripe Tax — Phase 2)
- Stripe Customer Portal
- Stripe Checkout hosted

**Endpoints Stripe à ajouter :**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/stripe/setup-intent` | Créer un SetupIntent pour collecter la carte | User |
| POST | `/api/stripe/subscribe` | Créer l'abonnement Stripe | User |
| POST | `/api/stripe/change-plan` | Upgrade/downgrade avec prorating | User |
| POST | `/api/stripe/cancel` | Annuler l'abonnement (fin de période) | User |
| PUT | `/api/stripe/payment-method` | Mettre à jour la carte | User |
| POST | `/api/webhooks/stripe` | Endpoint webhooks Stripe | Public (signature verification) |

**Migration Stripe :**

| Champ | Table | Type |
|-------|-------|------|
| `stripe_customer_id` | users | string, nullable |
| `stripe_subscription_id` | users | string, nullable |
| `stripe_payment_method_id` | users | string, nullable |

### 7.5 Infrastructure 100% Canadienne (D56)

**Promesse :** Ofra est hébergé à 100% au Canada. Aucune donnée ne sort du territoire canadien.

| Composant | Service | Région | Raison |
|-----------|---------|--------|--------|
| **Application (backend + frontend)** | Fly.io | Toronto (`yyz`) | Containers Docker, déploiement simple, région Canada native |
| **Base de données PostgreSQL** | Fly Postgres | Toronto (`yyz`) | Managed, même région que l'app, `DATABASE_URL` compatible |
| **Stockage fichiers (documents, pièces jointes)** | À déterminer (DO Spaces Toronto ou AWS S3 `ca-central-1`) | Canada | Compatible S3, résidence données au Canada |
| **Emails transactionnels** | Brevo SMTP | `smtp-relay.brevo.com:587` | Déjà configuré et fonctionnel |

**Déploiement actif (2026-02-20) :**
- **Frontend** : `https://ofra-crm-frontend.fly.dev` — nginx Alpine, proxy `/api/` vers backend via réseau privé Fly. 1 machine `shared-cpu-1x:256MB`.
- **Backend** : `https://ofra-crm-backend.fly.dev` — AdonisJS, `HOST=::` (IPv6), `min_machines_running=0`, auto-start. 1 machine `shared-cpu-1x:1024MB`.
- **DB** : Fly Postgres `ofra-crm-db` — attaché au backend via `DATABASE_URL`
- **Proxy interne** : nginx `resolver [fdaa::3]:53` → `ofra-crm-backend.internal:3333` (same-origin, pas de CORS cross-domain)
- **Queue/Redis** : désactivé (`QUEUE_ENABLED=false`) — pas de Redis en prod pour l'instant
- **Build args frontend** : `VITE_STRIPE_PUBLISHABLE_KEY` + `VITE_API_URL` injectés via `fly.toml [build.args]` (le `.env` est exclu du Docker build par `.dockerignore`)
- **Machines** : 2 total (1 frontend + 1 backend). Machines redondantes supprimées (2026-02-20) pour réduire les coûts pré-lancement.

**Pourquoi Fly.io (remplace DigitalOcean App Platform — décision 2026-02-17) :**
- Région `yyz` (Toronto) = résidence de données Canada confirmée
- DX supérieure : `fly deploy` depuis un Dockerfile, pas de buildpack opaque
- Fly Postgres managé dans la même région
- Coût compétitif pour un projet early-stage
- Note : Fly.io n'offre pas de stockage objet — un service S3-compatible externe (DO Spaces Toronto ou AWS S3 `ca-central-1`) sera nécessaire pour les fichiers

**Pourquoi pas Cloudinary ?**
- Cloudinary héberge sur des serveurs US/EU — incompatible avec la promesse "100% canadien"

**Conformité :**
- LPRPDE / PIPEDA : données personnelles des agents et clients restent au Canada
- Argument de vente : "Vos données ne quittent jamais le Canada" (landing page, legal)

---

## 8. Tests Utilisateur

### 8.1 Tests "Trouve l'urgence en <5 secondes"

| # | Écran | Consigne | Succès |
|---|-------|----------|--------|
| 1 | A1 | "Quelle est votre urgence #1 ?" | Pointe le 🔴 en retard en <3 sec |
| 2 | B1 | "Pourquoi ne pouvez-vous pas avancer ?" | Identifie la bloquante en <5 sec |
| 3 | B3 | "Pouvez-vous avancer ?" | Voit le bouton actif en <3 sec |
| 4 | C1 | "Ajoutez les suggestions" | Coche + Ajouter en <10 sec |
| 5 | A3 | "Créez votre première transaction" | Trouve le CTA en <3 sec |

### 8.2 Edge Cases

| Cas | Comportement attendu |
|-----|---------------------|
| 50+ urgences | Top 10 + "Voir les X autres" |
| 0 transactions | Dashboard A3 (vide) |
| 0 conditions sur une étape | Message "Aucune condition pour cette étape" + bouton suggestions |
| Fondateur 25/25 complet | Bannière "Complet. [Liste d'attente]" |
| Soft limit + downgrade simultané | Grace period s'applique, downgrade bloqué indépendamment |
| Agent en grâce qui archive et repasse sous la limite | `grace_period_start` reset, bandeau disparaît |
| Changement prix admin pendant checkout Stripe | Prix locké au moment de création Subscription Stripe (via `plan_locked_price` app) |

---

## 9. Roadmap

### 9.0 Feuille de Route Pré-Lancement (validée 2026-02-13)

**Principe directeur :** Stripe en dernier. Le trial 30j est 100% backend Ofra, zéro interaction Stripe. On peut lancer en beta fermée sans paiement et brancher Stripe quand les fondateurs approchent J30.

**🗓️ Date de lancement officiel : 20 mars 2026** (30 jours à partir du 18 février 2026).
- **Avant le 20 mars** : site en mode `coming_soon`, accès fondateurs par code uniquement
- **Le 20 mars** : admin bascule `site_mode` → `live`, signup public ouvert
- **Deadline Stripe** : doit être fonctionnel avant le 20 mars (les fondateurs ont 30j de trial, Stripe facture à J30)

| Bloc | Contenu | Dépendance | Statut |
|------|---------|------------|--------|
| **1. D53 Backend** | Migration `trial_tx_used`, `PlanLimitMiddleware` trial mode (1TX), `TrialGuardMiddleware` soft/hard wall, subscription endpoint enrichi, registration init 30j. | Aucune | ✅ DONE |
| **2. D53 Frontend** | `TrialBanner` (actif/soft wall), hard wall redirect dans Layout, i18n FR/EN. Manque : rappels email J7/J21/J27 (→ Bloc 6). | Bloc 1 | ✅ DONE |
| **3. Landing Page** | Hero, features (urgences, conditions, FINTRAC), social proof, CTA → `/signup`. Route publique `/`. | Aucune (parallélisable) | ✅ DONE (670 lignes, 6 pages marketing, ROUTE-1 routing) |
| **4. Pricing Page** | 4 plans, toggle mensuel/annuel, bannière fondateur "prix garanti à vie", Agence grisé. CTA → `/signup` (pas encore Stripe). | Aucune (parallélisable) | ✅ DONE (657 lignes, comparaison complète) |
| **5. Legal** | Conditions d'utilisation, Politique de confidentialité (LPRPDE/PIPEDA + NB). Routes `/legal/terms`, `/legal/privacy`. | Aucune (parallélisable) | ❌ TODO |
| **6. Emails essentiels** | WelcomeMail enrichi (mention trial 30j), `TrialReminderMail` paramétrique (J7/J21/J27), BullMQ scheduling à l'inscription, handler dans queue.ts. Reset password déjà existant. | Bloc 1 (trial dates) | ✅ DONE |
| **7. Stripe** | Stripe Elements (custom, inline). Webhooks sync. Page Abonnement custom (K2). Détails ci-dessous §7.4. | Blocs 1-6 terminés | 🟡 EN COURS (backend+frontend codés, env configuré, reste: Stripe Dashboard products + webhook registration + test E2E) |

| **8. Offres intelligentes** | Sprint A : Migration `buyer_party_id`/`seller_party_id`/`initial_direction` sur Offer, model+service+validator+controller, PartyPicker inline (dropdown + création inline), intégration CreateOfferModal avec pre-populate en mode contre-offre. Sprint B : `NegotiationThread` (fil vertical toutes révisions, deltas prix, direction arrows), `OfferComparison` (table side-by-side 2-4 offres, highlight meilleur/pire prix, CTA accepter), `AcceptOfferModal` affiche parties buyer/seller. Auto-populate parties à l'acceptation → FINTRAC ready. 15 fichiers, 283 tests verts. | Aucune (parallélisable) | ✅ DONE |
| **9. Admin Dashboard Refonte** | D57/D58/D59/D60. **Sprint A** : Backend — `SiteModeMiddleware` (3 états), table `site_settings`, endpoints pulse/site-settings/activity-feed, `POST plans/:id/apply-to-existing` (exclut fondateurs, type-to-confirm), `GET plan-changes` paginé, fix engagement filter SQL, VineJS validators notes/tasks, fix `subscriptionEndsAt`. **Sprint B** : Backend — table `promo_codes` + CRUD + validation inscription + miroir Stripe coupon, table `waitlist_emails` + endpoint public. **Sprint C** : Frontend — 3 vues (Pulse/Gens/Config) remplacent 5 pages, sidebar 3 items, smart segments SQL, drawer Radix Dialog avec focus trap, page construction + maintenance, modal promo + modal apply-to-existing, i18n complet FR/EN, responsive mobile lecture seule. **Sprint D** : Fix audit (~65 issues) — labels a11y, `aria-pressed`, heading hierarchy, form state sync, mutation error handlers, stale selectedUser, export auth. | Aucune (parallélisable avec 5/7) | ✅ DONE (Sprints A+B+C, Sprint D audit restant) |

**Blocs parallélisables :** 3, 4, 5, 8, 9 peuvent se faire en même temps que 1-2.

```
✅ Fait:     [Bloc 1: D53 Backend] + [Bloc 2: D53 Frontend] + [Bloc 3: Landing]
✅ Fait:     [Bloc 4: Pricing] + [Bloc 6: Emails] + [Bloc 8: Offres intelligentes]
✅ Fait:     [Bloc 9: Admin Dashboard Refonte + SiteMode + Promos] (Sprint D audit restant)
→ En cours: [Bloc 7: Stripe] (code done, Stripe Dashboard setup restant)
→ Reste:    [Bloc 5: Legal] + Tests + Polish
            → Beta fondateurs (accès fermé avec code)
🗓️ DEADLINE: 20 mars 2026 — Lancement public
```

#### 9.0.1 Bloc 9 — Plan d'implémentation détaillé

> **Statut : ✅ DONE (Sprints A+B+C)** — Terminé 2026-02-18
> Sprint D (audit ~65 issues a11y/state/error) restant.
> 5 maquettes admin (M-ADM-01 à M-ADM-05) validées et implémentées.
> 5 anciennes pages (Dashboard, Subscribers, Activity, System, Plans) → 3 vues (Pulse, Gens, Config) + 2 pages publiques (Coming Soon, Maintenance).

**Sprint A — Backend Core (SiteMode + Pulse + Plans)**

| # | Tâche | Fichier(s) | Détail |
|---|-------|------------|--------|
| A1 | Migration `site_settings` | `backend/database/migrations/1781000000001_create_site_settings_table.ts` | Table: id, key (unique), value (text nullable), updated_by (FK users nullable), timestamps. Seed 6 clés: site_mode='coming_soon', access_code='OFRA-FOUNDER-2026', custom_message='', launch_date='2026-03-20', pitch_points='[]', show_founder_count='true' |
| A2 | Model `SiteSetting` | `backend/app/models/site_setting.ts` | Helpers statiques: `get(key)`, `set(key, value, userId?)`, `getAll()` |
| A3 | `SiteModeMiddleware` | `backend/app/middleware/site_mode_middleware.ts`, `backend/start/kernel.ts` | Cache 30s. `live`→pass, `maintenance`→503 (admin bypass), `coming_soon`→403 (admin bypass + cookie check). Exemptés: `/api/health`, `/api/webhooks/*`, `/api/admin/*`, `/api/site/validate-code`, `/api/waitlist`, `/api/public/*` |
| A4 | `PublicSiteController` | `backend/app/controllers/public_site_controller.ts` | `validateCode` POST `/api/site/validate-code`, `getPublicInfo` GET `/api/public/site-info` |
| A5 | Validator site settings | `backend/app/validators/site_setting_validator.ts` | `updateSiteSettingsValidator`: site_mode enum, access_code, custom_message, launch_date, pitch_points, show_founder_count |
| A6 | `AdminSiteSettingsController` | `backend/app/controllers/admin_site_settings_controller.ts` | GET/PUT `/api/admin/site-settings` |
| A7 | `AdminPulseService` | `backend/app/services/admin_pulse_service.ts` | `getKpis()` (users+delta, TX actives, fondateurs X/25, MRR), `getAlerts()` (trials J25+, paiements échoués, conditions overdue), `getActivityFeed(limit=20)`, `getConversionStats()` |
| A8 | `AdminPulseController` | `backend/app/controllers/admin_pulse_controller.ts` | GET `/api/admin/pulse` |
| A9 | Plans améliorés | `backend/app/controllers/admin_plans_controller.ts` | `applyToExisting` POST `/api/admin/plans/:id/apply-to-existing`, `getChanges` GET `/api/admin/plan-changes?page&limit` |
| A10 | Routes | `backend/start/routes.ts` | Groupe public + admin pour tous les endpoints ci-dessus |

**Sprint B — Backend Promos + Waitlist**

| # | Tâche | Fichier(s) | Détail |
|---|-------|------------|--------|
| B1 | Migration `promo_codes` | `backend/database/migrations/1781000000002_create_promo_codes_table.ts` | code unique, type enum(percent/fixed/free_months), value decimal, max_uses, current_uses, valid_from/until, eligible_plans jsonb, active, stripe_coupon_id |
| B2 | Migration `waitlist_emails` | `backend/database/migrations/1781000000003_create_waitlist_emails_table.ts` | email unique, source default 'coming_soon_page' |
| B3 | Migration `add_promo_code_to_users` | `backend/database/migrations/1781000000004_add_promo_code_to_users.ts` | FK promo_code_id nullable sur users |
| B4 | Models | `backend/app/models/promo_code.ts`, `backend/app/models/waitlist_email.ts`, `backend/app/models/user.ts` | PromoCode (prepare/consume JSON), WaitlistEmail, User +promoCodeId |
| B5 | Validators | `backend/app/validators/promo_code_validator.ts` | create, update, validatePromoCode (inscription) |
| B6 | Controllers | `admin_promo_codes_controller.ts`, `admin_waitlist_controller.ts`, `public_promo_controller.ts`, `public_site_controller.ts` | CRUD promos, waitlist index+export CSV, validate promo public, joinWaitlist |
| B7 | Routes | `backend/start/routes.ts` | Admin: CRUD promo-codes, waitlist, waitlist/export. Public: promo-codes/validate, waitlist |

**Sprint C — Frontend 3 Vues + Pages Publiques**

| # | Tâche | Fichier(s) | Détail |
|---|-------|------------|--------|
| C1 | API layer | `frontend/src/api/admin.api.ts`, `frontend/src/api/site.api.ts` | Types + endpoints: pulse, site-settings, promo-codes, waitlist, plan-changes, apply-to-existing, public site info |
| C2 | AdminLayout refonte | `frontend/src/components/AdminLayout.tsx` | 3 navLinks (Pulse/Gens/Config), badge site_mode (pill vert/jaune/rouge) |
| C3 | AdminPulsePage | `frontend/src/pages/admin/AdminPulsePage.tsx` | KPIs, alertes actionnables, fil d'activité, stats conversion. queryKey: `['admin', 'pulse']` |
| C4 | AdminGensPage | `frontend/src/pages/admin/AdminGensPage.tsx` | Smart segments pills, table subscribers, drawer Radix Sheet, recherche+pagination. queryKey: `['admin', 'gens', {...}]` |
| C5 | AdminConfigPage | `frontend/src/pages/admin/AdminConfigPage.tsx` | 4 sections: Mode du site, Plans (+modal apply-to-existing), Codes promo (CRUD+modal), Système. queryKeys multiples |
| C6 | Modals | Dans AdminConfigPage | Modal "Appliquer aux existants" (2 étapes + type-to-confirm), Modal "Nouveau code promo" |
| C7 | Pages publiques | `frontend/src/pages/ComingSoonPage.tsx`, `frontend/src/pages/MaintenancePage.tsx` | Reproduire maquettes HTML validées en React |
| C8 | Router | `frontend/src/app/router.tsx` | `/admin` → Pulse, `/admin/gens` → Gens, `/admin/config` → Config. Routes publiques `/coming-soon`, `/maintenance`. Redirect sur E_COMING_SOON/E_MAINTENANCE |
| C9 | i18n | `frontend/src/i18n/locales/{fr,en}/common.json` | Clés: admin.pulse.*, admin.gens.*, admin.config.*, comingSoon.*, maintenance.* |
| C10 | Cleanup | Supprimer AdminDashboardPage, AdminActivityPage, AdminSystemPage, AdminPlansPage | Remplacés par Pulse/Gens/Config |

**Sprint D — Audit Fixes (post-implémentation)**

Sprint séparé couvrant les ~65 issues identifiées dans l'audit §11.I (a11y, stale state, error handlers, heading hierarchy, form state sync, etc.).

**Ordre d'exécution :** A → B → C → D (séquentiel, chaque sprint dépend du précédent)

### 9.1 Phase 1 — Lancement Fondateurs (Blocs 1-9) — Deadline : 20 mars 2026

Tout ce qui est nécessaire pour que les 25 premiers agents puissent :
1. Accéder via code fondateur (programme fermé, page Coming Soon)
2. S'inscrire (trial 30j, 1 TX, Pro complet)
3. Utiliser Ofra en conditions réelles
4. Choisir un plan et payer via Stripe à J30

| Feature | Écran | Décision | Statut |
|---------|-------|----------|--------|
| Dashboard urgences | A1-A3 | D42 | ✅ Codé |
| Timeline verticale | B1-B3 | D32 | ✅ Codé |
| Mode assisté | C1 | D44 | ✅ Codé |
| ~~Admin plans~~ → Admin Config | ~~G2~~ → M-ADM-03 | ~~D45~~ → D57 | ✅ Codé (Bloc 9 refonte complète) |
| Trial 30j backend | — | D53 | ✅ Codé |
| Trial 30j frontend | — | D53 | ✅ Codé |
| Landing page | — | — | ✅ Codé (670L, 6 pages marketing, route `/`) |
| Page pricing publique | H1-H3 | D46 | ✅ Codé (657L, comparaison 4 plans) |
| Emails essentiels | — | — | ✅ Codé (WelcomeMail, TrialReminderMail, BullMQ scheduling) |
| Offres intelligentes | M06, M12 | — | ✅ Codé (PartyPicker, NegotiationThread, OfferComparison, 15 fichiers) |
| Admin Pulse | M-ADM-01 | D57 | ✅ Codé (Bloc 9 — KPIs, alertes, activité, conversion) |
| Admin Gens (CRM) | M-ADM-02 | D57 | ✅ Codé (Bloc 9 — segments, drawer, prolongation, fondateur toggle) |
| Admin Config (Plans+Site+Promos) | M-ADM-03 | D57/D58/D59 | ✅ Codé (Bloc 9 — mode site, plans, promos CRUD, système) |
| SiteMode (construction/maintenance) | M-ADM-04, M-ADM-05 | D58 | ✅ Codé (Bloc 9 — SiteModeGuard frontend + middleware backend) |
| Codes promotionnels | M-ADM-03 | D59 | ✅ Codé (Bloc 9 — CRUD backend+frontend) |
| Liste d'attente email | M-ADM-04 | D60 | ✅ Codé (Bloc 9 — endpoint public + admin index) |
| Legal (CGU, vie privée) | — | — | ❌ TODO |
| Stripe integration | K2, #14, #15 | D47-D49 | 🟡 EN COURS (code done, reste Dashboard setup) |
| Offer notification loop | §9.2.1 | N1-N3 | ❌ TODO (2-3h — emails buyer sur counter/accept/confirm) |

#### Launch Day Checklist — 20 mars 2026

Actions à réaliser le jour du lancement public :

| # | Action | Responsable | Détail |
|---|--------|-------------|--------|
| 1 | Basculer `site_mode` → `live` | Admin (Sam) | Depuis Config > Mode du site. Le signup devient public. |
| 2 | Vérifier Stripe fonctionnel | Sam | Les fondateurs en trial depuis ~20 fév approchent J30. Stripe doit facturer. |
| 3 | Exporter la waitlist | Sam | CSV des emails collectés pendant le mode Coming Soon. Email d'annonce à envoyer. |
| 4 | Désactiver le code d'accès | Optionnel | Le code n'est plus vérifié en mode `live`, mais on peut le vider pour propreté. |
| 5 | Mettre à jour la Landing Page | Dev | Retirer les mentions "bientôt" / "accès anticipé" si présentes. |
| 6 | Vérifier les 25 fondateurs | Sam | S'assurer que tous les fondateurs invités ont bien `is_founder = true` et un trial actif. |
| 7 | Monitoring post-launch | Dev | Surveiller les erreurs, la charge, les inscriptions pendant les premières 24h. |

### 9.2 Phase 2 — "Les Connexions" (post-lancement, ~8 jours)

> **Philosophie :** Tout est relié. L'offre connaît ses parties, le client connaît ses pros, le comparateur sait qui offre quoi. L'agent gère un dossier, pas des écrans.

**Sprint 1 — Offre ↔ Parties (~3-4 jours)**

| # | Feature | Détail | Statut |
|---|---------|--------|--------|
| C1 | Migration `from_party_id` / `to_party_id` sur Offer | FK vers `transaction_parties`, direction résolue par les parties et non plus par un enum | ✅ DONE — FK Bloc 8 + inférence direction depuis rôle party (`inferDirection()` dans `OfferService`). `direction` optionnel dans validators, auto-inféré si `fromPartyId`/`buyerPartyId` fourni. `addRevision` auto-inverse direction depuis dernière revision. |
| C2 | Auto-création Party depuis Offer | À la soumission d'une offre, si `fromPartyId` n'existe pas comme Party → créer automatiquement | ✅ DONE — Two-step : `PartyPicker` crée la party inline ("+", nom/email/téléphone → `partiesApi.create()`) AVANT soumission. Flux intake public (`OfferIntakeController`) crée en atomique. Validation front : `buyerPartyId`/`sellerPartyId` requis au submit. Contre-offre : conversion buyer/seller → from/to selon direction. Error handling inline dans PartyPicker. |
| C3 | Auto-création Party depuis Client | À la création d'une transaction, le client assigné devient automatiquement une Party (buyer ou seller selon direction) | ✅ DONE — `WorkflowEngineService.createTransaction()` crée `TransactionParty` depuis `Client` avec `role=clientRole`, `isPrimary=true`. Frontend auto-détecte `clientRole` depuis `client.clientType` (C3b) puis depuis `transaction.type` (purchase→buyer, sale→seller). Warning mismatch si override. |
| C4 | Pré-remplissage formulaire offre | Si l'agent a déjà un client avec nom/téléphone/email → auto-populate les champs de l'offre | ✅ DONE — `PartyPicker` pré-sélectionne parties existantes (`isPrimary`). Client lookup autocomplete dans PartyPicker (accent-safe, `clientsApi.list()`, staleTime 5min). Auto-fill nom/email/téléphone sur sélection. Fix `fullName` bug dans CreateOfferModal (`firstName`+`lastName`). |

**Sprint 2 — UI Buyer/Seller Contextuelle (~2-3 jours)**

| # | Feature | Détail | Statut |
|---|---------|--------|--------|
| C5 | CTA adaptatif selon direction | Acheteur : "Soumettre une offre" (proactif) / Vendeur : "Ajouter manuellement" (réactif, outline) | ✅ DONE — Intégré dans C6 |
| C6 | Sections différentes buyer vs seller | Titre adaptatif, CTA role-aware, gating actions (accept/counter/reject vs withdraw selon tour), bannière contextuelle, intake link masqué pour buyer, auto-open comparateur seller, direction role-aware dans CreateOfferModal | ✅ DONE — `OffersPanel.tsx`, `CreateOfferModal.tsx`, i18n FR+EN, 327 tests verts |
| C7 | Comparateur vendeur enrichi | Table side-by-side avec highlight meilleur prix, deadline, conditions — le vendeur compare facilement | ✅ DONE — 6 enrichissements : closingDate highlight (earliest=best), expiry highlight (latest=best), depositDeadline row, inspectionDelay + "jours"/"days", fix conditions/inclusions row (count réel via preload), worst rouge sur toutes les rows. 5 clés i18n FR+EN. Type `conditions` ajouté sur `OfferRevision`. |
| C8 | Formulaire client 2 sections | Section acheteur (financement, pré-approbation) vs section vendeur (motivation vente, prix plancher) | ✅ DONE — Migration 7 colonnes (`1785000000001`), model+validator, CreateClientModal sections conditionnelles (buyer bleu/seller ambre), ClientDetailsPage edit+read-only, i18n FR+EN, API types. |

**Spec C7 — Comparateur vendeur enrichi**

> Composant existant : `OfferComparison.tsx`. Enrichissement sur 6 axes.

| # | Gap actuel | Fix | Logique highlight |
|---|-----------|-----|-------------------|
| 1 | `closingDate` pas de highlight | Highlight vert sur earliest, rouge sur latest | Earliest = best (vendeur veut clôturer vite) |
| 2 | `expiryAt` pas de highlight | Highlight vert sur latest, rouge sur earliest | Latest = best (plus de temps pour négocier) |
| 3 | Row "conditions" affiche `inclusions` (bug) | Renommer la row actuelle en "Inclusions" ; ajouter une nouvelle row "Conditions" avec le count réel de conditions par offre | Backend : `revisions.conditions` preload OU `withCount('conditions')` dans endpoint offers |
| 4 | `depositDeadline` non affiché | Nouvelle row "Date limite dépôt" après row "Dépôt" | Highlight : earliest = best (vendeur veut le dépôt vite) |
| 5 | `inspectionDelay` affiché sans unité | Suffixer avec "jours" (FR) / "days" (EN) via i18n key | Highlight : shortest delay = best |
| 6 | Aucune indication worst (rouge) | Les highlights "worst" existants sont maintenant rouge (`text-red-600 bg-red-50/30`) au lieu de neutre | Déjà codé pour price/deposit/financing ; étendre à toutes les rows |

**Fichiers impactés :**
- `frontend/src/components/transaction/OfferComparison.tsx` — 6 changements
- `frontend/src/i18n/locales/{fr,en}/common.json` — 5 clés : `offers.comparison.depositDeadline`, `offers.comparison.inspectionDays`, `offers.comparison.conditionCount`, `offers.comparison.noConditions`, `offers.comparison.inclusions`
- `backend/app/controllers/offers_controller.ts` — preload `revisions.conditions` (ou `withCount`) dans la query list

**Spec C8 — Formulaire client 2 sections**

> Objectif : enrichir le profil client avec des champs contextuels acheteur/vendeur pour alimenter le comparateur (C7) et le pré-remplissage offre (C4).

**Migration — 7 colonnes sur `clients` :**

| Colonne | Type | Contexte | Null | Default |
|---------|------|----------|------|---------|
| `pre_approval_amount` | `decimal(12,2)` | buyer | yes | null |
| `pre_approval_lender` | `string(255)` | buyer | yes | null |
| `financing_budget` | `decimal(12,2)` | buyer | yes | null |
| `is_pre_approved` | `boolean` | buyer | yes | false |
| `motivation_level` | `enum('low','medium','high','urgent')` | seller | yes | null |
| `floor_price` | `decimal(12,2)` | seller | yes | null |
| `target_close_date` | `date` | seller | yes | null |

**Backend :**
- Model `client.ts` : 7 `@column()` declarations
- Validator `client_validator.ts` : 7 champs optionnels dans schemas create + update
- Pas de validation conditionnelle backend (frontend gère l'affichage selon `clientType`)

**Frontend :**
- `CreateClientModal.tsx` : section conditionnelle dans l'onglet Basic après le select `clientType`
  - buyer/both → section "Profil acheteur" : `isPreApproved` (toggle), `preApprovalAmount`, `preApprovalLender`, `financingBudget`
  - seller/both → section "Profil vendeur" : `motivationLevel` (select), `floorPrice`, `targetCloseDate`
- `ClientDetailsPage.tsx` : ajouter `clientType` au formulaire edit (manquant) + sections conditionnelles identiques
- i18n : ~12 clés FR/EN (`clientForm.buyerSection`, `clientForm.sellerSection`, labels de chaque champ)

**Liens futurs :**
- `preApprovalAmount` → row dans OfferComparison (C7)
- `floorPrice` → warning si offre < plancher dans CreateOfferModal
- `financingBudget` → pré-remplir financing dans CreateOfferModal

**Sprint 3 — Carnet de Pros (~2 jours)**

| # | Feature | Détail | Statut |
|---|---------|--------|--------|
| C9 | Table `professional_contacts` | nom, rôle (inspecteur/notaire/avocat/courtier hypothécaire), téléphone, email, notes, `agent_id` FK | ✅ DONE — Migration `1786000000001`, model, validator (6 rôles), controller CRUD scoped agentId, 5 routes auth. |
| C10 | CRUD Carnet de pros | Page `/pros` — liste, ajout, modification. Recherche par nom/rôle | ✅ DONE — `ProsPage.tsx` avec liste cards, search accent-safe, filtre par rôle, modal add/edit, delete confirm, empty state. Route lazy-load, nav Briefcase, 21 clés i18n FR+EN. |
| C11 | Suggestion sur conditions | Quand une condition type "inspection" est créée → suggérer les inspecteurs du carnet de l'agent | ✅ DONE — Mapping `TYPE_TO_ROLE` (8 types → rôles) dans `EditConditionModal`. Pros matchés en section "Suggestions" (vert), autres en dessous. |
| C12 | Assignation pro sur condition | L'agent peut assigner un pro de son carnet à une condition (avocat sur "révision titre", etc.) | ✅ DONE — Migration `1786000000002` (`assigned_pro_id` FK), model+validator+audit trail, preload `assignedPro`, badge violet sur ConditionCard, picker dans EditConditionModal, 6 clés i18n FR+EN. |

#### 9.2.1 Audit Système Offre — Boucle Notification (2026-02-20)

> **Constat :** Le moteur offre est solide (direction auto-inférée, contre-offre inversée, comparateur 6 axes, intake public Phase A/B/C, share links sécurisés). Mais la **boucle de communication vers les parties externes** est cassée : le buyer/seller externe ne reçoit aucun email après sa soumission.

**Ce qui FONCTIONNE :**

| Feature | Status | Détail |
|---------|--------|--------|
| Direction auto-inférée depuis rôle party | ✅ | `inferDirection()` dans `OfferService` |
| Contre-offre : direction + parties auto-inversées | ✅ | `addRevision()` inverse from/to + direction |
| Acceptation : auto-advance workflow + reject autres | ✅ | `acceptOffer()` dans controller |
| Lien public buyer (intake Phase A/B/C) | ✅ | Token sécurisé, rate-limited, password-protected |
| Buyer contre-offre via lien public | ✅ | Phase C avec poll 30s + formulaire counter |
| Comparateur vendeur enrichi (6 axes highlight) | ✅ | `OfferComparison.tsx` — best vert, worst rouge |
| Email broker sur offre/counter/reject/withdraw | ✅ | 4 mails existants dans `app/mails/` |
| PartyPicker avec client lookup + création inline | ✅ | Accent-safe, auto-fill |
| NegotiationThread chronologique | ✅ | Direction arrows, delta prix, statut |

**GAPS identifiés (boucle notification) :**

| # | Gap | Impact | Gravité | Fix estimé |
|---|-----|--------|---------|------------|
| N1 | **Buyer ne reçoit AUCUN email quand vendeur contre-offre** | Négo stagne, buyer doit revisiter le lien manuellement | 🔴 CRITIQUE | Créer `OfferCounterNotifyBuyerMail` — envoyer à `party.email` avec lien intake. ~1h |
| N2 | **`OfferAcceptedMail` existe mais n'est JAMAIS envoyé** | Ni buyer ni seller ne savent que l'offre est acceptée | 🔴 CRITIQUE | Brancher `mail.send(new OfferAcceptedMail(...))` dans `acceptOffer()`. ~15min |
| N3 | **Aucun email de confirmation à la soumission** | Buyer soumet offre, aucun accusé de réception | 🟠 HAUTE | Créer `OfferReceivedConfirmationMail` — envoyer au buyer après POST intake. ~30min |
| N4 | **Offres expirées : `expireOffers()` jamais appelé** | Offres expirées restent "pending" en DB | 🟠 HAUTE | Cron job ou vérification lazy à la lecture. ~30min |
| N5 | **Pas de lien intake pour vendeur** (hardcodé buyer→seller) | Vendeur ne peut pas initier via lien public | 🟡 MOYENNE | Param `direction` sur intake link creation. Post-lancement. |
| N6 | **Buyer ne peut pas accepter via lien public** | Seulement le broker peut accepter | 🟡 MOYENNE | Endpoint public `accept` avec confirmation. Post-lancement. |

**Flow actuel (honnête) :**

```
Agent crée transaction + share link offer_intake
  └─ Envoie le lien au buyer MANUELLEMENT (SMS/email externe) ⚠️

Buyer ouvre lien → soumet offre (Phase A/B)
  └─ ✅ Broker notifié (in-app + email)
  └─ ❌ Buyer: aucun email de confirmation

Agent contre-offre depuis l'app
  └─ ✅ Direction auto-inversée seller→buyer
  └─ ❌ Buyer: aucun email ("vous avez une contre-offre, cliquez ici")
  └─ Buyer doit revisiter le lien manuellement

Buyer revoit le lien → contre-offre (Phase C)
  └─ ✅ Broker notifié (in-app)
  └─ ❌ Aucun email envoyé

Agent accepte
  └─ ✅ Workflow auto-advance, salePrice mis à jour
  └─ ❌ OfferAcceptedMail jamais envoyé — personne ne sait
```

**Flow cible (après fix N1-N3) :**

```
Buyer soumet offre → ✅ Email confirmation au buyer ("Offre reçue, on vous revient")
Agent contre-offre → ✅ Email au buyer ("Contre-offre reçue, cliquez pour répondre" + lien)
Buyer contre-offre → ✅ Email au broker (déjà fait) + confirmation buyer
Agent accepte → ✅ Email au buyer + seller ("Offre acceptée! 🎉")
```

**Effort total N1+N2+N3 : ~2-3 heures.** N4 (expiry) : ~30min. N5-N6 : post-lancement.

#### 9.2.2 Flow Offre Acheteur — Scénario validé (2026-02-20)

> **Principe directeur :** Ofra est un copilote de bout en bout. Le courtier ne quitte JAMAIS l'application. Formulaire → Preview → Signature → Envoi → Réponse → Avancement = tout dans Ofra.
>
> **Contexte :** Le formulaire d'offre actuel est générique (même UX buyer/seller). Ofra doit s'adapter au `clientRole` pour personnaliser tout le flow. Deux scénarios fondamentalement différents : acheteur (proactif, je soumets) vs vendeur (réactif, je reçois). Scénario acheteur en premier — le vendeur réutilise ~80% de l'infra.

**Scénario concret : Mon client Jean Tremblay veut acheter le 47 rue Champlain, Moncton (285 000 $)**

---

**1. Le courtier ouvre sa transaction**

Il est sur le Dashboard → clique sur la transaction "47 rue Champlain — Jean Tremblay". Il arrive sur la page transaction, onglet Offres.

Le panneau affiche : *"Aucune offre pour le moment"* et un bouton **"Préparer une offre"**.

---

**2. Il clique "Préparer une offre" — Étape 1/3 : Formulaire**

Le CreateOfferModal s'ouvre.

**En haut — Mon client (De) :**
> Jean Tremblay — jean.tremblay@gmail.com — 506-555-1234
> *(carte lecture seule, auto-rempli depuis la transaction. Non modifiable.)*

**Destinataire (À) — toggle :**
- **Courtier vendeur** (cas le plus fréquent) → Nom, Agence, Courriel, Téléphone. Autocomplete carnet pro (rôle `broker`).
- **Vendeur direct** (FSBO, sans courtier) → Nom, Courriel, Téléphone. Pas d'agence.

Le courtier choisit "Courtier vendeur" et remplit :
> Marie Dupuis — RE/MAX Moncton — marie.dupuis@remax.ca — 506-555-9876
> *(Si déjà dans le carnet pro, l'autocomplete la suggère dès les premières lettres.)*

**Reste du formulaire :**

| Champ | Valeur dans l'exemple |
|-------|----------------------|
| Prix offert | 275 000 $ *(hint : "Prix demandé : 285 000 $")* |
| Dépôt | 10 000 $ — dans les 5 jours ouvrables |
| Date de clôture | 20 avril 2026 |
| Expiration | Pill **48h** sélectionnée |
| Financement | Toggle ON → 265 000 $ |
| Inspection | Toggle ON → 10 jours |
| Inclusions | "Réfrigérateur, cuisinière, laveuse, sécheuse" |
| Message | "Bonjour Marie, ci-joint l'offre de mon client. N'hésitez pas pour toute question." |

**Résumé temps réel (colonne droite) :**
> Demandé : 285 000 $ | Offert : 275 000 $ | Écart : -3.5% | Expire : 22 fév 23h59

**Éléments cachés en mode acheteur :**
- Segmented Offre/Contre-offre : **CACHÉ** (c'est toujours une offre initiale)
- Direction : **auto** `buyer_to_seller` (pas de choix)

Il clique **"Suivant →"**

---

**3. Étape 2/3 — Preview PDF & Signature**

**À gauche :** le PDF NBREA "Agreement of Purchase & Sale" rempli avec toutes les données. Le courtier voit exactement le document officiel que Marie va recevoir.

**À droite :** résumé de vérification :
> **À :** Marie Dupuis (RE/MAX Moncton)
> **Prix :** 275 000 $ | **Dépôt :** 10 000 $ | **Clôture :** 20 avril 2026 | **Expire :** 22 fév 23h59
> **[← Modifier]** pour revenir à l'étape 1

**En bas — eSignature :**
- Première fois → le courtier dessine sa signature sur le canvas, coche "Sauvegarder pour la prochaine fois"
- Les fois suivantes → sa signature apparaît, il clique "Utiliser ma signature" (1 clic)

☑ *Envoyer par courriel à marie.dupuis@remax.ca* — coché par défaut

Il clique **"Envoyer l'offre →"**

---

**4. Étape 3/3 — Confirmation**

> **Offre envoyée**
> PDF signé envoyé à Marie Dupuis (RE/MAX Moncton) — marie.dupuis@remax.ca
> Expiration : 22 février 2026 à 23h59
> **[Voir la transaction]**

**En coulisses, Ofra a :**
1. Généré le PDF final signé (hash SHA-256 intégrité)
2. Envoyé un courriel à Marie : PDF en PJ + lien de réponse tokenisé
3. Créé l'offre en DB (status: `pending`, direction: `buyer_to_seller`)
4. Sauvegardé Marie Dupuis dans le carnet pro (rôle `broker`) si pas déjà

---

**5. Marie reçoit le courriel**

> **Objet : Offre d'achat — 47 rue Champlain, Moncton**
>
> Bonjour Marie,
> Une offre d'achat a été soumise pour la propriété au 47 rue Champlain, Moncton.
>
> Acheteur : Jean Tremblay | Prix offert : 275 000 $ | Clôture : 20 avril 2026 | Expire : 22 fév 23h59
>
> PDF signé en pièce jointe
> **[Consulter et répondre à l'offre →]**
>
> *Préparé avec Ofra*

---

**6. Marie clique le lien — Page de réponse (OfferIntakePage)**

Pas besoin de compte Ofra. Token URL + vérification email.

**D'abord :** "Entrez votre courriel pour accéder à cette offre" → marie.dupuis@remax.ca → correspond → accès.

**Elle voit :** le PDF complet signé (téléchargeable) + résumé de l'offre + 3 boutons :

**Scénario A — Acceptation :**
Marie clique "Accepter" → zone eSignature → elle (ou son vendeur) signe → PDF acceptation signé généré → notification au courtier acheteur dans Ofra → transaction avance automatiquement (`offer-accepted` → `conditional-period`).

**Scénario B — Contre-offre :**
Marie clique "Contre-offre" → formulaire pré-rempli → elle modifie : prix 282 000 $, clôture 15 avril → message "Mon vendeur accepterait à 282 000 $" → signe → PDF contre-offre généré → courriel au courtier acheteur.

Dans Ofra, le NegotiationThread affiche :
> **R1** — Offre 275 000 $ (buyer → seller) — Contre-offre reçue
> **R2** — Contre-offre 282 000 $ (seller → buyer) — **En attente de votre réponse**

Le courtier discute avec Jean → Jean veut monter à 280 000 $ → le courtier clique "Répondre" → même flow 3 étapes → contre-contre-offre envoyée → **le cycle continue** jusqu'à entente ou rupture.

**Scénario C — Refus :**
Marie clique "Refuser" → motif optionnel → notification au courtier acheteur → offre passe en `rejected`.

---

**7. Cas hors-système**

Marie ne répond pas via le lien mais appelle : "Mon vendeur accepte à 282 000 $."

Le courtier va dans Ofra → panneau Offres → **"Enregistrer la réponse du vendeur"** :

| Action | UX |
|--------|-----|
| Enregistrer une contre-offre | Formulaire pré-rempli avec dernières valeurs → direction auto-inversée `seller_to_buyer` |
| Le vendeur a accepté | → AcceptOfferModal (existant) → workflow avance |
| Le vendeur a refusé | → motif optionnel → statut `rejected` |

Architecture technique, sécurité, métriques : voir §9.2.6.
Scénario vendeur : voir §9.2.3.
Sprint plan : voir §9.2.7.

#### 9.2.3 Flow Offre Vendeur — Scénario validé (2026-02-21, Party Mode)

> **Principe directeur :** Même vision copilote bout en bout que §9.2.2. Le courtier vendeur reçoit, compare, et répond aux offres sans quitter Ofra. Réutilise ~80% de l'infra acheteur (PDF, eSign, lien réponse) mais avec un flow inversé : réactif au lieu de proactif.
>
> **Posture fondamentale :** Le courtier vendeur ne PRÉPARE pas d'offre — il les REÇOIT et y RÉPOND. L'UX entière est orientée réception, comparaison, et décision.

**Scénario concret : Ma cliente Sylvie Cormier vend le 47 rue Champlain, Moncton (285 000 $)**

---

**1. Le courtier ouvre sa transaction**

Dashboard → transaction "47 rue Champlain — Sylvie Cormier" (clientRole = `seller`). Page transaction, onglet Offres.

Le panneau affiche :
> *"Aucune offre reçue"*
>
> **[Inviter un courtier à soumettre]** *(bouton principal)*
> [Enregistrer une offre manuellement] *(lien secondaire, outline)*

---

**2. Gestionnaire d'invitations — liens intake uniques**

Le courtier clique "Inviter un courtier à soumettre". La modale **Gestionnaire d'invitations** s'ouvre :

> **Invitations**
>
> | Courtier | Agence | Envoyé le | Statut |
> |----------|--------|-----------|--------|
> | *(aucune invitation)* | | | |
>
> **Inviter un courtier :**
> Nom : _______ Agence : _______ Courriel : _______
> *(autocomplete carnet pro, rôle `broker`)*
>
> **[Envoyer l'invitation]**
>
> ---
> **Inviter un acheteur direct (sans courtier) :**
> Nom : _______ Courriel : _______
> **[Envoyer l'invitation]**

Chaque invitation génère un **lien intake unique tokenisé** par courtier/acheteur invité. Le courtier vendeur peut envoyer le lien par courriel directement depuis Ofra.

**Tableau de suivi des invitations (intelligence commerciale) :**

| Courtier | Agence | Envoyé le | Statut |
|----------|--------|-----------|--------|
| Marc Leblanc | Royal LePage | 20 fév | **Offre reçue** |
| Julie Thériault | Century 21 | 20 fév | **Lien ouvert** |
| Pierre Gallant | Keller Williams | 21 fév | Envoyé |

Statuts possibles : `Envoyé` → `Lien ouvert` → `Offre reçue`

Le courtier voit d'un coup d'oeil son pipeline : combien d'invitations, qui a ouvert, qui a soumis.

**Confidentialité :** Chaque lien est unique. Deux courtiers acheteurs ne peuvent pas déduire qu'ils sont en compétition en comparant leurs URLs. Aucune information sur le nombre d'offres concurrentes n'est visible sur la page intake.

---

**3A. Une offre arrive via le lien intake (cas idéal)**

Marc Leblanc ouvre son lien unique → OfferIntakePage → remplit : son client (Jean Tremblay), prix 275 000 $, dépôt 10 000 $, conditions, etc. → signe → soumet.

Notification dans Ofra :
> "Nouvelle offre reçue — 275 000 $ — Jean Tremblay (courtier : Marc Leblanc, Royal LePage)"

L'offre apparaît dans le panneau avec toutes les infos + PDF signé. Le tableau d'invitations passe Marc en "Offre reçue".

---

**3B. Une offre arrive hors Ofra (courriel/téléphone)**

Marc envoie son PDF par courriel classique. Le courtier → **"Enregistrer une offre manuellement"** :

| Champ | Valeur |
|-------|--------|
| Courtier acheteur | Marc Leblanc — Royal LePage — marc@royallepage.ca *(autocomplete carnet pro)* |
| Acheteur | Jean Tremblay |
| Prix offert | 275 000 $ |
| Dépôt | 10 000 $ |
| Date de clôture | 20 avril 2026 |
| Expiration | 22 fév 23h59 |
| Conditions | Inspection 10 jours, Financement |
| Inclusions | Réfrigérateur, cuisinière, laveuse, sécheuse |
| PDF reçu | *(upload du PDF envoyé par Marc)* |

**"Enregistrer"** → offre créée en DB, identique structurellement à une offre intake. Flag `source: 'intake' | 'manual'` pour tracer l'origine. Même objet `Offer` + `OfferRevision`.

---

**4. Panneau Offres — vue vendeur**

Adapté au rôle `seller`. Quand des offres sont présentes :

> **Offres reçues (2)**
>
> | Offre | Prix | Dépôt | Clôture | Conditions | Source | Statut |
> |-------|------|-------|---------|------------|--------|--------|
> | Jean Tremblay (Marc Leblanc) | 275 000 $ | 10 000 $ | 20 avr. | 2 | Lien | **En attente** |
> | Paul Landry (Julie Thériault) | 280 000 $ | 15 000 $ | 15 avr. | 3 | Lien | **En attente** |
>
> **[Comparer les offres]** **[Demander la meilleure offre finale]**

**Scalabilité :** À 5+ offres, filtres et tri disponibles (par prix, date, statut, nombre de conditions). Séparation visuelle **Actives** vs **Terminées** (acceptées, refusées, expirées, retirées).

---

**5. Comparateur d'offres (proéminent en mode vendeur)**

Le courtier clique "Comparer" → OfferComparison plein écran :

> | Critère | Offre 1 — Tremblay | Offre 2 — Landry | Meilleur |
> |---------|-------------------|------------------|----------|
> | Prix | 275 000 $ | **280 000 $** | Landry |
> | Dépôt | 10 000 $ | **15 000 $** | Landry |
> | Clôture | 20 avril | **15 avril** | Landry |
> | Conditions | **2** | 3 | Tremblay |
> | Financement | Oui | Oui | Égal |
> | Expiration | 22 fév | 23 fév | Égal |

Le courtier présente ce comparatif à Sylvie pour prendre une décision éclairée.

---

**6. Répondre à une offre**

Le courtier clique "Répondre" sur une offre → 3 choix :

**Accepter :** → eSignature (Sylvie ou courtier avec autorisation) → PDF acceptation signé → courriel au courtier acheteur → transaction avance (`offer-accepted` → `conditional-period`).

**Contre-offre :** → Formulaire pré-rempli → modifications (prix, clôture, conditions) → signe → PDF contre-offre généré → envoyé au courtier acheteur par courriel + lien de réponse → cycle de négociation continue.

**Refuser :** → Motif optionnel → notification au courtier acheteur → offre passe en `rejected`.

---

**7. Acceptation cascade — gestion des offres concurrentes**

Quand le courtier accepte une offre et qu'il reste d'autres offres actives, Ofra affiche :

> **Vous avez 2 autres offres en attente.**
> Souhaitez-vous les refuser et notifier les courtiers ?
>
> ☑ Jean Tremblay (Marc Leblanc) — 275 000 $
> ☑ *(autre offre)*
>
> Message : "L'offre sur le 47 rue Champlain n'a pas été retenue."
> *(personnalisable)*
>
> **[Refuser et notifier]** [Ignorer pour le moment]

Chaque courtier acheteur reçoit un courriel de notification. Aucun détail sur l'offre gagnante n'est communiqué (confidentialité).

---

**8. BidRound — "Best and final" (ronde d'enchères)**

Quand le courtier vendeur a 2+ offres actives et veut lancer une ronde d'enchères :

Bouton **"Demander la meilleure offre finale"** → modale :

> **Ronde d'enchères**
>
> Message aux courtiers :
> *"Mon client a reçu plusieurs offres pour le 47 rue Champlain. Vous êtes invité à soumettre votre meilleure offre finale avant la date limite."*
> *(personnalisable)*
>
> Date limite : **[date picker]** **[heure picker]**
>
> Courtiers notifiés :
> ☑ Marc Leblanc (offre actuelle : 275 000 $)
> ☑ Julie Thériault (offre actuelle : 280 000 $)
>
> **[Lancer la ronde]**

**En coulisses :**
1. Création d'un `BidRound` en DB (status: `active`, deadline, message)
2. Courriel **simultané** à tous les courtiers sélectionnés : message + lien pour **réviser leur offre** avant la deadline
3. Chaque courtier reçoit un lien vers sa propre offre avec la possibilité de la modifier
4. Hard cutoff côté serveur — aucune soumission acceptée après la deadline
5. Aucune information sur le nombre de concurrents dans le courriel ni sur la page de révision

**Après la deadline :**
- Le `BidRound` passe en `closed`
- Le panneau Offres met en évidence les offres révisées (badge "Mise à jour")
- Le comparateur affiche les offres finales
- Le courtier vendeur présente à Sylvie et choisit

**Modèle BidRound :**

```
BidRound {
  id
  transactionId       → Transaction
  deadline: DateTime
  message: string
  status: 'active' | 'closed'
  notifiedOfferIds: []  → Offers notifiées
  createdAt
  closedAt
}
```

---

**9. Cas hors-système**

Le courtier peut enregistrer manuellement toute réponse reçue par téléphone/texto/courriel direct, comme dans le scénario acheteur (§9.2.2 étape 7).

---

Architecture technique, sécurité : voir §9.2.6.
Sprint plan : voir §9.2.7.

---

#### 9.2.4 Refonte page transaction — Page adaptative par workflowStep (validé 2026-02-21, Party Mode)

> **Constat :** La page transaction actuelle est un dashboard statique avec onglets fixes (Infos | Offres | Conditions | Documents). Avec l'ajout du flow offre acheteur (§9.2.2), vendeur (§9.2.3), cartes conditions enrichies (§9.2.5), BidRound, gestionnaire d'invitations — cette structure ne tient plus. Coder les features S1-S6 sur la page actuelle obligerait à tout recasser ensuite. La refonte doit passer AVANT les features.
>
> **Décision validée :** Sprint S0 (refonte layout) AVANT S1 (features offre).

**Concept UX : page qui évolue selon le `workflowStep`**

Au lieu d'onglets fixes, la page montre **ce qui est pertinent maintenant** selon l'étape de la transaction. Les autres sections restent accessibles mais pas au premier plan. C'est un flow, pas un dashboard.

| workflowStep | Section au premier plan | Sections secondaires |
|-------------|------------------------|---------------------|
| `consultation` | Infos propriété + client, packs conditions | Carnet pro, documents |
| `offer-submitted` | Panneau offres (acheteur : mon offre + négo / vendeur : liste + comparateur + invitations) | Infos, conditions |
| `offer-accepted` | Confirmation offre acceptée, transition vers conditions | Offres (historique), infos |
| `conditional-period` | Cartes conditions enrichies (countdown, rappels, parties assignées, upload) | Offres (référence), infos |
| `firm-pending` | Checklist pré-closing, assignation notaire | Conditions (levées), infos |
| `pre-closing` | Coordination notaire/avocat, documents finaux | Checklist, infos |
| `closing-day` | Checklist jour J, confirmation rendez-vous | Tout le reste |
| `post-closing` | Commission, suivi client, archivage | Historique complet |

**Scope S0 :**
- Layout adaptatif par `workflowStep` — le contenu principal change selon l'étape
- Zones de la page définies (header TX, section principale, sections secondaires)
- Navigation entre sections (sidebar ou accordéon)
- Système de composants conteneurs (slots) pour accueillir les features S1-S8
- Responsive mobile (le courtier est souvent sur son cell)

**Ce qui n'est PAS dans S0 :** Aucune nouvelle feature — juste la structure qui les accueillera.

##### 9.2.4.1 Cockpit Acheteur — Vues détaillées par workflowStep (validé 2026-02-21, Party Mode)

> **Principe UX :** Chaque écran a UN call-to-action principal. Le courtier ne doit JAMAIS se demander "qu'est-ce que je clique ?". La réponse est toujours évidente. Un courtier de 55 ans au NB doit comprendre en 2 secondes.
>
> **Décision validée :** Après l'onboarding, le courtier est redirigé vers `/transactions/:id` (la TX fraîchement créée), PAS vers le Dashboard. Il atterrit directement sur le cockpit `consultation`.

**Architecture composant :**

```tsx
// Le type de la TX détermine quel cockpit
function TxCockpit({ transaction }) {
  if (transaction.type === 'purchase') return <BuyerCockpit transaction={transaction} />
  return <SellerCockpit transaction={transaction} />
}

// Switch par workflowStep pour l'acheteur
function BuyerCockpit({ transaction }) {
  switch (transaction.currentStep?.slug) {
    case 'consultation':       return <ConsultationView />
    case 'offer-submitted':    return <OfferSubmittedView />
    case 'offer-accepted':     return <OfferAcceptedView />
    case 'conditional-period': return <ConditionalPeriodView />
    case 'firm-pending':
    case 'pre-closing':
    case 'closing-day':        return <ClosingView />
    case 'post-closing':       return <PostClosingView />
  }
}
```

**Vue 1 — `consultation` : "Préparez votre offre"**

Première chose vue après l'onboarding. Doit être limpide.

| Zone | Contenu |
|------|---------|
| Message principal | "Votre dossier est prêt. Quand vous serez prêt à soumettre une offre pour [Client], cliquez ci-dessous. Ofra pré-remplira le formulaire NBREA." |
| CTA principal | **"Préparer une offre"** (gros bouton proéminent) |
| Profil propriété | Carte résumé : type, contexte, financement, tags (existant PropertyProfileCard, modifiable) |
| Conditions recommandées | Pack suggestions : "Ofra suggère 4 conditions pour ce type : Inspection, Financement, Titre clair, Assurance" + lien "Voir le pack" |

**Vue 2 — `offer-submitted` : "En attente de réponse"**

| Zone | Contenu |
|------|---------|
| Statut | Barre/carte : offre envoyée à [Destinataire], prix offert vs demandé (écart %), timer expiration avec barre de progression |
| CTA | "Voir le PDF" + "Retirer l'offre" (secondaire) |
| Message | "Pas encore de réponse. Ofra vous notifiera dès que [Destinataire] répond." |
| Si contre-offre reçue | Bascule en mode négociation : NegotiationThread visible (R1, R2...), écart actuel en $, 3 boutons : "Accepter [montant]" / "Contre-offre" / "Refuser" |

**Vue 3 — `offer-accepted` : "Offre acceptée !"**

| Zone | Contenu |
|------|---------|
| Célébration | Animation checkmark 3 sec, prix final + date clôture |
| Résumé auto | "Ofra a automatiquement : activé vos conditions, calculé les deadlines, préparé votre checklist" |
| CTA principal | **"Voir mes conditions"** → transition vers conditional-period |

**Vue 4 — `conditional-period` : "Vos conditions" (coeur d'Ofra)**

| Zone | Contenu |
|------|---------|
| Header | "Période conditionnelle — X/Y conditions actives. Prochaine deadline : [condition] dans N jours" |
| Cartes conditions | Chaque condition = mini-dossier : barre countdown colorée (rouge < 48h, jaune < 7j, vert > 7j), partie tierce assignée, boutons "Relancer" / "Uploader document" / "Lever la condition" |
| Conditions levées | Affichées en vert avec checkmark, parties tierces et date de résolution |

**Vue 5 — `firm-pending` → `closing-day` : "Checklist closing"**

| Zone | Contenu |
|------|---------|
| Countdown | Compte à rebours vers la date de clôture |
| Checklist | Items restants (notaire assigné, documents finaux, rendez-vous confirmé) |
| CTA | Action sur l'item le plus urgent |

**Vue 6 — `post-closing` : "Dossier complété"**

| Zone | Contenu |
|------|---------|
| Résumé final | Prix, dates, parties impliquées |
| Commission | Suivi si applicable |
| CTA | "Archiver" / "Voir l'historique complet" |

**Parcours émotionnel du courtier acheteur (guide UX) :**

| Moment | Émotion | Réponse Ofra |
|--------|---------|-------------|
| Sort de l'onboarding | "Et maintenant ?" | Redirige vers la TX, montre la prochaine action |
| Prépare l'offre | "Je veux pas me tromper" | Guide pas-à-pas, preview PDF, confiance |
| Attend la réponse | Anxiété | Timer visible, notification instantanée |
| Négocie | "Est-ce raisonnable ?" | Historique clair, écart en % |
| Offre acceptée | Excitation | Célébrer + lister les conditions auto |
| Période conditions | "L'inspecteur a-t-il rappelé ?" | Countdown par condition, bouton relancer |
| Closing | "Est-ce que tout est prêt ?" | Checklist, zéro surprise |

**Scope S0 pour le cockpit acheteur :**
- `ConsultationView` codé complètement (c'est le premier écran post-onboarding)
- Autres vues = placeholders "Cette section arrive bientôt" jusqu'aux sprints S1-S8
- Composants existants réutilisés à l'intérieur (OffersPanel, ConditionCard, NegotiationThread)
- TransactionHeader décomposé : modales extraites, header compact ~150 lignes

##### 9.2.4.2 Inventaire Maquettes Acheteur — 11 écrans (validé 2026-02-21, Party Mode)

> **Workflow maquettes :** Chaque maquette est produite une à la fois, dans l'ordre ci-dessous. Sam valide chaque écran avant de passer au suivant. Si débat → on ajuste → re-validation → prochaine maquette. Aucune maquette n'est skippée.
>
> **Format :** Maquettes HTML statiques dans `maquettes/` — une page par écran.

**Inventaire complet :**

| # | Code | Écran | workflowStep | Sous-état | Sprint | Priorité |
|---|------|-------|-------------|-----------|--------|----------|
| 1 | A1 | Consultation — dossier prêt | `consultation` | Premier écran post-onboarding | S0 | P0 |
| 2 | A2 | Offre envoyée — en attente | `offer-submitted` | Aucune réponse, timer expiration | S1 | P1 |
| 3 | A3 | Contre-offre reçue — négo | `offer-submitted` | Contre-offre R2, 3 boutons réponse | S1 | P1 |
| 4 | A4 | Négociation avancée | `offer-submitted` | R3+ plusieurs allers-retours | S4 | P2 |
| 5 | A5 | Offre acceptée — célébration | `offer-accepted` | Animation succès transitoire 3 sec | S1 | P1 |
| 6 | A6 | Conditions — début période | `conditional-period` | Toutes actives, rien levé, countdowns pleins | S7 | P1 |
| 7 | A7 | Conditions — en cours | `conditional-period` | Mix levées/actives/urgentes (rouge < 48h) | S7 | P1 |
| 8 | A8 | Conditions — tout levé | `conditional-period` | Toutes levées, transition vers firm | S7 | P2 |
| 9 | A9 | Pré-closing / checklist | `firm-pending` | Checklist items + countdown clôture | S8 | P2 |
| 10 | A10 | Closing day | `closing-day` | Checklist jour J, confirmation RDV | S8 | P2 |
| 11 | A11 | Post-closing — complété | `post-closing` | Résumé final, commission, archiver | S8 | P2 |

**Ordre de production des maquettes :**

```
A1 → valide → A2 → valide → A3 → valide → A5 → valide → A6 → valide → A7 → valide
→ A4 → valide → A8 → valide → A9 → valide → A10 → valide → A11 → valide → DONE
```

*(A4, A8-A11 sont P2 — faits après le coeur du flow)*

**Note :** Le SellerCockpit (maquettes V1-V??) sera inventorié séparément après validation du buyer.

---

#### 9.2.5 Outils post-offre — Conditions enrichies et pipeline closing (validé 2026-02-21, Party Mode)

> **Principe :** Après l'acceptation de l'offre, le courtier entre dans la période conditionnelle puis le pipeline vers le closing. À chaque étape, Ofra doit lui donner des outils pour agir vite — pas juste cocher des cases. Les packs conditions existants sont conservés et adaptés à la réalité.

**Cartes conditions enrichies (remplace les checkboxes actuelles) :**

Chaque condition devient un mini-dossier :

> **Inspection**
> Délai : 10 jours (reste 6 jours) ⏳
> Responsable : Jacques Hébert, inspecteur *(carnet pro)*
> Statut : Planifiée — 25 fév 10h
>
> **[Envoyer un rappel]** [Uploader le rapport] [Lever la condition]
>
> Historique :
> - 21 fév — Condition créée (offre acceptée)
> - 22 fév — Courriel envoyé à Jacques Hébert
> - 23 fév — Jacques a confirmé : 25 fév 10h

**Composants de la carte condition :**

| Composant | Détail |
|-----------|--------|
| Partie tierce assignée | Depuis le carnet pro (inspecteur, courtier hypothécaire, notaire, avocat). Autocomplete. |
| Countdown délai | Jours restants, barre visuelle, alerte quand < 48h |
| Statut enrichi | `Créée` → `Partie assignée` → `En cours` → `Résultat reçu` → `Levée` ou `Problème` |
| Actions contextuelles | "Envoyer un rappel" (courriel à la partie), "Uploader document" (rapport, lettre), "Lever la condition" |
| Historique | Timeline des événements (créée, courriel envoyé, confirmé, rapport reçu, levée) — utilise le `ConditionEvent` existant |

**Cycle universel d'une condition :**
```
Condition créée → Partie assignée → En cours → Résultat reçu → Levée / Problème → Renégociation ou retrait
```

**Vue d'ensemble période conditionnelle :**
> 3 conditions levées sur 5 | 12 jours restants | ⚠️ 1 condition en retard (financement)

**Pipeline post-conditions (firm → closing) :**

| Étape | Outils prévus | Priorité |
|-------|---------------|----------|
| `firm-pending` | Bouton "Assigner le notaire" → carnet pro → courriel auto avec résumé TX | P1 |
| `pre-closing` | Checklist pré-closing (notaire confirmé, hypothèque finale, ajustements, clés) | P2 |
| `closing-day` | Confirmation rendez-vous, checklist jour J, bouton "Transaction complétée" | P3 |
| `post-closing` | Commission, courriel "Félicitations" au client, archivage | P3 (§9.3 P3) |

**Priorisation validée (approche Murat, confirmée par Sam : "on livre bien ce qui est facile") :**

| Priorité | Feature | Effort | Sprint |
|----------|---------|--------|--------|
| **P0** | Cartes conditions enrichies (partie assignée, countdown, rappels, upload, historique) | 2 jours | S7 |
| **P0** | Rappels automatiques parties tierces (cron + email existant) | 1-2 jours | S8 |
| **P1** | Courriel auto au notaire "voici le dossier" à firm-pending | Inclus S8 | S8 |
| **P1** | Upload documents par condition | Inclus S7 | S7 |
| **P2** | Checklist pré-closing | Phase suivante | -- |
| **P2** | Dashboard commission | §9.3 P3 | -- |
| **P3** | Bouton "Transaction complétée" + archivage | Phase suivante | -- |

---

#### 9.2.6 Architecture technique commune — Système d'offre bout en bout

**Blocs acheteur (§9.2.2) :**

| Bloc | Technologie | Détail |
|------|-------------|--------|
| **OfferPdfService** (nouveau) | `pdf-lib` (Node.js) | Template PDF NBREA, remplissage dynamique, hash SHA-256 intégrité, stockage filesystem. Léger, pas de headless browser. |
| **ESignatureService** (nouveau) | HelloSign API ou DocuSign API | Création envelope, envoi signature, webhook callback (signé/refusé), stockage certificat. ~5$/mois bas volume. |
| **OfferMailService** (enrichi) | AdonisJS Mail (existant) | PDF signé en PJ, lien réponse token, template courriel pro avec branding Ofra. |
| **OfferIntakeController** (enrichi) | Existant | Vérification email, affichage PDF, accept + eSign vendeur, contre-offre, lien unique par invitation, tracking ouverture. |
| **CreateOfferModal** (refonte) | React (existant) | 3 étapes (form → preview → sent), adapté `clientRole`, destinataire courtier/vendeur direct. |
| **ProfessionalContact** (enrichi) | Migration | Ajout rôle `broker` dans l'enum. |
| **Profil signature** | Migration | Champ `signature_image` sur table `users` (blob ou path), sauvegardé après première signature. |

**Blocs vendeur (§9.2.3) :**

| Bloc | Technologie | Détail |
|------|-------------|--------|
| **BidRound** (nouveau) | Modèle Lucid + migration | Ronde d'enchères formelle, deadline serveur, notification groupée. |
| **OfferInvitation** (nouveau) | Modèle Lucid + migration | Lien unique par courtier invité, tracking statut (envoyé/ouvert/soumis). |
| **InvitationManager** (nouveau) | React | Modale gestionnaire d'invitations, tableau de suivi, formulaire d'invitation. |
| **OffersPanel** (enrichi) | React (existant) | Vue adaptée `seller` : liste offres reçues, comparateur proéminent, filtres/tri, acceptation cascade. |
| **OfferComparison** (enrichi) | React (existant) | Mise en évidence "Meilleur" par critère, support BidRound (badge "Mise à jour"). |

**Modèles DB nouveaux :**

```
BidRound {
  id, transactionId, deadline: DateTime, message: string,
  status: 'active' | 'closed', notifiedOfferIds: [],
  createdAt, closedAt
}

OfferInvitation {
  id, transactionId, email, name, agency, token (unique),
  status: 'sent' | 'opened' | 'submitted', createdAt
}

Offer (enrichi) : + source: 'intake' | 'manual'
User (enrichi) : + signature_image (blob ou path)
ProfessionalContact : + rôle 'broker'
```

**Template PDF NBREA :**

> **Dépendance critique** : Sam doit fournir ou valider le formulaire officiel "Agreement of Purchase & Sale" du NB (NBREA) avant implémentation.

| Section du formulaire | Champs Ofra mappés |
|----------------------|-------------------|
| Parties (Buyer/Seller) | `transaction.client` + destinataire |
| Property | `transaction.property` (adresse, ville, code postal) |
| Purchase Price | `offerRevision.price` |
| Deposit | `offerRevision.deposit` + `depositDeadline` |
| Closing Date | `offerRevision.closingDate` |
| Financing | `offerRevision.financingAmount` |
| Inspection | `offerRevision.inspectionRequired` + `inspectionDelay` |
| Inclusions | `offerRevision.inclusions` |
| Conditions | `offerRevision.conditions[]` |
| Expiry | `offerRevision.expiryAt` |
| Signature | eSignature canvas + horodatage + IP |

**Sécurité :**

| Risque | Mitigation |
|--------|-----------|
| Lien de réponse expose données financières | Vérification email obligatoire + token avec expiration + rate limiting |
| PDF modifié après signature | Hash SHA-256 intégré dans le PDF, vérification à l'ouverture |
| Signature biométrique (données sensibles) | Chiffrement au repos |
| Validité légale eSignature NB | *Electronic Transactions Act* NB, API tierce fournit certificat |
| PDF doit être reconnu par les courtiers NB | Template basé sur formulaire NBREA officiel |
| Courtiers acheteurs déduisent le nombre de concurrents | Liens uniques par invitation, aucun compteur visible |
| BidRound deadline contournée | Hard cutoff serveur, pas de grace period |
| Équité notification BidRound | Tous les courriels dans le même batch, logs d'envoi |

**Métriques de succès :**

| Métrique | Cible |
|----------|-------|
| Taux d'adoption formulaire acheteur (vs papier) | > 60% après 3 mois |
| Taux de réponse via lien (vs hors-système) | > 40% |
| Temps moyen préparation offre | < 5 min (vs 30-45 min papier) |
| NPS courtiers sur le flow offre | > 8/10 |

---

#### 9.2.7 Sprint plan unifié S0→S8 (~18-22 jours)

> **Effort total estimé : ~18-22 jours**

| Sprint | Contenu | Effort | Dépendances |
|--------|---------|--------|-------------|
| **S0** | **Refonte layout page transaction** — page adaptative par workflowStep, zones, navigation, composants conteneurs, mobile | 2-3 jours | -- |
| **S1** | Formulaire adapté acheteur (3 étapes) + destinataire courtier/vendeur direct + rôle `broker` carnet pro | 2-3 jours | S0 |
| **S2** | OfferPdfService + template NBREA + preview HTML | 2-3 jours | S1, template PDF Sam |
| **S3** | ESignatureService (intégration API tierce) + profil signature | 2 jours | S2 |
| **S4** | Envoi courriel enrichi + page de réponse refonte + cycle contre-offre | 2 jours | S2, S3 |
| **S5** | Gestionnaire invitations (OfferInvitation, liens uniques, tracking) + panneau Offres adapté vendeur | 2 jours | S0 |
| **S6** | BidRound (modèle, notification groupée, révision offre, hard cutoff) + acceptation cascade + comparateur enrichi | 2-3 jours | S5 |
| **S7** | Cartes conditions enrichies (partie assignée, countdown, rappels, upload, historique) | 2 jours | S0 |
| **S8** | Rappels automatiques parties tierces + courriel notaire à firm-pending | 1-2 jours | S7 |

**Éléments reportés (phases suivantes) :**

| Feature | Priorité | Phase |
|---------|----------|-------|
| Checklist pré-closing | P2 | Phase 3+ |
| Dashboard commission | P2 | §9.3 P3 |
| Bouton "Transaction complétée" + archivage | P3 | Phase 3+ |
| Portail client lecture seule | P2 | §9.3 P2 |
| Sprint 2-4 conditions (lock profile, admin override, audit log) | P2 | Phase 3+ |
| M14 Polish offres (irrévocabilité, custom expiration, NegotiationThread modal) | P2 | §11.G |
| Compteur "Valeur protégée" (données réelles) | P3 | D43 |
| ~~Onboarding simplifié "1ère TX en 2 min"~~ | **Absorbé dans §L.5** | D40 refonte |
| Plan Agence activé | P3 | D46 |
| UI Audit Trail conditions | P3 | Backlog |

### 9.3 Phase 3 — "Le Copilote" (mois 2-3, ~5 jours)

> **Philosophie :** Ofra ne se contente plus de suivre — il agit. Il envoie les rappels, il informe le client, il calcule les commissions. L'agent se concentre sur la relation humaine.

| # | Feature | Détail | Statut |
|---|---------|--------|--------|
| P1 | **Rappels proactifs aux parties tierces** | Email automatique à l'inspecteur 48h avant la date d'inspection, au notaire 5j avant le closing, à l'avocat pour la révision du titre. Template email configurable par l'agent. | ❌ TODO |
| P2 | **Portail client (lecture seule)** | Lien sécurisé unique (token expirable) envoyé au client. Le client voit : étapes de sa transaction (timeline), conditions en cours, prochaine deadline, documents partagés. Pas de login requis. | ❌ TODO |
| P3 | **Dashboard commission** | Réalisé (commissions fermées) + Projeté (TX actives × % probabilité) + Objectif annuel avec barre de progression. Graphique mensuel. | ❌ TODO |
| P4 | Email du lundi "Votre semaine" | Digest hebdo : TX actives, deadlines cette semaine, conditions en retard, commissions projetées | D50 — ❌ TODO |
| P5 | Alertes proactives 48h (push/SMS) | Notifications urgentes quand une deadline approche dans 48h — pas juste in-app mais push/SMS | D51 — ❌ TODO |
| P6 | Superadmin : suppression de compte | Mot de passe + type-to-confirm, soft delete, cascade TX/conditions, audit log | Backlog |

### 9.4 Phase 4 — "L'Arme Secrète" (mois 3-6, ~5 jours)

> **Philosophie :** Ce qu'aucun concurrent NB ne peut offrir. Les features qui font dire à l'agent : "je ne peux plus m'en passer."

| # | Feature | Détail | Statut |
|---|---------|--------|--------|
| S1 | ~~**Génération PDF formulaires NBREA**~~ | **AVANCÉ → §9.2.2** (Phase 2.5). Intégré dans le flow offre acheteur bout en bout avec eSignature + envoi automatique. Ne se limite plus à "télécharger un PDF" — le PDF est signé et envoyé directement depuis Ofra. | 📋 §9.2.2 |
| S1b | **eSignature intégrée** | Intégration API tierce (HelloSign/DocuSign). Signature courtier à la soumission, signature vendeur à l'acceptation. Profil signature sauvegardé. Conforme *Electronic Transactions Act* NB. Lié à §9.2.2. | ❌ TODO (lié §9.2.2 S3) |
| S2 | **Collaboration agent-agent** | 2 agents (acheteur + vendeur) sur le même dossier. Chacun voit sa perspective. Offres/contre-offres synchronisées en temps réel. Notifications croisées. Invitation par email. | ❌ TODO |
| S3 | **Export fiscal annuel** | Rapport PDF/CSV de toutes les commissions de l'année : date closing, montant, split, TPS/TVH. Prêt pour le comptable. | ❌ TODO |
| S4 | Intégration calendrier | Sync Google Calendar / Outlook avec les deadlines de conditions et dates de closing | ❌ TODO |
| S5 | Historique communications | Log des emails envoyés (rappels pros, portail client) avec statut (envoyé/ouvert/cliqué) | ❌ TODO |

### 9.5 Phase 5 — Intelligence Augmentée (12-24 mois)

> **Philosophie :** L'IA au service de l'agent — pas pour remplacer, mais pour augmenter son jugement.

| Feature | Détail |
|---------|--------|
| Analyse de documents par IA | OCR + extraction automatique des données clés d'un contrat scanné |
| Détection de risques automatique | Alertes quand les conditions d'une TX ressemblent à un pattern de défaillance passé |
| Suggestions d'offres basées sur le marché | Comparables automatiques basés sur le code postal, type de propriété, historique |
| Gestion d'agenda intégrée | Vue calendrier unifiée : deadlines, rendez-vous, visites |
| Templates partagés (données anonymisées) | Les agents partagent anonymement leurs templates de conditions les plus utilisés |

### 9.6 Expansion Géographique

```
Année 1 : Nouveau-Brunswick (Moncton → provincial)
Année 2 : Nouvelle-Écosse + IPE → Maritimes complètes + Québec rural
Année 3 : Québec + Ontario
```

L'architecture supporte l'expansion via `province` sur les templates de conditions.

---

## 10. Métriques de Succès

### Launch Fondateurs (Mois 1-3)

| Métrique | Cible | Signal STOP |
|----------|-------|-------------|
| Fondateurs inscrits | 25/25 | < 10 |
| Activation (1ère TX < 5 min) | 80% | < 50% |
| Rétention M1 | 70% | < 40% |
| NPS | > 30 | < 0 |
| Test "5 secondes" | 4/5 réussis | < 2/5 |

### Post-Launch (Mois 4-12)

| Métrique | Cible M6 | Cible M12 |
|----------|----------|-----------|
| Utilisateurs payants | 30-50 | 80-150 |
| MRR | 1 500-2 500$ | 4 000-8 000$ |
| Churn mensuel | < 8% | < 5% |
| % signups par référence | 20% | 40% |
| Couverture | NB complet | NB + NS + PEI |

---

## 11. Annexes

### A. Documents supprimés / périmés

| Document | Statut | Action |
|----------|--------|--------|
| `docs/pricing-strategy.md` | **SUPPRIMÉ** | Retiré du repo — entièrement remplacé par ce PRD |
| `docs/roadmap.md` | **SUPPRIMÉ** | Retiré du repo — entièrement remplacé par ce PRD |
| `project-context.md` | ✅ MIS À JOUR (2026-02-13) | Pricing, features, routes, roadmap — tous corrigés |

### B. Documents toujours valides

| Document | Contenu |
|----------|---------|
| `docs/visual-strategy.md` | Palette, typo, composants — toujours valide |
| `docs/business-logic-calculations.md` | Calculs métier — toujours valide |
| `project-context.md` (hors pricing) | Architecture, stack, API — toujours valide |
| `_bmad-output/session-2026-02-02-ux-refonte.md` | Décisions D32-D41 — toujours valide |
| `_bmad-output/planning-artifacts/product-brief-ofra-2026-01-25.md` | Personas, JTBD, vision 3 ans — toujours valide (sauf pricing) |

### C. Décisions complètes D32-D51

Référence croisée : voir section 4.1 de ce document.

### D. Bugs Connus (à corriger)

| # | Bug | Contexte | Sévérité |
|---|-----|----------|----------|
| BUG-01 | ~~**Profil propriété invisible dans Transaction Details**~~ — Query key inconsistant (`profile` vs `transaction-profile`). **CORRIGÉ** : 4 usages alignés sur `['transaction-profile', id]` dans EditTransactionPage + PropertyProfileCard. | Page Transaction Details → Profil Propriété | ✅ Corrigé |
| BUG-02 | **Erreur SMTP lors de la création d'un lien d'offre (share link)** — `ETIMEDOUT` sur `CONN` lors de l'envoi de l'email de partage. L'email ne part pas mais l'erreur est non-bloquante (l'offre est créée). | `POST /api/offers/:id/share` → `offer_accepted_mail` ou share link email | 🟡 Medium (SMTP config/connexion) |
| SEC-01 | ~~**FINTRAC controller sans vérification d'ownership**~~ — Les endpoints show/complete/resolve n'avaient pas de vérification tenant. **CORRIGÉ** : méthode `loadRecordWithOwnershipCheck()` + `TenantScopeService.canAccess()`. | `fintrac_controller.ts` | ✅ Corrigé |
| SEC-02 | ~~**TenantScope manquant dans conditions_controller + notes_controller**~~ — 15 endpoints sans tenant scoping. **CORRIGÉ** : `TenantScopeService.apply()` ajouté dans 12 méthodes conditions + 3 méthodes notes. | `conditions_controller.ts`, `notes_controller.ts` | ✅ Corrigé |
| BUG-ADM | ~~**admin_metrics_service deadline column**~~ — Colonne `deadline` n'existe pas, devrait être `due_date`. **CORRIGÉ**. | `admin_metrics_service.ts:196-203` | ✅ Corrigé |
| BUG-MAIL | ~~**fullName null dans emails**~~ — `auth.user!.fullName` pouvait être null dans transaction_members et transaction_parties controllers. **CORRIGÉ** : `fullName ?? email` fallback. | 2 controllers | ✅ Corrigé |
| BUG-TS | ~~**11 erreurs TypeScript**~~ — 5 dans `admin_metrics_service.ts` (nested preload → restructuré en 2 queries), 1 `cleanup_duplicates.ts` (+=), 1 `test_no_duplicates.ts` (import), 4 test files (unused vars). **CORRIGÉ** : `tsc --noEmit` = 0 erreur. | Backend | ✅ Corrigé |
| BUG-03 | ~~**FINTRAC conditions sans bouton CTA dans la timeline**~~ — `VerticalTimeline` ne passait pas `onFintracClick` aux `ConditionCard`. Les conditions FINTRAC s'affichaient comme des conditions normales → checkbox toggle → 422 + faux toast vert. **CORRIGÉ** : ajout `FintracComplianceModal` + `handleFintracClick` + interception toggle dans `VerticalTimeline.tsx`. | Timeline → ConditionCard FINTRAC | ✅ Corrigé |
| BUG-04 | ~~**FINTRAC auto-créé en mode manuel**~~ — `FintracService.onStepEnter()` ignorait `autoConditionsEnabled`. Conditions FINTRAC bloquantes créées même en mode manuel. **CORRIGÉ** : gate `autoConditionsEnabled` ajoutée dans `onStepEnter()` et `onPartyAdded()`. | Backend `fintrac_service.ts` | ✅ Corrigé |
| BUG-05 | ~~**Nested `<button>` dans DocumentStatusBar**~~ — `<button>` wrapper contenait des `<button>` badges → erreur React DOM. **CORRIGÉ** : wrapper changé en `<div role="button">`. | `DocumentStatusBar.tsx` | ✅ Corrigé |
| BUG-06 | ~~**Faux toast vert sur erreur 422**~~ — `ConditionValidationModal.resolveMutation.onSuccess` ne vérifiait pas `response.success`. 422 renvoyait JSON avec `success: false` mais le toast vert s'affichait. **CORRIGÉ** : vérification `response.success` avant toast. | `ConditionValidationModal.tsx` | ✅ Corrigé |

---

### E. Audit Général (2026-02-16)

**Score launch-readiness : 82%** (était 75% avant correctifs sécurité)

| Métrique | Valeur |
|----------|--------|
| Tests backend | 120 PASS (68 unit + 52 functional) |
| Tests frontend | 327 PASS (40 fichiers) |
| TODO/FIXME/HACK | 0 |
| console.log prod | 0 |
| @ts-ignore | 0 |
| explicit `any` | 0 |
| i18n FR/EN parité | ✅ 2 789 lignes chaque |
| Feature gates | 11/11 |
| Erreurs TS restantes | **0** (11 corrigées le 2026-02-16) |
| Routes protégées | 47 (auth/txPermission/admin/superadmin) |
| Secrets hardcodés | 0 |

**Correctifs appliqués (session 2026-02-16) :**
- SEC-01 : Auth FINTRAC (TenantScope + loadRecordWithOwnershipCheck)
- SEC-02 : TenantScope conditions/notes (15 endpoints)
- BUG-01 : Query key profile → `['transaction-profile', id]`
- BUG-ADM : deadline → due_date dans admin_metrics
- BUG-MAIL : fullName ?? email dans 2 controllers
- ROUTE-1 : Landing page `/` pour visiteurs non-auth

**Bloqueurs restants pour lancement :**
1. ~~D53 Trial 30j~~ → ✅ DONE (backend + frontend + middleware + trial banner + reminders)
2. Stripe billing (~70% — code done, Stripe Dashboard setup restant)
3. Legal pages (0%)
4. ~~Emails essentiels trial~~ → ✅ DONE (welcome, verification, trial reminders J7/J21/J27)
5. Offer notification loop (§9.2.1 N1-N3) — emails buyer sur counter-offre/acceptation/confirmation (~2-3h)

### F. Priorités Post-Audit (mis à jour 2026-02-18)

| Priorité | Action | Effort | Statut |
|----------|--------|--------|--------|
| ~~🔴 P0~~ | ~~Fix 7 erreurs TypeScript~~ | — | ✅ DONE |
| ~~🔴 P0~~ | ~~D53 Trial backend + frontend~~ | — | ✅ DONE |
| ~~🔴 P0~~ | ~~**SEC-03** Path traversal `/api/uploads/:filename`~~ | 5 min | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**SEC-04** FINTRAC bypass quand `autoConditionsEnabled=false`~~ | 5 min | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**SEC-05** Trial users bloqués FINTRAC (PlanService)~~ | 15 min | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**SEC-06** Fichiers servis sans ownership check~~ | 30 min | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**INFRA-01** `fly.toml` region `ewr` → `yyz` (Toronto)~~ | 1 min | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**Bloc 9 : Admin Dashboard Refonte** (D57 — 3 vues Pulse/Gens/Config, remplace 5 pages)~~ | 3-4 jours | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**Bloc 9 : SiteMode** (D58 — construction/maintenance/live + code accès fondateurs)~~ | 3h | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**Bloc 9 : Codes promo** (D59 — CRUD + validation inscription + miroir Stripe)~~ | 4h | ✅ DONE (2026-02-18) |
| ~~🔴 P0~~ | ~~**Bloc 9 : Apply-to-existing** (modal type-to-confirm, exclut fondateurs)~~ | 2h | ✅ DONE (2026-02-18) |
| 🔴 P0 | Stripe billing | 1-2 jours | 🟡 EN COURS (code done, env done, reste: créer 4 produits Stripe Dashboard, enregistrer webhook URL, seed `stripeProductId` dans plans DB, test E2E flow) |
| 🔴 P0 | Offer notification loop (§9.2.1 N1-N3) — emails buyer counter-offre + acceptation + confirmation soumission | 2-3h | ❌ TODO |
| 🟠 P1 | Offer expiry automation (§9.2.1 N4) — cron ou lazy check `expireOffers()` | 30min | ❌ TODO |
| ~~🟠 P1~~ | ~~Error Boundary + code splitting frontend~~ | 1h | ✅ DONE (2026-02-18) |
| ~~🟠 P1~~ | ~~Page 404 / catch-all route~~ | 15 min | ✅ DONE (2026-02-18) |
| ~~🟠 P1~~ | ~~`FRONTEND_URL` unifié dans `env.ts` (3 fallbacks différents)~~ | 30 min | ✅ DONE (2026-02-18) |
| ~~🟠 P1~~ | ~~Tests FINTRAC + TenantScope + Admin + Documents + Members + Parties backend + Pages frontend~~ | — | ✅ DONE (2026-02-18, commit `a2f364e`) |
| 🟠 P1 | Legal (CGU, vie privée) | 1 jour | ❌ TODO |
| ~~🟠 P1~~ | ~~Emails essentiels trial~~ | — | ✅ DONE |
| 🟡 P2 | i18n : `apiError.ts` FR hardcodé, `UserDropdown` EN hardcodé | 30 min | ❌ TODO |
| 🟡 P2 | `gray-` → `stone-` migration (13 fichiers) | 1h | ❌ TODO |
| 🟡 P2 | E2E Playwright en CI | 2h | ❌ TODO |
| 🟡 P2 | CSP headers (Content-Security-Policy) | 1h | ❌ TODO |
| 🟡 P2 | Docker : non-root user dans Dockerfile | 10 min | ❌ TODO |
| 🟡 P2 | `db:seed` idempotent (updateOrCreate) ou retirer du release_command | 30 min | ❌ TODO |
| 🟡 P2 | Sprint 2-4 conditions pipeline | Post-lancement | ❌ TODO |
| 🟡 P2 | M14 Offre Unifié — polish (voir §11.G) | Post-lancement | ❌ TODO |
| ⚪ P3 | `as any` cleanup (51+ total backend+frontend) | Continu | ❌ TODO |
| ⚪ P3 | Accessibilité WCAG (6 issues identifiées) | Continu | ❌ TODO |
| ⚪ P3 | Coverage pages frontend → 50%+ | Continu | 🔄 EN COURS (Login, Register, ForgotPassword, VerifyEmail, Clients couverts) |

### G. Audit M14 — Formulaire Offre Unifié (2026-02-17)

**Contexte :** Audit de cohérence entre la maquette M14 (`maquettes/14-formulaire-offre-unifie.html`), le backend Bloc 8, le frontend production (`components/transaction/`), et la réalité du marché immobilier NB (recherche FCNB, NBREA, McInnes Cooper).

**Maquette M14 :** 7 états (A — Nouvelle offre, B — Contre-offre, C — Confirmation, D — Succès, E — Erreurs, F — Permission, G — Serveur). Layout 2 colonnes : formulaire gauche, aperçu live + historique droite.

#### G.1 Cohérence Maquette ↔ Backend ↔ Frontend

| Champ M14 | Backend `OfferRevision` | Frontend type | Réalité NB | Verdict |
|-----------|------------------------|---------------|------------|---------|
| Prix offert | `price` decimal(12,2) | ✅ `price: number` | ✅ | ALIGNÉ |
| Dépôt | `deposit` decimal | ✅ | ✅ 1-3% typique NB | ALIGNÉ |
| Limite dépôt | `depositDeadline` date | ⚠️ **Absent du type `OfferRevision` en retour** | ✅ | FIX TYPE |
| Clôture | `closingDate` date | ✅ | ✅ 30-60j typique | ALIGNÉ |
| Expiration (pills 24h/48h/7j/Custom) | `expiryAt` datetime | ✅ pills | ⚠️ Terme NB = « irrévocabilité » | FIX LABEL |
| Financement toggle + montant | `financingAmount` decimal | ✅ | ✅ condition standard | ALIGNÉ |
| Inspection toggle + délai | `inspectionRequired` + `inspectionDelay` | ✅ | ✅ 2-3 jours typique | ALIGNÉ |
| Inclusions/Exclusions | `inclusions` text | ✅ | ⚠️ NB sépare incl/excl | OK MVP |
| Message | `message` text | ✅ | ✅ | ALIGNÉ |
| Direction from→to | `fromPartyId` + `toPartyId` + `direction` | ✅ | ✅ | ALIGNÉ |
| Rév. #N badge | `revisionNumber` auto-incr | ✅ | ✅ | ALIGNÉ |
| Notes internes courtier | `notes` text | ❌ **Absent du modal production** | Utile | FIX |
| Historique/timeline | revisions array | ⚠️ Dans OffersPanel, pas dans le modal | ✅ | DÉCISION UX |
| Rejet auto offres précédentes | Bulk reject auto dans `acceptOffer()` | ✅ auto | ✅ Légalement obligatoire NB | FIX MAQUETTE |

**Score alignement global : ~85%** — aucun gap bloquant, 9 actions identifiées.

#### G.2 Recherche NB — Conclusions Clés

**Sources :** FCNB (guides acheteurs/vendeurs + guide offres multiples courtiers), NBREA (code d'éthique, législation), McInnes Cooper (10 FAQs droit immobilier NB), Legal Line, Megadox.

1. **Vocabulaire :** Au NB, la période pendant laquelle l'offrant ne peut retirer son offre s'appelle « **période d'irrévocabilité** » (irrevocable period), pas « expiration ». Typiquement 2-48h. Notre label « Expiration » fonctionne mais manque de précision professionnelle.

2. **Contre-offre annule automatiquement l'offre précédente** — c'est une règle légale, pas un choix UX. Chaque contre-offre paraphée et datée remplace la précédente. Le checkbox « Marquer l'offre précédente comme non retenue » dans M14 état C **ne devrait pas être optionnel**.

3. **Pas de cooling-off period au NB** pour l'immobilier de revente. Acceptation = contrat lié immédiatement. Notre flow `accepted → advance step` est correct.

4. **Offres multiples :** Le vendeur peut recevoir plusieurs offres simultanées. Trois niveaux de divulgation possibles (transparence totale / partielle / confidentialité). Les montants et termes ne peuvent pas être partagés entre acheteurs concurrents. Notre `OfferComparison` est un outil courtier-only (pas visible aux parties), ce qui est conforme.

5. **Dépôt en fiducie :** Détenu par la maison de courtage OU l'avocat. Pas modélisé dans notre backend (champ manquant).

6. **Date de possession ≠ date de clôture :** Au NB, possession = typiquement lendemain de la clôture. Pas modélisé.

7. **Formulaires NBREA :** Réservés aux membres, non publics. L'Agreement of Purchase and Sale inclut : identification parties, description propriété (PID/NIP), prix, dépôt (qui le détient + délai), date d'irrévocabilité, conditions, date clôture/possession, inclusions/exclusions, clauses légales, annexes (Schedules), signatures/paraphes.

8. **Délais typiques NB :** Irrévocabilité 2-48h, inspection 2-3j, financement 5-14j, offre→clôture 30-60j, pré-approbation hypothèque 7-10j ouvrables.

#### G.3 Actions — Plan Classé par Priorité

| # | Priorité | Action | Effort | Détail |
|---|----------|--------|--------|--------|
| 1 | **P0** | Retirer le checkbox « marquer offre précédente comme non retenue » de M14 état C | Maquette | Remplacer par info card non-interactive : « Les autres offres actives seront automatiquement marquées comme non retenues. » C'est un comportement légal automatique au NB. |
| 2 | **P0** | Ajouter `depositDeadline` au type `OfferRevision` frontend | 5 min | `frontend/src/api/transactions.api.ts` — le champ existe en backend et est envoyé, mais pas typé en retour → invisible dans l'UI |
| 3 | **P1** | Enrichir le label « Expiration » avec hint « (période d'irrévocabilité) » | 15 min | i18n FR/EN + tooltip optionnel. Vocabulaire pro NB. |
| 4 | **P1** | Définir l'état « Custom » de l'expiration | Design | Date picker avec heure pour les cas hors 24h/48h/7j. La maquette montre un bouton « Custom » sans état expanded. |
| 5 | **P2** | Ajouter le champ `notes` (interne courtier) dans `CreateOfferModal` production | 30 min | Le champ existe en backend (`notes` sur OfferRevision) et dans le legacy modal, mais absent du modal `transaction/CreateOfferModal.tsx`. Distinct de `message` (public). |
| 6 | **P2** | Afficher `NegotiationThread` dans la colonne droite du modal en mode contre-offre | 1-2h | Actuellement la timeline est dans `OffersPanel` uniquement. La maquette M14 état B la montre à droite du formulaire pendant la saisie. Décision UX : dupliquer ou déplacer ? |
| 7 | **P2** | Corriger `OfferComparison` — vrai count de conditions | 30 min | Actuellement utilise `inclusions ? 1 : 0` comme proxy. Devrait compter les conditions liées via `offer_revision_conditions`. |
| 8 | **P3** | Ajouter champ « Détenteur du dépôt » (brokerage vs avocat en fiducie) | Backend migration + frontend | Obligatoire au NB, variable par transaction. Nouveau champ sur `OfferRevision` ou `Transaction`. |
| 9 | **P3** | Ajouter « Date de possession » distincte de « Date de clôture » | Backend migration + frontend | Au NB, possession = typiquement jour après clôture. Champ optionnel sur `OfferRevision`. |

#### G.4 Gaps Frontend — Code Mort & Boutons Inactifs

| Composant | Problème | Action |
|-----------|----------|--------|
| `OffersSection.tsx` (legacy) | Remplacé par `OffersPanel.tsx`, plus monté | Supprimer (dead code) |
| `CounterOfferModal.tsx` (legacy) | Remplacé par `CreateOfferModal.tsx` unifié | Supprimer (dead code) |
| `CreateOfferModal.tsx` (legacy, `/components/`) | Remplacé par version `/transaction/` | Supprimer (dead code) |
| Bouton « Restore » sur cartes rejected/withdrawn | `onClick` vide, purement cosmétique | Implémenter ou retirer |
| Boutons « View Details » / « Addenda » sur carte accepted | `onClick` vide, purement cosmétique | Implémenter ou retirer |
| `AcceptOfferModal` packs hardcodé | Texte `'Universal + Finance NB'` en dur | Rendre dynamique |
| `AcceptOfferModal` email/note non envoyés | `emailNotify` et `note` collectés mais pas passés à `offersApi.accept()` | Étendre l'API accept ou retirer les champs |

#### G.5 Système d'Intake Public — Phases B+C (ref D35)

> ~~Le flow d'intake est un lead capture minimal. Aucune action requise.~~ **PÉRIMÉ** — Voir D35 Phase B+C ci-dessous.

Le lien d'offre public (`/offer/:token`) doit gérer l'**aller-retour complet de négociation** sur un seul lien. Ref: `_bmad-output/decisions/D35-offer-intake-link.md` (approuvé 9/9).

**Phase A (MVP) : ✅ FAIT** — Formulaire minimaliste (nom, email, prix, message) → crée Offre + Party.

**Phase B (formulaire enrichi) : ❌ À FAIRE** — Enrichir `OfferIntakePage` avec les mêmes champs que `CreateOfferModal` : dépôt, depositDeadline, closingDate, financement, inspection (delay), inclusions. Notifications temps réel quand offre reçue.

**Phase C (portail négo aller-retour) : ❌ À FAIRE** — Le même lien `/offer/:token` affiche l'état actuel de la négociation (offre initiale, contre-offre(s), historique). La partie externe peut **répondre** à une contre-offre directement depuis le lien. Statut visible (en attente acheteur / en attente vendeur). Notification email quand l'autre partie répond.

#### G.6 Références Recherche NB

- FCNB — Guide d'achat d'une maison au Nouveau-Brunswick
- FCNB — Guide offres multiples pour acheteurs et vendeurs
- FCNB — Guide offres multiples pour courtiers
- FCNB — Travailler avec un agent immobilier
- McInnes Cooper — 10 Key Realtor FAQs About N.B. Real Estate Law
- NBREA — Code d'éthique et législation
- Legal Line — Offres et contre-offres / Annuler une offre
- Megadox — Formulaires immobiliers NB

### H. Audit Approfondi Complet (2026-02-18)

**Méthode :** Exploration automatisée exhaustive — 3 agents parallèles (backend, frontend, infra/tests). Lecture de tous les modèles, contrôleurs, services, middleware, routes, composants, API, i18n, configs. ~260 fichiers analysés.

**Score launch-readiness : 84%** (était 82% — auth flows réparés, a11y formulaires, 327/327 frontend 277/277 backend)

#### H.1 Statistiques Projet

| Métrique | Valeur |
|----------|--------|
| Modèles backend | 26 |
| Contrôleurs | 23 |
| Services | 15 |
| Middleware | 10 |
| Migrations | 80 |
| Validators | 14 |
| Pages frontend | 30+ |
| Modules API frontend | 22 |
| Tests backend (Japa) | 277 tests (277 PASS, 0 FAIL) |
| Tests frontend (Vitest) | 327 tests (327 PASS, 0 FAIL — 40 fichiers) |
| E2E (Playwright) | 3 specs + tenant isolation (local only, PAS en CI) |
| i18n FR/EN | 2 836 lignes chaque, parité ✅ |
| `as any` backend | 11 occurrences |
| `as any` frontend | 40+ occurrences |
| Issues totales | ~95 (7 critiques, 15 hautes, 30 moyennes, 43 basses) |

#### H.2 Issues Critiques (P0 — Sécurité / Légal)

| ID | Fichier | Description | Effort |
|----|---------|-------------|--------|
| ~~**SEC-03**~~ | `routes.ts:17` | ~~**Path traversal** — `params.filename` passé sans sanitisation à `app.makePath()`. Fix : `path.basename()`.~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**SEC-04**~~ | `fintrac_service.ts:108` | ~~**FINTRAC bypass** — `onStepEnter` early return quand `autoConditionsEnabled=false`. Brèche légale.~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**SEC-05**~~ | `plan_service.ts` | ~~**Trial FINTRAC bloqué** — `meetsMinimum(undefined, 'solo')` retourne `false`. Trial users bloqués FINTRAC.~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**SEC-06**~~ | `routes.ts:15-19` | ~~**Fichiers sans ownership** — `/api/uploads/:filename` accessible à tout user authentifié.~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**INFRA-01**~~ | `fly.toml` | ~~**Résidence données** — `primary_region = "ewr"` → `yyz` (Toronto).~~ | ✅ CORRIGÉ (2026-02-18) |

#### H.3 Issues Hautes (P1)

| ID | Fichier | Description | Statut |
|----|---------|-------------|--------|
| ~~**FE-01**~~ | `router.tsx` | ~~Pas de code splitting — 30+ pages dans un seul bundle JS~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**FE-02**~~ | `App.tsx` | ~~Pas d'Error Boundary — erreur React = écran blanc total~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**FE-03**~~ | `router.tsx` | ~~Pas de route 404 / catch-all~~ | ✅ CORRIGÉ (2026-02-18) |
| **FE-04** | `Layout.tsx:87-99` | Flash contenu avant redirect trial (hard wall) | ❌ TODO |
| **FE-05** | `tailwind.config.js` | Police Outfit définie mais pas chargée (Google Fonts) | ❌ TODO |
| **I18N-01** | `apiError.ts:24-90` | Messages d'erreur hardcodés en français — users EN voient du FR | ❌ TODO |
| **I18N-02** | `UserDropdown.tsx:100,115` | « Settings » et « Logout » hardcodés en anglais | ❌ TODO |
| **DB-01** | `transaction.ts:102` | `tags` column : `prepare` sans `consume` — retourné comme string brute | ❌ TODO |
| **MIG-01** | migrations | Timestamps dupliqués : `1772000000009` et `1774000000002` — ordre non-déterministe | ❌ TODO |
| **ADMIN-01** | `admin_controller.ts:119-125` | Filtre engagement appliqué post-pagination — `meta.total` incorrect | ❌ TODO |

#### H.4 Issues Moyennes (P2 — sélection)

| ID | Fichier | Description | Statut |
|----|---------|-------------|--------|
| **SEC-07** | `rate_limit_middleware.ts:10` | Rate limiter in-memory `new Map()` — pas distribué multi-instance | ❌ TODO |
| **SEC-08** | Controllers conditions/offers | `findOrFail(id)` avant TenantScope — disclosure existence ressource | ❌ TODO |
| **SEC-09** | (aucun) | Pas de CSP headers (Content-Security-Policy) | ❌ TODO |
| ~~**ENV-01**~~ | `env.ts` | ~~`FRONTEND_URL` non déclaré — 3 fallbacks différents~~ | ✅ CORRIGÉ (2026-02-18) |
| ~~**TS-01**~~ | `notification.ts` | ~~`NotificationType` déclare 4 valeurs, 7 autres utilisées en pratique~~ | ✅ CORRIGÉ (Sprint A — 18 types, commit `c368e79`) |
| **TS-02** | `activity_feed.ts` | `ActivityType` union incomplète — `email_recap_sent`, `fintrac_archived` manquent | ❌ TODO |
| **VAL-01** | Validators multiples | Dates acceptées comme `string` brut sans validation ISO format | ❌ TODO |
| ~~**CSS-01**~~ | 13 fichiers | ~~`gray-` vs `stone-` mélangés~~ | ✅ CORRIGÉ (Tier 1 polish — 213 occurrences, commit `3d68a51`) |
| ~~**CSS-02**~~ | `UpgradePrompt.tsx` | ~~Dark mode~~ | ✅ N/A (D62 — dark mode retiré) |
| **FE-06** | `transactions.api.ts:74,106,109,111` | 4 champs Transaction typés `any[]` / `any` | ❌ TODO |
| **FE-07** | Multiples | `['subscription']` query avec 5 staleTime différents | ❌ TODO |
| **DOCKER-01** | `Dockerfile` | Container tourne en root | ❌ TODO |
| ~~**DEPLOY-01**~~ | `fly.toml` | ~~`db:seed` à chaque deploy — risque duplications~~ | ✅ CORRIGÉ (2026-02-19 — retiré du `release_command`) |

#### H.5 Couverture de Tests — État 277 backend / 327 frontend PASS (2026-02-19)

**Backend — zones MAINTENANT couvertes ✅ :**
- ~~`fintrac_controller.ts` / `fintrac_service.ts`~~ → ✅ 15 tests (unit + functional)
- ~~`tenant_scope_service.ts`~~ → ✅ 8 tests unit
- ~~`plan_service.ts`~~ → ✅ 6 tests unit
- ~~`admin_controller.ts`~~ → ✅ 17 tests functional (access control, CRUD notes/tasks, superadmin)
- ~~`transaction_documents_controller.ts`~~ → ✅ 9 tests functional
- ~~`transaction_members_controller.ts`~~ → ✅ 9 tests functional
- ~~`transaction_parties_controller.ts`~~ → ✅ 10 tests functional
- ~~`export_controller.ts`~~ → ✅ 16 tests functional (7 PDF + 9 email, commit `bb29552`)
- ~~`conditions.spec.ts` blocking test~~ → ✅ fix `stepWhenCreated` (commit `7ce314e`)

**Backend — zones ENCORE sans couverture :**
- `reminder_service.ts`, `email_service.ts` (23 templates mail)
- `condition_template_service.ts` — matching engine

**Frontend — zones MAINTENANT couvertes ✅ :**
- ~~`ClientsPage.tsx`~~ → ✅ 3 tests (loading, empty, cards)
- ~~Register, ForgotPassword, VerifyEmail, Login pages~~ → ✅ 18 tests total
- ~~`apiError.ts`, `date.ts`~~ → ✅ 17 tests unit

**Frontend — zones ENCORE sans couverture :**
- `FintracComplianceModal.tsx` — composant légal critique
- `SettingsPage.tsx` (5 tabs)
- `ClientDetailsPage.tsx`
- Onboarding pages
- Admin pages complètes
- Couche API (`*.api.ts`) — 22 modules sans tests

**E2E (Playwright) — 3 specs + tenant isolation :**
- Auth flow (login, register, logout) — 14 tests
- Tenant isolation — 3 tests (visibility, URL access, API level) — commit `bb29552`

**CI/CD manquant :**
- E2E Playwright pas exécuté en CI
- Pas de code coverage reporting
- Pas de `npm audit` / security scan
- Pas de deploy automatisé

#### H.6 Accessibilité (6 issues WCAG)

| Composant | Issue |
|-----------|-------|
| `UserDropdown` trigger | Pas de `aria-label` — screen reader lit seulement les initiales |
| `Layout` mobile menu button | `aria-expanded` sans `aria-controls` |
| `CardTitle` | `<div>` au lieu de `<h2>` — casse la hiérarchie headings |
| `Badge` | `<div>` au lieu de `<span>` — sémantique inline incorrecte |
| `StepperPill` | Pas de `aria-current="step"` sur l'étape active |
| `KPICard` trend SVGs | Flèches SVG sans `aria-label` ni `aria-hidden` |

#### H.7 Points Positifs Confirmés

- Auth session cookie : `httpOnly`, `secure` en prod, `sameSite` configuré
- CORS restrictif (pas de wildcard `*`), `credentials: true`
- Anti-énumération email sur register et forgot-password
- TenantScopeService systématique (malgré pattern 2-query dans certains contrôleurs)
- i18n FR/EN parité parfaite (2 836 lignes, test automatisé de parité des clés)
- Aucun secret hardcodé dans le code source
- Aucun `.env` avec credentials dans git
- Feature gates 11/11 implémentées
- 30 tests frontend avec matchers accessibilité (`vitest-axe`)
- Design system shadcn/Radix cohérent, `forwardRef` + `displayName` partout

### I. Audit Admin Dashboard (2026-02-18)

**Contexte :** Audit complet du dashboard admin gestion plans/abonnements — backend (`admin_plans_controller`, `admin_controller`, `plan_service`, routes, validators, middleware) + frontend (`AdminPlansPage`, `AdminSubscribersPage`, `AdminDashboardPage`, `AdminLayout`, `admin.api.ts`, i18n).

**Score conformité PRD §G2 : ~55%** — Plusieurs features critiques manquent.

**Total : ~65 issues** (7 critiques, 15 hautes, 14 moyennes, ~29 basses)

#### I.1 Issues Critiques (7)

| ID | Lieu | Description |
|----|------|-------------|
| ADM-01 | `routes.ts` | `POST /api/admin/plans` absent — impossible de créer un plan |
| ADM-02 | `routes.ts` + `admin_plans_controller.ts` | `GET /api/admin/plan-changes` absent — historique embarqué dans GET plans, limité à 50, non paginé |
| ADM-03 | Backend + Frontend | "Appliquer aux existants" totalement absent — zéro endpoint, zéro UI, zéro confirmation 2 étapes |
| ADM-04 | `routes.ts` | `GET /api/me/subscription` et `POST /api/me/subscription/change` absents |
| ADM-05 | `fr/common.json`, `en/common.json` | `admin.subscription.*` clés absentes — badges subscription affichent anglais en mode FR |
| ADM-06 | `AdminLayout.tsx:60` | Sidebar fixe `w-64` non cachée en mobile — layout cassé sous 768px |
| ADM-07 | `AdminPlansPage.tsx:12-16` | Discounts fondateur `-20%/-30%` hardcodés — contradicts PRD v2.5 "prix garanti à vie" |

#### I.2 Issues Hautes (sélection — 15 total)

| ID | Lieu | Description |
|----|------|-------------|
| ADM-08 | `admin_controller.ts:527` | `subscriptionEndsAt` jamais mis à jour lors annulation/expiration |
| ADM-09 | `admin_controller.ts:276` | Notes admin : pas de VineJS, pas de `maxLength` |
| ADM-10 | `admin_controller.ts:407` | Tasks `dueDate` non validée — `DateTime.fromISO("garbage")` silencieux |
| ADM-11 | `admin_controller.ts:451` | `updateTask` sans ownership check (`auth` non destructuré) |
| ADM-12 | `AdminPlansPage.tsx:277` | `fieldLabels` changelog hardcodés FR — cassé en EN |
| ADM-13 | `AdminSubscribersPage.tsx:83` | `EngagementBadge` labels hardcodés EN (clés i18n existantes non utilisées) |
| ADM-14 | `AdminPlansPage.tsx:78+` | Toggle actif/inactif sans `aria-pressed`, labels sans `htmlFor`/`id` |
| ADM-15 | `AdminSubscribersPage.tsx:316` | Drawer sans `role="dialog"`, `aria-modal`, focus trap |
| ADM-16 | `AdminSubscribersPage.tsx:698` | `selectedUser` stale après mutation |
| ADM-17 | `AdminPlansPage.tsx:29` | Form state ne se resync pas après refetch |
| ADM-18 | `AdminSubscribersPage.tsx:564` | `updateSubscriptionMutation` sans `onError` ni toast |
| ADM-19 | `AdminSubscribersPage.tsx:241+` | 5 mutations notes/tasks sans `onError` |
| ADM-20 | `admin_plans_controller.ts:108,120` | 2x `as any` dans boucle editable fields |
| ADM-21 | `admin_controller.ts:157` | Filtre engagement post-pagination — `meta.total` incorrect |
| ADM-22 | `AdminSubscribersPage.tsx:548` | Pas de state `error` — erreur API affiche "Aucun utilisateur" |

#### I.3 Décision : Refonte complète (D57)

Plutôt que corriger les ~65 issues sur l'architecture 5 pages actuelle, la décision est de **refondre le dashboard admin** en 3 vues (Pulse/Gens/Config) alignées sur le PRD, avec les nouvelles features SiteMode (D58), codes promo (D59), et liste d'attente (D60). Les corrections d'audit seront intégrées dans la refonte.

### J. Audit Conformité Maquettes Bloc 9 (2026-02-18)

**Contexte :** Les maquettes HTML (M-ADM-01 à M-ADM-05) ont été validées par Sam. L'implémentation React diverge significativement sur le visuel, la structure et certaines fonctionnalités. Cet audit liste tous les écarts à corriger.

**Score conformité global : ~40%** — Fonctionnalités backend OK, mais le rendu frontend ne respecte pas les maquettes validées.

#### J.1 Écarts Globaux (AdminLayout + toutes pages)

| ID | Élément | Maquette | Code actuel | Sévérité |
|----|---------|----------|-------------|----------|
| MQ-01 | Sidebar couleur | Bleu navy `#1E3A5F` | Gris charbon `stone-900` (#1C1917) | HAUTE |
| MQ-02 | Sidebar largeur | 240px | 256px (`w-64`) | BASSE |
| MQ-03 | Logo | `OFRA` texte avec `O` en ambre, sous-titre "Admin" | SVG OfraLogo + ShieldCheck icon | HAUTE |
| MQ-04 | Nav icons | Emojis (🏠 👥 ⚙️) | Lucide SVG (Zap, Users, Settings) | MOYENNE |
| MQ-05 | Avatar sidebar | Cercle ambre 32px | Cercle `bg-white/10` 40px | MOYENNE |
| MQ-06 | Nav mobile bottom bar | 3 icônes en bas sur mobile | Absent | HAUTE |
| MQ-07 | Main content max-width | `max-width: 1200px` | Aucune limite (full width) | MOYENNE |
| MQ-08 | Main content padding | 32px vertical, 40px horizontal | 32px uniforme (`p-8`) | BASSE |
| MQ-09 | Badge site_mode sidebar | Absent des maquettes | Présent dans le code | BASSE (garder) |

#### J.2 Écarts Pulse (M-ADM-01)

| ID | Élément | Maquette | Code actuel | Sévérité |
|----|---------|----------|-------------|----------|
| MQ-10 | Header | `"Bonjour Sam 👋"` personnalisé + date + badge Live animé | Titre "Pulse" générique | HAUTE |
| MQ-11 | KPI layout | Icône emoji à gauche du label, delta en pill colorée | Icône SVG à droite dans cercle, delta en texte muted | HAUTE |
| MQ-12 | KPI labels | 11px uppercase letter-spacing 0.8px | 14px normal case | MOYENNE |
| MQ-13 | KPI fondateurs | `14/25` avec `/25` en style muted plus petit | Texte uniforme bold | BASSE |
| MQ-14 | KPI MRR | `—` + `"pré-Stripe"` + `"Prévu : ~686$"` | `0$` + `"Stripe bientôt"` | MOYENNE |
| MQ-15 | Section "Actions requises" | Cartes bordure rouge gauche, CTA "Voir profil →" et "Envoyer rappel" | Grille 3 colonnes sans CTA, pas de bordure rouge | CRITIQUE |
| MQ-16 | Panel droit stats | Table "Fondateurs" (nom, plan, statut, jour) | Chart Recharts LineChart | CRITIQUE |
| MQ-17 | Activité — icônes | Dots colorés (vert récent, bleu ancien) + colonne timestamp | Icône FileText uniforme + timestamp sous texte | HAUTE |
| MQ-18 | Activité — texte | Français humain (`"Marie a créé une transaction"`) | Slug technique (`transaction_created`) | HAUTE |
| MQ-19 | Activité — footer | `"Voir tout →"` lien | Absent | MOYENNE |
| MQ-20 | Stats conversion | Lignes stat avec pills colorées (vert/orange/neutre) | Chiffres bruts sans pills | MOYENNE |

#### J.3 Écarts Gens (M-ADM-02)

| ID | Élément | Maquette | Code actuel | Sévérité |
|----|---------|----------|-------------|----------|
| MQ-21 | Titre | `"👥 Abonnés (42)"` avec compteur | `"Gens"` sans compteur | HAUTE |
| MQ-22 | Segments — compteurs | `"Tous (42)"`, `"⏰ Trial J25+ (3)"` | Labels sans compteur ni emoji | HAUTE |
| MQ-23 | Segments — style inactive | Bordure 1.5px + fond blanc | Fond `bg-muted` rempli, pas de bordure | MOYENNE |
| MQ-24 | Tableau — colonne Plan | Présente (`"Pro 79$"`, `"Solo 49$"`) | Absente | HAUTE |
| MQ-25 | Tableau — badge fondateur | Emoji 🏗️ devant le nom | Absent | HAUTE |
| MQ-26 | Tableau — headers | 12px uppercase letter-spacing | 14px normal case | MOYENNE |
| MQ-27 | Badges subscription | Emojis + français (`"✅ Actif"`, `"⏳ Trial"`) | Texte anglais brut (`"active"`, `"trial"`) | HAUTE |
| MQ-28 | Badges engagement | Dot coloré 8px + label français | Icône Lucide + label anglais | HAUTE |
| MQ-29 | Pagination | Boutons numérotés `1 2 3` + `← Préc` / `Suiv →` | Flèches prev/next seulement | MOYENNE |
| MQ-30 | Mobile card view | Cartes empilées responsive | Même tableau à toutes les tailles | HAUTE |
| MQ-31 | Drawer — animation | Slide-in `translateX` 300ms cubic-bezier | Mount/unmount instantané | MOYENNE |
| MQ-32 | Drawer — role change | `<select>` inline user/admin/superadmin | Lecture seule | CRITIQUE |
| MQ-33 | Drawer — subscription ctrl | `<select>` actif/suspendu/résilié | Absent | CRITIQUE |
| MQ-34 | Drawer — timeline activité | Timeline avec dots + connecteurs | Absente | HAUTE |
| MQ-35 | Drawer — plan info | Nom du plan + "(prix locké)" | Absent | HAUTE |
| MQ-36 | Drawer — tabs Notes/Tâches | Onglets avec bordure active | Sections empilées | MOYENNE |

#### J.4 Écarts Config (M-ADM-03)

| ID | Élément | Maquette | Code actuel | Sévérité |
|----|---------|----------|-------------|----------|
| MQ-37 | Titre | `"⚙️ Configuration"` + user pill droite | `"Config"` sans pill | MOYENNE |
| MQ-38 | Section headers | 15px uppercase letter-spacing primary color | 18px normal case default color | MOYENNE |
| MQ-39 | Mode boutons — couleurs | Vert (live), jaune (construction), rouge (maintenance) | Même bleu primary pour les 3 | CRITIQUE |
| MQ-40 | Code accès — Régénérer | Bouton `"🔄 Régénérer"` | Absent | HAUTE |
| MQ-41 | Code accès — hint | `"14 accès valides avec ce code"` | Absent | MOYENNE |
| MQ-42 | Message custom | `<textarea rows="3">` | `<input>` ligne unique | MOYENNE |
| MQ-43 | Warning mode | `"⚠️ Changer le mode affecte tous les visiteurs."` | Absent | MOYENNE |
| MQ-44 | Plans — édition prix | 6 champs éditables par plan (mensuel, annuel, TX max, stockage, historique, users max) | Lecture seule | CRITIQUE |
| MQ-45 | Plans — historique | Section historique changements avec date/auteur/champ/valeur | Absent | HAUTE |
| MQ-46 | Plans — grid layout | 4 colonnes côte à côte | Liste verticale | HAUTE |
| MQ-47 | Promos — type selection | Radio pills visuelles | Select dropdown | MOYENNE |
| MQ-48 | Promos — plans éligibles | Checkboxes par plan | Absent | HAUTE |
| MQ-49 | Promos — auto-générer code | Bouton `"🎲 Auto-générer"` | Absent | MOYENNE |
| MQ-50 | Promos — colonne Expire | Colonne date expiration dans table | Absente | MOYENNE |
| MQ-51 | Promos — edit button | Bouton ✏️ éditer par ligne | Seulement delete | HAUTE |
| MQ-52 | Système — items layout | Pills flex wrap | Grid 4 colonnes | MOYENNE |
| MQ-53 | Système — Redis/Emails | Checks Redis et Emails | Absents | MOYENNE |
| MQ-54 | Système — barre stockage | Progress bar stockage `2.1/50 Go` | Absente | MOYENNE |
| MQ-55 | Système — version badge | `"v1.0-beta"` pill sombre | Absent | BASSE |

#### J.5 Plan de correction

**Phase 1 — P0 sécurité (2h) :** Fixes P0 de l'audit code (cookie signé, CSV injection, JSON.parse, memory leak).

**Phase 2 — Conformité maquettes (priorité) :** ✅ DONE. Pages conformes : AdminLayout, AdminPulsePage, AdminConfigPage, AdminGensPage (icônes Lucide, pas d'emoji).

**Phase 3 — P1 fonctionnels :** Segments qui filtrent, error states, dead code cleanup. → Absorbé dans §11.K.

### K. Audit Cohérence Admin (2026-02-18)

**Contexte :** Audit party-mode (John PM + Mary Analyst + Sally UX + Winston Architect) révélant 19 incohérences entre le code implémenté, le PRD, le guide superadmin, et les besoins réels d'un CRM admin. Sam a identifié le problème initial : "pourquoi un user deviendrait superadmin ?" et "le superadmin doit pouvoir prolonger un abonnement".

#### K.1 Incohérences critiques (bloquent le lancement)

| ID | Problème | Fichier(s) | Impact |
|----|----------|------------|--------|
| C1 | ~~**Segment Fondateurs = fake**~~ | `AdminGensPage.tsx`, `admin_controller.ts` | ✅ FIXÉ — filtre `isFounder=true` backend + `getParams()` frontend |
| C2 | ~~**Subscription dropdown perdu**~~ | `AdminGensPage.tsx` | ✅ FIXÉ — dropdown fonctionnel pour superadmins + mutation |
| C3 | **AdminSubscribersPage = code mort** — 530+ lignes, pas dans le router | `AdminSubscribersPage.tsx` | À supprimer (cleanup Sprint D) |
| C4 | **updateRole = 403 toujours** — Backend stub + frontend no-op, documenté comme fonctionnel | `admin_controller.ts:513`, `admin.api.ts:288-291` | Volontaire — rôle affiché en lecture seule, superadmin = DB only |
| C5 | ~~**SiteMode ne bloque PAS les visiteurs non-authentifiés**~~ | `router.tsx` | ✅ FIXÉ — SiteModeGuard dans ScrollToTop, fetch `/api/public/site-info` |

#### K.2 Incohérences hautes

| ID | Problème | Fichier(s) |
|----|----------|------------|
| H1 | ~~**Aucune prolongation trial**~~ | `admin_controller.ts`, `AdminGensPage.tsx` | ✅ FIXÉ — `PATCH /extend` + boutons +7j/+14j/+30j/custom |
| H2 | **`updateSubscription` ne touche pas `subscriptionEndsAt`** — Changer le statut ne reset pas la date d'expiration | `admin_controller.ts` | P1 restant |
| H3 | ~~**Plans modifiables par tout admin**~~ | `routes.ts` | ✅ FIXÉ — `PUT /plans/:id` déplacé dans groupe superadmin |
| H4 | ~~**Pas de toggle `isFounder`**~~ | `admin_controller.ts`, `AdminGensPage.tsx` | ✅ FIXÉ — `PATCH /founder` + bouton toggle dans drawer |
| H5 | **Plan name absent du drawer** — `AdminUser` ne retourne ni `planId` ni `planName` | `admin_controller.ts` | P1 restant (pré-Stripe) |
| H6 | **Trial J25+ = filtre ALL trial** — Le segment envoie juste `subscription=trial` | `AdminGensPage.tsx` | P1 restant |
| H7 | **Activité drawer = statique** — 2 events hardcodés, pas de vraie timeline | `AdminGensPage.tsx` | P1 restant |
| H8 | ~~**Pas de gate superadmin dans l'UI**~~ | `AdminGensPage.tsx` | ✅ FIXÉ — prop `isSuperadmin` + gating actions |
| H9 | ~~**Dropdown rôle montre "superadmin"**~~ | `AdminGensPage.tsx` | ✅ FIXÉ — remplacé par texte lecture seule |

#### K.3 Incohérences moyennes

| ID | Problème | Fichier(s) |
|----|----------|------------|
| M1 | **txMax hardcodé à 25** — Starter=3, Solo=10, Pro=25, Agence=∞. Drawer montre toujours "X/25" | `AdminGensPage.tsx:208` |
| M2 | **Stockage hardcodé 0.8/10 Go** — Aucun endpoint backend pour le stockage réel | `AdminGensPage.tsx:406` |
| M3 | **`gracePeriodStart` sans admin reset** — Le champ existe sur User, aucun endpoint admin pour le clear | `user.ts:168` |
| M4 | **MRR = placeholder** — Normal pré-Stripe, mais guide le documente comme vrai KPI | `AdminPulsePage.tsx` |
| M5 | **Export waitlist = pas de bouton UI** — Route backend existe, aucun CTA dans Config | Routes vs Config UI |

#### K.4 Plan de correction P0 (pré-lancement 20 mars)

| # | Fix | Backend | Frontend | Priorité | Statut |
|---|-----|---------|----------|----------|--------|
| 1 | **SiteModeGuard** — Wrapper frontend qui fetch `site-info` et redirect `/coming-soon` ou `/maintenance` | — | `SiteModeGuard` dans `router.tsx` `ScrollToTop` | P0 CRITIQUE | ✅ DONE |
| 2 | **Prolongation trial** — `PATCH /subscribers/:id/extend` body `{ days, reason }` | Endpoint + validation (1-365j, raison 3+ chars) | Boutons +7j/+14j/+30j/custom dans drawer | P0 | ✅ DONE |
| 3 | **Débloquer subscription dropdown** — Fonctionnel pour superadmins | Endpoint existant | `onChange` + `subscriptionMut` dans drawer | P0 | ✅ DONE |
| 4 | **Fixer segment Fondateurs** — Filtre `isFounder=true` au backend | `admin_controller.ts` + `isFounder` dans response | `getParams()` envoie `founder: 'true'` | P0 | ✅ DONE |
| 5 | **Retirer "superadmin" du dropdown rôle** | — | Remplacé par texte lecture seule | P0 | ✅ DONE |
| 6 | **Plans = superadmin only** — `PUT /plans/:id` dans groupe superadmin | `routes.ts` déplacé | — | P0 | ✅ DONE |

---

### L. Audit Onboarding Agent + Client (2026-02-19)

**Contexte :** Audit party-mode (John PM + Mary Analyst + Sally UX + Winston Architect) des deux flux d'onboarding : inscription agent et gestion client. Objectif : identifier les frictions pré-lancement 20 mars.

#### L.1 Onboarding Agent — Flux actuel

```
/register (fullName*, email*, password*, phone, address, city, province)
  → Backend: create Org + User (trial 30j démarre immédiatement)
  → Email vérification (24h token)
  → /verify-email → clic lien → emailVerified=true → WelcomeMail
  → /login → session cookie
  → ProtectedRoute: onboardingCompleted=false → redirect /onboarding
  → 5 étapes: Langue → Pratique → Contextes propriétés → Volume → Auto-conditions
  → "Terminer" → PUT /api/me/onboarding → onboardingCompleted=true
  → Dashboard (empty state: 3 lignes de texte + CTA)
```

#### L.2 Onboarding Client — Flux actuel

```
/clients → "Nouveau client" → CreateClientModal (3 onglets)
  → Minimum: prénom + nom (email/phone optionnels)
  → Fiche client avec édition inline, historique transactions
  → Import CSV bilingue (desktop seulement)
  → Transaction: select client = <select> HTML basique (pas d'autocomplete)
```

#### L.3 Issues identifiées

**P0 — Bloquant lancement**

| ID | Problème | Fichier(s) | Impact |
|----|----------|------------|--------|
| OB-1 | **Emails signup toujours en anglais** — `preferredLanguage` n'est JAMAIS envoyé depuis RegisterPage. Backend default `'en'`. Courtiers francophones NB reçoivent emails en anglais. | `RegisterPage.tsx`, `auth_controller.ts` (ligne `data.preferredLanguage ?? 'en'`) | Deal-breaker marché NB francophone |
| OB-2 | **Pas de création client inline** — Agent doit quitter le formulaire transaction → /clients → créer → revenir → sélectionner. 4 clics, 2 changements de page pour un use case quotidien. | `EditTransactionPage.tsx` (select client), `CreateClientModal.tsx` | Friction majeure chaque nouvelle transaction |

**P1 — Haute priorité**

| ID | Problème | Fichier(s) | Impact |
|----|----------|------------|--------|
| OB-3 | **Select client = `<select>` basique** — Pas d'autocomplete, pas de recherche. Inutilisable à 50+ clients. | `EditTransactionPage.tsx:921-936` | UX dégradée en production |
| OB-4 | **Skip onboarding = définitif** — `onboardingCompleted=true` + `onboardingSkipped=true`. Aucun re-prompt. Profil reste `null` pour toujours. | `OnboardingPage.tsx`, `profile_controller.ts` | Perte données profil, conditions auto cassées |
| OB-5 | **Empty state dashboard = faible** — Emoji + 3 lignes texte. Pas de vidéo, pas de tour guidé, pas de checklist interactive. First impression = rétention. | `DashboardUrgencies.tsx` (state='empty') | Risque abandon J1 |
| OB-6 | **Agence + licence absents du signup** — Existent dans le validator backend mais PAS dans le formulaire RegisterPage. L'agent ne sait pas qu'il doit aller dans les paramètres. | `RegisterPage.tsx`, `auth_validator.ts` | Champs professionnels incomplets |

**P2 — Moyenne priorité**

| ID | Problème | Fichier(s) | Impact |
|----|----------|------------|--------|
| OB-7 | **Pas de checklist profil post-onboarding** — Après l'onboarding, aucun widget "Complétez votre profil: 3/7". Pas de notion de progression. | Absent | Engagement faible |
| OB-8 | **Pas de type client** (acheteur/vendeur) — Le rôle est sur `TransactionParty`, pas sur `Client`. Impossible de filtrer "mes acheteurs" vs "mes vendeurs". | `client.ts` model | Filtrage absent |

#### L.4 Plan de correction

| # | Fix | Backend | Frontend | Priorité | Statut |
|---|-----|---------|----------|----------|--------|
| 1 | **Langue emails signup** — Détecter `i18n.language` au frontend, envoyer `preferredLanguage` dans le body register | Ajouter `preferredLanguage` au user create | RegisterPage envoie la langue courante | P0 | ~~DONE~~ |
| 2 | **Création client inline** — Bouton "+" à côté du select client dans EditTransactionPage, ouvre CreateClientModal, auto-sélectionne le client créé | Rien (endpoint existe) | Bouton + modal + callback `onCreated` | P0 | ~~DONE~~ |
| 3 | **Autocomplete client** — Remplacer `<select>` par un Combobox searchable (Radix ou custom) | Rien | Composant `ClientCombobox` | P1 | ~~DONE~~ |
| 4 | **Re-prompt onboarding skippé** — Banner dans Dashboard si `onboardingSkipped=true` : "Complétez votre profil pour débloquer les suggestions" | `GET /api/me` retourne déjà `onboardingSkipped` | Banner conditionnel dans DashboardPage | P1 | ~~DONE~~ |
| 5 | **Empty state enrichi** — Refaire l'empty state dashboard avec illustration, 3 cards cliquables, CTA principal prominent | — | Refonte `EmptyState` dans DashboardUrgencies | P1 | ~~DONE~~ |
| 6 | ~~Agence + licence dans signup~~ → **INVERSÉ v2.33 : retirés du signup, déplacés vers onboarding §L.5 étape 1.** Inscription légère = prénom, nom, email, téléphone + mot de passe. | Retirer du validator signup | Retirer de RegisterPage | P1 | ~~DONE~~ |
| 7 | **Checklist profil post-onboarding** — Widget progression dans SettingsPage | — | Widget complétion profil (6 items, barre %) | P2 | ~~DONE~~ |
| 8 | **Type client** (acheteur/vendeur/both) — Champ `client_type` sur le modèle Client | Migration + model + validator | Select dans CreateClientModal + badge liste | P2 | ~~DONE~~ |

#### L.5 Refonte Onboarding Agent — 3 étapes action (validé 2026-02-21, Party Mode)

> **Constat :** L'onboarding 5 étapes actuel est désaligné avec la vision copilote bout en bout. Audit en Party Mode :
> - `practiceType` → **jamais utilisé** dans l'app (zéro `if` dans la codebase)
> - `annualVolume` → **jamais utilisé** dans l'app
> - `propertyContexts` → utilisé uniquement pour filtrer les suggestions manuelles de conditions (pas critique)
> - `preferAutoConditions` → feature gate D39, utile mais déplaçable dans les paramètres
> - **Manquant :** profil courtier complet (agence, licence → nécessaire pour PDF NBREA), import clients (FollowUpBoss), première transaction
>
> **Décision Sam :** Refonte complète. Chaque étape crée de la valeur immédiate. Zéro question "quiz".

**Inscription légère (décision v2.33) :**
```
RegisterPage — 4 champs + mot de passe :
  prénom*, nom*, email*, téléphone* + mot de passe*
  → PAS d'agence, PAS de licence (déplacés vers onboarding étape 1)
  → Inscription en 15 secondes max
```

**Ancien onboarding (5 étapes quiz) → OBSOLÈTE :**
```
1. Langue (FR/EN)           → GARDER (déplacé étape 1)
2. Type de pratique          → SUPPRIMÉ (dead data)
3. Contextes propriété       → DÉPLACÉ dans Paramètres (nice-to-have)
4. Volume annuel             → SUPPRIMÉ (dead data)
5. Style travail auto-cond.  → DÉPLACÉ dans Paramètres ou 1ère TX
```

**Nouvel onboarding (3 étapes action) :**

| Étape | Contenu | Valeur immédiate | Données captées |
|-------|---------|-----------------|-----------------|
| **1** | **Langue + Profil pro** — Langue FR/EN, agence, numéro de licence. Nom et téléphone pré-remplis (inscription) mais modifiables. | Identité pro complète → prêt pour PDFs NBREA et courriels | `user.language`, `user.agency`, `user.licenseNumber` (nom/tél déjà captés à l'inscription) |
| **2** | **Import clients** — Connexion FollowUpBoss (API) ou import CSV ou "Je commence à zéro" | "Mes clients sont dans l'app" → wow moment, portefeuille instantané | Clients créés en DB |
| **3** | **Créer sa première transaction** — Formulaire création TX guidé, client pré-sélectionné | L'agent finit l'onboarding avec une vraie TX ouverte — pas un dashboard vide | 1ère transaction créée |

**Maquettes onboarding :**

| # | Maquette | Fichier | Statut |
|---|----------|---------|--------|
| M01 | Étape 1 — Langue + Profil pro (desktop/tablette/mobile) | `maquettes/01-onboarding-etape1-langue-profil.html` | ✅ FAIT |
| M02 | Étape 2 — Import clients (FollowUpBoss/CSV, 2 scènes) | `maquettes/02-onboarding-etape2-import-clients.html` | ✅ FAIT |
| M03 | Étape 3 — Première transaction (2 scènes) | `maquettes/03-onboarding-etape3-premiere-transaction.html` | ✅ FAIT |

**Import FollowUpBoss :**
- CRM #1 utilisé par les courtiers NB ciblés
- Intégration API FollowUpBoss (REST) pour sync contacts
- D'autres CRM seront ajoutés plus tard (extensible)
- Fallback : import CSV (déjà codé) + "Je commence à zéro" (skip import)

**Champs DB impactés :**
- `practiceType` → **déprécié** (garder en DB, ne plus demander, nullable)
- `annualVolume` → **déprécié** (garder en DB, ne plus demander, nullable)
- `propertyContexts` → **déplacé** vers Paramètres
- `preferAutoConditions` → **déplacé** vers Paramètres ou demandé à la 1ère TX

**Changement RegisterPage :** ✅ IMPLÉMENTÉ (2026-02-21)
- RegisterPage : 5 champs (fullName, email, phone, password, confirmPassword)
- `agency` et `licenseNumber` retirés de RegisterPage et de `RegisterRequest` frontend

**Skip :** Toujours possible — appelle `authApi.skipOnboarding()` existant → marque `onboardingCompleted = true`.

**Résultat :** L'agent termine l'onboarding avec son profil complet, ses clients importés, et une transaction ouverte. Prêt à préparer sa première offre en < 2 min.

**Implémentation (2026-02-21) :**
| Fichier | Changement |
|---------|-----------|
| `backend/app/validators/profile_validator.ts` | `onboardingValidator` : language, fullName?, phone?, agency (requis), licenseNumber (requis) |
| `backend/app/controllers/profile_controller.ts` | `saveOnboarding` : sauve language/agency/licenseNumber + onboardingCompleted |
| `backend/app/services/followupboss_service.ts` | **NOUVEAU** — validateAndFetchContacts + importContacts |
| `backend/app/controllers/integrations_controller.ts` | **NOUVEAU** — connectFollowUpBoss + importFollowUpBoss |
| `backend/app/validators/integrations_validator.ts` | **NOUVEAU** — fubConnectValidator + fubImportValidator |
| `backend/start/routes.ts` | 2 routes FUB dans groupe auth |
| `frontend/src/api/auth.api.ts` | OnboardingRequest refactoré, RegisterRequest simplifié |
| `frontend/src/api/integrations.api.ts` | **NOUVEAU** — connectFub + importFub |
| `frontend/src/hooks/useCsvImport.ts` | **NOUVEAU** — hook réutilisable CSV parsing |
| `frontend/src/pages/RegisterPage.tsx` | Simplifié (5 champs) |
| `frontend/src/pages/OnboardingPage.tsx` | Shell 3 étapes (progress bar, routing, skip) |
| `frontend/src/pages/onboarding/Step1Profile.tsx` | **NOUVEAU** — Langue + profil pro |
| `frontend/src/pages/onboarding/Step2Import.tsx` | **NOUVEAU** — FUB / CSV / zéro |
| `frontend/src/pages/onboarding/Step3Transaction.tsx` | **NOUVEAU** — Création TX + succès |
| `frontend/src/i18n/locales/{fr,en}/common.json` | Clés onboarding.step1/step2/step3 |

---

_PRD rédigé par l'équipe BMAD en Party Mode — 2026-02-06_
_Mis à jour v2.18 — 2026-02-19 (D62: Retrait dark mode — 37 fichiers, 13K chars supprimés)_
_Validé par : Sam (Product Owner)_
_Source de vérité unique pour Ofra v2_
