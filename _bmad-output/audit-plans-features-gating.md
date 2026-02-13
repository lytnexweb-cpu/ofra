# Audit complet : Plans, Limites & Feature Gating

**Date :** 2026-02-12
**Auteur :** Paige (Tech Writer) + Winston (Architect) + Mary (Analyst) + John (PM)
**Scope :** PRD, Backend, Frontend, Feature Inventory
**Méthode :** 4 audits parallèles exhaustifs (PRD, backend, frontend, inventaire features)

---

## 0. DECISION PRODUIT (2026-02-12)

**Callouts marketing (Solo+, Pro+) = PAS de gating technique.**
Les mentions "Packs auto + Suggestions" (Solo) et "Deadlines auto + Support prio" (Pro) sont du marketing visuel sur la page pricing uniquement. Toutes les features sont accessibles à tous les plans.

**Gating réel = limites quantitatives uniquement :**

| Gate | Type | Statut |
|------|------|--------|
| TX actives | Quantitatif (soft limit 7j + block) | ✅ Implémenté |
| Stockage | Quantitatif (bloquer upload) | ❌ A implémenter |
| Historique | Quantitatif (archiver TX anciennes) | ❌ A implémenter |
| Max users / invites | Quantitatif (bloquer invite) | ❌ A implémenter (champ manquant) |
| Features binaires (JSON) | ~~Feature gate~~ | **Annulé** — pas nécessaire |

**Conséquence architecture :** Pas besoin de champ JSON `features` sur Plan. Les 4 champs quantitatifs suffisent.

---

## 1. Grille de prix (Source de vérité : PRD §2.1, L79-86)

| Plan | Mensuel | Annuel (-17%) | TX actives | Stockage | Historique | Max Users | Statut |
|------|---------|---------------|------------|----------|------------|-----------|--------|
| **Starter** | 29$/mo | 290$/an (~24$/mo) | 5 | 1 Go | 6 mois | 1 | ✅ Actif |
| **Solo** | 49$/mo | 490$/an (~41$/mo) | 12 | 3 Go | 12 mois | 1 | ✅ Actif |
| **Pro** | 79$/mo | 790$/an (~66$/mo) | 25 | 10 Go | Illimité | 1 | ⭐ Actif (Populaire) |
| **Agence** | 149$/mo | 1490$/an (~124$/mo) | Illimité | 25 Go | Illimité | 3 | ⏸️ Phase 2 |

Tous les prix en CAD. Le plan Agence est grisé/pointillés au lancement avec bouton "Me notifier".

### Personas par plan (PRD §2.2, L90-95)

| Plan | Persona | Phrase |
|------|---------|--------|
| Starter | Agent temps partiel, débutant | "Je fais ça à côté" |
| Solo | Agent débutant actif, en croissance | "Je lance ma pratique" |
| Pro | Agent établi, pipeline chargé | "J'ai un pipeline chargé" |
| Agence | Petite équipe (Phase 2) | "On travaille en équipe" |

### Rabais (PRD §2.3-2.4, L97-122)

| Type | Montant | Application | Détails |
|------|---------|-------------|---------|
| Annuel | -17% | Tous plans | Équivaut à 2 mois gratuits |
| Fondateur mensuel | -20% à vie | Tous plans (Starter, Solo, Pro) | Suit l'upgrade |
| Fondateur annuel | -30% à vie | Tous plans | Meilleur rabais, pas de cumul avec -20% |
| Places fondateurs | 25 max | Hard cap | 1er mois GRATUIT |

### Prix fondateur (PRD L114-118)

| Plan | Normal | Fondateur mensuel (-20%) | Fondateur annuel (-30%) |
|------|--------|--------------------------|------------------------|
| Starter | 29$/mo | 23$/mo | 244$/an (~20$/mo) |
| Solo | 49$/mo | 39$/mo | 412$/an (~34$/mo) |
| Pro | 79$/mo | 63$/mo | 664$/an (~55$/mo) |

### Règles fondateur (PRD L101-110)

- 25 places maximum (hard cap)
- 1er mois = GRATUIT
- -20% mensuel à vie OU -30% annuel à vie (pas de cumul)
- Applicable à TOUT plan (Starter, Solo, Pro)
- Le rabais SUIT l'upgrade (fondateur = flag, pas plan)
- Badge visible : "Membre Fondateur #X/25"
- Engagement : 15 minutes feedback/mois
- **Annulation = perte fondateur PERMANENTE** (PRD L109)
- Changement de plan sans annuler = conserve fondateur (PRD L110)

