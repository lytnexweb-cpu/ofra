# OFRA — Epic 1 Validation Report

**Projet** : OFRA — Transaction Management System pour agents immobiliers canadiens
**Epic** : Epic 1 — Workflow Engine + Infrastructure
**Date de validation** : 26 janvier 2026
**Validé par** : Équipe BMAD (réunion de revue) + Sam (Product Owner)
**Statut** : ✅ VALIDÉ — Prêt pour Epic 2

---

## 1. Contexte

Conformément à la roadmap définie dans `ofra-v2-decisions.md` (section 6), l'Epic 1 consistait à reconstruire le module transactionnel d'OFRA en une architecture 3 couches (Template → Instance → Activity) avec les fondations infrastructure nécessaires.

La validation a été effectuée lors de la réunion de revue prévue dans la roadmap :
> "VALIDATION : Réunion de revue avant Épique 2"

---

## 2. Vérification par section

### 2.1 Template Layer — PASS ✓

| Modèle | Fichier | Champs clés | Relations |
|--------|---------|-------------|-----------|
| WorkflowTemplate | `backend/app/models/workflow_template.ts` | provinceCode, name, slug, transactionType, isDefault, isActive | hasMany WorkflowStep |
| WorkflowStep | `backend/app/models/workflow_step.ts` | templateId, stepOrder, name, slug, typicalDurationDays | belongsTo Template, hasMany Condition/Automation |
| WorkflowStepCondition | `backend/app/models/workflow_step_condition.ts` | stepId, title, conditionType, priority, isBlockingDefault, dueDateOffsetDays | belongsTo Step |
| WorkflowStepAutomation | `backend/app/models/workflow_step_automation.ts` | stepId, trigger, actionType, delayDays, config (JSONB) | belongsTo Step |

### 2.2 Instance Layer — PASS ✓

| Modèle | Fichier | Changements critiques |
|--------|---------|----------------------|
| Transaction | `backend/app/models/transaction.ts` | ❌ `status` SUPPRIMÉ, ✅ `workflowTemplateId`, `currentStepId`, `organizationId` ajoutés |
| TransactionStep | `backend/app/models/transaction_step.ts` | NOUVEAU — status (pending/active/completed/skipped), enteredAt, completedAt |
| Condition | `backend/app/models/condition.ts` | ❌ `stage` SUPPRIMÉ, ✅ `transactionStepId` ajouté |
| ActivityFeed | `backend/app/models/activity_feed.ts` | NOUVEAU — 12 types d'activités, metadata JSONB |

### 2.3 Infrastructure — PASS ✓

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Redis | `docker-compose.yml` (redis:7-alpine) + `backend/config/redis.ts` | ✅ Installé, prefix `ofra:` |
| Sentry backend | `backend/config/sentry.ts` | ✅ Configuré via SENTRY_DSN |
| Sentry frontend | `frontend/src/lib/sentry.ts` | ✅ Configuré via VITE_SENTRY_DSN |
| i18n | `frontend/src/i18n/index.ts` + locales EN/FR | ✅ Installé, détection langue, clés EN/FR |
| Organizations | `backend/app/models/organization.ts` + migrations | ✅ Multi-tenancy léger en place |

### 2.4 Services — PASS ✓

**WorkflowEngineService** (`backend/app/services/workflow_engine_service.ts`) :
- `createTransactionFromTemplate()` — Crée transaction + instancie toutes les étapes + active la première + crée conditions
- `advanceStep()` — Vérifie blocking conditions → complète step → active suivant → crée conditions → log activités
- `skipStep()` — Skip sans vérification de blocage
- `goToStep()` — Navigation vers une étape spécifique
- `checkBlockingConditions()` — Retourne conditions bloquantes pending
- `getCurrentStatus()` — Retourne progression (totalSteps, completedSteps, %, currentStepName)

**ActivityFeedService** (`backend/app/services/activity_feed_service.ts`) :
- `log()` — Crée entrée activité
- `getForTransaction()` — Feed paginé par transaction

### 2.5 Controllers + Routes — PASS ✓

| Endpoint | Méthode | Controller |
|----------|---------|------------|
| `/api/workflow-templates` | GET, POST | WorkflowTemplatesController |
| `/api/workflow-templates/:id` | GET, PUT, DELETE | WorkflowTemplatesController |
| `/api/transactions` | GET, POST | TransactionsController |
| `/api/transactions/:id` | GET, PUT, DELETE | TransactionsController |
| `/api/transactions/:id/advance` | PATCH | TransactionsController.advanceStep |
| `/api/transactions/:id/skip` | PATCH | TransactionsController.skipStep |
| `/api/transactions/:id/goto/:stepOrder` | PATCH | TransactionsController.goToStep |
| `/api/transactions/:id/activity` | GET | TransactionsController.activity |
| `/api/transactions/:id/conditions` | POST | ConditionsController |
| `/api/conditions/:id` | PUT, DELETE | ConditionsController |
| `/api/conditions/:id/complete` | PATCH | ConditionsController |

