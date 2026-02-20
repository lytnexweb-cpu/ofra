# Story 2A.3: SearchBar + Filtrage par Step

Status: done

## Story

As a **real estate agent**,
I want **to search transactions by client or property name and filter by workflow step**,
So that **I can find a specific file instantly**.

## Acceptance Criteria

1. **Given** 10 transactions dont une avec client "Andre Cote" **When** l'agent tape "andre cote" dans la SearchBar **Then** seule la transaction "Andre Cote" s'affiche (normalizeSearch gere les accents) (FR20, AR4)

2. **Given** la SearchBar **When** l'agent tape du texte **Then** le filtrage est instantane (cote client, pas de requete API)

3. **Given** les 8 steps du template NB **When** l'agent clique sur le filtre par step **Then** les 8 steps sont affiches comme options (+ "Tous") **And** la selection d'un step filtre le listing immediatement (FR22)

4. **Given** un filtre step "Conditionnel" actif ET une recherche "dupont" **When** les deux sont combines **Then** seules les transactions au step Conditionnel avec client/propriete matchant "dupont" sont affichees

5. **Given** aucun resultat ne matche **When** le listing est vide apres filtrage **Then** un message "Aucune transaction trouvee" s'affiche avec suggestion de modifier les filtres

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : La SearchBar et le filtrage par step sont **completement implementes** dans TransactionsPage.tsx (lignes 54-55, 66-85, 114-155, 196-214). Tous les AC sont couverts. Manque uniquement les tests specifiques pour la recherche et le filtrage.

### AC1 — normalizeSearch filtre par accents : DONE
- `normalizeSearch()` dans `lib/utils.ts` (AR4)
- `useMemo` filtre cote client avec `normalizeSearch(searchQuery)` et `normalizeSearch(clientName + property)`

### AC2 — Filtrage instantane cote client : DONE
- `useMemo` sur `[sorted, searchQuery, stepFilter]`
- Pas de requete API, filtrage en memoire

### AC3 — Filtre step avec 8 options + "Tous" : DONE
- `STEP_SLUGS` array avec 8 slugs
- `<select>` avec `<option value="">{t('common.all')}</option>` + map des 8 steps
- `aria-label={t('transaction.step')}` (a11y)

### AC4 — Filtrage combine search + step : DONE
- Le `useMemo` applique les deux filtres sequentiellement (step d'abord, puis search)

### AC5 — Message "aucun resultat" : DONE
- `isFilteredEmpty` condition (lignes 87-88)
- Message avec `t('common.noResults')` + bouton `t('common.clearFilters')`

## Tasks / Subtasks

- [x] **Task 1: Ajouter tests SearchBar + filtrage dans TransactionsPage.test.tsx** (AC: tous, DoD)
  - [x] Test : recherche par nom de client filtre les TransactionCards
  - [x] Test : normalizeSearch gere les accents (AC1 — "andre cote" trouve "Andre Cote")
  - [x] Test : filtre step affiche seulement les transactions du step selectionne (AC3)
  - [x] Test : filtrage combine search + step (AC4)
  - [x] Test : message "aucun resultat" quand filtres ne matchent rien (AC5)
  - [x] Test : bouton "Effacer les filtres" reinitialise search et step
  - [x] Test : bouton X efface le champ de recherche

- [x] **Task 2: Verifier les hardcoded strings et a11y** (AC: DoD)
  - [x] Scanner la section search/filter pour strings non-i18n — CLEAN (all i18n'd)
  - [x] Verifier aria-labels et data-testid — CLEAN (search-input, step-filter, filter-bar, clear-filters-btn, filter-empty)

## Dev Notes

### Architecture Compliance

- **normalizeSearch()** dans `lib/utils.ts` — deja teste (9 tests dans `utils.test.ts`)
- **Filtrage cote client** via `useMemo` — pas de requete API (AC2)
- **STEP_SLUGS** hardcoded dans TransactionsPage — correspond au template NB (8 steps)

### Pattern de test

- Reutiliser les factories `makeTx`, `makeCondition`, `makeStep` de TransactionsPage.test.tsx
- Mock API avec `mockApiData()` existant
- Utiliser `userEvent` pour simuler la saisie dans le champ de recherche
- Utiliser `fireEvent.change` pour le select de step filter

### Lecons Stories precedentes

- `vi.useFakeTimers({ shouldAdvanceTime: true })` obligatoire pour tests avec `waitFor` + dates
- `T12:00:00.000Z` dans les dates de test pour eviter offset timezone
- `renderWithProviders()` obligatoire
- `as any` acceptable pour factories de test

### File Structure

```
frontend/src/
  pages/
    TransactionsPage.tsx         <- NE PAS MODIFIER (sauf si bug trouve)
    __tests__/
      TransactionsPage.test.tsx  <- MODIFIER (ajouter tests search/filter)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2A.3 (lines 376-405)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SearchBar]
- [Source: _bmad-output/planning-artifacts/ofra-v2-decisions.md#AR4]

## Dev Agent Record

### Debug Log References

- 0 failures — all 7 new tests passed on first run

### Completion Notes List

- Task 1: 7 tests added to TransactionsPage.test.tsx — search by name, accent-safe search (AR4), step filter, combined filter, no-results message, clear filters button, X clear button
- Task 2: Full scan — all strings i18n'd, all aria-labels and data-testid present
- No code changes to TransactionsPage.tsx (all functionality pre-implemented)
- All 95 tests pass (0 regressions), TypeScript clean

### File List

**Modified:**
- `frontend/src/pages/__tests__/TransactionsPage.test.tsx` — Added 7 search/filter tests (fireEvent-based)

**No production code changes.**

### Code Review (Murat/TEA) — 2026-01-27

**Reviewer:** Murat (TEA) — Adversarial Senior Developer Review
**Issues Found:** 0 HIGH, 0 MEDIUM, 1 LOW — **0 FIXED (acceptable)**

| # | Sev | Issue | Fix |
|---|-----|-------|-----|
| L1 | LOW | `as any` on client factory objects in test data | ACCEPTABLE — follows established test pattern |

**Post-review:** 95/95 tests pass, TypeScript clean, 0 regressions.