---

## 2. Inventaire complet des features

### 2.1 Features existantes (20 domaines, 119 routes API)

| # | Feature | Controller/Service | Routes | Accessible à |
|---|---------|-------------------|--------|-------------|
| F01 | Transactions CRUD | `transactions_controller.ts` | 6 routes | Tous les plans |
| F02 | Workflow engine (8 étapes) | `workflow_engine_service.ts` | advance/skip/go-to | Tous les plans |
| F03 | Conditions manuelles | `conditions_controller.ts` | CRUD + resolve | Tous les plans |
| F04 | Conditions auto (52 templates, 4 packs) | `conditions_engine_service.ts` | Auto-gen on create | Tous les plans |
| F05 | Résolution avec preuve (evidence) | `conditions_controller.ts` | resolve + evidence | Tous les plans |
| F06 | Offres + contre-offres + révisions | `offers_controller.ts` | CRUD + accept/reject/withdraw | Tous les plans |
| F07 | Documents upload/versioning/approve | `transaction_documents_controller.ts` | CRUD + approve/reject | Tous (limité par stockage) |
| F08 | Export PDF personnalisé | `pdf_export_service.ts` | POST export/pdf | Tous les plans |
| F09 | Liens de partage (token + password + expiry) | `transaction_share_links_controller.ts` | CRUD + public access | Tous les plans |
| F10 | Parties (acheteur/vendeur/avocat/courtier) | `transaction_parties_controller.ts` | CRUD | Tous les plans |
| F11 | Membres d'équipe (inviter/rôles/révoquer) | `transaction_members_controller.ts` | invite/accept/revoke | **Agence only** (via maxUsers) |
| F12 | Clients CRUD + import CSV | `clients_controller.ts` | CRUD + import/template | Tous les plans |
| F13 | Notes internes par transaction | notes routes | CRUD | Tous les plans |
| F14 | Dashboard urgences (criticality scoring) | `dashboard_controller.ts` | GET urgencies | Tous les plans |
| F15 | Admin : gestion abonnés + engagement scoring | `admin_controller.ts` | subscribers + CRM | Admin only |
| F16 | Admin : plans CRUD + audit log complet | `admin_plans_controller.ts` | GET/PUT plans | Admin only |
| F17 | Admin : notes/tâches CRM par abonné | `admin_controller.ts` | notes + tasks | Admin only |
| F18 | Admin : log d'activité système | `admin_controller.ts` | activity-log | Admin only |
| F19 | Profil utilisateur + préférences (langue/theme/tz) | `profile_controller.ts` | PUT profile/settings | Tous |
| F20 | Auth complète (register/login/reset/logout-all) | `auth_controller.ts` | 8 routes | Tous |

### 2.2 Détail des 8 étapes workflow (slugs DB)

`consultation` → `offer-submitted` → `offer-accepted` → `conditional-period` → `firm-pending` → `pre-closing` → `closing-day` → `post-closing`

### 2.3 Détail des 52 templates conditions (4 packs)

| Pack | Templates | Applicable si |
|------|-----------|--------------|
| Universal | ~10 | Toutes transactions |
| Rural NB | ~15 | propertyContext = rural (puits, fosse septique, droit passage) |
| Condo NB | ~15 | propertyType = condo |
| Financé NB | ~12 | isFinanced = true |

Matching via `TransactionProfile.toMatchObject()` → `appliesTo()`.
Anti-duplicate via `existingTemplateIds` + `existingTitleKeys`.

### 2.4 Features Phase 2 (PRD, pas implémentées)

| # | Feature | Décision PRD | Ref PRD |
|---|---------|-------------|---------|
| P01 | Bloc "Valeur protégée" (commissions sauvées) | Phase 2 | D43, L219 |
| P02 | Email du lundi "Votre semaine" | Phase 2 | D50, L226 |
| P03 | Alertes push/SMS deadlines 48h | Phase 2 | D51, L227 |
| P04 | Plan Agence multi-user activé | Phase 2 | L86, L1171 |

### 2.5 Features Phase 3-4 (roadmap long terme)

