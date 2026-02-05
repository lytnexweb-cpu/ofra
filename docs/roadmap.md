# Roadmap Ofra - SaaS Premium

> Plan d'exécution pour le lancement SaaS Premium d'Ofra
> Dernière mise à jour: 2026-02-04
> Version: 2.3 (Post-Audit Technique)

---

## Vision Produit

**Ofra** est un Transaction Manager Premium pour agents immobiliers canadiens.

### Ce qu'Ofra EST
- Transaction Manager intelligent avec Conditions Engine
- Suggestions automatiques basées sur le contexte (Rural/Condo/Financé)
- 3 niveaux de conditions (Blocking/Required/Recommended)
- 100% Canadien, bilingue FR/EN natif
- Focus NB first, puis expansion

### Ce qu'Ofra N'EST PAS
- Un CRM de prospection (on gère post-signature)
- Un ERP complexe (on reste simple et focalisé)
- Un outil US adapté au Canada (on est Canadian-built)

---

## État Actuel (Post-Audit 2026-02-04)

```
COMPLÉTÉ ✓
├── Epic 1: Workflow Engine ✓
├── Epic 2: Frontend Core ✓
├── Epic 3: Automations + Multi-tenant + Auth ✓
├── Epic 4 (partiel): CSV Import API ✓
├── Pack Rural NB v1.0 ✓ (conditions définies)
├── D40: Onboarding 5 étapes ✓ (NON COMMITÉ)
├── D41: Garde-fous + Escape tracking ✓ (NON COMMITÉ)
├── D38: Edit Deadline/Note ✓ (NON COMMITÉ)
├── D27: Conditions Engine Premium ✓ (NON COMMITÉ)
└── 356 tests (94 backend + 262 frontend)

⚠️ ALERTE: 122 fichiers non commités = 2 semaines de travail à risque
```

---

## 🚨 Priorités Immédiates (Post-Audit)

### P0 - COMPLÉTÉ ✅ (2026-02-04)

| Tâche | Responsable | Statut |
|-------|-------------|--------|
| Fixer doublon migration 1772000000006 | Dev | ✅ |
| Commit migrations (9 fichiers) | Dev | ✅ |
| Commit models & services | Dev | ✅ |
| Commit controllers & routes | Dev | ✅ |
| Commit frontend components | Dev | ✅ |
| Commit docs & roadmap | Dev | ✅ |
| Push to remote | Dev | ✅ |

### P1 - COMPLÉTÉ ✅ (2026-02-04)

| Tâche | Responsable | Statut |
|-------|-------------|--------|
| Transaction Profile UI | Amelia | ✅ (déjà implémenté) |
| Tests Notes Controller (12 tests) | Murat | ✅ |
| Tests Offers Controller (25 tests) | Murat | ✅ |
| Tenant scoping ReminderService | Winston | ✅ |
| Optimiser N+1 queries + pagination | Winston | ✅ |

### P2 - EN COURS (Sprint Actuel)

| Tâche | Responsable | Epic | Statut |
|-------|-------------|------|--------|
| Timeline UI (D32) | Sally + Amelia | Epic 9 | ✅ COMPLÉTÉ |
| Tests E2E Playwright | Murat | Quality Gates | ⏳ À FAIRE |
| Exception Handler amélioré | Winston | Observabilité | ⏳ À FAIRE |
| Filtre par niveau conditions | Amelia | Epic 8 | ⏳ À FAIRE |
| Evidence/Documents sur conditions | Dev | Epic 5+8 | ⏳ À FAIRE |

---

## Scores Audit Technique

| Domaine | Score | Responsable |
|---------|-------|-------------|
| Architecture Backend | 7/10 | Winston |
| Frontend UX | 8.2/10 | Sally |
| Couverture Tests | 63% | Murat |
| Versioning | 🔴 CRITIQUE | - |

> Rapport complet: `_bmad-output/audit-2026-02-04.md`

---

## Decision Queue

Décisions requises pour débloquer le développement:

| ID | Décision | Statut | Bloque | Document |
|----|----------|--------|--------|----------|
| D1 | Transaction Profile v1 (8 champs) | ✅ VALIDÉ | Epic 8 | `decisions/D1-transaction-profile-v1.md` |
| D2 | Pack Condo NB v1.0 | ✅ VALIDÉ | Epic 8 | `decisions/D2-pack-condo-nb-v1.0.md` |
| D3 | Pack Financé NB v1.0 | ✅ VALIDÉ | Epic 8 | `decisions/D3-pack-finance-nb-v1.0.md` |
| D4 | Archivage conditions dans Timeline | ✅ VALIDÉ | Epic 9 | `decisions/D4-archivage-timeline.md` |
| D5 | CSV scope v1 | ⏳ En attente | Epic 5 | - |
| D6 | Pricing page (corriger plans) | 🔴 URGENT | Epic 6 | `pricing-strategy.md` |
| D27 | Conditions Engine Premium | ✅ IMPLÉMENTÉ | Epic 8 | NON COMMITÉ |
| D32 | Timeline interactive | ✅ SPÉCIFIÉ | Epic 9 | `_bmad-output/decisions/D32-timeline-interactive.md` |
| D34/D35 | Nettoyage onglets | ⏳ À implémenter | UX | - |
| D36 | Archivage automatique | ⏳ À implémenter | Epic 9 | - |
| D38 | Edit Deadline/Note conditions | ✅ IMPLÉMENTÉ | Epic 8 | NON COMMITÉ |
| D40 | Onboarding personnalisé | ✅ IMPLÉMENTÉ | Onboarding | NON COMMITÉ |
| D41 | Garde-fous validation avec preuves | ✅ IMPLÉMENTÉ | Epic 8 | NON COMMITÉ |

### ✅ Blocage Résolu (2026-02-04)

**Transaction Profile UI** — ~~Manquante~~ **DÉJÀ IMPLÉMENTÉE** dans `CreateTransactionModal.tsx` (lignes 342-628).
- Property Type, Property Context, Is Financed
- Champs ruraux conditionnels (puits, fosse septique, accès)
- Chargement automatique du Pack Rural NB (D39)

---

## Phases de Développement

### Vue d'ensemble

```
TRACK A: CŒUR PREMIUM
├── Epic 8: Conditions Engine Premium ──► Epic 9: Timeline & Command Center
│
TRACK B: INFRASTRUCTURE SAAS (en parallèle)
├── Epic 5: Documents/Uploads ──► Epic 6: Landing ──► Epic 7: Stripe
│
└──────────────────────► LAUNCH FONDATEURS
```

**Stratégie:** Tracks A et B avancent en parallèle. Epic 5 (Documents) supporte "Evidence sur conditions" du Premium.

---

## Launch Minimum (Must Have)

Ce qui DOIT être terminé avant le lancement Fondateurs:

| Feature | Epic | Statut |
|---------|------|--------|
| Transaction Profile v1 | Epic 8 | ✅ Décidé |
| Pack Rural NB v1.0 | Epic 8 | ✅ Gravé |
| 3 niveaux conditions | Epic 8 | ⏳ À implémenter |
| Evidence/Documents sur conditions | Epic 5 | ⏳ À implémenter |
| Timeline unifiée (basique) | Epic 9 | ⏳ À implémenter |
| Stripe Minimal Viable Billing | Epic 7 | ⏳ À implémenter |
| Landing Page | Epic 6 | ⏳ À implémenter |

### Post-Launch (Nice to Have)

- Pack Condo NB
- Pack Financé NB
- Command Center avancé
- Automations email
- Rapports poussés

---

## Epic 8: Conditions Engine Premium

### Objectif
Transformer le système de conditions basique en un moteur intelligent qui suggère automatiquement les bonnes conditions selon le contexte de la transaction.

### Décisions validées
- **D1: Transaction Profile v1** - 6 champs (validé 2026-01-31)
- **Pack Rural NB v1.0** - 40+ conditions templates (gravé 2026-01-31)

