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
version: '2.8'
date: '2026-02-18'
author: 'Sam + Équipe BMAD (Party Mode)'
status: 'SOURCE DE VÉRITÉ'
supersedes:
  - docs/pricing-strategy.md (SUPPRIMÉ du repo)
  - docs/roadmap.md (SUPPRIMÉ du repo)
  - project-context.md (section SaaS Pricing — mis à jour)
---

# PRD v2 — Ofra : Copilote de l'Agent Immobilier NB

> **⚠️ CE DOCUMENT EST LA SOURCE DE VÉRITÉ UNIQUE**
> Tout conflit avec un autre document se résout en faveur de ce PRD.
> Dernière mise à jour : 2026-02-18 (v2.8)
> Auteur : Sam + Équipe BMAD (Party Mode)
>
> **Changements v2.8 (2026-02-18) — Audit Approfondi Complet (Backend + Frontend + Infra) :**
> - §11.H ajouté : Audit approfondi 2026-02-18 — ~95 issues (7 critiques, 15 hautes, 30 moyennes, 43 basses)
> - §11.F Priorités Post-Audit mis à jour avec les nouveaux P0 sécurité/légal
> - CRITIQUE : Path traversal `/api/uploads/:filename` (SEC-03), FINTRAC bypass autoConditions (SEC-04), trial FINTRAC bloqué (SEC-05)
> - HAUTE : Fichiers sans ownership check (SEC-06), `fly.toml` region `ewr` vs `yyz` (INFRA-01)
> - Frontend : Pas d'Error Boundary, pas de code splitting, pas de 404, i18n cassé (EN→FR dans apiError)
> - Tests : FINTRAC/admin/export/TenantScope zéro couverture, E2E pas en CI
> - Score launch-readiness : **68%** (baisse de 82% — issues sécurité et légales découvertes)
>
> **Changements v2.7 (2026-02-17) — Audit M14 Formulaire Offre Unifié :**
> - §11.G ajouté : Audit complet M14 — cohérence maquette / backend / frontend / réalité NB
> - Recherche terrain NB : vocabulaire (irrévocabilité vs expiration), flow NBREA, offres multiples FCNB
> - 9 actions classées P0→P3 : fix checkbox confirmation, depositDeadline type, label irrévocabilité, etc.
> - Pistes backlog identifiées : détenteur dépôt, date de possession, séparation inclusions/exclusions
> - §9.2 Phase 2 : ajout M14 polish items
>
> **Changements v2.6 (2026-02-17) — D56 Infrastructure Fly.io :**
> - §7.5 Infrastructure : DigitalOcean App Platform → **Fly.io (`yyz` Toronto)** + Fly Postgres (`yyz`)
> - §7.5 Stockage fichiers : DO Spaces → **À déterminer** (DO Spaces Toronto ou AWS S3 `ca-central-1`)
> - §4.1 D56 mis à jour : Fly.io remplace DigitalOcean, conformité Canada maintenue
>
> **Changements v2.5 (2026-02-17) — Bloc 8 Offres intelligentes ✅ :**
> - §9.0 Bloc 8 : `❌ TODO` → `✅ DONE` — Sprint A (backend migration `buyerPartyId`/`sellerPartyId` sur Offer, PartyPicker inline, validation cohérence parties) + Sprint B (NegotiationThread, OfferComparison side-by-side, AcceptOfferModal parties display)
> - §9.0 Description Bloc 8 mise à jour : suppression mention `parentOfferId` (pattern écarté), description réelle de l'implémentation
> - §9.1 Phase 1 : ajout ligne « Offres intelligentes » ✅ Codé
> - §9.0 Gantt : Bloc 8 marqué DONE, Semaine 3 ne contient plus que Stripe + Legal + Polish
> - Score pré-lancement : **6/8 blocs DONE** — reste Legal (contenu) + Stripe (paiement)
> - 283 tests frontend verts, 0 erreurs TypeScript backend+frontend
>
> **Changements v2.4 (2026-02-16) — Audit général + correctifs sécurité :**
> - §9.0 Roadmap : Bloc 3 Landing ✅, ROUTE-1 routing ✅ — mis à jour
> - §11.D : BUG-01 ✅ corrigé (query key profile), BUG-ADM ✅ (deadline→due_date), BUG-MAIL ✅ (fullName??email)
> - §11.E : Audit sécurité 2026-02-16 — SEC-1 FINTRAC auth ✅, SEC-2 TenantScope conditions/notes ✅, ReminderService tenant scoping ✅ (faux positif — déjà scopé)
> - §11.F : Audit général — score launch-readiness 82%, 463 tests verts, 0 tech debt markers
> - §11.D : BUG-03 à BUG-06 déjà corrigés, BUG-TS 11 erreurs TypeScript ✅ toutes corrigées (`tsc --noEmit` = 0)
>
> **Changements v2.3 (2026-02-13) :**
> - §1.4 Moat enrichi : "100% hébergé au Canada (serveurs Toronto)"
> - §7.5 Infrastructure 100% Canadienne (D56) : DigitalOcean App Platform + Managed DB + Spaces, tout Toronto
> - §9.0 Bloc 8 Offres intelligentes (ajouté en v2.2)
> - §9.2 Phase 2 : Superadmin suppression compte + UI Audit Trail conditions (backlog)
> - §11.D Bugs connus BUG-01, BUG-02
>
> **Changements v2.2 (2026-02-13) :**
> - Maquettes H1, H3, G2, K2 mises à jour pour D53 (prix garanti à vie, suppression -20%/-30%)
> - §9 Roadmap réécrite : feuille de route lancement validée (Stripe en dernier)
> - Ajout §9.0 Feuille de Route Pré-Lancement (6 blocs ordonnés)
>
> **Changements v2.1 (2026-02-13) :**
> - Statuts décisions D42-D49 mis à jour (codés)
> - `docs/roadmap.md` et `docs/pricing-strategy.md` SUPPRIMÉS du repo
> - Features ajoutées depuis v2.0 : Email system (23 mails), Notifications in-app, Auth redesign, FINTRAC, Export/Partage (M10), Permissions (M11), Offres (M12), Offer Intake (D35), Plans backend, Admin panel
> - **D52** : FINTRAC identity gate Solo+ ajouté (`fintrac_controller.ts:complete()` + `resolve()`)
> - Audit feature gates complet : 11/11 gates implémentées (voir §2.6)
> - **D53** : Trial 30j gratuit (1 TX, Pro complet, pas de CC) + Programme Fondateur simplifié (prix garanti à vie, plus de −20%/−30%)