| # | Feature | Phase |
|---|---------|-------|
| L01 | SMS/emails aux avocats, clients, inspecteurs | Phase 3 |
| L02 | Contacts liés par transaction | Phase 3 |
| L03 | Rappels auto aux parties prenantes | Phase 3 |
| L04 | Intégration calendrier (Google/Outlook) | Phase 3 |
| L05 | Analyse IA de documents | Phase 4 |
| L06 | Détection de risques auto | Phase 4 |
| L07 | Suggestions d'offres basées sur le marché | Phase 4 |
| L08 | Templates partagés entre agents (anonymisés) | Phase 4 |

---

## 3. Matrice plan × feature (DÉCISION FINALE)

### 3.1 Limites quantitatives (seul gating technique)

| Limite | Starter | Solo | Pro | Agence | Enforcement |
|--------|---------|------|-----|--------|-------------|
| **TX actives** | 5 | 12 | 25 | ∞ | ✅ `PlanLimitMiddleware` (soft 7j + block) |
| **Stockage** | 1 Go | 3 Go | 10 Go | 25 Go | ❌ A implémenter (check upload) |
| **Historique** | 6 mo | 12 mo | ∞ | ∞ | ❌ A implémenter (job archivage) |
| **Max users** | 1 | 1 | 1 | 3 | ❌ A implémenter (check invite) |

### 3.2 Features accessibles à tous les plans (pas de gate)

| Feature | Starter | Solo | Pro | Agence | Note |
|---------|---------|------|-----|--------|------|
| Workflow guidé (8 étapes) | ✅ | ✅ | ✅ | ✅ | — |
| Conditions manuelles | ✅ | ✅ | ✅ | ✅ | — |
| Conditions auto (52 templates) | ✅ | ✅ | ✅ | ✅ | Callout "Solo+" = marketing |
| Résolution avec preuve | ✅ | ✅ | ✅ | ✅ | — |
| Offres + contre-offres | ✅ | ✅ | ✅ | ✅ | — |
| Documents upload/versioning | ✅ | ✅ | ✅ | ✅ | Limité par stockage |
| Export PDF | ✅ | ✅ | ✅ | ✅ | — |
| Liens de partage + password | ✅ | ✅ | ✅ | ✅ | — |
| Parties (avocat/courtier) | ✅ | ✅ | ✅ | ✅ | — |
| Clients CRUD + import CSV | ✅ | ✅ | ✅ | ✅ | — |
| Notes internes | ✅ | ✅ | ✅ | ✅ | — |
| Dashboard urgences | ✅ | ✅ | ✅ | ✅ | — |
| Profil + préférences | ✅ | ✅ | ✅ | ✅ | — |
| Email recap | ✅ | ✅ | ✅ | ✅ | — |

### 3.3 Callouts marketing (affichés sur PricingPage, PAS de gate technique)

| Callout | Affiché sur | Gate technique | Décision |
|---------|-------------|---------------|----------|
| "Packs auto + Suggestions" | Solo+ (PRD L861-862) | ❌ Aucun | **Marketing only** |
| "Deadlines auto" | Pro+ (PRD L867-868) | ❌ Aucun | **Marketing only** |
| "Support prioritaire" | Pro+ (PRD L867-868) | ❌ Aucun | **Marketing only** |

### 3.4 Feature Agence-only (seule restriction binaire)

| Feature | Starter | Solo | Pro | Agence | Gate |
|---------|---------|------|-----|--------|------|
| Membres d'équipe (inviter) | ❌ | ❌ | ❌ | ✅ | `maxUsers > 1` |

En pratique : Starter/Solo/Pro ont `maxUsers = 1` donc pas de bouton "Inviter membre". Agence a `maxUsers = 3`.

---

## 4. Enforcement actuel — audit backend détaillé

### 4.1 Ce qui fonctionne ✅

#### PlanLimitMiddleware (`backend/app/middleware/plan_limit_middleware.ts`, 87 lignes)

Machine à états :
```
ÉTAT 1 : SOUS LA LIMITE
  → count < maxTransactions → reset grace, pass through

ÉTAT 2 : DÉBUT GRACE
  → count >= maxTransactions, gracePeriodStart = null
  → Set gracePeriodStart = now(), autorise la création

ÉTAT 3 : GRACE ACTIVE
  → count >= maxTransactions, daysSinceGrace <= 7
  → Autorise la création (l'user a le temps)

ÉTAT 4 : GRACE EXPIRÉE
  → daysSinceGrace > 7
  → BLOQUE avec code E_PLAN_LIMIT_EXCEEDED
```

