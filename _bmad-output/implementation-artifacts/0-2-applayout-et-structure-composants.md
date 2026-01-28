# Story 0.2: AppLayout et Structure Composants

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **a consistent app layout with sticky header, responsive container, and accessibility skip link**,
So that **I can navigate efficiently on any device with keyboard or screen reader**.

## Acceptance Criteria

1. **Given** j'ouvre l'app **When** la page se charge **Then** AppLayout affiche un container max-w-screen-xl centré (AR8) **And** le header est sticky en haut de page avec border-bottom ou shadow-sm

2. **Given** je suis sur n'importe quelle page **When** j'appuie sur Tab **Then** un lien "Skip to main content" apparaît et pointe vers #main (AR8)

3. **Given** le codebase **When** un composant est importé **Then** les barrel exports fonctionnent via `@/components/{folder}` (AR5)

4. **Given** la structure de dossiers **When** je vérifie les fichiers **Then** les dossiers `components/transaction/`, `components/common/`, `components/ui/` existent avec `index.ts` (AR11)

## Pre-Implementation Analysis: MOSTLY DONE

**CRITICAL FINDING** : Layout.tsx existe déjà (222 lignes, Epic 1 commit e5222a6). L'analyse exhaustive montre ~80% de couverture avec des corrections d'alignement nécessaires.

### AC1 — AppLayout container + sticky header : DONE ✅ (avec corrections)

**Layout.tsx** (222 lignes) implémente :
- Container `max-w-screen-xl mx-auto` ✅
- Sticky header `sticky top-0` ✅
- `shadow-sm` + `border-b border-border` ✅
- Responsive padding `px-4 sm:px-6 lg:px-8` ✅
- Mobile hamburger menu avec Framer Motion ✅
- Desktop nav links ✅
- Footer avec brand ✅

**Corrections nécessaires :**
- Header z-index : `z-dialog` (40) → `z-banner` (30) — AR3/UX spec dit z-banner pour le header
- 222 lignes > 200 max (NFR10) — Extraction sub-composants requise

### AC2 — Skip link #main : DONE ✅ (avec corrections)

- Skip link existe : `<a href="#main" className="skip-link">` ✅
- `id="main"` sur `<main>` ✅
- **Corrections :** Texte "Skip to main content" hardcodé anglais → i18n `t()`

### AC3 — Barrel exports : PARTIAL ⚠️

- `components/ui/index.ts` — 17 exports ✅
- `components/transaction/index.ts` — 16 exports ✅
- `components/common/index.ts` — Export vide `{}` ❌ (placeholder seulement)
- Imports via `@/components/ui` fonctionnent (tsconfig paths) ✅

### AC4 — Structure dossiers : DONE ✅

- `components/ui/` existe avec index.ts ✅
- `components/transaction/` existe avec index.ts ✅
- `components/common/` existe avec index.ts (vide) ✅

## Tasks / Subtasks — Corrections d'alignement

- [x] **Task 1: Refactorer Layout.tsx sous 200 lignes** (AC: NFR10)
  - [x] Extraire `MobileMenu.tsx` dans `components/common/` — menu hamburger + animation Framer Motion
  - [x] NavLinks inline dans Layout (not extracted — keeps it simple, 177 lines total)
  - [x] Layout.tsx final : 177 lignes (< 200)
  - [x] `MobileMenu.tsx` : 92 lignes (< 200)

- [x] **Task 2: Corriger z-index header** (AC: AR3, AC1)
  - [x] Changé `z-dialog` (40) → `z-banner` (30) dans Layout.tsx header `<nav>`

- [x] **Task 3: Ajouter i18n sur toutes les strings Layout** (AC: FR27, DoD)
  - [x] Nav labels : `t('nav.dashboard')`, `t('nav.clients')`, `t('nav.transactions')`, `t('nav.settings')`
  - [x] Skip link : `t('common.skipToContent')`
  - [x] Mobile menu : `t('common.openMenu')`
  - [x] Logout : `t('auth.logout')`, `t('auth.loggingOut')`
  - [x] Breadcrumb labels : `t('nav.dashboard')`, `t('nav.clients')`, etc. via labelMap
  - [x] Notifications title : `t('common.notifications')`
  - [x] Footer : `t('common.poweredBy')`
  - [x] Breadcrumb aria-label : `t('common.breadcrumb')`, go back : `t('common.goBack')`
  - [x] Clés ajoutées dans EN et FR : skipToContent, openMenu, notifications, poweredBy, breadcrumb, goBack, auth.logout, auth.loggingOut

