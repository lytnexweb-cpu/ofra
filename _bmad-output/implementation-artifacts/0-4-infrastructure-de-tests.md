# Story 0.4: Infrastructure de Tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **vitest-axe configured with testing conventions and helpers**,
So that **every component test automatically validates accessibility and uses consistent selectors**.

## Acceptance Criteria

1. **Given** un fichier test de composant **When** vitest-axe est exécuté sur un composant rendu **Then** les violations WCAG 2.1 AA sont détectées et reportées (NFR7)

2. **Given** un test utilisant des éléments interactifs **When** les sélecteurs sont vérifiés **Then** `data-testid` est utilisé comme convention (AR6)

3. **Given** un test impliquant des dates ou timers **When** `vi.useFakeTimers()` est utilisé **Then** le comportement des timers est déterministe (AR7)

4. **Given** un helper de test `renderWithProviders()` **When** un composant est rendu dans un test **Then** il est wrappé avec QueryClientProvider + I18nextProvider + MemoryRouter **And** le paramètre `initialRoute` est supporté pour les tests nécessitant un contexte de routing

5. **Given** le test canari **When** un composant bidon est rendu avec `renderWithProviders()` + vitest-axe **Then** 0 violations WCAG sont détectées, prouvant que la chaîne fonctionne de bout en bout

## Pre-Implementation Analysis: DONE

**CRITICAL FINDING** : L'infrastructure de tests est **~95% implémentée** par les Stories 0.1, 0.2 et 0.3. L'analyse exhaustive montre que tous les AC sont couverts avec des corrections mineures.

### AC1 — vitest-axe détecte violations WCAG 2.1 AA : DONE ✅

- `test/setup.ts` : `expect.extend(matchers)` depuis `vitest-axe/matchers` ✅
- `@testing-library/jest-dom/vitest` importé ✅
- `cleanup()` après chaque test ✅
- Utilisé dans : canary.test.tsx, Layout.test.tsx, design-system-canary.test.tsx, ActionZone.test.tsx, ConditionsTab.test.tsx ✅

### AC2 — data-testid convention : DONE ✅

- Pattern `{composant}-{identifiant}` établi ✅
- Exemples : `canary-btn`, `action-zone`, `advance-step-btn`, `condition-card-{id}`, `toggle-condition-{id}`, `timeline-tab`, `activity-{id}` ✅
- Utilisé dans 6+ test files ✅

### AC3 — vi.useFakeTimers() déterministe : DONE ✅

- Démontré dans `lib/__tests__/date.test.ts` ✅
- Pattern : `beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(...) })` + `afterEach(() => { vi.useRealTimers() })` ✅

### AC4 — renderWithProviders() helper : DONE ✅

- `test/helpers.tsx` implémente `renderWithProviders()` ✅
- Wraps : QueryClientProvider (retry: false) + I18nextProvider + MemoryRouter ✅
- `initialRoute` supporté via `MemoryRouter initialEntries` ✅
- Retourne `{ ...render(), queryClient }` ✅

### AC5 — Test canari : DONE ✅

- `test/canary.test.tsx` : composant bidon + vitest-axe = 0 violations ✅
- `design-system-canary.test.tsx` : shadcn/ui components + vitest-axe ✅

### Inventaire tests existants (64 tests, 9 fichiers)

| Fichier | Tests | Type |
|---------|-------|------|
| canary.test.tsx | 2 | Infra canary |
| design-system-canary.test.tsx | 6 | UI components |
| Layout.test.tsx | 10 | Component + a11y |
| CreateTransactionModal.test.tsx | 5 | Component |
| ActionZone.test.tsx | 7 | Component + a11y |
| ConditionsTab.test.tsx | 7 | Component + a11y |
| LoginPage.test.tsx | ? | Page |
| utils.test.ts | 9 | Unit |
| date.test.ts | 13 | Unit + locale |

### Gap Analysis

Tous les AC sont couverts. Les gaps restants sont **hors scope** ou **optionnels** :

