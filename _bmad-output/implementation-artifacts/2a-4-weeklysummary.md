# Story 2A.4: WeeklySummary

Status: done

## Story

As a **real estate agent**,
I want **a weekly summary showing urgent deadlines and overdue conditions at the top of my listing**,
So that **I know immediately what needs my attention this week (NFR8)**.

## Acceptance Criteria

1. **Given** 2 conditions en retard et 3 deadlines cette semaine **When** TransactionsPage se charge **Then** le WeeklySummary affiche "2 en retard . 3 cette semaine" avec icones semantiques (FR21)

2. **Given** aucune urgence cette semaine **When** TransactionsPage se charge **Then** le WeeklySummary affiche "Tout est en ordre" avec icone succes (vert)

3. **Given** un mobile 375px **When** le WeeklySummary est affiche **Then** il est compact, une ligne, en haut de page avant les cards

4. **Given** un desktop 1280px **When** le WeeklySummary est affiche **Then** il peut s'etendre avec plus de details

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : WeeklySummary.tsx (70 lignes) est **completement implemente**. Composant pur (props-driven). Manque tests.

### AC1-2 — DONE
- `overdueCount` + `thisWeekCount` calcules via `useMemo` sur `transactions`
- i18n: `summary.overdue`, `summary.thisWeek`, `summary.allClear`
- Icons: AlertTriangle (destructive), Clock (warning), CheckCircle (success)

### AC3-4 — DONE (CSS-only)
- Layout compact `flex items-center gap-4 text-sm` — responsive par nature
- Cannot be tested in JSDOM (viewport-dependent)

## Tasks / Subtasks

- [x] **Task 1: Creer tests WeeklySummary** (AC: tous, DoD)
  - [x] Test : affiche overdue count avec icone AlertTriangle
  - [x] Test : affiche this-week count avec icone Clock
  - [x] Test : affiche separateur dot quand les deux sont presents
  - [x] Test : affiche "All clear" quand aucune urgence
  - [x] Test : ignore les conditions non-blocking ou completees
  - [x] Test : data-testid present
  - [x] Test : vitest-axe 0 violations WCAG

- [x] **Task 2: Verifier hardcoded strings** (AC: DoD)
  - [x] Scan — all strings i18n'd

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2A.4 (lines 405-427)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#WeeklySummary]
