# Story 0.1: Design System Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **shadcn/ui configured with Tailwind CSS variables (HSL), z-index convention, and dark mode support**,
So that **all Epic 2 components use a consistent, accessible design system from day one**.

## Acceptance Criteria

1. **Given** le frontend existant **When** shadcn/ui est initialisé **Then** les CSS variables utilisent le format HSL (AR2) **And** les composants shadcn Button, Card, Dialog, Sheet, Tabs, Badge, Input, Checkbox, Skeleton, Toast sont disponibles

2. **Given** le fichier tailwind.config **When** les z-index sont vérifiés **Then** fab(10), toast(20), banner(30), dialog(40), sheet(50) sont définis (AR3)

3. **Given** l'app avec `darkMode: 'class'` **When** l'OS est en dark mode **Then** les CSS variables basculent automatiquement (NFR9) **And** le mode peut être forcé manuellement via un toggle

## Pre-Implementation Analysis: ALREADY DONE

**CRITICAL FINDING**: Cette story est déjà implémentée à ~95% par le travail d'Epic 1. L'analyse exhaustive du codebase montre :

### AC1 — shadcn/ui + CSS Variables HSL : DONE ✅

**13 composants shadcn/ui déjà en place** dans `frontend/src/components/ui/` :
- `Button.tsx` — CVA variants (default, destructive, outline, secondary, ghost, link) + tailles (sm, default, lg, icon)
- `Card.tsx` — Compound component (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `Badge.tsx` — CVA variants (default, secondary, destructive, success, warning, outline)
- `Dialog.tsx` — Radix DialogPrimitive avec overlay, content, header, footer
- `Sheet.tsx` — Radix DialogPrimitive slide-out avec side variants (top, bottom, left, right)
- `Tabs.tsx` — Radix TabsPrimitive avec List, Trigger, Content
- `Input.tsx` — Styled text input avec focus rings
- `Checkbox.tsx` — Radix CheckboxPrimitive avec Check icon
- `Toast.tsx` — Radix ToastPrimitives avec variants (default, destructive, success)
- `Toaster.tsx` — Provider wrapper avec useToast hook
- `Skeleton.tsx` — Avec variants SkeletonCard, SkeletonChart, SkeletonList, SkeletonTable
- `ThemeToggle.tsx` — Toggle light/dark/system
- Icons.tsx (custom SVG icons)

**CSS Variables HSL dans `index.css`** :
- `--primary`: 214 53% 24% → #1E3A5F / dark: 213 94% 68% → #60A5FA
- `--accent`: 38 92% 50% → #F59E0B / dark: 38 93% 56% → #FBBF24
- `--success`: 160 84% 39% → #10B981 / dark: 160 67% 52% → #34D399
- `--destructive`: 0 84% 60% → #EF4444 / dark: 0 91% 71% → #F87171
- `--warning`: 25 95% 53% → #F97316 / dark: 24 94% 61% → #FB923C
- `--background`, `--card`, `--foreground`, `--muted`, `--border` — all HSL

**Barrel exports** : `components/ui/index.ts` exporte tout.

### AC2 — z-index Convention : DONE ✅

Défini dans `index.css` via Tailwind v4 `@theme` :
```css
--z-fab: 10;
--z-toast: 20;
--z-banner: 30;
--z-dialog: 40;
--z-sheet: 50;
```
Usage Tailwind : `z-fab`, `z-toast`, `z-banner`, `z-dialog`, `z-sheet`.

### AC3 — Dark Mode : DONE ✅

- `ThemeContext.tsx` — 3 modes (light, dark, system), localStorage persistence (`ofra-theme`), system preference detection via `matchMedia`, `useTheme()` hook
- `ThemeToggle.tsx` — Toggle UI component
- `index.css` — `.dark` class applies dark CSS variables
- `tailwind.config.js` — `darkMode: 'class'`

## Tasks / Subtasks — Remaining Gaps

Bien que les AC soient couverts, quelques ajustements mineurs sont nécessaires pour l'alignement Epic 2 :

- [x] **Task 1: Vérifier les touch target mobile** (AC: NFR2)
  - [x] S'assurer que Button variant mobile a `h-11 min-w-[44px]` (44px touch target) — Updated default to `h-11 sm:h-10`, icon to `h-11 w-11 sm:h-10 sm:w-10`
  - [x] Vérifier que Checkbox touch target est >= 44px sur mobile — Checkbox (20px) stays small; 44px touch area handled at ConditionCard wrapper level (Story 2B.5/2C.1)
  - [x] Pattern Tailwind attendu : `h-11 sm:h-9` — Applied `h-11 sm:h-10` (44px mobile, 40px desktop)

- [x] **Task 2: Vérifier la convention Tooltip (date complète au hover)** (AC: AR2)
  - [x] S'assurer que le composant Tooltip shadcn/ui est disponible — Created `Tooltip.tsx` with Radix TooltipPrimitive, installed `@radix-ui/react-tooltip`
  - [x] Vérifier import/export dans barrel — Added Tooltip, TooltipTrigger, TooltipContent, TooltipProvider to `index.ts`

- [x] **Task 3: Vérifier Sonner/Toast pattern pour optimistic updates** (AC: AR2)
  - [x] Confirmer que `toast.error(message, { action: { label, onClick } })` fonctionne — Toast accepts `action` prop (ToastAction component), pattern confirmed
  - [x] Vérifier que le toast bottom-center mobile / bottom-right desktop est configuré (AR14) — ToastViewport: full-width bottom on mobile (centered), `md:max-w-[420px]` right on desktop

- [x] **Task 4: Canary test design system** (AC: NFR7)
  - [x] Écrire un test minimaliste qui rend Button + Card + Badge avec `vitest-axe` et vérifie 0 violations — Created `design-system-canary.test.tsx` with 5 tests (render, variants, axe, dark mode)
  - [x] Confirmer que le composant se rend en dark mode aussi — Test applies `.dark` class to documentElement and verifies render

## Dev Notes

### Architecture Compliance

- **shadcn/ui** — Composants copiés localement dans `components/ui/`, pas de dépendance npm directe. Customisés avec CSS variables OFRA. [Source: ux-design-specification.md#Design System Foundation]
- **Radix UI** — Primitives pour keyboard nav, ARIA, focus management. `data-state` attributes pour tests. [Source: ux-design-specification.md#Design System Choice]
- **CVA** (class-variance-authority) — Pattern de variants pour Button, Badge, Toast. [Source: codebase analysis]
- **Tailwind v4** — `@import "tailwindcss"`, `@theme` pour variables, `@custom-variant dark` pour dark mode. Pas de `tailwind.config.ts` centralisé traditionnel — config dans `index.css`. [Source: codebase analysis]

### Library/Framework Requirements

| Library | Version | Notes |
|---------|---------|-------|
| React | 19.2.0 | Hooks API, no class components |
| Tailwind CSS | 4.1.18 | v4 syntax (`@import`, `@theme`, `@custom-variant`) |
| @radix-ui/* | Various | Checkbox 1.3.3, Dialog 1.1.15, Tabs 1.1.13, Toast 1.2.15 |
| class-variance-authority | 0.7.1 | Variant management |
| clsx + tailwind-merge | 2.1.1 / 3.4.0 | `cn()` utility in `lib/utils.ts` |
| lucide-react | 0.563.0 | Icon library (MVP) |
| date-fns | 4.1.0 | Date formatting (locale enCA) |
| i18next + react-i18next | 25.8.0 / 16.5.3 | i18n (not yet wired for design system labels) |

### File Structure Notes

```
frontend/src/
├── components/
│   ├── ui/              ← 13 shadcn/ui components + barrel exports
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Sheet.tsx
│   │   ├── Tabs.tsx
│   │   ├── Toast.tsx
│   │   ├── Toaster.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── index.ts
│   ├── transaction/     ← 16 domain components (already built)
│   └── common/          ← Empty barrel (placeholder)
├── contexts/
│   └── ThemeContext.tsx  ← Dark mode context
├── hooks/
│   └── use-toast.ts     ← Toast hook + imperative toast()
├── lib/
│   └── utils.ts         ← cn() + normalizeSearch()
└── index.css            ← Design tokens, z-index, fonts, focus ring
```

### Testing Standards

- `vitest-axe` pour WCAG 2.1 AA automatisé
- `data-testid` sur éléments interactifs
- `renderWithProviders()` helper (QueryClient + I18n + Router)
- Radix `data-state` attributes pour assertions stables
- `vi.useFakeTimers()` pour tests impliquant dates

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Customization Strategy]
- [Source: _bmad-output/ofra-v2-decisions.md#2. DECISIONS TECHNIQUES]
- [Source: _bmad-output/epic2-decisions.md#8. Charte graphique]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 0.1]

### Git Intelligence (last 5 commits)

```
e5222a6 feat: complete Epic 1 - Workflow Engine, Infrastructure & Planning Artifacts
c502bf5 fix: prefix unused transactionStatus prop to satisfy strict build
5ada8ad feat: add offers UI to transaction detail page
b19e4ce fix: drop status_histories CHECK constraints before migration update
ca47353 feat: refactor transaction pipeline and add offers system
```

Le commit `e5222a6` (+21126/-6271 lignes, 148 fichiers) a déjà livré l'essentiel du design system. Les tâches restantes sont des vérifications d'alignement, pas des implémentations majeures.

## Dev Agent Record

### Debug Log References

- No errors encountered during implementation

### Completion Notes List

- Story analysée et contextualisée par John (PM) via create-story workflow
- AC1/AC2/AC3 étaient déjà implémentés (~95%) par Epic 1 commit e5222a6
- Task 1: Button touch targets updated to 44px mobile (`h-11 sm:h-10`), Checkbox 44px deferred to wrapper component level
- Task 2: Created Tooltip.tsx component with @radix-ui/react-tooltip, added to barrel exports
- Task 3: Toast pattern verified — action prop supports rollback, viewport positioning correct (full-width mobile, 420px right desktop)
- Task 4: Created design-system-canary.test.tsx — 5 tests (render, Button variants, Badge variants, axe violations, dark mode)
- All 29 frontend tests pass (0 regressions), TypeScript clean

### Code Review (Murat/TEA) — 2026-01-27

**Reviewer:** Murat (TEA) — Adversarial Senior Developer Review
**Issues Found:** 2 HIGH, 3 MEDIUM, 2 LOW — **ALL FIXED**

| # | Sev | Issue | Fix |
|---|-----|-------|-----|
| H1 | HIGH | Tooltip.tsx `z-50` brut au lieu de token sémantique AR3 | Ajouté `--z-index-tooltip: 50` dans index.css, remplacé `z-50` → `z-tooltip` |
| H2 | HIGH | TooltipProvider absent du React tree — Tooltip ne fonctionne pas runtime | Ajouté `<TooltipProvider>` dans App.tsx |
| M1 | MEDIUM | Animations CSS mortes (animate-in, fade-in-0) — package manquant | Installé `tw-animate-css`, ajouté `@import "tw-animate-css"` dans index.css |
| M2 | MEDIUM | Test dark mode canary superficiel — assertions trop faibles | Renforcé le test avec assertions DOM explicites |
| M3 | MEDIUM | `use-toast.ts` useEffect dépendance `[state]` → re-subscribe chaque update | Corrigé en `[]` (mount/unmount seulement) |
| L1 | LOW | Canary test n'utilise pas `renderWithProviders` | Migré vers renderWithProviders, retiré beforeAll matchMedia |
| L2 | LOW | Button `sm` sans touch target 44px mobile | Ajouté `h-11 sm:h-9` pour cohérence NFR2 |

**Post-fix:** 30/30 tests pass, TypeScript clean, 0 régressions.

### File List

**Modified:**
- `frontend/src/components/ui/Button.tsx` — Touch target: default `h-11 sm:h-10`, sm `h-11 sm:h-9`, icon `h-11 w-11 sm:h-10 sm:w-10`
- `frontend/src/components/ui/Tooltip.tsx` — z-50 → z-tooltip (token sémantique AR3)
- `frontend/src/components/ui/index.ts` — Added Tooltip exports
- `frontend/src/App.tsx` — Added TooltipProvider wrapper
- `frontend/src/index.css` — Added tw-animate-css import + --z-index-tooltip token
- `frontend/src/hooks/use-toast.ts` — Fixed useEffect dependency [state] → []
- `frontend/package.json` — Added @radix-ui/react-tooltip + tw-animate-css
- `frontend/package-lock.json` — Lock file updated

**Created:**
- `frontend/src/components/ui/Tooltip.tsx` — Radix TooltipPrimitive wrapper (Tooltip, TooltipTrigger, TooltipContent, TooltipProvider)
- `frontend/src/components/__tests__/design-system-canary.test.tsx` — 6 design system canary tests with vitest-axe + Tooltip + dark mode
