# Story 2A.2: TransactionsPage Listing

Status: done

## Story

As a **real estate agent**,
I want **a listing page showing all my transactions as cards sorted by urgency**,
So that **I can answer "Where is my file?" in under 10 seconds (NFR3)**.

## Acceptance Criteria

1. **Given** l'agent a 5 transactions actives **When** il ouvre TransactionsPage **Then** 5 TransactionCards sont affichées, triées par urgence (blocages retard > deadlines proches > reste)

2. **Given** les données chargent **When** TransactionsPage est en état loading **Then** 3 Skeleton cards sont affichées (AR13)

3. **Given** l'API retourne les transactions **When** React Query fetch les données **Then** staleTime est 30s pour le listing (AR1)

4. **Given** un mobile 375px **When** la page est affichée **Then** les cards prennent toute la largeur avec espacement vertical 12px

5. **Given** un desktop 1280px **When** la page est affichée **Then** les cards s'affichent en grille 2 colonnes (lg: grid-cols-2)

6. **Given** l'API retourne une erreur réseau **When** TransactionsPage tente de charger **Then** un message d'erreur s'affiche avec bouton "Réessayer"

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : TransactionsPage.tsx (244 lignes) est **complètement implémentée**. Tous les AC sont couverts. Manque uniquement les tests de la page.

### AC1-6 — Tous DONE ✅

- React Query `staleTime: 30_000` (AR1) ✅
- Tri par urgence via `getUrgencyScore()` + `sortByUrgency()` ✅
- 3 Skeleton cards en loading (AR13) ✅
- Grille `grid-cols-1 lg:grid-cols-2 gap-3` ✅
- Error state avec retry button ✅
- EmptyState + ReturnBanner + WeeklySummary ✅
- FAB mobile 56px + bouton desktop ✅
- Search accent-safe + filtre step ✅
- i18n sur toutes les strings ✅
- data-testid sur éléments clés ✅

## Tasks / Subtasks

- [x] **Task 1: Créer tests TransactionsPage** (AC: tous, DoD)
  - [x] Créer `pages/__tests__/TransactionsPage.test.tsx`
  - [x] Test : affiche les TransactionCards triées par urgence
  - [x] Test : affiche 3 skeletons en loading
  - [x] Test : affiche error state avec retry button
  - [x] Test : affiche EmptyState quand 0 transactions
  - [x] Test : grille a la classe grid-cols-1 lg:grid-cols-2
  - [x] Test : FAB visible sur mobile
  - [x] Test : vitest-axe 0 violations WCAG

- [x] **Task 2: Vérifier les hardcoded strings restantes** (AC: DoD)
  - [x] Scanner TransactionsPage.tsx pour strings non-i18n
  - [x] Corrigé : `{t('common.close')} filters` → `{t('common.clearFilters')}` (line 210)

## Dev Notes

### File Structure

```
frontend/src/
├── pages/
│   ├── TransactionsPage.tsx         ← NE PAS MODIFIER (déjà complet)
│   └── __tests__/
│       └── TransactionsPage.test.tsx ← CRÉER
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2A.2 (lines 344-375)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TransactionsPage]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 6 test timeouts fixed: `vi.useFakeTimers()` freezes `setTimeout` used by `waitFor` → switched to `vi.useFakeTimers({ shouldAdvanceTime: true })`
- 1 WCAG a11y failure: `<select>` missing accessible name → added `aria-label={t('transaction.step')}`

### Completion Notes List

- Task 1: 7 tests created — urgency sort, 3 skeletons loading, error+retry, empty state, grid responsive classes, FAB, WCAG a11y
- Task 2: 1 hardcoded string found and fixed: `{t('common.close')} filters` → `{t('common.clearFilters')}`, key added EN+FR. Also added `aria-label` on `<select>` for a11y compliance.
- All 88 tests pass (0 regressions), TypeScript clean

### File List

**Modified:**
- `frontend/src/pages/TransactionsPage.tsx` — Fixed hardcoded "filters" string (line 210), added aria-label on step filter select
- `frontend/src/i18n/locales/en/common.json` — Added `common.clearFilters` key
- `frontend/src/i18n/locales/fr/common.json` — Added `common.clearFilters` key

**Created:**
- `frontend/src/pages/__tests__/TransactionsPage.test.tsx` — 7 tests (urgency sort, skeletons, error, empty, grid, FAB, a11y)

### Code Review (Murat/TEA) — 2026-01-27

**Reviewer:** Murat (TEA) — Adversarial Senior Developer Review
**Issues Found:** 0 HIGH, 0 MEDIUM, 3 LOW — **0 FIXED (all acceptable)**

| # | Sev | Issue | Fix |
|---|-----|-------|-----|
| L1 | LOW | `as any` type assertions on client factories | ACCEPTABLE — follows existing test patterns |
| L2 | LOW | `as Transaction` cast on makeTx return | ACCEPTABLE — same pattern in codebase |
| L3 | LOW | FAB test checks DOM presence only, not viewport | ACCEPTABLE — JSDOM cannot simulate breakpoints |

**Post-review:** 88/88 tests pass, TypeScript clean, 0 regressions.
