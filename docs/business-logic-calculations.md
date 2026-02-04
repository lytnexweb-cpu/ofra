# Ofra - Logique de Calculs Métier

**Document de référence technique**
**Dernière mise à jour:** 2026-02-02
**Auteur:** Équipe BMAD

---

## Table des matières

1. [Calculs de Dates & Deadlines](#1-calculs-de-dates--deadlines)
2. [Calculs de Progression](#2-calculs-de-progression)
3. [Logique de Blocage & Avancement](#3-logique-de-blocage--avancement)
4. [Calculs de Countdown](#4-calculs-de-countdown)
5. [KPIs & Métriques Dashboard](#5-kpis--métriques-dashboard)
6. [Algorithmes de Tri & Priorité](#6-algorithmes-de-tri--priorité)
7. [Calculs d'Offres](#7-calculs-doffres)
8. [Détermination des Niveaux](#8-détermination-des-niveaux)
9. [Transitions d'État](#9-transitions-détat)

---

## 1. Calculs de Dates & Deadlines

### 1.1 Deadlines Relatives (D37)

**Fichier:** `backend/app/models/condition_template.ts`

**Principe:** Les templates de conditions définissent des deadlines relatives à une date d'ancrage.

```typescript
deadline = date_ancrage + nombre_de_jours
```

**Points d'ancrage disponibles:**

| Ancrage | Description | Cas d'usage |
|---------|-------------|-------------|
| `acceptance` | Date d'acceptation de l'offre | Conditions du début (inspection, financement) |
| `closing` | Date de clôture prévue | Conditions de fin (avocat, signatures) |
| `step_start` | Date de début d'étape | Conditions spécifiques à une étape |

**Exemples de calcul:**

```
Transaction: acceptance = 1er février, closing = 15 mars

| Condition          | Ancrage    | Offset | Calcul           | Deadline    |
|--------------------|------------|--------|------------------|-------------|
| Dépôt initial      | acceptance | +2     | 1 fév + 2j       | 3 février   |
| Inspection         | acceptance | +7     | 1 fév + 7j       | 8 février   |
| Financement        | acceptance | +10    | 1 fév + 10j      | 11 février  |
| Avocat confirmé    | closing    | -14    | 15 mars - 14j    | 1er mars    |
| Assurance          | closing    | -5     | 15 mars - 5j     | 10 mars     |
| Signatures         | closing    | 0      | 15 mars + 0j     | 15 mars     |
```

**Note:** Les offsets négatifs représentent un countdown vers la clôture.

**Méthode de calcul:**
```typescript
// backend/app/models/condition_template.ts
calculateDueDate(dates: {
  acceptanceDate?: DateTime | null
  closingDate?: DateTime | null
  stepStartDate?: DateTime | null
}): DateTime | null {
  if (!this.deadlineReference || this.defaultDeadlineDays === null) {
    return null
  }

  let referenceDate: DateTime | null = null

  switch (this.deadlineReference) {
    case 'acceptance':
      referenceDate = dates.acceptanceDate ?? null
      break
    case 'closing':
      referenceDate = dates.closingDate ?? null
      break
    case 'step_start':
      referenceDate = dates.stepStartDate ?? null
      break
  }

  if (!referenceDate) {
    return null
  }

  return referenceDate.plus({ days: this.defaultDeadlineDays })
}
```

---

### 1.2 Différence en Jours

**Fichier:** `frontend/src/lib/date.ts`

```typescript
function differenceInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay)
}
```

**Usage:** Calcul du nombre de jours entre deux dates (utilisé pour countdown, overdue, etc.)

---

### 1.3 Plages de Dates Dashboard

**Fichier:** `backend/app/controllers/dashboard_controller.ts`

```typescript
const today = DateTime.now()
const sevenDaysLater = today.plus({ days: 7 })      // Deadlines à venir
const sixMonthsAgo = today.minus({ months: 6 })     // Historique revenus
const startOfMonth = today.startOf('month')          // Revenu du mois
```

---

## 2. Calculs de Progression

### 2.1 Progression de Transaction

**Fichier:** `frontend/src/components/transaction/TransactionCard.tsx`

```typescript
function calculateProgress(transaction): number {
  const steps = transaction.transactionSteps ?? []
  const currentStepId = transaction.currentStepId

  // Si pas d'étape courante = terminé
  if (!currentStepId) return 100

  const currentStep = steps.find(s => s.id === currentStepId)
  if (!currentStep) return 100

  const totalSteps = steps.length
  const currentOrder = currentStep.stepOrder

  return Math.round((currentOrder / totalSteps) * 100)
}
```

**Exemple:**
```
Transaction avec 8 étapes, actuellement à l'étape 3:
progress = (3 / 8) * 100 = 37.5% → arrondi à 38%
```

---

### 2.2 Progression par Étapes Complétées (Backend)

**Fichier:** `backend/app/services/workflow_engine_service.ts`

```typescript
const totalSteps = transaction.transactionSteps.length
const completedSteps = transaction.transactionSteps.filter(
  s => s.status === 'completed' || s.status === 'skipped'
).length
const progress = totalSteps > 0
  ? Math.round((completedSteps / totalSteps) * 100)
  : 0
```

**Différence avec frontend:** Le backend compte les étapes terminées/skippées, le frontend utilise l'ordre de l'étape courante.

---

### 2.3 Taux de Conversion

**Fichier:** `backend/app/controllers/dashboard_controller.ts`

```typescript
const totalAll = await Transaction.query()
  .where('userId', userId)
  .count('* as total')

const completedCount = await Transaction.query()
  .where('userId', userId)
  .whereNull('currentStepId')  // NULL = transaction terminée
  .count('* as total')

const conversionRate = totalAll > 0
  ? Math.round((completedCount / totalAll) * 100)
  : 0
```

---

## 3. Logique de Blocage & Avancement

### 3.1 Vérification d'Avancement (Advance Check)

**Fichier:** `backend/app/services/conditions_engine_service.ts`

```typescript
interface AdvanceCheckResult {
  canAdvance: boolean
  blocking: Condition[]    // Bloquantes non résolues
  required: Condition[]    // Requises non résolues
  recommended: Condition[] // Recommandées non résolues
  summary: {
    blockingPending: number
    requiredPending: number
    recommendedPending: number
  }
}

function checkAdvancement(conditions: Condition[]): AdvanceCheckResult {
  const pending = conditions.filter(c => c.status === 'pending')

  const blocking = pending.filter(c =>
    c.level === 'blocking' || (c.level === null && c.isBlocking)
  )
  const required = pending.filter(c => c.level === 'required')
  const recommended = pending.filter(c =>
    c.level === 'recommended' || (c.level === null && !c.isBlocking)
  )

  return {
    canAdvance: blocking.length === 0,
    blocking,
    required,
    recommended,
    summary: {
      blockingPending: blocking.length,
      requiredPending: required.length,
      recommendedPending: recommended.length
    }
  }
}
```

**Règle:** `canAdvance = true` seulement si `blocking.length === 0`

---

### 3.2 Filtrage des Conditions Bloquantes

**Fichier:** `frontend/src/components/transaction/TransactionCard.tsx`

```typescript
function getBlockingPendingConditions(conditions: Condition[]): Condition[] {
  return conditions.filter(c => c.isBlocking && c.status === 'pending')
}
```

---

### 3.3 Règles d'Archivage des Conditions

**Fichier:** `backend/app/services/conditions_engine_service.ts`

Lors du passage à l'étape suivante, les conditions sont archivées selon leur niveau:

| Niveau | Règle d'archivage |
|--------|-------------------|
| `blocking` | DOIT être résolue (erreur sinon) |
| `required` | DOIT avoir une résolution explicite (completed, waived, not_applicable, skipped_with_risk) |
| `recommended` | Auto-résolue comme `not_applicable` si non traitée |

```typescript
for (const condition of conditions) {
  const effectiveLevel = condition.level ??
    (condition.isBlocking ? 'blocking' : 'recommended')

  switch (effectiveLevel) {
    case 'blocking':
      if (condition.status === 'pending') {
        throw new Error('Blocking condition still pending')
      }
      break
    case 'required':
      if (!condition.resolutionType) {
        throw new Error('Required condition needs explicit resolution')
      }
      break
    case 'recommended':
      if (condition.status === 'pending') {
        // Auto-resolve as not applicable
        condition.resolutionType = 'not_applicable'
        condition.status = 'completed'
      }
      break
  }

  condition.archived = true
  await condition.save()
}
```

---

## 4. Calculs de Countdown

### 4.1 Badge de Countdown

**Fichier:** `frontend/src/components/transaction/CountdownBadge.tsx`

```typescript
function getCountdownStatus(dueDate: string): CountdownStatus {
  const due = parseISO(dueDate)
  const today = new Date()

  // Normaliser à minuit pour comparer les jours
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const days = differenceInDays(due, today)

  return {
    isOverdue: days < 0,
    isToday: days === 0,
    isTomorrow: days === 1,
    daysRemaining: days,
    displayText: days < 0
      ? `${Math.abs(days)}j en retard`
      : days === 0
        ? "Aujourd'hui"
        : days === 1
          ? "Demain"
          : `${days}j`
  }
}
```

---

### 4.2 Urgence des Deadlines

**Fichier:** `frontend/src/components/dashboard/UpcomingDeadlines.tsx`

```typescript
function getDaysUntilDue(dueDate: string): { text: string, urgent: boolean } {
  const days = differenceInDays(parseISO(dueDate), new Date())

  if (days < 0) return { text: 'En retard', urgent: true }
  if (days === 0) return { text: "Aujourd'hui", urgent: true }
  if (days === 1) return { text: 'Demain', urgent: true }
  if (days <= 3) return { text: `${days} jours`, urgent: true }

  return { text: `${days} jours`, urgent: false }
}
```

**Seuil d'urgence:** <= 3 jours

---

### 4.3 Fenêtre d'Alerte 48h (Rappels)

**Fichier:** `backend/app/services/reminder_service.ts`

```typescript
const now = DateTime.now()
const windowStart = now.plus({ hours: 48 })
const windowEnd = now.plus({ hours: 49 })

// Conditions dont la deadline est dans les 48-49 prochaines heures
const upcomingConditions = await Condition.query()
  .where('dueDate', '>=', windowStart.toSQL())
  .where('dueDate', '<', windowEnd.toSQL())
  .where('status', 'pending')
```

---

## 5. KPIs & Métriques Dashboard

### 5.1 Conditions en Retard

**Fichier:** `backend/app/controllers/dashboard_controller.ts`

```sql
SELECT COUNT(*) as total
FROM conditions
WHERE due_date <= :today
AND status = 'pending'
AND transaction.user_id = :userId
```

---

### 5.2 Conditions à Venir (7 jours)

```sql
SELECT COUNT(*) as total
FROM conditions
WHERE due_date > :today
AND due_date <= :sevenDaysLater
AND status = 'pending'
AND transaction.user_id = :userId
```

---

### 5.3 Revenu par Mois (6 derniers mois)

```typescript
const revenueData = []
for (let i = 5; i >= 0; i--) {
  const month = today.minus({ months: i })
  const startOfMonth = month.startOf('month')
  const endOfMonth = month.endOf('month')

  const revenue = await Transaction.query()
    .where('userId', userId)
    .whereNull('currentStepId')  // Terminées seulement
    .whereBetween('updatedAt', [startOfMonth, endOfMonth])
    .sum('commission as total')

  revenueData.push({
    month: month.toFormat('MMM'),
    revenue: revenue[0]?.total ?? 0
  })
}
```

---

### 5.4 Formatage des Montants

**Fichier:** `frontend/src/components/dashboard/RevenueChart.tsx`

```typescript
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toLocaleString()}`
}
```

**Exemples:**
- 1,500,000 → "$1.5M"
- 75,000 → "$75K"
- 500 → "$500"

---

### 5.5 Animation des Chiffres KPI

**Fichier:** `frontend/src/components/dashboard/KPICard.tsx`

```typescript
function animateNumber(targetValue: number): void {
  const duration = 1000  // 1 seconde
  const steps = 30       // 30 frames
  const stepDuration = duration / steps
  const increment = targetValue / steps

  let step = 0
  const interval = setInterval(() => {
    step++
    const current = Math.min(Math.round(increment * step), targetValue)
    setDisplayValue(current)

    if (step >= steps) {
      clearInterval(interval)
    }
  }, stepDuration)
}
```

---

## 6. Algorithmes de Tri & Priorité

### 6.1 Tri des Conditions

**Fichier:** `frontend/src/components/transaction/ConditionsTab.tsx`

```typescript
conditions.sort((a, b) => {
  // 1. Bloquantes en premier
  if (a.isBlocking !== b.isBlocking) {
    return a.isBlocking ? -1 : 1
  }
  // 2. Par date d'échéance croissante
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
})
```

**Ordre résultant:**
1. Bloquantes avec deadline proche
2. Bloquantes avec deadline lointaine
3. Non-bloquantes avec deadline proche
4. Non-bloquantes avec deadline lointaine

---

### 6.2 Tri des Étapes

```typescript
const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder)
```

---

### 6.3 Tri des Deadlines Dashboard

```sql
SELECT * FROM conditions
WHERE status = 'pending'
ORDER BY due_date ASC
LIMIT 5
```

---

## 7. Calculs d'Offres

### 7.1 Numéro de Révision

**Fichier:** `backend/app/services/offer_service.ts`

```typescript
const lastRevision = await OfferRevision.query()
  .where('offerId', offerId)
  .orderBy('revisionNumber', 'desc')
  .first()

const nextRevisionNumber = (lastRevision?.revisionNumber ?? 0) + 1
```

---

### 7.2 Vérification d'Expiration

```typescript
function isOfferExpired(offer: Offer): boolean {
  const latestRevision = offer.revisions[0]

  if (!latestRevision?.expiryAt) {
    return false
  }

  return latestRevision.expiryAt < DateTime.now()
}
```

---

### 7.3 Rejet Automatique des Autres Offres

Lors de l'acceptation d'une offre:

```typescript
await Offer.query()
  .where('transactionId', transactionId)
  .whereNot('id', acceptedOfferId)
  .whereIn('status', ['received', 'countered'])
  .update({ status: 'rejected' })
```

---

## 8. Détermination des Niveaux

### 8.1 Niveau Effectif d'une Condition

**Fichier:** `frontend/src/components/transaction/ConditionCard.tsx`

```typescript
// Le champ `level` (Premium) a priorité sur `isBlocking` (legacy)
const level: ConditionLevel | null = condition.level
  ?? (condition.isBlocking ? 'blocking' : null)

const isBlocking = level === 'blocking' && condition.status !== 'completed'
```

---

### 8.2 Niveau Effectif Backend

**Fichier:** `backend/app/services/conditions_engine_service.ts`

```typescript
const effectiveLevel = condition.level
  ?? (condition.isBlocking ? 'blocking' : 'recommended')
```

**Fallback:** Si pas de `level` défini, utilise `isBlocking` pour déterminer blocking vs recommended.

---

## 9. Transitions d'État

### 9.1 Trouver l'Étape Suivante

**Fichier:** `backend/app/services/workflow_engine_service.ts`

```typescript
const nextStep = transactionSteps.find(
  s => s.stepOrder === currentStep.stepOrder + 1
)

if (!nextStep) {
  // Dernière étape = transaction terminée
  transaction.currentStepId = null
}
```

---

### 9.2 Retour à une Étape Précédente

```typescript
async function goToStep(targetStepOrder: number): Promise<void> {
  for (const step of transactionSteps) {
    if (step.stepOrder > targetStepOrder) {
      // Reset les étapes futures
      step.status = 'pending'
      step.enteredAt = null
      step.completedAt = null
    } else if (step.stepOrder === targetStepOrder) {
      // Activer l'étape cible
      step.status = 'active'
      step.enteredAt = DateTime.now()
    }
    await step.save()
  }

  transaction.currentStepId = targetStep.id
  await transaction.save()
}
```

---

## Annexe: Constantes Importantes

```typescript
// Seuils d'urgence
const URGENT_DAYS_THRESHOLD = 3        // Jours avant deadline = urgent
const REMINDER_WINDOW_HOURS = 48       // Heures avant deadline pour rappel

// Limites
const CONDITION_NOTE_MAX_LENGTH = 1000 // Caractères max pour note
const SKIP_REASON_MIN_LENGTH = 10      // Caractères min pour raison de skip

// Animations
const KPI_ANIMATION_DURATION = 1000    // ms
const KPI_ANIMATION_STEPS = 30         // frames

// Affichage
const UPCOMING_DEADLINES_LIMIT = 5     // Deadlines affichées
const RECENT_ACTIVITY_LIMIT = 10       // Activités récentes affichées
const REVENUE_MONTHS_HISTORY = 6       // Mois d'historique revenus
```

---

## 10. Chargement du Pack Conditions (D39)

### 10.1 Logique de chargement

**Fichier:** `backend/app/services/conditions_engine_service.ts`

```typescript
async loadPackForTransaction(
  transactionId: number,
  userId: string | number,
  dates?: { acceptanceDate?: DateTime; closingDate?: DateTime }
): Promise<{ loaded: number; byStep: Record<number, number> }>
```

**Processus:**
1. Récupérer le profil de transaction
2. Filtrer les templates applicables via `appliesTo(profileData)`
3. Pour chaque template:
   - Trouver le TransactionStep correspondant
   - Calculer la deadline via D37 `calculateDueDate()`
   - Créer la condition avec toutes les métadonnées
   - Logger l'événement `created` avec `pack_load: true`

**Retour:**
```typescript
{
  loaded: 15,        // Nombre total de conditions créées
  byStep: {          // Répartition par étape
    2: 2,
    3: 5,
    4: 3,
    5: 2,
    6: 2,
    7: 1
  }
}
```

---

*Document généré par l'équipe BMAD - Session 2026-02-02*