### État d'implémentation (2026-02-01)

| Phase | Description | Statut |
|-------|-------------|--------|
| Phase 1 | Data Model (5 migrations) | ✅ COMPLÉTÉ |
| Phase 2 | Backend Integration | ✅ COMPLÉTÉ |
| Phase 3 | API Endpoints (15 nouveaux) | ✅ COMPLÉTÉ |
| Phase 4A | Frontend Resolution Modal | ✅ COMPLÉTÉ |
| Phase 4B | Level Selector (3 boutons) | ✅ COMPLÉTÉ |
| Phase 4C | Intelligent Create Modal | ✅ COMPLÉTÉ |
| Phase 4D | Timeline par étape | 📋 À FAIRE |

### Bugs fixés (Session 2026-02-01)
- ✅ 500 errors sur `/advance` et `/skip` (legacy conditions NULL handling)
- ✅ React Query undefined warnings (404 graceful handling)
- ✅ "Étape ?" affichage (currentStepOrder propagation)

### Blocage actuel
- ✅ ~~Transaction Profile UI manquante~~ — **RÉSOLU** (déjà dans CreateTransactionModal)

### Prochaines étapes
1. ✅ ~~UI création de profil~~ — Déjà implémenté
2. **Tester flow complet** — Profil → Suggestions → Créer condition
3. **Phase 4D** — Timeline par étape (D32)

### User Stories

#### 8.1 Transaction Profile

**En tant qu'** agent immobilier
**Je veux** définir le profil de ma transaction (type, contexte, financement)
**Afin que** le système me suggère automatiquement les bonnes conditions

**Critères d'acceptation:**
- [x] 3 champs obligatoires à la création (property_type, property_context, is_financed)
- [x] 3 champs conditionnels si rural (has_well, has_septic, access_type)
- [x] Progressive disclosure (champs ruraux cachés si urbain/condo) — **Implémenté**
- [x] Sauvegarde dans transaction_profile
- [ ] Tests E2E pour chaque combinaison

**Modèle de données:**
```typescript
interface TransactionProfile {
  property_type: 'house' | 'condo' | 'land'
  property_context: 'urban' | 'suburban' | 'rural'
  is_financed: boolean
  has_well?: boolean
  has_septic?: boolean
  access_type?: 'public' | 'private' | 'right_of_way'
}
```

#### 8.2 Conditions Templates avec applies_when

**En tant qu'** agent immobilier
**Je veux** que les conditions appropriées soient suggérées automatiquement
**Afin de** ne rien oublier selon mon type de transaction

**Critères d'acceptation:**
- [x] Table condition_templates avec applies_when JSON
- [x] Logique de matching profile → templates
- [x] Pack Rural NB v1.0 chargé en seed (46 templates)
- [x] API GET /applicable-templates retourne les conditions applicables

**Modèle de données:**
```typescript
interface ConditionTemplate {
  id: string
  label_fr: string
  label_en: string
  level: 'blocking' | 'required' | 'recommended'
  applicable_steps: number[]
  applies_when: Record<string, any>  // JSON rules
  default_responsible: string
  source_type: 'legal' | 'government' | 'industry' | 'best_practice'
  category: string
  order: number
}
```

#### 8.3 Trois niveaux de conditions

**En tant qu'** agent immobilier
**Je veux** voir clairement quelles conditions sont critiques vs recommandées
**Afin de** prioriser mon travail

**Critères d'acceptation:**
- [x] Niveau Blocking - Empêche l'avancement (rouge)
- [x] Niveau Required - Apparaît en "Risque" si non fait (orange)
- [x] Niveau Recommended - Suggestion/best practice (gris)
- [x] Affichage visuel distinct pour chaque niveau
- [ ] Filtre par niveau dans l'onglet Conditions

#### 8.4 Evidence sur conditions