Réponse quand bloqué :
```json
{
  "success": false,
  "error": {
    "code": "E_PLAN_LIMIT_EXCEEDED",
    "meta": {
      "maxTransactions": 5,
      "activeTransactions": 7,
      "gracePeriodStart": "2026-02-10T14:30:00.000Z",
      "graceExpired": true
    }
  }
}
```

Appliqué sur : `POST /transactions` uniquement (route L77 de routes.ts).

#### AdminPlansController (`backend/app/controllers/admin_plans_controller.ts`)

- `GET /api/admin/plans` → Liste tous les plans + subscriber counts (total + fondateurs) + 50 derniers change logs
- `PUT /api/admin/plans/:id` → Update atomique + audit log par champ (old→new + reason obligatoire)
- Champs éditables : name, monthlyPrice, annualPrice, maxTransactions, maxStorageGb, historyMonths, isActive, displayOrder

#### PlansController (`backend/app/controllers/plans_controller.ts`)

- `GET /api/plans` (public, sans auth) → Plans actifs + discounts hardcodés `{ annual: 0.17, founder: 0.20, founderAnnual: 0.30 }`

#### ProfileController — subscription (`backend/app/controllers/profile_controller.ts`, L303-358)

- `GET /api/me/subscription` → Plan actuel + billing info + usage + grace period
- `storageUsedGb` = **hardcodé à 0** (TODO dans le code)

### 4.2 Ce qui manque ❌ (détail complet)

#### M1 : Champ `maxUsers` — N'EXISTE PAS

- **PRD L137 :** `max_users: number // 1 pour Starter/Solo/Pro, 3 pour Agence`
- **Modèle Plan :** Pas de champ `maxUsers`
- **Migration :** Pas de colonne `max_users`
- **Seeder :** Pas de valeur `maxUsers`
- **Validator :** Pas dans `updatePlanValidator`
- **Admin UI :** Pas de champ dans `AdminPlansPage`

#### M2 : Enforcement stockage — ZERO CODE

- **Champ DB :** `Plan.maxStorageGb` ✅ existe
- **Affiché :** Dans `PricingPage`, `AccountPage` (progress bar), `AdminPlansPage`
- **Tracking usage :** `storageUsedGb` hardcodé à 0 dans profile controller
- **Middleware/check :** ❌ AUCUN — un Starter peut upload 100 Go sans blocage
- **Besoin :** Service de tracking + check avant upload + soft limit UI

#### M3 : Enforcement historique — ZERO CODE

- **Champ DB :** `Plan.historyMonths` ✅ existe (null = illimité)
- **Affiché :** Dans `PricingPage`, `AdminPlansPage`
- **Job d'archivage :** ❌ N'existe pas
- **Query filter :** ❌ Pas d'exclusion des TX anciennes
- **Besoin :** Colonne `archived_at` sur transactions + job cron + query filter

#### M4 : Self-service plan change — PAS D'ENDPOINT

- **PRD §3.1-3.3 :** Upgrade instantané + downgrade avec validation
- **Endpoints existants :** AUCUN `POST /me/plan` ou similaire
- **Frontend :** Le bouton "Changer de forfait" redirige vers `/pricing` (page publique)
- **Besoin :** Endpoint upgrade/downgrade + validation TX actives + modal frontend

#### M5 : Downgrade blocking — PAS DE VALIDATION

- **PRD §3.3 L174-179 :** Bloqué si `active_transactions > new_plan.max_transactions`
- **Modal PRD :** "Presque ! Archivez X transactions d'abord" (calcul : 18-12 = 6)
- **Code :** ❌ RIEN — pas d'endpoint, pas de validation

#### M6 : Prix locké (grandfathering) — CHAMP INUTILISÉ

- **Champ DB :** `User.planLockedPrice` ✅ existe
- **PRD §3.4 L181-184 :** Changements prix admin = nouveaux abonnés seulement
- **Usage :** ❌ AUCUNE logique ne lit ce champ pour le billing
- **Action admin "Appliquer aux existants" :** ❌ N'existe pas

#### M7 : Perte fondateur si cancel — PAS DE LOGIQUE

- **PRD L109 :** Annulation = perte fondateur PERMANENTE
- **Code :** `User.isFounder` existe mais aucun code ne le met à `false` lors d'une annulation

#### M8 : Intégration paiement — ZERO

- Pas de Stripe, pas de webhook, pas de checkout, pas de facture
- Pas de session de paiement
- Pas de gestion de renouvellement

#### M9 : Compteur fondateur dynamique — HARDCODÉ