- **Documentation formelle** des conventions : HORS SCOPE (les patterns sont établis dans le code, pas besoin d'un TESTING.md séparé)
- **Couverture test des composants dashboard** : Sera fait dans les Epics 2A-2D quand ces composants seront refactorés
- **`mockFetch` helper** : Existe dans `setup.ts` mais le pattern d'utilisation varie (mock global vs vi.mock par fichier). Acceptable — les deux patterns coexistent.

## Tasks / Subtasks — Validation finale

- [x] **Task 1: Vérifier que tous les tests passent** (AC: tous)
  - [x] Run `vitest run` — confirmer 64/64 pass
  - [x] Run `tsc --noEmit` — confirmer TypeScript clean
  - [x] Vérifier 0 régressions

- [x] **Task 2: Valider la couverture des AC par les tests existants** (AC: AC1-AC5)
  - [x] AC1 : vitest-axe fonctionne (canary + 3 component tests prouvent)
  - [x] AC2 : data-testid utilisé dans 6+ tests
  - [x] AC3 : vi.useFakeTimers() dans date.test.ts
  - [x] AC4 : renderWithProviders() utilisé dans 7+ test files
  - [x] AC5 : canary.test.tsx + design-system-canary.test.tsx prouvent bout en bout

## Dev Notes

### Architecture Compliance

- **test/setup.ts** — Point d'entrée global des tests. Enregistre vitest-axe matchers, cleanup DOM, mock fetch.
- **test/helpers.tsx** — `renderWithProviders()` est LE helper standard. Tous les tests composants DOIVENT l'utiliser.
- **vite.config.ts** — Section `test` configure jsdom, setupFiles, include pattern.
- Pas de `vitest.config.ts` séparé — tout est dans `vite.config.ts`.

### Testing Conventions Établies

| Convention | Pattern | Référence |
|------------|---------|-----------|
| Render composants | `renderWithProviders(<Component />)` | AR17, test/helpers.tsx |
| Sélecteurs | `data-testid="{composant}-{id}"` | AR6 |
| Accessibilité | `const results = await axe(container); expect(results).toHaveNoViolations()` | NFR7 |
| Dates/Timers | `vi.useFakeTimers()` + `vi.setSystemTime()` dans `beforeEach` | AR7 |
| API mocking | `vi.mock('../../api/...')` ou `mockFetch` global | test/setup.ts |
| Toast dans tests | Wrapper `<Toaster />` si le composant utilise des toasts | UX Decision #4 |
| Unit tests | Simple `describe/it/expect` sans providers | lib/__tests__/*.ts |

### Leçons Stories précédentes

- `renderWithProviders()` obligatoire pour composants (pas `render()` nu)
- Tests doivent utiliser des sélecteurs spécifiques (ex: `getByRole('navigation', { name: /main navigation/i })`)
- Mock `i18n.language` via `vi.mock()` pour tester le locale switching
- `vi.useFakeTimers()` + `vi.useRealTimers()` dans beforeEach/afterEach

### Library/Framework Requirements

| Library | Version | Notes |
|---------|---------|-------|
| vitest | 4.0.17 | Test runner |
| vitest-axe | 0.1.0 | WCAG 2.1 AA automated testing |
| @testing-library/react | 16.3.1 | Component testing |
| @testing-library/jest-dom | 6.9.1 | Custom matchers (toBeInTheDocument, etc.) |
| @testing-library/user-event | 14.6.1 | User interaction simulation |
| jsdom | 27.4.0 | DOM environment |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.4 (lines 279-310)]
- [Source: _bmad-output/ofra-v2-decisions.md#Testing Strategy (lines 177-184)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Test Conventions (lines 1831-1851)]
- [Source: _bmad-output/implementation-artifacts/0-3-i18n-et-utilitaires.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No errors encountered — pure validation story

### Completion Notes List

- Story 0.4 is 100% pre-implemented by Stories 0.1, 0.2, and 0.3
- Task 1: 64/64 tests pass, TypeScript clean, 0 regressions
- Task 2: All 5 AC validated:
  - AC1: vitest-axe in 6 test files with `toHaveNoViolations()`
  - AC2: `data-testid` in 23 files, 72 occurrences
  - AC3: `vi.useFakeTimers()` in date.test.ts
  - AC4: `renderWithProviders()` in 6 test files
  - AC5: canary.test.tsx + design-system-canary.test.tsx prove end-to-end
- No code changes required — all infrastructure was already in place

### File List

**No files modified or created** — validation-only story.

### Code Review (Murat/TEA) — 2026-01-27

**Reviewer:** Murat (TEA)
**Verdict:** PASS — No code changes to review. All AC validated by existing test infrastructure. 64/64 tests green.