**En tant qu'** agent immobilier
**Je veux** attacher des preuves (documents, notes) à mes conditions
**Afin de** centraliser toute l'information

**Critères d'acceptation:**
- [ ] Champ document_ids[] sur transaction_conditions
- [ ] Lien vers documents uploadés (Epic 5)
- [ ] Champ notes sur condition
- [ ] Affichage des preuves dans ConditionCard

### Quality Gates (Epic 8)
- [ ] Tests E2E: 100% coverage sur les règles applies_when
- [ ] Tests unitaires: chaque niveau de condition
- [ ] Tests: Pack Rural NB complet
- [ ] Performance: < 500ms pour charger les suggestions

### Dépendances
- D1 Transaction Profile v1 ✅
- D2 Pack Condo NB (pour extension)
- D3 Pack Financé NB (pour extension)

---

## Epic 9: Timeline & Command Center

### Objectif
Unifier l'expérience utilisateur avec une timeline claire et un Command Center qui montre les actions prioritaires.

### User Stories

#### 9.1 Timeline Unifiée

**En tant qu'** agent immobilier
**Je veux** voir une seule timeline claire de ma transaction
**Afin de** comprendre l'historique et l'état actuel en un coup d'œil

**Critères d'acceptation:**
- [ ] Fusion des 2 timelines existantes
- [ ] Affichage des 8 étapes du workflow NB
- [ ] Conditions archivées sous chaque étape (verrouillées)
- [ ] Historique des activités intégré
- [ ] Deadlines visuelles

#### 9.2 Command Center Light

**En tant qu'** agent immobilier
**Je veux** voir mes actions prioritaires en 2 secondes
**Afin de** savoir immédiatement quoi faire

**Critères d'acceptation:**
- [ ] Section "Next Actions" (3 actions prioritaires)
- [ ] Section "Waiting On" (client/vendeur/avocat/banque)
- [ ] Indicateur de risques visibles
- [ ] Intégration dans le dashboard transaction

### Quality Gates (Epic 9)
- [ ] Performance: Timeline < 1s avec 100+ activités
- [ ] Tests E2E: navigation timeline complète
- [ ] Accessibilité: WCAG 2.1 AA

### Dépendances
- Epic 8 (Conditions Engine)
- D4 Archivage conditions dans Timeline

---

## Epic 5: UI Import CSV + Uploads Documents

### Objectif
Compléter l'expérience utilisateur avec l'interface d'import et la gestion de documents par transaction.

> Note: Les documents supportent "Evidence sur conditions" (Epic 8.4)

### User Stories

#### 5.1 UI Import CSV Clients ✅ COMPLÉTÉ (2026-02-04)

**En tant qu'** agent immobilier
**Je veux** importer mes clients existants via CSV
**Afin de** migrer rapidement depuis mon ancien système

**Critères d'acceptation:**
- [x] Bouton "Importer des clients" dans la liste clients
- [x] Modal avec zone drag & drop
- [x] Lien télécharger template CSV
- [x] Spinner pendant l'upload
- [x] Résumé: "X clients importés, Y ignorés"
- [x] Liste des erreurs avec numéro de ligne
- [ ] Tests E2E pour le flow complet

#### 5.2 Upload Documents par Transaction

**En tant qu'** agent immobilier
**Je veux** attacher des documents à mes transactions
**Afin de** centraliser toute l'information au même endroit

**Critères d'acceptation:**
- [ ] Section "Documents" dans la vue transaction
- [ ] Upload drag & drop ou click
- [ ] Types acceptés: PDF, JPG, PNG, HEIC, DOC, DOCX
- [ ] Validation taille selon tier (5/15/25 MB)
- [ ] Affichage quota utilisé / disponible
- [ ] Preview PDF et images dans modal
- [ ] Téléchargement fichier
- [ ] Suppression fichier
- [ ] Lien document → condition (Evidence)

**Backend:**
- [ ] Model Document
- [ ] Service StorageService (S3)
- [ ] Endpoints CRUD documents
- [ ] Validation quota par tier