- Frontend : `"19/25 places restantes"` = string i18n hardcodé
- Backend : pas d'endpoint qui compte les fondateurs actifs
- Besoin : `GET /api/founders/count` ou inclure dans `/api/plans`

---

## 5. Audit frontend détaillé

### 5.1 PricingPage (`frontend/src/pages/PricingPage.tsx`, 360 lignes)

**Data flow :** `useQuery(['plans'], plansApi.list)` → `GET /api/plans` (staleTime 5min)

**Hardcoded metadata (PLAN_META, L11-30) :**
```typescript
starter: { tagline: { fr: 'Je fais ça à côté', en: 'Side hustle' } }
solo:    { tagline: { fr: 'Je lance ma pratique', en: 'Growing my practice' } }
pro:     { tagline: { fr: 'Pipeline chargé', en: 'Busy pipeline' }, popular: true }
agence:  { tagline: { fr: 'Mon équipe grandit', en: 'Team is growing' }, comingSoon: true }
```

**Plan card affiche :**
- Nom + tagline
- Prix mensuel ou annuel (calculé : `Math.round(plan.annualPrice / 12)`)
- Prix barré si annuel : `~~588$~~ 490$/an`
- maxTransactions (ou ∞)
- maxStorageGb (Go)
- historyMonths (ou ∞)
- "Moteur de conditions" + "Workflow guidé" (statique, tous plans)

**Agence :** border dashed + opacity-80 + bouton disabled "Bientôt disponible"
**Pro :** ring-2 ring-primary + scale-105 + badge "Populaire"

**Founder banner :** Amber gradient, HardHat icon, "19/25 places restantes" (hardcodé), CTA → `/register`

**Toggle billing :** Monthly ↔ Annual avec badge "-17%"

**FAQ :** 4 items via i18n (fondateur, annulation, sécurité, équipes)

**Trust badges :** "Garantie 30j remboursé · 100% Canada 🍁 · FR/EN · Sans contrat"

### 5.2 AccountPage — onglet Subscription (`frontend/src/pages/AccountPage.tsx`, L471-602)

**Data flow :** `useQuery(['subscription'], subscriptionApi.get)` (staleTime 2min)

**Affiche :**
- Plan name + billing cycle + subscription status
- Badge fondateur si `isFounder = true` (amber, HardHat)
- Progress bar TX : vert < 80%, ambre 80-100%, rouge > 100%
- Progress bar stockage : vert < 80%, ambre >= 80%
- Grace period warning : ambre si jours restants > 0, rouge si expiré
- Bouton "Changer de forfait" → `/pricing`

### 5.3 SoftLimitBanner (`frontend/src/components/SoftLimitBanner.tsx`, 68 lignes)

**Placement :** Global dans `Layout.tsx` L234, au-dessus du contenu principal

**Condition :** S'affiche si `sub.grace.active === true`

**Deux états :**
- **Grace active** (ambre) : "Vous avez X/Y TX. Il vous reste Z jour(s) pour mettre à niveau."
- **Grace expirée** (rouge) : "Limite de Y TX atteinte (X actives). Veuillez mettre à niveau."

**Boutons :** "Mettre à niveau" → `/pricing` + "Voir les transactions" → `/transactions` (desktop only)

### 5.4 AdminPlansPage (`frontend/src/pages/admin/AdminPlansPage.tsx`, 428 lignes)

**Data flow :** `useQuery(['admin', 'plans'], adminApi.getPlans)`

**Par plan card :**
- Nom + badge Actif/Inactif (toggle cliquable)
- Subscriber count + founder count
- Inputs éditables : mensuel ($), annuel ($), TX max, stockage (Go), historique (mois)
- Aperçu prix : fondateur (-20%), annuel (-17%), fondateur+annuel (-30%)
- Reason field (obligatoire, min 3 chars) + Save/Cancel
- Discounts hardcodés : `{ annual: 0.17, founder: 0.20, founderAnnual: 0.30 }`

**Change log :** Format `[Date] · [Admin] · [Plan] [champ]: [old] → [new] · "[reason]"`

**Mobile :** Read-only avec note "Édition complète sur Desktop"

**Warning footer :** "Les changements s'appliquent aux nouveaux abonnés uniquement."

### 5.5 API types