---

## 1. Vision & Proposition de Valeur

### 1.1 Vision

> **"Ofra est le copilote de l'agent immobilier au Nouveau-Brunswick. Il protège ses commissions en s'assurant qu'aucune deadline n'est ratée, qu'aucune condition n'est oubliée. L'agent dort tranquille."**

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

### 2.4 Programme Fondateur (25 places) — Prix Garanti à Vie (D53)

| Règle | Détail |
|-------|--------|
| Places | 25 maximum |
| Essai | **30 jours gratuits** (même trial que tout le monde) |
| Prix | **Prix du jour garanti à vie** — pas de réduction %, le prix de lancement ne bouge jamais |
| Applicable à | **TOUT plan** (Starter, Solo, Pro) |
| Le prix suit l'upgrade | ✅ Oui — `plan_locked_price` = prix du plan au moment du choix |
| Badge visible | ✅ "Membre Fondateur #X/25" dans l'app |
| Engagement | 15 minutes de feedback par mois |
| Annulation | **Perd le statut fondateur définitivement** |
| Changement de plan sans annuler | **Garde le statut fondateur** |

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
├── Onboarding 5 étapes (déjà codé)
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
| D40 | Onboarding personnalisé 5 étapes | ✅ Codé | Session 2026-02-03 |
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
| **D56** | **Infrastructure 100% canadienne** | **📋 À configurer** | Fly.io (`yyz` Toronto) + Fly Postgres (`yyz`) + stockage S3-compatible Canada (DO Spaces ou AWS `ca-central-1`). Zéro donnée hors Canada. LPRPDE/PIPEDA conforme. |

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

## 5. Maquettes Validées (15 écrans)

### 5.1 A1 — Dashboard Urgences (avec urgences)

**Endpoint :** `GET /api/dashboard/urgencies`
**Query :** Conditions pending avec due_date, triées par urgence, groupées par criticité

**Desktop (>1024px) :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra ▸ Home  Transactions  Clients          (FR/EN)  Sam ▾  🔔  ☾      │
├──────────────────────────────────────────────────────────────────────────┤
│ Bonjour Sam 👋  |  3 urgences aujourd'hui              [+ Nouvelle TX]  │
│                                                                          │
│ ┌───────────────────────────────┐  ┌────────────────────────────────────┐│
│ │ 🛡️ VALEUR PROTÉGÉE (ce mois)  │  │ 📊 CE MOIS-CI                     ││
│ │ • 2 deadlines rattrapées      │  │ 12 actives · 3 nouvelles          ││
│ │ • 1 oubli détecté             │  │ 1 closing prévu · Taux: 48%      ││
│ │ ≈ 12 000$ commissions         │  │                                   ││
│ └───────────────────────────────┘  └────────────────────────────────────┘│
│                                                                          │
│ ⚡ CE QUI BRÛLE                                                          │
│ ────────────────────────────────────────────────────────────────────     │
│ 🔴 EN RETARD                                                             │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Financement hypothécaire (🔴 Blocking)  2j en retard            │     │
│ │ TX: Tremblay · 123 rue Principale · Étape 4     [Ouvrir →]     │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 🔴 URGENT (48h)                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Inspection résidentielle (🟡 Required)  Demain                  │     │
│ │ TX: Dupont · 456 av. Érables · Étape 4           [Ouvrir →]    │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Dépôt initial (🔴 Blocking)              2 jours                │     │
│ │ TX: Cormier · 789 boul. Central · Étape 3        [Ouvrir →]    │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 🟡 CETTE SEMAINE                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Test qualité de l'eau (🟡 Required)     5 jours                 │     │
│ │ TX: Leblanc · 12 ch. Roy · Étape 4               [Ouvrir →]    │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 🟢 TOUT ROULE (8 transactions)  Prochaine deadline dans 12 jours        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile (<640px) :**

```
┌─────────────────────────────────────┐
│ Ofra  Home                  🔔  ☾  │
├─────────────────────────────────────┤
│ Bonjour Sam 👋                      │
│ 3 urgences aujourd'hui              │
│ ┌─────────────────────────────────┐ │
│ │ 🛡️ ~12 000$ protégés · ce mois  │ │
│ │ 2 deadlines · 1 oubli           │ │
│ └─────────────────────────────────┘ │
│ ⚡ CE QUI BRÛLE                     │
│ ────────────────────────────────── │
│ 🔴 Financement (Blocking)          │
│ 2j en retard · Tremblay · Étape 4  │
│ [Ouvrir →]                          │
│ ────────────────────────────────── │
│ 🔴 Inspection (Required)           │
│ Demain · Dupont · Étape 4           │
│ [Ouvrir →]                          │
│ ────────────────────────────────── │
│ 🔴 Dépôt initial (Blocking)        │
│ 2 jours · Cormier · Étape 3        │
│ [Ouvrir →]                          │
│ ────────────────────────────────── │
│ 🟡 Test eau (Required)             │
│ 5 jours · Leblanc · Étape 4        │
│ [Ouvrir →]                          │
│                                     │
│ 🟢 8 TX OK · Prochaine: 12 jours   │
│ [+ Nouvelle TX]                     │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️     │
└─────────────────────────────────────┘
```

**Critères d'acceptance (Murat) :**
- [ ] L'agent identifie l'urgence #1 en < 3 secondes
- [ ] Tri : 🔴 en retard → 🔴 48h → 🟡 semaine → 🟢 OK
- [ ] Chaque card urgence montre : condition, niveau, deadline, client, adresse, étape
- [ ] Clic "Ouvrir →" navigue directement à la transaction
- [ ] Si 0 urgences → affiche A2 (tout va bien)
- [ ] Si 0 transactions → affiche A3 (vide)
- [ ] Si > 10 urgences → affiche top 10 + lien "Voir les X autres"
- [ ] Mobile : tout visible en 1 scroll
- [ ] Bloc "Valeur protégée" : données réelles (count alertes envoyées + conditions complétées après alerte)
- [ ] WCAG 2.1 AA (contraste, aria-labels)