### Dépendances
- AWS S3 bucket configuré
- D5 CSV scope v1

---

## Epic 6: Landing Page

### Objectif
Créer une page marketing pour présenter Ofra Premium et recruter les Fondateurs.

### User Stories

#### 6.1 Landing Page Marketing

**Sections:**
- [ ] Hero: Titre accrocheur + CTA Programme Fondateur
- [ ] Problème: Pain points des agents (oublis coûteux)
- [ ] Solution: Conditions Engine intelligent, Packs NB
- [ ] Pricing: Essentiel $29 / Pro $49 / Agence $99 (CAD)
- [ ] Programme Fondateur: 25 places, 3 mois gratuits
- [ ] FAQ: Questions fréquentes
- [ ] Footer: Contact, légal, Moncton NB

#### 6.2 Correction Pricing Page

**URGENT (D6):** La page pricing actuelle affiche les MAUVAIS plans.

**Corriger:**
- Starter (Free) → **Essentiel ($29 CAD/mois)**
- Pro ($49) → **Pro ($49 CAD/mois)** ✅
- Enterprise (Custom) → **Agence ($99 CAD/mois)**

Référence: `docs/pricing-strategy.md`

### Dépendances
- D6 Pricing corrigé
- Screenshots app Premium
- Textes FR/EN finalisés

---

## Epic 7: Stripe Billing

### Objectif
Implémenter le système de paiement minimal viable pour le lancement Fondateurs.

### Minimal Viable Billing (Launch)

| Feature | Priorité | Notes |
|---------|----------|-------|
| Créer compte Stripe | 🔴 Critique | Mode test d'abord |
| 3 Products (29/49/99 CAD) | 🔴 Critique | |
| Checkout Session | 🔴 Critique | Redirect vers Stripe |
| Webhook subscription.created | 🔴 Critique | Activer accès |
| Trial 90 jours Fondateurs | 🔴 Critique | |
| Coupon -25% forever | 🟡 Important | Après trial |

### Post-Launch
- Portal client Stripe
- Proration upgrades/downgrades
- Gestion des échecs de paiement
- Grace period

### Dépendances
- Compte Stripe vérifié
- Compte bancaire canadien

---

## Timeline Globale

```
SPRINT 1-2: FONDATIONS PREMIUM
├── Track A: Epic 8 (Transaction Profile + Templates + 3 niveaux)
├── Track B: Epic 5 (Documents/Uploads)
└── Décisions: D2 (Condo), D3 (Financé)

SPRINT 3-4: UX & INFRA
├── Track A: Epic 8 suite (Evidence) + Epic 9 (Timeline)
├── Track B: Epic 6 (Landing) + D6 (Pricing corrigé)
└── Décision: D4 (Archivage Timeline)

SPRINT 5: BILLING & POLISH
├── Epic 7 (Stripe Minimal)
├── Tests E2E complets
└── Quality Gates validation

SPRINT 6: LAUNCH FONDATEURS
├── Ouvrir inscriptions (25 places)
├── Onboarder premiers Fondateurs
└── Collecter feedback
```

---

## Checklist Pré-Launch

### Infrastructure
- [ ] Hébergement production (AWS ca-central-1)
- [ ] Base de données production
- [ ] Redis production
- [ ] S3 bucket documents
- [ ] Domaine ofra.ca
- [ ] SSL certificat
- [ ] Monitoring (Sentry)
- [ ] Backups automatiques

### Configuration
- [ ] Variables d'environnement production
- [ ] Stripe mode live
- [ ] Email transactionnel (Resend)
- [ ] DNS configuré

### Légal
- [ ] Conditions d'utilisation ✅
- [ ] Politique de confidentialité ✅
- [ ] Mentions légales ✅
- [ ] Disclaimer suppression transaction (D17)

### Marketing
- [ ] Screenshots app Premium
- [ ] Textes FR et EN
- [ ] Logo haute résolution
- [ ] Open Graph image

