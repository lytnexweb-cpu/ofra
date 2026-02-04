# Conditions Engine Premium - Progress Report

**Date:** 2026-02-01
**Sprint:** Implementation Phase
**Status:** PHASE 4C COMPLETE — Frontend Intelligent Create ✅

---

## Overview

Implementation of the Conditions Engine Premium as specified in:
- **D4:** Archivage des Conditions dans la Timeline
- **D27:** Modèle de Données Conditions Engine Premium

---

## Phase 1: Data Model ✅ COMPLETE

### Migrations Created

| File | Purpose | Status |
|------|---------|--------|
| `1772000000001_create_condition_templates_table.ts` | Templates for condition packs | ✅ |
| `1772000000002_create_transaction_profiles_table.ts` | 8-field transaction profile (D1) | ✅ |
| `1772000000003_upgrade_conditions_for_premium.ts` | Add premium fields to conditions | ✅ |
| `1772000000004_create_condition_evidence_table.ts` | Evidence attachments | ✅ |
| `1772000000005_create_condition_events_table.ts` | Audit trail events | ✅ |

### Models Created/Updated

| Model | Type | Purpose |
|-------|------|---------|
| `ConditionTemplate` | NEW | Template definitions from packs |
| `TransactionProfile` | NEW | Transaction context (8 fields) |
| `ConditionEvidence` | NEW | File/link/note attachments |
| `ConditionEvent` | NEW | Audit trail logging |
| `Condition` | UPDATED | Premium fields added |

### New Fields on Condition Model

```typescript
// Premium fields added:
- templateId: number | null
- labelFr: string | null
- labelEn: string | null
- level: 'blocking' | 'required' | 'recommended'
- sourceType: 'legal' | 'government' | 'industry' | 'best_practice'
- resolutionType: 'completed' | 'waived' | 'not_applicable' | 'skipped_with_risk'
- resolutionNote: string | null
- resolvedAt: DateTime | null
- resolvedBy: string | null
- archived: boolean
- archivedAt: DateTime | null
- archivedStep: number | null
- stepWhenCreated: number | null
- stepWhenResolved: number | null
```

### Services Created

| Service | Purpose |
|---------|---------|
| `ConditionsEngineService` | Core Premium logic (D4/D27) |

### Key Methods in ConditionsEngineService

| Method | Purpose |
|--------|---------|
| `getApplicableTemplates()` | Match templates to profile |
| `createConditionsFromProfile()` | Create conditions from templates |
| `checkStepAdvancement()` | D4: Check if can advance |
| `resolveConditions()` | Resolve with validation |
| `archiveConditionsOnStepChange()` | D4: Archive on step change |
| `getConditionsGroupedByStep()` | Timeline display |
| `getActiveConditions()` | Non-archived conditions |
| `getConditionHistory()` | Audit trail |
| `createCustomCondition()` | Manual condition creation |

### Database Constraints

| Constraint | Table | Rule |
|------------|-------|------|
| `chk_blocking_no_skip` | conditions | Blocking cannot have resolution_type='skipped_with_risk' |
| `chk_event_type` | transaction_condition_events | Valid event types only |

### Indexes Created

| Index | Table | Columns |
|-------|-------|---------|
| `idx_templates_step_active` | condition_templates | step, is_active, is_default |
| `idx_templates_applies_when` | condition_templates | applies_when (GIN) |
| `idx_conditions_tx_archived` | conditions | transaction_id, archived, step_when_created |
| `idx_conditions_tx_archived_step` | conditions | transaction_id, archived_step |
| `idx_conditions_tx_status_level` | conditions | transaction_id, status, level |
| `idx_conditions_template` | conditions | template_id |
| `idx_evidence_condition` | condition_evidence | condition_id |
| `idx_events_condition_at` | transaction_condition_events | condition_id, created_at |
| `idx_events_type` | transaction_condition_events | event_type |

---

## Phase 2: Integration ✅ COMPLETE

### Tasks Completed

- [x] Integrate ConditionsEngineService with WorkflowEngineService
- [x] Update advanceStep() to use D4 archiving logic
- [x] Add required resolution support via `options.requiredResolutions`
- [x] Create seed data for condition templates (46 templates total)
- [x] Update createTransactionFromTemplate() to support profile

### WorkflowEngineService Changes

