# D27: Modèle de Données - Conditions Engine Premium

**Date de validation:** 2026-02-01
**Validé par:** Sam (Product Owner) + Équipe BMAD + ChatGPT (unanime)
**Statut:** GRAVÉ DANS LE MARBRE

---

## Vue d'Ensemble

Le Conditions Engine Premium repose sur 5 tables interconnectées:

```
┌─────────────────────┐     ┌─────────────────────────┐
│ condition_templates │────▶│ transaction_conditions  │
└─────────────────────┘     └───────────┬─────────────┘
                                        │
┌─────────────────────┐                 │
│ transaction_profiles│                 │
└─────────────────────┘                 │
                                        ▼
                            ┌─────────────────────────┐
                            │ condition_evidence      │
                            └─────────────────────────┘
                                        │
                                        ▼
                            ┌─────────────────────────┐
                            │ transaction_condition_  │
                            │ events                  │
                            └─────────────────────────┘
```

---

## Table A: `condition_templates`

Templates de conditions issus des Packs (Rural NB, Condo NB, Financé NB).

```sql
CREATE TABLE condition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contenu bilingue
  label_fr VARCHAR(500) NOT NULL,
  label_en VARCHAR(500) NOT NULL,
  description_fr TEXT,
  description_en TEXT,

  -- Classification
  level VARCHAR(20) NOT NULL CHECK (level IN ('blocking', 'required', 'recommended')),
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('legal', 'government', 'industry', 'best_practice')),
  category VARCHAR(100),

  -- Applicabilité
  step INTEGER,  -- NULL = applicable à toutes les étapes
  applies_when JSONB NOT NULL DEFAULT '{}',  -- Règles JSON pour Transaction Profile

  -- Métadonnées
  pack VARCHAR(50),  -- 'rural_nb', 'condo_nb', 'finance_nb', NULL=général
  "order" INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_templates_step_active ON condition_templates(step, is_active, is_default);
CREATE INDEX idx_templates_applies_when ON condition_templates USING GIN (applies_when);
```

### Exemple `applies_when`

```json
{
  "property_context": "rural",
  "has_well": true
}
```

---

## Table B: `transaction_profiles`

Profil de transaction (8 champs v1) - 1 row par transaction.

```sql
CREATE TABLE transaction_profiles (
  transaction_id UUID PRIMARY KEY REFERENCES transactions(id) ON DELETE CASCADE,

  -- Champs obligatoires (création)
  property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('house', 'condo', 'land')),
  property_context VARCHAR(20) NOT NULL CHECK (property_context IN ('urban', 'suburban', 'rural')),
  is_financed BOOLEAN NOT NULL,

  -- Champs conditionnels (rural)
  has_well BOOLEAN,
  has_septic BOOLEAN,
  access_type VARCHAR(20) CHECK (access_type IN ('public', 'private', 'right_of_way')),

  -- Champs conditionnels (condo)
  condo_docs_required BOOLEAN DEFAULT true,

  -- Champs conditionnels (financé)
  appraisal_required BOOLEAN,  -- NULL = "je ne sais pas encore"

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Table C: `transaction_conditions`

Instance réelle d'une condition sur une transaction - **LE CŒUR DU SYSTÈME**.

```sql
CREATE TABLE transaction_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  template_id UUID REFERENCES condition_templates(id),  -- NULL si condition custom

  -- Snapshot au moment de création (audit-proof si template change)
  label_fr VARCHAR(500) NOT NULL,
  label_en VARCHAR(500) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('blocking', 'required', 'recommended')),
  source_type VARCHAR(20) CHECK (source_type IN ('legal', 'government', 'industry', 'best_practice')),

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),

  -- Résolution
  resolution_type VARCHAR(30) CHECK (resolution_type IN ('completed', 'waived', 'not_applicable', 'skipped_with_risk')),
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100),  -- user_id ou 'system'

  -- Archivage
  archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_step INTEGER,  -- Étape vers laquelle on a avancé (trigger de l'archivage)

  -- Étapes
  step_when_created INTEGER NOT NULL,
  step_when_resolved INTEGER,

  -- Deadline (optionnel, futur)
  due_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT chk_blocking_no_skip
    CHECK (NOT (level = 'blocking' AND resolution_type = 'skipped_with_risk')),
  CONSTRAINT chk_resolved_has_by
    CHECK (resolved_at IS NULL OR resolved_by IS NOT NULL),
  CONSTRAINT chk_required_note
    CHECK (NOT (level = 'required' AND resolution_type IN ('waived', 'not_applicable', 'skipped_with_risk') AND resolution_note IS NULL))
);