```typescript
// plans.api.ts
PublicPlan { id, name, slug, monthlyPrice, annualPrice, maxTransactions, maxStorageGb, historyMonths, displayOrder }
PlansDiscounts { annual: 0.17, founder: 0.20, founderAnnual: 0.30 }

// subscription.api.ts
SubscriptionData {
  plan: { id, name, slug, maxTransactions, maxStorageGb, historyMonths } | null
  billing: { cycle, isFounder, lockedPrice, subscriptionStatus, subscriptionStartedAt, subscriptionEndsAt }
  usage: { activeTransactions, maxTransactions, storageUsedGb, maxStorageGb }
  grace: { active, startedAt, daysRemaining }
}

// admin.api.ts
AdminPlan extends PublicPlan + { isActive, subscriberCount, founderCount, createdAt, updatedAt }
UpdatePlanRequest { monthlyPrice?, annualPrice?, maxTransactions?, maxStorageGb?, historyMonths?, isActive?, reason (required) }
```

### 5.6 Query keys

| Key | Composant | staleTime |
|-----|-----------|-----------|
| `['plans']` | PricingPage | 5 min |
| `['subscription']` | AccountPage, SoftLimitBanner | 2 min |
| `['admin', 'plans']` | AdminPlansPage | default |

---

## 6. Valeurs hardcodées (risques de drift)

| Valeur | Emplacements | Dynamique ? | Risque |
|--------|-------------|-------------|--------|
| Rabais annuel -17% | `PlansController`, `AdminPlansPage`, `PricingPage` | ❌ 3 endroits | Moyen — drift si modifié à un seul endroit |
| Rabais fondateur -20% | `PlansController`, `AdminPlansPage` | ❌ 2 endroits | Moyen |
| Rabais fondateur annuel -30% | `PlansController`, `AdminPlansPage` | ❌ 2 endroits | Moyen |
| Places fondateurs "19/25" | i18n `pricing.founder.spots` | ❌ String hardcodé | **Haut** — jamais mis à jour |
| Agence `comingSoon: true` | `PricingPage PLAN_META` | ❌ Hardcodé | Bas — change une fois |
| Pro `popular: true` | `PricingPage PLAN_META` | ❌ Hardcodé | Bas |
| Grace period 7 jours | `PlanLimitMiddleware` L66 | ❌ Hardcodé | Bas |
| Taglines par plan | `PricingPage PLAN_META` | ❌ Hardcodé | Bas |

---

## 7. Deltas PRD vs Implémentation

| Item PRD | Ref PRD | Spécifié | Implémenté | Delta | Sévérité |
|----------|---------|----------|------------|-------|----------|
| 4 plans avec prix | §2.1, L79-86 | ✅ | ✅ | OK | — |
| Personas par plan | §2.2, L90-95 | ✅ | ✅ | OK (hardcodé frontend) | — |
| Limites TX par plan | §2.1 | ✅ | ✅ | OK | — |
| Soft limit 7j + grace | §3.1, L158-166 | ✅ | ✅ | OK | — |
| Bannière soft limit | Écran 14, L974-978 | ✅ | ✅ | OK | — |
| Toggle mensuel/annuel | §3.6, L193-198 | ✅ | ✅ | OK | — |
| Admin edit plans + audit log | §G2, L740-806 | ✅ | ✅ | OK | — |
| Prix dynamiques depuis DB | §H1, L881 | ✅ | ✅ | OK | — |
| Agence grisé Phase 2 | L86, L769, L835 | ✅ | ✅ | OK (UI) | — |
| Flag fondateur | §2.3, L106 | ✅ | ✅ | OK (field) | — |
| Badge fondateur | L924 | ✅ | ✅ | OK (AccountPage) | — |
| Stockage enforcement | §2.1 | ✅ | ❌ | Champ existe, zero code | **CRITIQUE** |
| Historique enforcement | §2.1 | ✅ | ❌ | Champ existe, zero code | **CRITIQUE** |
| `max_users` sur Plan | L137 | ✅ | ❌ | Champ absent du modèle | **CRITIQUE** |
| Self-service upgrade | §3.2, L168-172 | ✅ | ❌ | Pas d'endpoint | **BLOQUANT** |
| Downgrade blocking | §3.3, L174-179 | ✅ | ❌ | Pas de validation | **BLOQUANT** |
| Modal downgrade "Presque !" | Écran 15, L998-1035 | ✅ | ❌ | Pas de modal | Important |
| Prix locké (grandfathering) | §3.4, L181-184 | ✅ | ⚠️ | Champ existe, aucune logique | Important |
| "Appliquer aux existants" | L779 | ✅ | ❌ | Pas d'action admin | Important |
| Perte fondateur si cancel | L109 | ✅ | ❌ | Aucune logique | Important |
| Compteur fondateur dynamique | L816-818 | ✅ | ❌ | Hardcodé "19/25" | Moyen |
| Garantie 30j remboursé | L837 | ✅ | ✅ | OK (texte UI) | — |
| Pas de free trial | L187-190 | ✅ | ✅ | OK | — |
| Stripe/paiement | §K2 | ✅ | ❌ | Zero intégration | **BLOQUANT** |
| Page abonnement (K2) | L916-968 | ✅ | ✅ | OK (usage bars, plan info) | — |