- [x] **Task 4: Corriger Breadcrumb.tsx pour dark mode et tokens sémantiques** (AC: NFR9, DoD)
  - [x] `text-gray-600` → `text-muted-foreground`
  - [x] `text-gray-900` → `text-foreground`
  - [x] `text-blue-600 hover:text-blue-800` → `text-primary hover:text-primary/80`
  - [x] `text-gray-400` → `text-muted-foreground/50`
  - [x] `aria-label="Go back"` → `t('common.goBack')`

- [x] **Task 5: Ajouter aria-current="page" sur nav links actifs** (AC: NFR2, WCAG)
  - [x] Desktop nav links : `aria-current={active ? 'page' : undefined}`
  - [x] Mobile nav links : idem (in MobileMenu.tsx)
  - [x] Breadcrumb current item : `aria-current="page"`

- [x] **Task 6: Mettre à jour barrel exports common/** (AC: AC3, AC4)
  - [x] `common/index.ts` exporte MobileMenu
  - [x] Import `@/components/common` fonctionne

- [x] **Task 7: Test Layout + vitest-axe** (AC: NFR7, DoD)
  - [x] Créé `components/__tests__/Layout.test.tsx` — 10 tests
  - [x] Test render avec `renderWithProviders()` (MemoryRouter)
  - [x] Test skip link existe et pointe vers `#main`
  - [x] Test main element has id="main"
  - [x] Test nav links visibles sur desktop
  - [x] Test `aria-current="page"` sur lien actif (/ et /clients)
  - [x] Test pas d'aria-current sur liens inactifs
  - [x] Test z-banner class sur header nav
  - [x] Test vitest-axe 0 violations WCAG 2.1 AA
  - [x] Test dark mode : composant rend sans erreur avec `.dark` class

## Dev Notes

### Architecture Compliance

- **Layout.tsx** est dans `components/Layout.tsx` (pas `layouts/` comme suggéré par le UX spec). Le router l'importe depuis `../components/Layout`. **Ne pas déplacer** — garder la structure existante.
- **Breadcrumb.tsx** est dans `components/Breadcrumb.tsx` — composant commun, pourrait migrer vers `common/` mais hors scope story.
- **MobileMenu** extrait → `components/common/MobileMenu.tsx` avec barrel export.
- **router.tsx** — Ne PAS modifier. Imports depuis `../components/Layout` restent valides.

### Leçons Story 0.1

- Tous les nouveaux composants doivent avoir un test avec `renderWithProviders()` (pas `render()` nu)
- Utiliser les tokens sémantiques z-index (`z-banner`, `z-dialog`) — jamais `z-50` brut
- Chaque composant Radix avec Provider → monter le Provider dans le tree (App.tsx ou Layout)
- `tw-animate-css` est maintenant installé — les animations Radix fonctionnent

### Library/Framework Requirements

| Library | Version | Notes |
|---------|---------|-------|
| React | 19.2.0 | Hooks API, no class components |
| react-router-dom | 7.11.0 | createBrowserRouter, Outlet, useLocation |
| framer-motion | 12.27.1 | AnimatePresence + motion pour MobileMenu |
| react-i18next | 16.5.3 | `useTranslation()` hook, `t()` function |
| Tailwind CSS | 4.1.18 | v4 syntax, `@theme` config |

### File Structure Notes

```
frontend/src/
├── components/
│   ├── Layout.tsx           ← MODIFIER (refactor < 200 lignes, z-index, i18n)
│   ├── Breadcrumb.tsx       ← MODIFIER (dark mode tokens, i18n, aria-current)
│   ├── __tests__/
│   │   └── Layout.test.tsx  ← CRÉER
│   ├── common/
│   │   ├── MobileMenu.tsx   ← CRÉER (extrait de Layout)
│   │   └── index.ts         ← MODIFIER (ajouter export MobileMenu)
│   ├── transaction/
│   │   └── index.ts         ← EXISTANT (16 exports, ne pas toucher)
│   └── ui/
│       └── index.ts         ← EXISTANT (17 exports, ne pas toucher)
├── i18n/
│   └── locales/
│       ├── en/common.json   ← MODIFIER (ajouter clés nav, layout)
│       └── fr/common.json   ← MODIFIER (ajouter clés nav, layout)
└── app/
    └── router.tsx           ← NE PAS MODIFIER
```

### Testing Standards

- `renderWithProviders()` obligatoire (QueryClient + I18n + MemoryRouter)
- `vitest-axe` pour WCAG 2.1 AA automatisé
- `data-testid` sur éléments interactifs (AR6)
- Utiliser `initialRoute` pour tester la nav active

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AppLayout structure (line 2050-2068)]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#z-index convention (line 2071-2086)]
- [Source: _bmad-output/ofra-v2-decisions.md#AR3 z-index, AR5 barrel exports, AR8 AppLayout]

### Git Intelligence (last 5 commits)

```
e5222a6 feat: complete Epic 1 - Workflow Engine, Infrastructure & Planning Artifacts
c502bf5 fix: prefix unused transactionStatus prop to satisfy strict build
5ada8ad feat: add offers UI to transaction detail page
b19e4ce fix: drop status_histories CHECK constraints before migration update
ca47353 feat: refactor transaction pipeline and add offers system
```

Le commit `e5222a6` a créé Layout.tsx (222 lignes), Breadcrumb.tsx, router.tsx, barrel exports, et la structure de dossiers. Les tâches restantes sont des corrections d'alignement UX/accessibilité, pas des implémentations from scratch.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No errors encountered during implementation

### Completion Notes List

- Story analysée et contextualisée par John (PM) via create-story workflow
- AC1/AC2/AC4 déjà implémentés (~80%) par Epic 1 commit e5222a6
- AC3 partiellement — barrel exports UI et transaction OK, common/ vide
- 7 tasks d'alignement identifiées : refactor < 200 lignes, z-index, i18n, dark mode tokens, aria-current, barrel exports, test
- Task 1: Layout.tsx refactoré de 222 → 177 lignes. MobileMenu.tsx extrait (92 lignes) dans components/common/
- Task 2: z-dialog → z-banner sur header nav (AR3)
- Task 3: Toutes les strings hardcodées remplacées par t() — Layout, Breadcrumb, MobileMenu. 8 clés i18n ajoutées EN+FR
- Task 4: Breadcrumb dark mode — tous les gray-* remplacés par tokens sémantiques (muted-foreground, foreground, primary)
- Task 5: aria-current="page" ajouté sur desktop nav, mobile nav (MobileMenu), et breadcrumb current item
- Task 6: common/index.ts exporte MobileMenu
- Task 7: Layout.test.tsx créé — 10 tests (render, skip link, main#id, nav links, aria-current active/inactive/root, z-banner, axe WCAG, dark mode)
- All 40 frontend tests pass (0 regressions), TypeScript clean

### File List

**Modified:**
- `frontend/src/components/Layout.tsx` — Refactored: 222→177 lines, z-dialog→z-banner, i18n t(), aria-current, MobileMenu extraction
- `frontend/src/components/Breadcrumb.tsx` — Dark mode tokens, i18n t(), aria-current="page", aria-label breadcrumb
- `frontend/src/components/common/index.ts` — Added MobileMenu export
- `frontend/src/i18n/locales/en/common.json` — Added skipToContent, openMenu, notifications, poweredBy, breadcrumb, goBack, auth.logout, auth.loggingOut
- `frontend/src/i18n/locales/fr/common.json` — Added same keys in French

**Created:**
- `frontend/src/components/common/MobileMenu.tsx` — Extracted mobile menu with Framer Motion, i18n, aria-current
- `frontend/src/components/__tests__/Layout.test.tsx` — 10 Layout tests with renderWithProviders + vitest-axe

### Code Review (Murat/TEA) — 2026-01-27

**Reviewer:** Murat (TEA) — Adversarial Senior Developer Review
**Issues Found:** 1 HIGH, 3 MEDIUM, 2 LOW — **4 FIXED, 2 SKIPPED (hors scope/acceptable)**

| # | Sev | Issue | Fix |
|---|-----|-------|-----|
| H1 | HIGH | Header `<nav>` manque `aria-label` — WCAG landmark dupliqué avec Breadcrumb `<nav>` | Ajouté `aria-label={t('common.mainNavigation')}` + clé i18n EN/FR |
| M1 | MEDIUM | Bell button `title` au lieu de `aria-label` — pas un accessible name fiable | Changé `title` → `aria-label` |
| M2 | MEDIUM | Test `getByRole('navigation')` fragile — crash si multiple `<nav>` | Changé en `getByRole('navigation', { name: /main navigation/i })` |
| M3 | MEDIUM | CreateClientModal.tsx `<nav>` sans `aria-label` | SKIPPED — hors scope story |
| L1 | LOW | MobileMenu SVG inline au lieu de `LogoutIcon` de Icons.tsx | Remplacé par import `LogoutIcon` |
| L2 | LOW | `BRAND.copyright` hardcodé anglais | SKIPPED — copyright légal accepté en EN |

**Post-fix:** 40/40 tests pass, TypeScript clean, 0 regressions.