-- Index pour performance
CREATE INDEX idx_conditions_tx_archived ON transaction_conditions(transaction_id, archived, step_when_created);
CREATE INDEX idx_conditions_tx_archived_step ON transaction_conditions(transaction_id, archived_step);  -- Timeline queries
CREATE INDEX idx_conditions_tx_status_level ON transaction_conditions(transaction_id, status, level);
CREATE INDEX idx_conditions_template ON transaction_conditions(template_id);
```

---

## Table D: `condition_evidence`

Preuves attachées aux conditions (documents, liens, notes).

```sql
CREATE TABLE condition_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_condition_id UUID NOT NULL REFERENCES transaction_conditions(id) ON DELETE CASCADE,

  -- Type de preuve
  type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'link', 'note')),

  -- Contenu
  file_id UUID REFERENCES documents(id),  -- Si type='file'
  url VARCHAR(2000),                       -- Si type='link'
  note TEXT,                               -- Si type='note'
  title VARCHAR(255),

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_condition ON condition_evidence(transaction_condition_id);
```

---

## Table E: `transaction_condition_events`

Audit trail complet - **CRUCIAL POUR DEBUGGING ET LÉGAL**.

```sql
CREATE TABLE transaction_condition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_condition_id UUID NOT NULL REFERENCES transaction_conditions(id) ON DELETE CASCADE,

  -- Type d'événement
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created',
    'started',
    'resolved',
    'archived',
    'evidence_added',
    'evidence_removed',
    'note_added',
    'level_changed_admin',
    'unarchived_admin'
  )),

  -- Acteur
  actor_id VARCHAR(100) NOT NULL,  -- user_id ou 'system'

  -- Métadonnées (old/new values, etc.)
  meta JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_condition_at ON transaction_condition_events(transaction_condition_id, created_at);
CREATE INDEX idx_events_type ON transaction_condition_events(event_type);
```

### Exemples d'événements

```json
// Création
{ "event_type": "created", "actor_id": "system", "meta": { "template_id": "uuid", "level": "required" } }

// Résolution
{ "event_type": "resolved", "actor_id": "user-123", "meta": {
  "resolution_type": "skipped_with_risk",
  "resolution_note": "Client refuse délai",
  "previous_status": "pending"
}}

// Archivage
{ "event_type": "archived", "actor_id": "system", "meta": { "step_changed_to": 5 } }
```

---

## TypeScript Interfaces

```typescript
// Enums
type PropertyType = 'house' | 'condo' | 'land'
type PropertyContext = 'urban' | 'suburban' | 'rural'
type AccessType = 'public' | 'private' | 'right_of_way'
type ConditionLevel = 'blocking' | 'required' | 'recommended'
type SourceType = 'legal' | 'government' | 'industry' | 'best_practice'
type ConditionStatus = 'pending' | 'in_progress' | 'resolved'
type ResolutionType = 'completed' | 'waived' | 'not_applicable' | 'skipped_with_risk'
type EvidenceType = 'file' | 'link' | 'note'

// Transaction Profile
interface TransactionProfile {
  transaction_id: string
  property_type: PropertyType
  property_context: PropertyContext
  is_financed: boolean
  has_well?: boolean
  has_septic?: boolean
  access_type?: AccessType
  condo_docs_required?: boolean
  appraisal_required?: boolean | null
}

// Condition Template
interface ConditionTemplate {
  id: string
  label_fr: string
  label_en: string
  description_fr?: string
  description_en?: string
  level: ConditionLevel
  source_type: SourceType
  category?: string
  step?: number
  applies_when: Record<string, any>
  pack?: string
  order: number
  is_default: boolean
  is_active: boolean
}

// Transaction Condition
interface TransactionCondition {
  id: string
  transaction_id: string
  template_id?: string
  label_fr: string
  label_en: string
  level: ConditionLevel
  source_type?: SourceType
  status: ConditionStatus
  resolution_type?: ResolutionType
  resolution_note?: string
  resolved_at?: Date
  resolved_by?: string
  archived: boolean
  archived_at?: Date
  archived_step?: number  // Étape vers laquelle on a avancé (trigger)
  step_when_created: number
  step_when_resolved?: number
  due_at?: Date
  created_at: Date
  updated_at: Date
}

// Evidence
interface ConditionEvidence {
  id: string
  transaction_condition_id: string
  type: EvidenceType
  file_id?: string
  url?: string
  note?: string
  title?: string
  created_by: string
  created_at: Date
}