---

## 8. Architecture validée : Limites quantitatives pures

### ~~Option JSON `features`~~ — ANNULÉE (décision 2026-02-12)

Les callouts marketing ne nécessitent pas de gating technique. L'architecture reste simple : **4 champs quantitatifs sur le modèle Plan** suffisent.

### Champs de gating (existants + à ajouter)

```typescript
// backend/app/models/plan.ts
maxTransactions: number | null  // ✅ Existe + enforcé (soft limit 7j)
maxStorageGb: number            // ✅ Existe, ❌ pas enforcé
historyMonths: number | null    // ✅ Existe, ❌ pas enforcé
maxUsers: number                // ❌ A AJOUTER (1 pour Starter/Solo/Pro, 3 pour Agence)
```

### Enforcement à implémenter

| Limite | Middleware/Service | Route protégée | Comportement |
|--------|-------------------|----------------|-------------|
| `maxTransactions` | `PlanLimitMiddleware` | `POST /transactions` | ✅ Soft limit 7j + block |
| `maxStorageGb` | Check dans documents controller | `POST /documents` | Bloquer upload si quota dépassé |
| `historyMonths` | Job planifié (cron/command) | N/A | Archiver TX > N mois, exclure des queries |
| `maxUsers` | Check dans members controller | `POST /members` | Bloquer invite si `memberCount >= maxUsers` |

---

## 9. Règles de billing (PRD §3, non implémentées)

### Upgrade (PRD §3.2)
- Instantané, self-service, 3 clicks max
- Bouton apparait **là où la limite est atteinte** (bannière, pas settings)
- Coupon fondateur s'applique automatiquement au nouveau prix

### Downgrade (PRD §3.3)
- **BLOQUÉ** si `active_transactions > new_plan.max_transactions`
- Modal "Presque !" avec calcul (18 actives - 12 limite = 6 à archiver)
- Bouton "Voir mes transactions actives" filtre par ancienneté

### Prix locké (PRD §3.4)
- Changement prix admin = nouveaux abonnés seulement
- Existants conservent `plan_locked_price`
- Action manuelle "Appliquer aux existants" avec confirmation obligatoire

### Edge cases (PRD §8.2, L1136-1146)
- Fondateur 25/25 complet → Bannière "Complet. [Liste d'attente]"
- Soft limit + downgrade simultané → Grace s'applique, downgrade bloqué indépendamment
- Agent en grâce qui archive et repasse sous la limite → `grace_period_start` reset, bannière disparaît
- Changement prix admin pendant checkout Stripe → Prix locké au moment de création session Stripe

---

## 10. Priorités d'implémentation

### P0 — Bloquant lancement 🔴

1. **Self-service plan change** (upgrade/downgrade endpoint + validation)
2. **Downgrade blocking** (check TX actives vs nouvelle limite)
3. **Intégration paiement** (Stripe minimal : checkout + webhook)

### P1 — Critique 🟠

4. **Ajouter `maxUsers`** au modèle Plan + migration + seeder + validator + admin UI
5. **Enforcement stockage** (tracking usage + check upload + UI progress bar réelle)
6. **Prix locké enforcement** (logique billing utilisant `planLockedPrice`)

### P2 — Important 🟡

7. **Enforcement historique** (job archivage + query filter)
8. **Compteur fondateur dynamique** (endpoint + remplacer hardcodé)
9. **"Appliquer prix aux existants"** (action admin + confirmation)
10. **Perte fondateur si cancel** (logique dans endpoint cancel)
11. **Modal downgrade "Presque !"** (frontend)

### P3 — Nice to have 🟢

12. **Rabais dynamiques** (sortir du hardcodé, stocker en DB ou config)
13. **Grace period configurable** (sortir du hardcodé 7j)
14. **Agence `comingSoon` dynamique** (basé sur `isActive` du plan en DB)

