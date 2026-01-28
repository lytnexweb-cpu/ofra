# Story 2A.1: TransactionCard + CountdownBadge

Status: done

## Story

As a **real estate agent**,
I want **to see a card for each transaction showing the current step, client name, blocking conditions count, and nearest deadline**,
So that **I can scan my caseload at a glance and spot urgent items**.

## Acceptance Criteria

1. **Given** une transaction avec step actuel "Conditionnel", client "Dupont", propriété "123 Rue Main" **When** la TransactionCard est rendue **Then** elle affiche le nom du step actuel, le nom du client, l'adresse de la propriété **And** un badge indique le nombre de conditions bloquantes en retard (rouge si > 0)

2. **Given** une condition avec deadline dans 3 jours **When** le CountdownBadge est rendu **Then** il affiche "dans 3 jours" en couleur warning (orange) (FR28) **And** l'icône + texte sont présents (jamais couleur seule — AR16)

3. **Given** une condition avec deadline dépassée de 2 jours **When** le CountdownBadge est rendu **Then** il affiche "il y a 2 jours" en couleur danger (rouge)

4. **Given** une transaction sans conditions bloquantes **When** la TransactionCard est rendue **Then** aucun badge rouge n'apparaît

5. **Given** le composant en Skeleton loading **When** les données ne sont pas encore chargées **Then** un Skeleton mime la structure exacte de la TransactionCard (3 lignes) (AR13)

## Pre-Implementation Analysis: MOSTLY DONE

**CRITICAL FINDING** : TransactionCard.tsx (102 lignes) et CountdownBadge.tsx (35 lignes) existent déjà (Epic 1 commit e5222a6). L'analyse révèle ~75% de couverture avec des corrections d'alignement UX nécessaires.

### AC1 — TransactionCard affiche step, client, adresse, blocking count : DONE ✅ (avec corrections)

**TransactionCard.tsx** implémente :
- Nom du step via `t('workflow.steps.${slug}')` ✅
- Nom du client via `${firstName} ${lastName}` ✅
- Adresse propriété ✅
- Badge blocking count (rouge, AlertTriangle + nombre) ✅
- Badge type purchase/sale ✅
- ChevronRight ✅
- data-testid `transaction-card-${id}` ✅

**Corrections nécessaires :**
- **Bordure gauche** manquante : UX spec dit rouge si blocking > 0, gris sinon → pas implémenté ❌
- **Prix** affiché avec `.toLocaleString('en-CA')` hardcodé → devrait utiliser la locale i18n courante ❌

### AC2 — CountdownBadge affiche texte humain warning : PARTIAL ⚠️

**CountdownBadge.tsx** implémente :
- `differenceInDays` pour calculer les jours restants ✅
- Badge variant `warning` (orange) pour deadline proche ✅
- Icône Clock + texte (AR16) ✅
- data-testid `countdown-badge` ✅
- Masqué si > 7 jours ✅

**Corrections nécessaires :**
- Affiche `"3j"` au lieu de `"dans 3 jours"` → texte humain i18n requis ❌
- Pas de cas "Aujourd'hui!" ni "Demain" → UX spec les requiert ❌
- Pas d'i18n (`t()`) — strings hardcodées ❌
- `completedAt` prop manquante (UX spec) — masquer si condition complétée ❌

### AC3 — CountdownBadge deadline dépassée : PARTIAL ⚠️

- Badge variant `destructive` (rouge) pour overdue ✅
- Affiche `"-2j"` au lieu de `"il y a 2 jours"` → texte humain requis ❌

### AC4 — Pas de badge si pas de blocking : DONE ✅

- Condition `{blockingCount > 0 && ...}` correcte ✅
- Badge absent si pas de conditions bloquantes ✅

### AC5 — TransactionCardSkeleton : DONE ✅

- `TransactionCardSkeleton` avec 3 lignes (2 badges + 2 lignes texte) ✅
- data-testid `transaction-card-skeleton` ✅
- Exporté dans barrel `index.ts` ✅

## Tasks / Subtasks

- [x] **Task 1: Enrichir CountdownBadge avec texte humain i18n** (AC: AC2, AC3)
  - [x] Ajouter `useTranslation()` hook
  - [x] Remplacer `"${days}j"` par des clés i18n contextuelles :
    - `countdown.today` → "Aujourd'hui!" / "Today!"
    - `countdown.tomorrow` → "Demain" / "Tomorrow"
    - `countdown.daysLeft` → "dans {{count}} jours" / "in {{count}} days"
    - `countdown.overdue` → "il y a {{count}} jours" / "{{count}} days ago"
  - [x] Ajouter clés dans `locales/en/common.json` et `locales/fr/common.json`
  - [x] Ajouter prop optionnelle `completedAt` — masquer si complété
  - [x] Ajouter aria-label descriptif pour accessibilité

- [x] **Task 2: Ajouter bordure gauche conditionnelle à TransactionCard** (AC: AC1)
  - [x] Bordure gauche rouge si `blockingCount > 0`
  - [x] Bordure gauche gris (border-border) sinon
  - [x] Utiliser `border-l-4` avec couleur conditionnelle

- [x] **Task 3: Corriger le formatage prix avec locale i18n** (AC: AC1)
  - [x] Remplacer `'en-CA'` hardcodé par locale dynamique basée sur `i18n.language`
  - [x] FR: "350 000 $", EN: "$350,000"