### 2.6 Seed Data NB — PASS ✓

2 templates créés : **NB Purchase** + **NB Sale**, chacun avec 8 étapes :

| # | Étape | Slug | Durée |
|---|-------|------|-------|
| 1 | Buyer/Seller Consultation | consultation | — |
| 2 | Offer Submitted | offer-submitted | 3j |
| 3 | Offer Accepted | offer-accepted | 1j |
| 4 | Conditional Period | conditional-period | 14j |
| 5 | Firm Pending | firm-pending | 7j |
| 6 | Pre-Closing Tasks | pre-closing | 14j |
| 7 | Closing Day / Key Delivery | closing-day | 1j |
| 8 | Post-Closing Follow-Up | post-closing | 30j |

**Conditions par défaut (Step 4)** : Financing (14j, blocking), Deposit (3j, blocking), Inspection (10j, blocking), Water Test (10j, blocking), RPDS Review (7j, blocking)

**Automations** : Email offer-accepted, Email+FINTRAC firm-pending, Celebration closing-day, Google review post-closing (7j delay)

### 2.7 Ancien code supprimé — PASS ✓

10/10 fichiers legacy confirmés supprimés :
- `transaction_status_history.ts`, `transaction_template.ts`, `template_condition.ts`, `reminder_log.ts`
- `transaction_state_machine.ts`, `template_service.ts`, `reminder_service.ts`, `transaction_automation_service.ts`
- `templates_controller.ts`, `templates.api.ts`

3 commandes orphelines supprimées en nettoyage : `backfill_status_histories.ts`, `send_reminders.ts`, `backfill_condition_stages.ts`

### 2.8 Frontend API — PASS ✓

| Fichier | Méthodes/Types |
|---------|----------------|
| `transactions.api.ts` | advanceStep, skipStep, goToStep, getActivity + types Transaction, TransactionStep |
| `workflow-templates.api.ts` | list, get, create, update, delete + types complets |
| `conditions.api.ts` | create, update, complete, delete — `transactionStepId` (pas de `stage`) |

---

## 3. Tests

| Suite | Tests | Résultat |
|-------|-------|----------|
| Unit — WorkflowEngineService | 12 | ✅ 12/12 |
| Functional — Activity Feed | 4 | ✅ 4/4 |
| Functional — Auth | 4 | ✅ 4/4 |
| Functional — Clients | 5 | ✅ 5/5 |
| Functional — Conditions | 4 | ✅ 4/4 |
| Functional — Transactions | 10 | ✅ 10/10 |
| Functional — Workflow Templates | 5 | ✅ 5/5 |
| **TOTAL** | **44** | **✅ 44/44 PASS** |

---

## 4. Build & Migrations

| Vérification | Résultat |
|-------------|----------|
| `npm run build` (frontend) | ✅ TypeScript compile, Vite build OK |
| `npx tsc --noEmit` (backend) | ✅ Zéro erreur |
| `node ace migration:run` | ✅ 22 migrations appliquées |
| `node ace db:seed` | ✅ Templates NB + User test créés |
| `docker compose up -d` | ✅ Postgres + Redis running |

---

## 5. Dette technique identifiée

| Item | Sévérité | Planifié |
|------|----------|----------|
| `executeAutomations` est un stub (log-only, ne fait rien) | Moyenne | Epic 3 (BullMQ) |
| i18n installé mais clés non appliquées dans les composants | Faible | Epic 2 |
| `TransactionDetailPage.tsx` ~1600 lignes (god component) | Moyenne | Epic 2 |
| Pas de tests frontend | Moyenne | Epic 2 |
| Slugs tirets vs underscores (inconsistance mineure avec doc) | Faible | Epic 2 |
| Race condition potentielle sur `advanceStep` concurrent | Faible | Epic 3 (Redis lock) |

---

## 6. Décision

**L'Epic 1 — Workflow Engine + Infrastructure est VALIDÉ et CLOS.**

Toutes les 8 sections de vérification passent. L'architecture 3 couches est en place, les fondations infrastructure sont solides, et le codebase compile et passe tous les tests.

**L'Epic 2 — Refonte UI Transaction peut démarrer.**

---

*Document généré lors de la réunion de revue BMAD du 26 janvier 2026*
*Validé par Sam (Product Owner)*