### Quality Gates
- [ ] Tests E2E: 100% pass
- [ ] Audit sécurité
- [ ] WCAG 2.1 AA validation
- [ ] Performance < 3s toutes pages

---

## Métriques de Succès

### Launch Fondateurs (Mois 1-3)
- [ ] 25 Fondateurs inscrits
- [ ] 0 bug critique
- [ ] NPS > 7
- [ ] 80% utilisent Transaction Profile
- [ ] 60% utilisent les suggestions de conditions

### Post-Launch (Mois 4-6)
- [ ] 50% conversion Fondateurs → Payants
- [ ] 10 clients payants organiques
- [ ] MRR > 500$ CAD
- [ ] Churn < 10%

### Croissance (Mois 7-12)
- [ ] 100 clients payants
- [ ] MRR > 4 000$ CAD
- [ ] Churn < 5%/mois
- [ ] Expansion NS/PEI planifiée

---

## Historique des versions

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 2026-01-29 | Roadmap MVP initiale |
| 2.0 | 2026-01-31 | Pivot Premium: Epic 8-9, Decision Queue, Launch Minimum |
| 2.1 | 2026-02-01 | Epic 8 Phases 1-4C complétées, bugs legacy conditions fixés |
| 2.2 | 2026-02-03 | D40 Onboarding + D41 Garde-fous implémentés |
| 2.3 | 2026-02-04 | Audit technique complet, réorganisation priorités, plan de commits |

---

## Session Log

### 2026-02-01 (Session nocturne)

**Participants:** Sam + Équipe BMAD (Party Mode)

**Accompli:**
- Diagnostic et fix des erreurs 500 sur `/advance` et `/skip`
- Root cause: conditions legacy avec `stepWhenCreated = NULL` et `archived = NULL`
- Fix: queries avec fallback NULL dans `conditions_engine_service.ts`
- Fix: React Query undefined warnings dans `CreateConditionModal.tsx`

**Fichiers modifiés (non commités):**
- `backend/app/services/conditions_engine_service.ts`
- `frontend/src/components/CreateConditionModal.tsx`

**Blocage identifié:**
- Pas d'UI pour créer Transaction Profile → utilisateurs bloqués sur suggestions

**À faire demain:**
1. Décider: curl workaround VS UI de profil
2. Implémenter l'UI de profil (recommandé pour prod)
3. Tester flow complet avec profil
4. Continuer Phase 4D (Timeline par étape)

---

### 2026-02-03 (Session matinale)

**Participants:** Sam + Équipe BMAD (Party Mode)

**Accompli:**

**D41 - Garde-fous validation avec preuves:**
- Friction graduée: blocking > required > recommended
- Conditions blocking/required verrouillées après completion (Lock icon)
- Escape tracking avec raison obligatoire (10 chars min)
- Confirmation phrase pour bypass
- Migration: `1772000000007_add_escape_tracking_to_conditions.ts`
- Modals: ConditionValidationModal, EscapeConfirmationModal
- Traductions FR/EN complètes

**D40 - Onboarding personnalisé:**
- Wizard 5 étapes: Langue → Pratique → Contextes → Volume → Préférences
- Choix langue FR/EN en première question (changement instantané)
- Langue persistée sur le compte utilisateur
- Chargement automatique langue au login
- Migration: `1772000000008_add_onboarding_profile_to_users.ts`
- Redirect automatique vers /onboarding si non complété
- Logo Ofra correct dans l'onboarding
- Layout responsive: boutons dans content (desktop) / footer sticky (mobile)

**Fichiers créés/modifiés:**
- Backend: profile_controller, profile_validator, auth_controller, user model
- Frontend: OnboardingPage, router.tsx (ProtectedRoute avec langue)
- Traductions: common.json FR/EN (onboarding.steps.language)

**À faire:**
- D32: Timeline interactive (en cours)
- Corriger traductions si nécessaire
- Tests E2E pour onboarding flow

---

---

### 2026-02-04 (Audit Technique + Exécution P0/P1)