### 5.2 A2 — Dashboard Tout Va Bien

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra ▸ Home                                              [+ Nouvelle TX]│
├──────────────────────────────────────────────────────────────────────────┤
│ Bonjour Sam 👋  |  🟢 Tout roule. Prochaine deadline dans 12 jours.    │
│                                                                          │
│ ┌───────────────────────────────┐  ┌────────────────────────────────────┐│
│ │ 🛡️ VALEUR PROTÉGÉE (ce mois)  │  │ 📌 PROCHAINS ÉVÉNEMENTS           ││
│ │ • 0 deadline rattrapée        │  │ • Closing: 15 mars — Tremblay     ││
│ │ • 0 oubli détecté             │  │ • Inspection: 18 mars — Leblanc   ││
│ │ ≈ 0$                          │  │                                   ││
│ └───────────────────────────────┘  └────────────────────────────────────┘│
│                                                                          │
│ 🟢 Aucune urgence. [Voir toutes les transactions]                        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Ofra  Home                  🔔  ☾  │
├─────────────────────────────────────┤
│ Bonjour Sam 👋                      │
│ 🟢 Tout roule                       │
│ Prochaine deadline: 12 jours        │
│ [Voir mes transactions →]           │
│ [+ Nouvelle TX]                     │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️     │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Message positif visible immédiatement
- [ ] Prochains événements (max 5, triés par date)
- [ ] CTA vers liste de transactions

### 5.3 A3 — Dashboard Vide (Nouvel Utilisateur)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra ▸ Home                                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ 👋 Bienvenue !                                                           │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ Votre tableau "Urgences" apparaîtra ici dès votre 1ère          │     │
│ │ transaction.                                                     │     │
│ │                                                                  │     │
│ │ 1) Créez une transaction (2 min)                                 │     │
│ │ 2) Ajoutez/validez vos conditions                                │     │
│ │ 3) Ofra vous alerte avant les deadlines                          │     │
│ │                                                                  │     │
│ │ [+ Créer ma première transaction]                                │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ✅ Astuce: import CSV clients disponible (optionnel)                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Ofra  Home                          │
├─────────────────────────────────────┤
│ 👋 Bienvenue !                      │
│ Votre tableau "Urgences" apparaîtra │
│ après votre 1ère transaction.       │
│ [Créer ma première transaction]     │
│ Astuce: import clients plus tard    │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️     │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] CTA "Créer ma première transaction" bien visible et proéminent
- [ ] Time-to-value communiqué ("2 min")
- [ ] Pas de surcharge d'information