| Method | Change |
|--------|--------|
| `advanceStep()` | Now uses D4 logic: checks blocking, requires resolutions for required, archives on step change |
| `checkBlockingConditions()` | Uses Premium `level` field with fallback to legacy `isBlocking` |
| `getConditionsNeedingResolution()` | NEW: Returns blocking + required conditions |
| `createTransactionFromTemplate()` | Now accepts `profile` param and creates Premium conditions |

### New Error Codes

| Code | Description |
|------|-------------|
| `E_BLOCKING_CONDITIONS` | Blocking conditions prevent advancement |
| `E_REQUIRED_RESOLUTIONS_NEEDED` | Required conditions need explicit resolution |

---

## Phase 3: API Endpoints ✅ COMPLETE

### Controllers Created

| Controller | Purpose |
|------------|---------|
| `ConditionTemplatesController` | NEW - Template packs management |
| `TransactionProfilesController` | NEW - D1 transaction profiles |
| `ConditionsController` | UPDATED - Added 9 Premium methods |

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/conditions/templates` | GET | List all templates |
| `/api/conditions/templates/by-pack` | GET | Templates grouped by pack |
| `/api/conditions/templates/:id` | GET | Single template |
| `/api/transactions/:id/profile` | GET | Get transaction profile |
| `/api/transactions/:id/profile` | PUT | Create/update profile |
| `/api/transactions/:id/profile/status` | GET | Check profile completeness |
| `/api/transactions/:id/applicable-templates` | GET | Templates matching profile |
| `/api/conditions/:id/resolve` | POST | Resolve with Premium types |
| `/api/conditions/:id/history` | GET | Audit trail events |
| `/api/conditions/:id/evidence` | GET | List evidence |
| `/api/conditions/:id/evidence` | POST | Add evidence |
| `/api/conditions/:id/evidence/:evidenceId` | DELETE | Remove evidence |
| `/api/transactions/:id/conditions/timeline` | GET | Conditions grouped by step |
| `/api/transactions/:id/conditions/active` | GET | Non-archived conditions |
| `/api/transactions/:id/conditions/advance-check` | GET | What's needed to advance |

---

## Phase 4: Testing ⏳ IN PROGRESS

### E2E Test Scenarios (Murat)

1. **Blocking empêche l'avancement** - Blocking condition blocks step change
2. **Required force résolution explicite** - Required needs explicit resolution
3. **Recommended auto-archive** - Recommended auto-resolves on step change
4. **Audit trail complet** - Events are logged correctly

---

## Phase 4A: Frontend (Reduced Scope) ✅ COMPLETE

### Components Created/Updated

| Component | Type | Purpose |
|-----------|------|---------|
| `ResolutionRequiredModal` | NEW | Modal for resolving Required conditions before step advance |
| `ConditionCard` | UPDATED | Premium level badges (blocking/required/recommended), resolution status display |
| `ActionZone` | UPDATED | Advance-check integration, resolution modal trigger |

### API Integration

| Feature | Status |
|---------|--------|
| `conditionsApi.advanceCheck()` | ✅ Integrated |
| `conditionsApi.resolve()` | ✅ Integrated |
| Premium types (ConditionLevel, ResolutionType) | ✅ Added |

### Translation Keys Added

| Key | FR | EN |
|-----|----|----|
| `conditions.levels.blocking` | Bloquante | Blocking |
| `conditions.levels.required` | Requise | Required |
| `conditions.levels.recommended` | Recommandée | Recommended |
| `resolution.*` | Full set | Full set |
| `actionZone.requiredCount` | conditions requises | required conditions |

### UX Flow

1. User clicks "Advance Step"
2. System calls `/advance-check` API
3. If blocking conditions → Show blocking modal (existing)
4. If required conditions pending → Show `ResolutionRequiredModal`
5. User resolves each condition with type + note
6. System calls `/resolve` for each
7. On success → Retry advance step

---

## Phase 4B: Level Selector in Custom Form ✅ COMPLETE

### Changes

| File | Change |
|------|--------|
| `condition_validator.ts` | Added `level` field to create/update validators |
| `CreateConditionModal.tsx` | Added 3-button level selector (Blocking/Required/Recommended) |

### Level Selector UX

- 3 visual buttons with icons and colors
- Blocking (red) / Required (amber) / Recommended (grey)
- Dynamic hint text explaining each level's behavior
- Sets both `level` and `isBlocking` for backward compatibility

---

## Phase 4C: Intelligent Condition Create ✅ COMPLETE

### Overview

Transformed `CreateConditionModal` from a simple form to an intelligent suggestion-based UI.

### New Features

| Feature | Description |
|---------|-------------|
| **Mode Suggestions** | Default mode - shows applicable templates from backend |
| **Mode Custom** | Fallback - manual form with level selector |
| **Template Filtering** | Groups by "current step" vs "other steps" |
| **Search** | Real-time filter on template labels |
| **One-Click Create** | Click suggestion → condition created instantly |
| **Profile Warning** | Banner if transaction profile is incomplete |

### API Integration

| Endpoint | Purpose |
|----------|---------|
| `GET /api/transactions/:id/applicable-templates` | Fetch templates matching profile + step |

### UX Flow

```
[+ Ajouter Condition]
    ↓