**Participants:** Sam + Équipe BMAD complète (Party Mode)

#### Phase 1: Audit (matin)

**Audit réalisé par:**
- 🏗️ Winston (Architecte) - Backend: 7/10
- 🎨 Sally (UX Designer) - Frontend: 8.2/10
- 🧪 Murat (Test Architect) - Couverture: 63%
- 📊 Mary (Analyst) - Git: CRITIQUE

**Constats majeurs:**
1. **122 fichiers non commités** = 2 semaines de travail à risque
2. **Doublon migration** 1772000000006 (cancellation + deadline)
3. **N+1 queries** dans TransactionsController.index()
4. **ReminderService** sans tenant scoping (GDPR)
5. **Notes/Offers** à 0% de couverture tests

#### Phase 2: Exécution P0/P1 (après-midi)

**P0 - Commits urgents:** ✅ COMPLÉTÉ
- Fix doublon migration → renommé en `1772000000009`
- 8 commits créés et poussés vers `feat/d38-edit-condition-deadline-note`
- 122 fichiers sécurisés sur remote

**P1 - Tests & Optimisations:** ✅ COMPLÉTÉ
- 🧪 Murat: Notes Controller tests (12 tests)
- 🧪 Murat: Offers Controller tests (25 tests)
- 🏗️ Winston: Fix N+1 queries + pagination dans TransactionsController
- 🏗️ Winston: Optimisation ReminderService (tenant scoping)
- Découverte: Transaction Profile UI déjà implémenté dans CreateTransactionModal!

#### Phase 3: Planification D32 (soir)

**Débat d'équipe sur placement WorkflowTimeline:**

| Agent | Vote | Argument |
|-------|------|----------|
| Mary | Option 3 | GPS toujours visible |
| Sally | Option 3 | Hybride desktop/mobile |
| Winston | Option 1 | Pragmatique, réutilise l'existant |
| John | Option 1 | Activity log = secondaire |
| Barry | Option 1 | Ship fast |
| Murat | Option 1 | Avec accès historique |

**Consensus:** Option 1 - Remplacer contenu onglet Timeline par WorkflowTimeline, garder accès historique via bouton.

**Composants existants découverts:**
- `StepProgressBar.tsx` - Barre horizontale (desktop)
- `StepperBottomSheet.tsx` - Liste verticale (mobile) - 70% de D32!
- `TimelineTab.tsx` - Activity log (à conserver en secondaire)

**Décision Sam:** Option 1 validée.

#### Phase 4: Implémentation D32 (soir - suite)

**Nomenclature:**
- Onglet "Timeline" → "Étapes" (FR) / "Steps" (EN)
- Tab key: `steps`

**Fichiers créés:**
- `frontend/src/components/transaction/WorkflowTimeline.tsx` (200 lignes)
- `frontend/src/components/transaction/__tests__/WorkflowTimeline.test.tsx` (10 tests)

**Fichiers modifiés:**
- `frontend/src/pages/TransactionDetailPage.tsx` - tab timeline→steps
- `frontend/src/components/transaction/TransactionBottomNav.tsx` - tab config
- `frontend/src/components/transaction/index.ts` - export
- `frontend/src/i18n/locales/fr/common.json` - tabs.steps
- `frontend/src/i18n/locales/en/common.json` - tabs.steps
- `_bmad-output/decisions/D32-timeline-interactive.md` - statut COMPLÉTÉ

**Features:**
- 8 étapes verticales avec statuts visuels (vert/orange/gris)
- Conditions affichées sous l'étape courante (expanded par défaut)
- Étapes passées: conditions readonly + icône cadenas
- Bouton "Voir l'historique complet" → drawer avec TimelineTab
- Aucun bouton retour arrière

**Documents produits:**
- `_bmad-output/audit-2026-02-04.md` - Rapport complet

---

**Document validé par:** Sam (Product Owner) + Équipe BMAD
**Prochaine révision:** Après implémentation D32