### 5.4 B1 — Transaction Timeline (Étape Courante, Conditions Pending)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Retour   Tremblay · 123 rue Principale           [🕘 Hist.] [📝] [⋯]│
├──────────────────────────────────────────────────────────────────────────┤
│ Achat · 285 000$ · Closing 15 mars · Acceptée 1 fév                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ 1. Consultation           28 jan                                     │
│  ✅ 2. Offre soumise          30 jan                                     │
│  ✅ 3. Offre acceptée         1 fév                                      │
│                                                                          │
│  ●━━ 4. PÉRIODE CONDITIONNELLE ━━━━━━━━━━━━━━━━━━━━ depuis 5 jours ━━   │
│  │                                                                       │
│  │  🔴 BLOQUANTES                                                        │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Financement hypothécaire              🔴 2j en retard     │     │
│  │  │   "Attente confirm. RBC"                    [✏️] [Valider ✓]│     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Dépôt initial                    3 fév · 📎 1 preuve      │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟡 REQUISES                                                          │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Inspection résidentielle              🔴 Demain           │     │
│  │  │                                             [✏️] [Valider ✓]│     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Révision RPDS                         5 jours             │     │
│  │  │                                             [✏️] [Valider ✓]│     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟢 RECOMMANDÉES                                                      │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Vérification zonage                   12 jours            │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  📎 DOCUMENTS (1)                                                     │
│  │  · recu-depot.pdf → lié à "Dépôt initial"                            │
│  │                                                                       │
│  │  📝 NOTES (1)                                                         │
│  │  · "Client nerveux, rassurer financement" — 3 fév                    │
│  │  [+ Ajouter une note]                                                 │
│  │                                                                       │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ⚠️ 1 BLOQUANTE en attente · Impossible d'avancer            │     │
│  │  │ [Avancer à l'étape suivante] (désactivé, grisé)             │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  ○  5. Ferme en attente                                                  │
│  ○  6. Pré-clôture                                                       │
│  ○  7. Jour de clôture                                                   │
│  ○  8. Suivi post-clôture                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ ← Tremblay · 123 rue Princ.   [⋯] │
├─────────────────────────────────────┤
│ Achat · 285 000$ · Closing 15 mars │
│                                     │
│ ✅ 1. Consultation                  │
│ ✅ 2. Offre soumise                 │
│ ✅ 3. Offre acceptée                │
│                                     │
│ ● 4. PÉRIODE COND.  (5 jours)      │
│                                     │
│ 🔴 BLOQUANTES                      │
│ ┌─────────────────────────────────┐ │
│ │ ○ Financement hyp.             │ │
│ │   🔴 2j en retard               │ │
│ │   "Attente RBC"                │ │
│ │   [✏️] [Valider ✓]             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ✅ Dépôt initial  📎 preuve     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🟡 REQUISES                        │
│ ┌─────────────────────────────────┐ │
│ │ ○ Inspection rés. 🔴 Demain    │ │
│ │   [✏️] [Valider ✓]             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ○ Révision RPDS    5 jours     │ │
│ │   [✏️] [Valider ✓]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🟢 ○ Vérif. zonage   12 jours     │
│                                     │
│ 📎 Docs (1) · 📝 Notes (1)        │
│                                     │
│ ⚠️ 1 bloquante · Avancer (grisé)  │
│                                     │
│ ○ 5-8. (à venir)                   │
├─────────────────────────────────────┤
│ 🏠 Home  📋 TX  👥 Clients  ⚙️    │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Étapes passées compressées (✅ + date sur 1 ligne)
- [ ] Étape courante expanded (conditions + docs + notes)
- [ ] Conditions groupées par niveau (🔴 → 🟡 → 🟢)
- [ ] Chaque condition montre : titre, niveau, deadline/countdown, note, boutons action
- [ ] Bouton "Avancer" désactivé si bloquante pending + message explicatif
- [ ] Étapes futures grisées
- [ ] Accès historique via 🕘 (drawer)
- [ ] Accès notes globales via 📝
- [ ] Mobile : tout visible en scroll vertical

### 5.5 B2 — Transaction Timeline (Étape Passée Cliquée)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Retour   Tremblay · 123 rue Principale           [🕘 Hist.] [📝] [⋯]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ 1. Consultation           28 jan                                     │
│  ✅ 2. Offre soumise          30 jan                                     │
│                                                                          │
│  ✅━━ 3. OFFRE ACCEPTÉE ━━━━━━━━━━━━━━━━━━━━━━━━━ complété 1 fév ━━     │
│  │                                                                       │
│  │  🔒 CONDITIONS (archivées — lecture seule)                            │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Signature acte d'achat       🔒  Complété 1 fév · 📎     │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Dépôt initial confirmé       🔒  Complété 1 fév          │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  Pas de boutons [✏️] ni [Valider] — tout est verrouillé              │
│  │                                                                       │
│  ●━━ 4. PÉRIODE CONDITIONNELLE ━━━━━━━━━━━━━━━━━━ (étape courante)      │
│  │  ...                                                                  │
│  ○  5. Ferme en attente                                                  │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Conditions archivées avec icône 🔒
- [ ] Aucun bouton d'action (pas de ✏️, pas de Valider)
- [ ] Pas de bouton "Avancer" sur les étapes passées
- [ ] L'agent peut cliquer pour consulter, pas pour modifier

### 5.6 B3 — Transaction Timeline (Tout OK, Avancer Actif)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Retour   Tremblay · 123 rue Principale           [🕘 Hist.] [📝] [⋯]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ 1-3. (compressés)                                                    │
│                                                                          │
│  ●━━ 4. PÉRIODE CONDITIONNELLE ━━━━━━━━━━━━━━━━━━ depuis 12 jours ━━    │
│  │                                                                       │
│  │  🔴 BLOQUANTES                                                        │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Financement hypothécaire     11 fév · 📎 preuve          │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Dépôt initial               3 fév · 📎 preuve            │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟡 REQUISES                                                          │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Inspection résidentielle    8 fév · 📎 rapport           │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Révision RPDS              10 fév                        │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  🟢 RECOMMANDÉES                                                      │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ○ Vérification zonage         (non complété — OK)           │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  │  ┌──────────────────────────────────────────────────────────────┐     │
│  │  │ ✅ Tout est prêt ! Bloquantes et requises complétées.       │     │
│  │  │                                                              │     │
│  │  │ [▸ Avancer à l'étape 5 — Ferme en attente]  (ACTIF, bleu)   │     │
│  │  └──────────────────────────────────────────────────────────────┘     │
│  │                                                                       │
│  ○  5. Ferme en attente                                                  │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Bouton "Avancer" ACTIF (bleu, primary) quand toutes bloquantes complétées
- [ ] Message positif "Tout est prêt !" au-dessus du bouton
- [ ] Conditions recommandées non complétées = OK (pas de blocage)
- [ ] Clic "Avancer" → confirmation → avancement réel

### 5.7 C1 — Mode Assisté (Panneau Suggestions)

**Desktop (slide-in à droite) :**

```
┌───────────────────────────────────────────────────────┬─────────────────┐
│ TRANSACTION (timeline visible)                        │ 💡 SUGGESTIONS  │
│                                                       │                 │
│                                                       │ Basé sur:       │
│                                                       │ Achat NB rural  │
│                                                       │ financé         │
│                                                       │                 │
│                                                       │ ☑ Financement   │
│                                                       │   🔴 Block +10j │
│                                                       │ ☑ Inspection    │
│                                                       │   🟡 Req. +7j   │
│                                                       │ ☑ Test puits    │
│                                                       │   🔴 Block +10j │
│                                                       │ ☐ Vérif. zonage │
│                                                       │   🟢 Reco +14j  │
│                                                       │ ─────────────── │
│                                                       │ 3 sélectionnées │
│                                                       │ [Ajouter (3)]   │
│                                                       │ [✕ Fermer]      │
└───────────────────────────────────────────────────────┴─────────────────┘
```

**Mobile (bottom sheet) :**

```
┌─────────────────────────────────────┐
│ (Transaction visible derrière)      │
├─────────────────────────────────────┤
│  ▔▔▔▔▔ (drag handle)               │
│ 💡 Suggestions — Étape 4            │
│ ☑ Financement hyp.  🔴 +10j        │
│ ☑ Inspection rés.   🟡 +7j         │
│ ☑ Test puits        🔴 +10j        │
│ ☐ Vérif. zonage     🟢 +14j        │
│ 3 sélectionnées                     │
│ [Ajouter (3)]                       │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Suggestions basées sur le profil transaction (rural/urbain/condo + financé)
- [ ] Chaque suggestion montre : nom, niveau, deadline relative
- [ ] Toutes pré-cochées par défaut SAUF recommended
- [ ] Agent peut décocher/cocher librement
- [ ] Bouton "Ajouter (N)" avec compteur dynamique
- [ ] Après ajout : conditions créées avec deadlines calculées (D37)
- [ ] Panel ne bloque pas la vue transaction (slide-in, pas modal)

### 5.8 E1 — Modal Création Transaction (Simplifié)

**Desktop :**

```
┌───────────────────────────────────────────────────────────┐
│ + Nouvelle transaction                                     │
├───────────────────────────────────────────────────────────┤
│ Client:  [Rechercher ou créer ▾]                           │
│ Adresse: [___________________________________]             │
│ Type:    [Achat ▾]    Prix: [________]                     │
│ Date de closing prévue: [📅 ___________]                   │
│                                                           │
│ ☑ Me proposer des suggestions de conditions                │
│   (je valide avant création)                               │
│                                                           │
│ [Annuler]                           [Créer transaction]    │
└───────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ + Nouvelle transaction              │
├─────────────────────────────────────┤
│ Client: [Rechercher ▾]             │
│ Adresse: [________________]        │
│ Type: [Achat ▾]                    │
│ Prix: [________]                   │
│ Closing: [📅 _______]              │
│                                    │
│ ☑ Suggestions de conditions        │
│                                    │
│ [Créer]                            │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Formulaire simple : client, adresse, type, prix, closing
- [ ] Toggle suggestions (activé par défaut si profil onboarding = "guidez-moi")
- [ ] Pas de re-paramétrage profil pratique (déjà fait à l'onboarding)
- [ ] Création < 2 minutes
- [ ] Si suggestions activées → C1 s'ouvre après création

### 5.9 G2 — Admin Dashboard (Gestion Plans/Pricing)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Admin Ofra ▸ Plans & Pricing                               Sam (Admin)  │
├──────────────────────────────────────────────────────────────────────────┤
│ Rabais annuel: [−17%]   Programme Fondateur: [Prix garanti à vie]       │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ STARTER  [Actif ✅]                Abonnés: 12 (2 fondateurs)   │     │
│ │ Mensuel: [29.00]$  Annuel: [290.00]$                            │     │
│ │ TX max: [5]  Stockage: [1] Go  Historique: [6] mois             │     │
│ │ [Sauvegarder]                                                   │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ SOLO  [Actif ✅]                   Abonnés: 18 (5 fondateurs)   │     │
│ │ Mensuel: [49.00]$  Annuel: [490.00]$                            │     │
│ │ TX max: [12]  Stockage: [3] Go  Historique: [12] mois           │     │
│ │ [Sauvegarder]                                                   │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ PRO  [Actif ✅]                    Abonnés: 10 (4 fondateurs)   │     │
│ │ Mensuel: [79.00]$  Annuel: [790.00]$                            │     │
│ │ TX max: [25]  Stockage: [10] Go  Historique: [∞]                │     │
│ │ [Sauvegarder]                                                   │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ AGENCE  [Inactif ⏸️]  Phase 2     Emails collectés: 7          │     │
│ │ Mensuel: [149.00]$  Annuel: [1490.00]$  Users: [3]             │     │
│ │ TX max: [∞]  Stockage: [25] Go  Historique: [∞]                │     │
│ │ [Activer]  [Sauvegarder]                                       │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│ 📜 HISTORIQUE DES CHANGEMENTS                                            │
│ 6 fév 14:32 · Sam · Pro mensuel: 69→79$ · "Brainstorm pricing v2"      │
│ 5 fév 09:15 · Sam · Starter créé: 29$ · "Ajout plan d'entrée"          │
│                                                                          │
│ ⚠️ Changements = nouveaux abonnés. [Appliquer aux existants...]         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile (lecture seule) :**

```
┌─────────────────────────────────────┐
│ Admin · Plans                       │
├─────────────────────────────────────┤
│ STARTER: 29$/mo · 5 TX · 1 Go      │
│ SOLO:    49$/mo · 12 TX · 3 Go     │
│ PRO:     79$/mo · 25 TX · 10 Go    │
│ AGENCE:  Inactif (Phase 2)         │
│ (Édition complète: Desktop)         │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Tous les champs éditables (prix, limites, stockage, historique)
- [ ] Sauvegarder par plan (pas tout d'un coup)
- [ ] Historique des changements avec date, admin, champ, ancien→nouveau, raison
- [ ] Raison obligatoire avant sauvegarde
- [ ] Avertissement : nouveaux abonnés seulement
- [ ] Bouton "Appliquer aux existants" avec confirmation (2 étapes)
- [ ] Mobile = lecture seule (édition desktop recommandée)
- [ ] Middleware `adminOnly` (is_admin boolean sur user)

### 5.10 H1 — Page Pricing Publique (Mensuel)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Ofra  Fonctionnalités  Pricing  Connexion                   [Commencer] │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐     │
│ │ 🏗️ FONDATEUR — 19/25 places restantes                           │     │
│ │ 30 jours gratuits + votre prix garanti à vie                   │     │
│ │ [Devenir fondateur →]                                           │     │
│ └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│              [● Mensuel]    [Annuel — Économisez 17%]                    │
│                                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │ STARTER      │ │ SOLO         │ │ PRO ⭐         │ │ ÉQUIPE         │ │
│ │ 29$/mois     │ │ 49$/mois     │ │ 79$/mois      │ │ 149$/mois      │ │
│ │              │ │              │ │ Populaire     │ │                │ │
│ │ "Je fais ça  │ │ "Je lance ma │ │ "Pipeline     │ │ Bientôt        │ │
│ │  à côté"     │ │  pratique"   │ │  chargé"      │ │                │ │
│ │              │ │              │ │               │ │ Illimité       │ │
│ │ 5 TX actives │ │ 12 TX        │ │ 25 TX         │ │ 3 users        │ │
│ │ 1 Go         │ │ 3 Go         │ │ 10 Go         │ │ 25 Go          │ │
│ │ Hist. 6 mois │ │ Hist. 12 mois│ │ Hist. ∞       │ │                │ │
│ │              │ │              │ │               │ │                │ │
│ │ [Commencer]  │ │ [Commencer]  │ │ [Commencer ⭐] │ │ [Me notifier]  │ │
│ └──────────────┘ └──────────────┘ └───────────────┘ └ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                                          │
│ Essai 30j gratuit · 100% Canada 🍁 · FR/EN · Sans contrat · Sans CB     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Pricing                             │
├─────────────────────────────────────┤
│ 🏗️ Fondateur 19/25                  │
│ 30j gratuits + prix garanti à vie  │
│ [Devenir fondateur →]               │
│                                     │
│ [● Mensuel] [Annuel −17%]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ STARTER  29$/mo                 │ │
│ │ 5 TX · 1 Go · Hist. 6 mois     │ │
│ │ [Commencer]                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ SOLO  49$/mo                    │ │
│ │ 12 TX · 3 Go · Hist. 12 mois   │ │
│ │ + Packs auto + Suggestions      │ │
│ │ [Commencer]                     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ PRO ⭐  79$/mo  Populaire       │ │
│ │ 25 TX · 10 Go · Hist. ∞        │ │
│ │ + Deadlines auto + Support prio │ │
│ │ [Commencer ⭐]                   │ │
│ └─────────────────────────────────┘ │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ │ ÉQUIPE 149$/mo (Bientôt)       │ │
│ │ [Me notifier]                  │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                     │
│ 🍁 100% canadien · 30j gratuit     │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Toggle mensuel/annuel fonctionnel
- [ ] Prix lus depuis la DB (endpoint public `GET /api/plans`)
- [ ] Plan Pro marqué "Populaire" / ⭐
- [ ] Agence en pointillés avec "Me notifier" (collecte email)
- [ ] Bannière fondateur au-dessus avec compteur temps réel
- [ ] Si 25/25 fondateurs → "Programme Fondateur — Complet. [Liste d'attente]"

### 5.11 H2 — Page Pricing (Annuel Toggle)

Même layout que H1 avec :
- Toggle "Annuel" activé
- Prix barrés : ~~348$/an~~ **290$/an** (≈24$/mo)
- Chaque plan montre l'économie annuelle

### 5.12 H3 — Bannière Fondateur

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🏗️ OFFRE FONDATEUR — 19/25 places restantes                             │
│ 30 jours gratuits + votre prix garanti à vie · Les prix augmenteront   │
│ "Vous construisez Ofra avec nous."   [Devenir fondateur →] [Détails]   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ 🏗️ Fondateur — 19/25                │
│ 30j gratuits + prix garanti à vie  │
│ [Devenir fondateur →]               │
└─────────────────────────────────────┘
```

### 5.13 K2 — Paramètres Abonnement

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Paramètres ▸ Abonnement                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ 🏗️ Membre Fondateur #14/25 — Prix garanti à vie                         │
│                                                                          │
│ Plan actuel: PRO (79$/mo — prix locké)  Statut: Actif ✅                 │
│ Renouvellement: 12 mars 2026            Cycle: Mensuel                   │
│                                                                          │
│ Utilisation:                                                             │
│ TX actives: 12/25  ████████████░░░░░  48%                                │
│ Stockage:  3.2/10 Go  ███░░░░░░░░░░  32%                                │
│                                                                          │
│ Paiement: Visa **** 4242   [Mettre à jour]                               │
│                                                                          │
│ Changer de plan:                                                         │
│ [Starter 29$/mo] [Solo 49$/mo] [● Pro 79$/mo] [Agence — Phase 2]       │
│ (prix garanti à vie — votre prix ne changera jamais)                     │
│                                                                          │
│ [Passer en annuel (−17% → 790$/an)]                                      │
│                                                                          │
│ [Annuler l'abonnement]                                                   │
│ ⚠️ L'annulation fait perdre votre statut Fondateur définitivement.       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Abonnement                          │
├─────────────────────────────────────┤
│ 🏗️ Fondateur #14/25 · Prix locké   │
│ Plan: PRO 79$/mo · Actif ✅         │
│ TX: 12/25 · Stock: 3.2/10 Go       │
│ [Passer en annuel −17%]            │
│ [Changer de plan]                   │
│ ⚠️ Annulation = perte fondateur    │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Badge fondateur visible si is_founder = true
- [ ] Prix affichés = `plan_locked_price` (prix garanti à vie, pas le prix courant)
- [ ] Barres de progression TX et stockage
- [ ] Changement de plan : prix locké au moment du switch (garanti à vie)
- [ ] Avertissement explicite sur perte fondateur en cas d'annulation
- [ ] Downgrade → vérifie TX actives → modal "Presque !" si dépassement

### 5.14 Écran 14 — Soft Limit (Bandeau)

**Desktop :**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Limite atteinte: 25/25 transactions actives (Plan Pro)                │
│ 7 jours de grâce. Après: création bloquée.                              │
│ [Upgrade maintenant]   [Voir mes transactions]                           │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ ⚠️ Limite atteinte (Pro)            │
│ 7 jours de grâce                    │
│ [Upgrade]  [Voir TX]                │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Bandeau affiché en haut de toutes les pages quand `grace_period_start` != null
- [ ] Countdown jours restants
- [ ] Bouton upgrade → page pricing avec plan supérieur pré-sélectionné
- [ ] Transactions existantes **jamais** supprimées

### 5.15 Écran 15 — Downgrade Bloqué

**Desktop :**

```
┌───────────────────────────────────────────────────────────────┐
│ Presque ! Quelques transactions à archiver d'abord            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Vous souhaitez passer au plan Solo (12 TX actives max).      │
│                                                               │
│  Actives actuellement :  18                                   │
│  Limite Solo :           12                                   │
│  ─────────────────────────                                    │
│  À archiver/terminer :   6                                    │
│                                                               │
│  [Voir mes transactions actives →]              [Compris]     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Mobile :**

```
┌─────────────────────────────────────┐
│ Presque !                           │
├─────────────────────────────────────┤
│ Actives: 18 · Limite Solo: 12      │
│ Archivez 6 transactions d'abord.   │
│ [Voir actives →]   [Compris]       │
└─────────────────────────────────────┘
```

**Critères d'acceptance :**
- [ ] Titre bienveillant ("Presque !"), pas agressif
- [ ] Calcul fait pour l'agent (18 − 12 = 6)
- [ ] "Voir actives" filtre par ancienneté (les plus vieilles en premier)
- [ ] Modal bloquante — impossible de downgrader tant que la condition n'est pas remplie

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

### 7.3 Migrations Nouvelles

| # | Migration | Tables/Colonnes |
|---|-----------|----------------|
| 1 | `create_plans_table` | plans (id, name, slug, monthly_price, annual_price, max_transactions, max_storage_mb, history_months, max_users, is_active, display_order) |
| 2 | `add_plan_fields_to_users` | users + plan_id, is_founder, billing_cycle, plan_locked_price, grace_period_start |
| 3 | `create_plan_changes_table` | plan_changes (id, plan_id, admin_user_id, field, old_value, new_value, reason, created_at) |

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
| **Emails transactionnels** | À déterminer (Postmark ou SES ca-central-1) | Canada / US-East | Évaluer options canadiennes |

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

| Bloc | Contenu | Dépendance | Statut |
|------|---------|------------|--------|
| **1. D53 Backend** | Migration `trial_tx_used`, `PlanLimitMiddleware` trial mode (1TX), `TrialGuardMiddleware` soft/hard wall, subscription endpoint enrichi, registration init 30j. | Aucune | ✅ DONE |
| **2. D53 Frontend** | `TrialBanner` (actif/soft wall), hard wall redirect dans Layout, i18n FR/EN. Manque : rappels email J7/J21/J27 (→ Bloc 6). | Bloc 1 | ✅ DONE |
| **3. Landing Page** | Hero, features (urgences, conditions, FINTRAC), social proof, CTA → `/signup`. Route publique `/`. | Aucune (parallélisable) | ✅ DONE (670 lignes, 6 pages marketing, ROUTE-1 routing) |
| **4. Pricing Page** | 4 plans, toggle mensuel/annuel, bannière fondateur "prix garanti à vie", Agence grisé. CTA → `/signup` (pas encore Stripe). | Aucune (parallélisable) | ✅ DONE (657 lignes, comparaison complète) |
| **5. Legal** | Conditions d'utilisation, Politique de confidentialité (LPRPDE/PIPEDA + NB). Routes `/legal/terms`, `/legal/privacy`. | Aucune (parallélisable) | ❌ TODO |
| **6. Emails essentiels** | WelcomeMail enrichi (mention trial 30j), `TrialReminderMail` paramétrique (J7/J21/J27), BullMQ scheduling à l'inscription, handler dans queue.ts. Reset password déjà existant. | Bloc 1 (trial dates) | ✅ DONE |
| **7. Stripe** | Stripe Elements (custom, inline). Webhooks sync. Page Abonnement custom (K2). Détails ci-dessous §7.4. | Blocs 1-6 terminés | ❌ TODO (dernier) |

| **8. Offres intelligentes** | Sprint A : Migration `buyer_party_id`/`seller_party_id`/`initial_direction` sur Offer, model+service+validator+controller, PartyPicker inline (dropdown + création inline), intégration CreateOfferModal avec pre-populate en mode contre-offre. Sprint B : `NegotiationThread` (fil vertical toutes révisions, deltas prix, direction arrows), `OfferComparison` (table side-by-side 2-4 offres, highlight meilleur/pire prix, CTA accepter), `AcceptOfferModal` affiche parties buyer/seller. Auto-populate parties à l'acceptation → FINTRAC ready. 15 fichiers, 283 tests verts. | Aucune (parallélisable) | ✅ DONE |

**Blocs parallélisables :** 3, 4, 5, 8 peuvent se faire en même temps que 1-2.

```
✅ Fait:     [Bloc 1: D53 Backend] + [Bloc 2: D53 Frontend] + [Bloc 3: Landing]
✅ Fait:     [Bloc 4: Pricing] + [Bloc 6: Emails] + [Bloc 8: Offres intelligentes]
→ Reste:    [Bloc 5: Legal] + [Bloc 7: Stripe] + Tests + Polish
            → Beta fondateurs
```

### 9.1 Phase 1 — Lancement Fondateurs (Blocs 1-7 ci-dessus)

Tout ce qui est nécessaire pour que les 25 premiers agents puissent :
1. S'inscrire (trial 30j, 1 TX, Pro complet)
2. Utiliser Ofra en conditions réelles
3. Choisir un plan et payer via Stripe à J30

| Feature | Écran | Décision | Statut |
|---------|-------|----------|--------|
| Dashboard urgences | A1-A3 | D42 | ✅ Codé |
| Timeline verticale | B1-B3 | D32 | ✅ Codé |
| Mode assisté | C1 | D44 | ✅ Codé |
| Admin plans | G2 | D45 | ✅ Codé |
| Trial 30j backend | — | D53 | ✅ Codé |
| Trial 30j frontend | — | D53 | ✅ Codé |
| Landing page | — | — | ✅ Codé (670L, 6 pages marketing, route `/`) |
| Page pricing publique | H1-H3 | D46 | ✅ Codé (657L, comparaison 4 plans) |
| Emails essentiels | — | — | ✅ Codé (WelcomeMail, TrialReminderMail, BullMQ scheduling) |
| Offres intelligentes | M06, M12 | — | ✅ Codé (PartyPicker, NegotiationThread, OfferComparison, 15 fichiers) |
| Legal (CGU, vie privée) | — | — | ❌ TODO |
| Stripe integration | K2, #14, #15 | D47-D49 | ❌ TODO (dernier) |

### 9.2 Phase 2 — Valeur Perçue (post-lancement, mois 2-3)

| Feature | Décision |
|---------|----------|
| Compteur "Valeur protégée" (données réelles) | D43 |
| Email du lundi "Votre semaine" | D50 |
| Alertes proactives 48h (push/SMS) | D51 |
| Onboarding simplifié "1ère transaction en 2 min" | D40 amélioré |
| Plan Agence activé | D46 |
| Sprint 2-4 conditions (lock profile, admin override) | Planifié |
| M14 Polish : label irrévocabilité, Custom expiration, notes field, NegotiationThread dans modal, OfferComparison conditions count | §11.G |
| Superadmin : suppression de compte (mot de passe + type-to-confirm, soft delete, cascade, audit log) | Backlog |
| UI Audit Trail conditions : historique événements par condition (créé, résolu, archivé) — backend `ConditionEvent` déjà actif, manque le composant frontend | Backlog |

### 9.3 Phase 3 — Copilote Proactif (6 mois)

| Feature |
|---------|
| SMS/emails automatiques aux avocats, clients, inspecteurs |
| Contacts liés par transaction (avocat, courtier, inspecteur) |
| Rappels automatiques aux parties prenantes |
| Intégration calendrier (Google Calendar / Outlook) |
| Historique communications |

### 9.4 Phase 4 — Intelligence Augmentée (12-24 mois)

| Feature |
|---------|
| Analyse de documents par IA |
| Détection de risques automatique |
| Suggestions d'offres basées sur le marché |
| Gestion d'agenda intégrée |
| Templates partagés (données anonymisées entre agents) |

### 9.5 Expansion Géographique

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
| Tests backend | 180 PASS |
| Tests frontend | 283 PASS |
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
1. D53 Trial 30j (15% — schema OK, enforcement 0%)
2. Stripe billing (0%)
3. Legal pages (0%)
4. Emails essentiels trial (0%)

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
| 🔴 P0 | Stripe billing | 5-7 jours | ❌ TODO |
| ~~🟠 P1~~ | ~~Error Boundary + code splitting frontend~~ | 1h | ✅ DONE (2026-02-18) |
| ~~🟠 P1~~ | ~~Page 404 / catch-all route~~ | 15 min | ✅ DONE (2026-02-18) |
| ~~🟠 P1~~ | ~~`FRONTEND_URL` unifié dans `env.ts` (3 fallbacks différents)~~ | 30 min | ✅ DONE (2026-02-18) |
| 🟠 P1 | Tests FINTRAC + TenantScope backend | 1 jour | ❌ TODO |
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
| ⚪ P3 | Coverage pages frontend → 50%+ | Continu | ❌ TODO |

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

#### G.5 Système d'Intake Public (Constat)

Le flow d'intake (`/api/offer-intake/:token` + `OfferIntakePage`) est un **lead capture minimal** (nom, email, téléphone, prix, message) — pas un formulaire juridique. C'est le bon pattern : le courtier reçoit l'intérêt puis reformalise l'offre complète dans Ofra. Aucune action requise.

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

**Score launch-readiness : 68%** (baisse de 82% — failles sécurité et légales découvertes)

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
| Tests backend (Japa) | 12 functional + 3 unit suites |
| Tests frontend (Vitest) | 30 fichiers |
| E2E (Playwright) | 3 specs (local only, PAS en CI) |
| i18n FR/EN | 2 836 lignes chaque, parité ✅ |
| `as any` backend | 11 occurrences |
| `as any` frontend | 40+ occurrences |
| Issues totales | ~95 (7 critiques, 15 hautes, 30 moyennes, 43 basses) |

#### H.2 Issues Critiques (P0 — Sécurité / Légal)

| ID | Fichier | Description | Effort |
|----|---------|-------------|--------|
| **SEC-03** | `routes.ts:17` | **Path traversal** — `params.filename` passé sans sanitisation à `app.makePath()`. `../../config/database.ts` expose le code source. Fix : `path.basename()`. | 5 min |
| **SEC-04** | `fintrac_service.ts:108` | **FINTRAC bypass** — `onStepEnter` fait `return` early quand `autoConditionsEnabled=false`. Viole spec : « ALWAYS created even if autoConditionsEnabled=false ». Brèche légale. | 5 min |
| **SEC-05** | `plan_service.ts` | **Trial FINTRAC bloqué** — `meetsMinimum(undefined, 'solo')` retourne `false`. Trial users ne peuvent pas compléter l'identité FINTRAC — obligation légale. Contradicts `plan_limit_middleware.ts` L11 comment « trial = full Pro access ». | 15 min |
| **SEC-06** | `routes.ts:15-19` | **Fichiers sans ownership** — `/api/uploads/:filename` accessible à tout user authentifié. Le CUID est observable dans les réponses API. | 30 min |
| **INFRA-01** | `fly.toml` | **Résidence données** — `primary_region = "ewr"` (Newark, NJ). PRD §7.5 exige `yyz` (Toronto). Claim « 100% hébergé au Canada » actuellement faux. | 1 min |

#### H.3 Issues Hautes (P1)

| ID | Fichier | Description |
|----|---------|-------------|
| **FE-01** | `router.tsx` | Pas de code splitting — 30+ pages dans un seul bundle JS |
| **FE-02** | (aucun) | Pas d'Error Boundary — erreur React = écran blanc total |
| **FE-03** | `router.tsx` | Pas de route 404 / catch-all |
| **FE-04** | `Layout.tsx:87-99` | Flash contenu avant redirect trial (hard wall) |
| **FE-05** | `tailwind.config.js` | Police Outfit définie mais pas chargée (Google Fonts) |
| **I18N-01** | `apiError.ts:24-90` | Messages d'erreur hardcodés en français — users EN voient du FR |
| **I18N-02** | `UserDropdown.tsx:100,115` | « Settings » et « Logout » hardcodés en anglais |
| **DB-01** | `transaction.ts:102` | `tags` column : `prepare` sans `consume` — retourné comme string brute |
| **MIG-01** | migrations | Timestamps dupliqués : `1772000000009` et `1774000000002` — ordre non-déterministe |
| **ADMIN-01** | `admin_controller.ts:119-125` | Filtre engagement appliqué post-pagination — `meta.total` incorrect |

#### H.4 Issues Moyennes (P2 — sélection)

| ID | Fichier | Description |
|----|---------|-------------|
| **SEC-07** | `rate_limit_middleware.ts:10` | Rate limiter in-memory `new Map()` — pas distribué multi-instance |
| **SEC-08** | Controllers conditions/offers | `findOrFail(id)` avant TenantScope — disclosure existence ressource |
| **SEC-09** | (aucun) | Pas de CSP headers (Content-Security-Policy) |
| **ENV-01** | `env.ts` | `FRONTEND_URL` non déclaré — 3 fallbacks différents (`ofra.app`, `ofra.pages.dev`, `ofra.ca`) |
| **TS-01** | `notification.ts` | `NotificationType` déclare 4 valeurs, 7 autres utilisées en pratique |
| **TS-02** | `activity_feed.ts` | `ActivityType` union incomplète — `email_recap_sent`, `fintrac_archived` manquent |
| **VAL-01** | Validators multiples | Dates acceptées comme `string` brut sans validation ISO format |
| **CSS-01** | 13 fichiers | `gray-` vs `stone-` mélangés — visible en dark mode |
| **CSS-02** | `UpgradePrompt.tsx` | Zéro dark mode coverage |
| **FE-06** | `transactions.api.ts:74,106,109,111` | 4 champs Transaction typés `any[]` / `any` |
| **FE-07** | Multiples | `['subscription']` query avec 5 staleTime différents |
| **DOCKER-01** | `Dockerfile` | Container tourne en root |
| **DEPLOY-01** | `fly.toml` | `db:seed` à chaque deploy — risque duplications |

#### H.5 Couverture de Tests — Zones Sans Tests

**Backend (zones critiques sans couverture) :**
- `fintrac_controller.ts` / `fintrac_service.ts` — module légal critique
- `tenant_scope_service.ts` — couche multi-tenant
- `plan_service.ts` — feature gating
- `admin_controller.ts` — panel admin complet
- `export_controller.ts` / `pdf_export_service.ts`
- `transaction_documents_controller.ts`, `transaction_members_controller.ts`, `transaction_parties_controller.ts`
- `reminder_service.ts`, `email_service.ts` (23 templates mail)

**Frontend (zones sans couverture) :**
- `FintracComplianceModal.tsx` — composant légal critique
- `SettingsPage.tsx` (5 tabs)
- `ClientsPage.tsx`, `ClientDetailsPage.tsx`
- Register, ForgotPassword, VerifyEmail, Onboarding pages
- Admin pages complètes
- Couche API (`*.api.ts`) — 22 modules sans tests
- `apiError.ts`, `date.ts`, `ThemeContext.tsx`

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

---

_PRD rédigé par l'équipe BMAD en Party Mode — 2026-02-06_
_Mis à jour v2.8 — 2026-02-18 (audit approfondi complet — 95 issues, plan P0 sécurité/légal)_
_Validé par : Sam (Product Owner)_
_Source de vérité unique pour Ofra v2_