┌─────────────────────────────────────┐
│  [Suggestions]  [+ Personnalisée]   │  ← Mode tabs
├─────────────────────────────────────┤
│  🔍 Rechercher...                   │  ← Search
├─────────────────────────────────────┤
│  Suggestions pour cette étape       │
│  ┌─────────────────────────────────┐│
│  │ 🛡️ Financement approuvé  [+]   ││  ← Click = create
│  │ 🛡️ Dépôt versé           [+]   ││
│  │ ⚠️ Inspection            [+]   ││
│  └─────────────────────────────────┘│
│  ▶ Autres étapes (12)               │  ← Expandable
└─────────────────────────────────────┘
```

### Translation Keys Added

| Key | FR | EN |
|-----|----|----|
| `conditions.form.suggestions` | Suggestions | Suggestions |
| `conditions.form.custom` | Personnalisée | Custom |
| `conditions.form.suggestionsForStep` | Suggestions pour cette étape | Suggestions for this step |
| `conditions.form.otherSteps` | Autres étapes | Other steps |
| `conditions.form.searchPlaceholder` | Rechercher... | Search... |
| `conditions.form.noProfile` | Profil incomplet | Profile incomplete |

### Definition of Done ✅

- [x] Modal opens in "Suggestions" mode by default
- [x] Shows templates filtered by profile + current step
- [x] Click on suggestion creates condition instantly
- [x] "Custom" mode available as fallback
- [x] Labels are FR/EN based on locale
- [x] Search filters suggestions in real-time

---

## Database Migrations ✅ EXECUTED

All 5 Premium migrations have been successfully run:

```bash
node ace migration:run
# ✅ 1772000000001_create_condition_templates_table
# ✅ 1772000000002_create_transaction_profiles_table
# ✅ 1772000000003_upgrade_conditions_for_premium
# ✅ 1772000000004_create_condition_evidence_table
# ✅ 1772000000005_create_condition_events_table
```

Existing conditions backfilled with:
- `level` = 'blocking' (from is_blocking=true) or 'required'
- `label_fr` / `label_en` = copied from title
- `step_when_created` = from transaction step

---

## Dependencies

| Dependency | Status |
|------------|--------|
| D1: Transaction Profile v1 | ✅ VALIDATED |
| D4: Archivage Timeline | ✅ VALIDATED |
| D27: Data Model | ✅ VALIDATED |
| Pack Rural NB v1.0 | ✅ VALIDATED (needs seed) |
| Pack Condo NB v1.0 | ✅ VALIDATED (needs seed) |
| Pack Financé NB v1.0 | ✅ VALIDATED (needs seed) |

---

## Next Steps

1. ~~Run migrations~~ ✅ DONE
2. ~~Create seed data for packs~~ ✅ DONE (46 templates)
3. 🔄 Run E2E tests (Murat)
4. 🔄 Seed templates in dev database
5. 🔄 Create Transaction Profile for test transactions
6. 📋 Phase 4D: Timeline Conditions (grouped by step)

---

## Testing Checklist

| Test | Status |
|------|--------|
| Profile rural + step 4 → suggestions "Test puits" | ⏳ Pending |
| Profile condo → suggestions condo visibles | ⏳ Pending |
| Sans profil → banner "Profil incomplet" | ⏳ Pending |
| Click suggestion → condition créée | ⏳ Pending |
| Mode custom → sélecteur niveau fonctionne | ⏳ Pending |
| Advance avec Required → modal résolution | ⏳ Pending |

---

**Document maintained by:** Paige (Tech Writer)
**Last updated:** 2026-02-01 (Phase 4C Complete)