---

## 11. Fichiers de référence

### Backend

| Fichier | Rôle | Statut |
|---------|------|--------|
| `backend/app/models/plan.ts` | Modèle Plan (46 lignes) | ✅ Complet, manque maxUsers |
| `backend/app/models/plan_change_log.ts` | Audit log des changements plans | ✅ Complet |
| `backend/app/models/user.ts` | Champs plan/subscription (L134-148) | ✅ Complet |
| `backend/app/middleware/plan_limit_middleware.ts` | Enforcement TX (87 lignes) | ✅ Complet |
| `backend/app/controllers/plans_controller.ts` | Endpoint public `/api/plans` | ✅ Complet |
| `backend/app/controllers/admin_plans_controller.ts` | Admin CRUD + audit | ✅ Complet |
| `backend/app/controllers/profile_controller.ts` | `GET /me/subscription` (L303-358) | ⚠️ storageUsedGb=0 |
| `backend/app/controllers/admin_controller.ts` | Subscription status update (L527-569) | ⚠️ Superadmin only |
| `backend/app/validators/plan_validator.ts` | Validation admin plan update | ✅ Manque maxUsers |
| `backend/database/seeders/plans_seeder.ts` | Seed 4 plans | ✅ Manque maxUsers |
| `backend/database/migrations/1773000000001_create_plans_table.ts` | Table plans | ✅ Manque max_users |
| `backend/database/migrations/1773000000002_add_plan_fields_to_users.ts` | User plan fields | ✅ Complet |
| `backend/database/migrations/1773000000003_create_plan_change_logs_table.ts` | Audit trail | ✅ Complet |
| `backend/start/routes.ts` | Routes (planLimit sur POST /transactions, L77) | ⚠️ Manque plan change routes |
| `backend/start/kernel.ts` | Middleware registry (planLimit enregistré) | ✅ Complet |

### Frontend

| Fichier | Rôle | Statut |
|---------|------|--------|
| `frontend/src/pages/PricingPage.tsx` | Page pricing publique (360 lignes) | ✅ Complet |
| `frontend/src/pages/AccountPage.tsx` | Onglet abonnement (L471-602) | ✅ Complet |
| `frontend/src/components/SoftLimitBanner.tsx` | Bannière grace period (68 lignes) | ✅ Complet |
| `frontend/src/pages/admin/AdminPlansPage.tsx` | Admin plans (428 lignes) | ✅ Manque maxUsers field |
| `frontend/src/pages/admin/AdminSubscribersPage.tsx` | Gestion abonnés | ✅ Complet |
| `frontend/src/api/plans.api.ts` | Types + API plans (25 lignes) | ✅ Complet |
| `frontend/src/api/subscription.api.ts` | Types + API subscription (38 lignes) | ✅ Complet |
| `frontend/src/api/admin.api.ts` | Types + API admin plans (271 lignes) | ✅ Complet |
| `frontend/src/components/Layout.tsx` | Inclut SoftLimitBanner (L234) | ✅ Complet |
| `frontend/src/i18n/locales/fr/common.json` | Traductions pricing/subscription/admin | ✅ Complet |
| `frontend/src/i18n/locales/en/common.json` | Traductions EN | ✅ Complet |

### Documentation

| Fichier | Rôle | Statut |
|---------|------|--------|
| `_bmad-output/planning-artifacts/prd.md` | Source de vérité produit | ✅ Référence |
| `docs/pricing-strategy.md` | Ancien doc pricing | **SUPPRIMÉ** (2026-02-12) |
| `_bmad-output/audit-plans-features-gating.md` | Ce document | ✅ Référence |

---

## 12. Changelog de cette session

| Action | Détail |
|--------|--------|
| **Supprimé** | `docs/pricing-strategy.md` (marqué PÉRIMÉ, remplacé par PRD §2) |
| **Créé** | `_bmad-output/audit-plans-features-gating.md` (ce document) |
| **Décision** | Callouts marketing = pas de gate technique |
| **Décision** | Gating = limites quantitatives only (TX, stockage, historique, maxUsers) |
| **Décision** | Pas besoin de champ JSON `features` sur Plan |
| **Identifié** | 9 manques critiques (M1-M9, section 4.2) |
| **Identifié** | 8 valeurs hardcodées à risque de drift (section 6) |
| **Priorisé** | 14 items d'implémentation en 4 niveaux (P0-P3, section 10) |