// Event
interface TransactionConditionEvent {
  id: string
  transaction_condition_id: string
  event_type: string
  actor_id: string
  meta: Record<string, any>
  created_at: Date
}
```

---

## Service: `onStepChange`

Logique métier pour l'avancement d'étape.

```typescript
async function onStepChange(
  transactionId: string,
  newStep: number,
  resolutions?: Map<string, { type: ResolutionType; note: string }>,
  userId: string
): Promise<void> {
  const currentStep = await getCurrentStep(transactionId)

  // 1. Vérifier les Blocking pending
  const blockingPending = await getConditions({
    transactionId,
    level: 'blocking',
    status: 'pending',
    stepWhenCreated: currentStep
  })

  if (blockingPending.length > 0) {
    throw new BlockingConditionError(
      'Impossible d\'avancer: conditions bloquantes non résolues',
      blockingPending
    )
  }

  // 2. Vérifier les Required ont des résolutions
  const requiredPending = await getConditions({
    transactionId,
    level: 'required',
    status: 'pending',
    stepWhenCreated: currentStep
  })

  for (const cond of requiredPending) {
    const res = resolutions?.get(cond.id)
    if (!res) {
      throw new RequiredResolutionMissingError(
        'Résolution requise pour condition Required',
        cond
      )
    }
    if (res.type !== 'completed' && !res.note) {
      throw new ResolutionNoteMissingError(
        'Raison obligatoire pour cette résolution',
        cond
      )
    }

    await resolveCondition(cond.id, res.type, res.note, userId)
    await createEvent(cond.id, 'resolved', userId, {
      resolution_type: res.type,
      resolution_note: res.note
    })
  }

  // 3. Auto-résoudre les Recommended pending
  const recommendedPending = await getConditions({
    transactionId,
    level: 'recommended',
    status: 'pending',
    stepWhenCreated: currentStep
  })

  for (const cond of recommendedPending) {
    await resolveCondition(
      cond.id,
      'not_applicable',
      'Auto-archived on step change',
      'system'
    )
    await createEvent(cond.id, 'resolved', 'system', {
      resolution_type: 'not_applicable',
      auto_archived: true
    })
  }

  // 4. Archiver toutes les conditions de l'étape précédente
  const allPreviousConditions = await getConditions({
    transactionId,
    stepWhenCreated: currentStep
  })

  const now = new Date()
  for (const cond of allPreviousConditions) {
    await archiveCondition(cond.id, now, newStep)  // archived_step = newStep
    await createEvent(cond.id, 'archived', 'system', {
      archived_step: newStep
    })
  }

  // 5. Avancer la transaction
  await updateTransactionStep(transactionId, newStep)
}
```

---

## Queries Fréquentes

### Dashboard: Conditions pending par transaction

```sql
SELECT * FROM transaction_conditions
WHERE transaction_id = $1
  AND status IN ('pending', 'in_progress')
  AND archived = false
ORDER BY level DESC, step_when_created, "order";
```

### Timeline: Conditions groupées par étape

```sql
-- Conditions archivées lors du passage à l'étape 5
SELECT * FROM transaction_conditions
WHERE transaction_id = $1 AND archived_step = 5
ORDER BY step_when_created, "order";

-- Timeline complète groupée par étape de création
SELECT
  step_when_created,
  json_agg(
    json_build_object(
      'id', id,
      'label_fr', label_fr,
      'level', level,
      'status', status,
      'resolution_type', resolution_type,
      'resolved_at', resolved_at,
      'resolved_by', resolved_by,
      'archived_step', archived_step
    ) ORDER BY "order"
  ) as conditions
FROM transaction_conditions
WHERE transaction_id = $1
GROUP BY step_when_created
ORDER BY step_when_created DESC;
```

### Audit: Historique complet d'une condition

```sql
SELECT e.*, u.name as actor_name
FROM transaction_condition_events e
LEFT JOIN users u ON e.actor_id::uuid = u.id
WHERE e.transaction_condition_id = $1
ORDER BY e.created_at ASC;
```

---

## Migration SQL

```sql
-- Migration: Create Conditions Engine Premium tables
-- Version: 001_conditions_engine_premium

BEGIN;

-- Table A: condition_templates (si pas déjà créée)
-- [voir définition ci-dessus]

-- Table B: transaction_profiles
-- [voir définition ci-dessus]

-- Table C: transaction_conditions
-- [voir définition ci-dessus]

-- Table D: condition_evidence
-- [voir définition ci-dessus]

-- Table E: transaction_condition_events
-- [voir définition ci-dessus]

COMMIT;
```

---

## Historique

| Date | Action | Par |
|------|--------|-----|
| 2026-02-01 | Création modèle de données complet | Sam + BMAD + ChatGPT unanime |

---

**Document gravé. Toute modification requiert validation Product Owner.**