- [x] **Task 4: Tests TransactionCard + CountdownBadge** (AC: tous, DoD)
  - [x] Créer `components/transaction/__tests__/TransactionCard.test.tsx`
  - [x] Test : affiche step name, client name, property address
  - [x] Test : affiche blocking badge quand blocking > 0
  - [x] Test : pas de blocking badge quand blocking = 0
  - [x] Test : CountdownBadge affiché avec deadline proche
  - [x] Test : pas de CountdownBadge si > 7 jours
  - [x] Test : CountdownBadge affiche texte overdue en rouge
  - [x] Test : CountdownBadge affiche "Aujourd'hui" pour deadline = today
  - [x] Test : TransactionCardSkeleton rend la structure
  - [x] Test : vitest-axe 0 violations WCAG
  - [x] Test : bordure gauche rouge si blocking, gris sinon

## Dev Notes

### Architecture Compliance

- **TransactionCard.tsx** dans `components/transaction/` — ne pas déplacer
- **CountdownBadge.tsx** dans `components/transaction/` — UX spec suggère `common/` mais garder en place pour l'instant (utilisé principalement dans le contexte transaction)
- **Barrel exports** dans `transaction/index.ts` — déjà en place, pas de modification nécessaire

### UX Spec — CountdownBadge States

| Délai | Texte FR | Texte EN | Couleur |
|-------|----------|----------|---------|
| Aujourd'hui | "Aujourd'hui!" | "Today!" | Rouge bold |
| Demain | "Demain" | "Tomorrow" | Orange |
| 2-7 jours | "dans X jours" | "in X days" | Warning orange |
| Passé | "il y a X jours" | "X days ago" | Rouge bold |
| > 7 jours | Caché | Hidden | — |
| Pas de deadline | Caché | Hidden | — |

### UX Spec — TransactionCard Left Border

| État | Couleur |
|------|---------|
| Conditions bloquantes en retard | Rouge (`border-destructive`) |
| Pas d'urgence | Gris (`border-border`) |

### Price Formatting

```typescript
// ❌ AVANT — locale hardcodée
transaction.salePrice.toLocaleString('en-CA', { ... })

// ✅ APRÈS — locale dynamique
const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA'
transaction.salePrice.toLocaleString(locale, { ... })
```

### Leçons Stories précédentes

- `renderWithProviders()` obligatoire pour tests composants
- `vi.useFakeTimers()` obligatoire pour tests impliquant des dates (CountdownBadge!)
- `data-testid` sur éléments interactifs
- Tokens sémantiques (pas de `text-gray-*`, utiliser `text-muted-foreground`)
- `aria-label` sur éléments avec signification visuelle seule

### Library/Framework Requirements

| Library | Version | Notes |
|---------|---------|-------|
| React | 19.2.0 | Hooks API |
| react-i18next | 16.5.3 | `useTranslation()`, `t()` |
| lucide-react | latest | AlertTriangle, Clock, User, ChevronRight |
| date-fns | 4.1.0 | Via `lib/date.ts` wrapper uniquement |

### File Structure

```
frontend/src/
├── components/
│   └── transaction/
│       ├── TransactionCard.tsx      ← MODIFIER (bordure gauche, locale prix)
│       ├── CountdownBadge.tsx       ← MODIFIER (texte humain, i18n, completedAt)
│       ├── __tests__/
│       │   └── TransactionCard.test.tsx  ← CRÉER
│       └── index.ts                 ← NE PAS MODIFIER
├── i18n/
│   └── locales/
│       ├── en/common.json           ← MODIFIER (ajouter clés countdown)
│       └── fr/common.json           ← MODIFIER (ajouter clés countdown)
└── lib/
    └── date.ts                      ← NE PAS MODIFIER
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2A.1 (lines 314-342)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#CountdownBadge (lines 1344-1367)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TransactionCard (lines 1399-1423)]
- [Source: _bmad-output/ofra-v2-decisions.md#AR13, AR16]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 4 test failures fixed: timezone offset on UTC midnight dates (T00:00:00Z → T12:00:00.000Z for CountdownBadge tests)

### Completion Notes List

- Task 1: CountdownBadge enrichi — texte humain i18n (Today/Tomorrow/in X days/X days ago), completedAt prop, aria-label. 4 clés countdown ajoutées EN+FR.
- Task 2: TransactionCard bordure gauche — `border-l-4 border-l-destructive` si blocking > 0, `border-l-border` sinon
- Task 3: Prix formaté avec locale dynamique (`fr-CA` ou `en-CA` selon i18n.language)
- Task 4: 17 tests créés (10 TransactionCard + 7 CountdownBadge) — step/client/address, blocking badge, left border, type badge, skeleton, a11y, countdown states
- All 81 tests pass (0 regressions), TypeScript clean

### File List

**Modified:**
- `frontend/src/components/transaction/CountdownBadge.tsx` — i18n, human-readable text, completedAt, aria-label
- `frontend/src/components/transaction/TransactionCard.tsx` — border-l-4 conditional, price locale dynamic
- `frontend/src/i18n/locales/en/common.json` — Added countdown.today, countdown.tomorrow, countdown.daysLeft, countdown.overdue
- `frontend/src/i18n/locales/fr/common.json` — Same 4 keys in French

**Created:**
- `frontend/src/components/transaction/__tests__/TransactionCard.test.tsx` — 17 tests (TransactionCard + CountdownBadge + Skeleton)

### Code Review (Murat/TEA) — 2026-01-27

**Reviewer:** Murat (TEA) — Adversarial Senior Developer Review
**Issues Found:** 0 HIGH, 0 MEDIUM, 2 LOW — **0 FIXED (all acceptable)**

| # | Sev | Issue | Fix |
|---|-----|-------|-----|
| L1 | LOW | parseISO + setHours mutates Date object | ACCEPTABLE — local variable, no side effects |
| L2 | LOW | border-l-destructive Tailwind v4 class | ACCEPTABLE — works with @theme CSS variables |

**Post-review:** 81/81 tests pass, TypeScript clean, 0 regressions.
