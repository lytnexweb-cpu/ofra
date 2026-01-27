---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: 2026-01-27
inputDocuments:
  - product-brief-ofra-2026-01-25.md
  - ofra-v2-decisions.md
  - epic2-decisions.md
  - ux-design-specification.md
  - epic1-validation-report.md
summary:
  epics: 5
  stories: 22
  acceptanceCriteria: 76
  requirementsCovered: 55/55
  forwardDependencies: 0
  agentValidationRounds: 6
---

# Ofra — Epic 2 : Refonte UI Transaction — Epic Breakdown

## Overview

Ce document décompose l'Epic 2 (Refonte UI Transaction) en stories d'implémentation avec acceptance criteria. L'Epic 1 (Workflow Engine + Infrastructure) est validé et clos — le backend, les models, les API, les services et les tests sont en place (44 tests, tous passent).

L'Epic 2 est un Epic **purement frontend** qui transforme le god component `TransactionDetailPage.tsx` (1600 lignes) en une interface hiérarchisée, mobile-first, avec onglets et zone d'action urgente.

## Requirements Inventory

### Functional Requirements

FR1: TransactionDetailPage splittée en sous-composants orchestrés (< 200 lignes chacun)
FR2: TransactionHeader affiche client, propriété, navigation retour
FR3: StepProgressBar affiche les 8 étapes du template avec statuts (done/active/future) sur desktop
FR4: StepperPill affiche résumé compact "Étape N/8 — Nom" avec barre de progression sur mobile
FR5: StepperBottomSheet affiche stepper complet vertical au tap sur StepperPill
FR6: ActionZone affiche conditions bloquantes, deadlines imminentes, boutons Avancer/Passer
FR7: Blocking check empêche l'avancement si conditions bloquantes pending (appel API advanceStep)
FR8: Modal premier blocage avec message pédagogique + option "Ne plus afficher"
FR9: Banner inline pour blocages subséquents (après première modal dismissée)
FR10: Onglets state-based (React state, pas router) : Conditions, Offres, Documents, Timeline, Notes
FR11: ConditionsTab : checklist conditions par step, cochables individuellement
FR12: ConditionCard : titre, statut, type blocking/normal, deadline, CountdownBadge
FR13: Toggle condition (complete/uncomplete) avec optimistic update React Query
FR14: OffersTab : wrap du composant OffersSection existant
FR15: DocumentsTab : liens documents par condition
FR16: TimelineTab : ActivityFeed unifié paginé (GET /api/transactions/:id/activity)
FR17: NotesTab : CRUD notes par transaction
FR18: TransactionsPage listing avec step actuel, client, propriété, badges statut
FR19: TransactionCard : step actuel, nom client, conditions bloquantes, deadline prochaine
FR20: SearchBar : recherche client/propriété avec normalizeSearch (accents-safe)
FR21: WeeklySummary : résumé urgences et deadlines de la semaine
FR22: Filtrage par step dans TransactionsPage
FR23: Création transaction via Sheet mobile / Dialog desktop (client, propriété, template, prix)
FR24: FAB 56px mobile pour création rapide, bouton texte dans header desktop
FR25: EmptyState pour jour 1 (0 transactions) avec CTA et illustration
FR26: ReturnBanner conditionnel si absent > 24h (localStorage lastSeenAt)
FR27: Toutes les strings UI via i18n t() — clés anglaises, valeurs FR + EN
FR28: CountdownBadge : affiche jours restants ou retard avec couleur sémantique

### Non-Functional Requirements

NFR1: Mobile-first responsive (< 640px défaut, sm: 640px+, lg: 1024px+, xl: 1280px+)
NFR2: WCAG 2.1 AA (contrastes 4.5:1, touch targets 44px mobile, keyboard navigation, ARIA labels)
NFR3: "Où est mon dossier ?" répondable en < 10 secondes (listing)
NFR4: Création transaction en < 5 minutes
NFR5: Session moyenne 3-5 minutes (efficace)
NFR6: Tests frontend coverage 80%+ (Vitest + Testing Library)
NFR7: vitest-axe en CI pour tests accessibilité automatisés
NFR8: Zéro surcharge cognitive — information hiérarchisée par priorité
NFR9: Dark mode + Light mode (auto via prefers-color-scheme, toggle manuel)
NFR10: Chaque composant < 200 lignes

### Additional Requirements

**Architecture (ofra-v2-decisions.md) :**
AR1: React Query — staleTime 30s listing, 0 detail, optimistic updates sur mutations
AR2: shadcn/ui design system (Radix UI + Tailwind, CSS variables HSL)
AR3: z-index convention Tailwind config : fab(10), toast(20), banner(30), dialog(40), sheet(50)
AR4: normalizeSearch() dans lib/utils.ts — NFD + remove diacritics + lowercase + trim
AR5: Barrel exports index.ts par dossier — imports via @/components/{folder}
AR6: data-testid convention pour sélecteurs de test
AR7: vi.useFakeTimers() obligatoire pour tests dates
AR8: AppLayout.tsx : container max-w-screen-xl, sticky header, skip link #main

**UX (ux-design-specification.md) :**
AR9: Focus ring dark mode : ring-2 ring-primary ring-offset-2 ring-offset-background
AR10: font-display: swap vérifié pour Inter + JetBrains Mono
AR11: 22 composants : 10 shadcn/ui + 8 transaction + 4 common (structure fichiers définie)
AR12: Dialog = confirmations, Sheet bottom = formulaires (convention mobile)
AR13: Skeleton cards miment structure exacte TransactionCard (3 lignes)
AR14: Toast bottom-center mobile (bottom-4), bottom-right desktop
AR15: date-fns locale enCA (canadien, pas US)
AR16: Couleur jamais seule comme signal — toujours couleur + icône + texte
AR17: Checklist composant : mobile 375px + desktop 1280px + vitest-axe 0 violations + keyboard nav + aria labels + data-testid + i18n t()

### FR Coverage Map

| Requirement | Story 0 | Epic 2A | Epic 2B | Epic 2C | Epic 2D | Cross-cutting |
|-------------|---------|---------|---------|---------|---------|---------------|
| FR1  | | | ✅ | | | |
| FR2  | | | ✅ | | | |
| FR3  | | | ✅ | | | |
| FR4  | | | ✅ | | | |
| FR5  | | | ✅ | | | |
| FR6  | | | | ✅ | | |
| FR7  | | | | ✅ | | |
| FR8  | | | | ✅ | | |
| FR9  | | | | ✅ | | |
| FR10 | | | ✅ | | | |
| FR11 | | | ✅ | | | |
| FR12 | | | ✅ | | | |
| FR13 | | | | ✅ | | |
| FR14 | | | | | ✅ | |
| FR15 | | | | | ✅ | |
| FR16 | | | | | ✅ | |
| FR17 | | | | | ✅ | |
| FR18 | | ✅ | | | | |
| FR19 | | ✅ | | | | |
| FR20 | | ✅ | | | | |
| FR21 | | ✅ | | | | |
| FR22 | | ✅ | | | | |
| FR23 | | ✅ | | | | |
| FR24 | | ✅ | | | | |
| FR25 | | ✅ | | | | |
| FR26 | | ✅ (nice-to-have) | | | | |
| FR27 | | | | | | ✅ (toutes stories) |
| FR28 | | ✅ | ✅ | | | |
| NFR1-10 | | | | | | ✅ (Definition of Done) |
| AR1-AR17 | ✅ (setup) | | | | | ✅ (conventions) |

## Epic List

### Story 0 : Foundation

**But** : Poser les bases techniques communes à tous les epics — shadcn/ui, AppLayout, composants communs, utilitaires, configuration i18n, setup tests.

**Requirements** : AR1-AR17 (setup initial), NFR1 (responsive skeleton), NFR2 (WCAG fondations), NFR6-7 (test infra)

**Tâches Winston (détaillées)** :
1. Installer/configurer shadcn/ui (Radix + Tailwind CSS variables HSL)
2. Créer AppLayout.tsx (container max-w-screen-xl, sticky header, skip link #main)
3. Créer normalizeSearch() dans lib/utils.ts
4. Configurer z-index convention dans tailwind.config
5. Créer structure dossiers composants avec barrel exports
6. Setup vitest-axe + data-testid convention
7. Configurer i18n (react-i18next, détection langue, fichiers FR/EN)

---

### Epic 2A : Voir et créer mes dossiers

**But** : L'agent immobilier peut voir tous ses dossiers, rechercher, filtrer, et créer une nouvelle transaction. Répond au besoin « Où est mon dossier ? » en < 10 secondes.

**Requirements** : FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26 (nice-to-have), FR28

---

### Epic 2B : Comprendre mon dossier (lecture)

**But** : L'agent ouvre un dossier et comprend instantanément : quelle étape, quelles conditions, quel état. Tout est lisible, rien n'est interactif. ConditionCard avec `interactive: false`.

**Requirements** : FR1, FR2, FR3, FR4, FR5, FR10, FR11, FR12, FR28

---

### Epic 2C : Agir sur mon dossier (interaction)

**But** : L'agent peut agir — cocher des conditions, avancer/passer une étape, gérer les blocages. ConditionCard avec `interactive: true`. Zone d'action urgente.

**Requirements** : FR6, FR7, FR8, FR9, FR13

---

### Epic 2D : Historique complet

**But** : L'agent accède à l'historique et aux données complémentaires : offres, documents, timeline d'activité, notes.

**Requirements** : FR14, FR15, FR16, FR17

---

### Definition of Done (globale — s'applique à CHAQUE story)

Chaque story est considérée terminée uniquement si :

- [ ] i18n : Toutes les strings via `t()` — clés anglaises, valeurs FR + EN (FR27)
- [ ] Accessibilité : vitest-axe 0 violations (NFR7)
- [ ] Tests : data-testid sur éléments interactifs (AR6)
- [ ] Responsive : Testé mobile 375px + desktop 1280px (NFR1)
- [ ] Dark mode : Vérifié light + dark (NFR9)
- [ ] Coverage : Tests Vitest + Testing Library (NFR6)
- [ ] Taille : Chaque composant < 200 lignes (NFR10)
- [ ] Keyboard : Navigation clavier fonctionnelle (NFR2)
- [ ] ARIA : Labels appropriés sur éléments interactifs (NFR2)
- [ ] Touch : Targets 44px minimum sur mobile (NFR2)

---

## Story 0 : Foundation

Poser les bases techniques communes à tous les epics — shadcn/ui, AppLayout, composants communs, utilitaires, configuration i18n, setup tests. Aucune fonctionnalité utilisateur visible, mais tout le reste en dépend.

### Story 0.1 : Design System Foundation

As a **developer**,
I want **shadcn/ui configured with Tailwind CSS variables (HSL), z-index convention, and dark mode support**,
So that **all Epic 2 components use a consistent, accessible design system from day one**.

**Acceptance Criteria:**

**Given** le frontend existant
**When** shadcn/ui est initialisé
**Then** les CSS variables utilisent le format HSL (AR2)
**And** les composants shadcn Button, Card, Dialog, Sheet, Tabs, Badge, Input, Checkbox, Skeleton, Toast sont disponibles

**Given** le fichier tailwind.config
**When** les z-index sont vérifiés
**Then** fab(10), toast(20), banner(30), dialog(40), sheet(50) sont définis (AR3)

**Given** l'app avec `darkMode: 'class'`
**When** l'OS est en dark mode
**Then** les CSS variables basculent automatiquement (NFR9)
**And** le mode peut être forcé manuellement via un toggle

### Story 0.2 : AppLayout et Structure Composants

As a **user**,
I want **a consistent app layout with sticky header, responsive container, and accessibility skip link**,
So that **I can navigate efficiently on any device with keyboard or screen reader**.

**Acceptance Criteria:**

**Given** j'ouvre l'app
**When** la page se charge
**Then** AppLayout affiche un container max-w-screen-xl centré (AR8)
**And** le header est sticky en haut de page avec border-bottom ou shadow-sm

**Given** je suis sur n'importe quelle page
**When** j'appuie sur Tab
**Then** un lien "Skip to main content" apparaît et pointe vers #main (AR8)

**Given** le codebase
**When** un composant est importé
**Then** les barrel exports fonctionnent via `@/components/{folder}` (AR5)

**Given** la structure de dossiers
**When** je vérifie les fichiers
**Then** les dossiers `components/transaction/`, `components/common/`, `components/ui/` existent avec `index.ts` (AR11)

### Story 0.3 : i18n et Utilitaires

As a **bilingual user (FR/EN)**,
I want **the interface in my preferred language with accent-safe search**,
So that **I can use Ofra naturally in French or English**.

**Acceptance Criteria:**

**Given** un navigateur configuré en français
**When** l'app se charge
**Then** toutes les strings s'affichent en français via react-i18next

**Given** un navigateur configuré en anglais
**When** l'app se charge
**Then** toutes les strings s'affichent en anglais

**Given** la fonction normalizeSearch()
**When** j'appelle `normalizeSearch("Étape conditionnel")`
**Then** le résultat est `"etape conditionnel"` (NFD + remove diacritics + lowercase + trim) (AR4)

**Given** date-fns est configuré
**When** une date est formatée
**Then** le locale `enCA` est utilisé (pas US) (AR15)

**Given** les fichiers i18n
**When** je vérifie `locales/en/common.json` et `locales/fr/common.json`
**Then** les deux fichiers contiennent les clés de base (navigation, common actions, labels)

### Story 0.4 : Infrastructure de Tests

As a **developer**,
I want **vitest-axe configured with testing conventions and helpers**,
So that **every component test automatically validates accessibility and uses consistent selectors**.

**Acceptance Criteria:**

**Given** un fichier test de composant
**When** vitest-axe est exécuté sur un composant rendu
**Then** les violations WCAG 2.1 AA sont détectées et reportées (NFR7)

**Given** un test utilisant des éléments interactifs
**When** les sélecteurs sont vérifiés
**Then** `data-testid` est utilisé comme convention (AR6)

**Given** un test impliquant des dates ou timers
**When** `vi.useFakeTimers()` est utilisé
**Then** le comportement des timers est déterministe (AR7)

**Given** un helper de test `renderWithProviders()`
**When** un composant est rendu dans un test
**Then** il est wrappé avec QueryClientProvider + I18nextProvider + MemoryRouter
**And** le paramètre `initialRoute` est supporté pour les tests nécessitant un contexte de routing

**Given** le test canari
**When** un composant bidon est rendu avec `renderWithProviders()` + vitest-axe
**Then** 0 violations WCAG sont détectées, prouvant que la chaîne fonctionne de bout en bout

---

## Epic 2A : Voir et créer mes dossiers

L'agent immobilier peut voir tous ses dossiers, rechercher, filtrer, et créer une nouvelle transaction. Répond au besoin « Où est mon dossier ? » en < 10 secondes.

### Story 2A.1 : TransactionCard + CountdownBadge

As a **real estate agent**,
I want **to see a card for each transaction showing the current step, client name, blocking conditions count, and nearest deadline**,
So that **I can scan my caseload at a glance and spot urgent items**.

**Acceptance Criteria:**

**Given** une transaction avec step actuel "Conditionnel", client "Dupont", propriété "123 Rue Main"
**When** la TransactionCard est rendue
**Then** elle affiche le nom du step actuel, le nom du client, l'adresse de la propriété
**And** un badge indique le nombre de conditions bloquantes en retard (rouge si > 0)

**Given** une condition avec deadline dans 3 jours
**When** le CountdownBadge est rendu
**Then** il affiche "3j" en couleur warning (orange) (FR28)
**And** l'icône + texte sont présents (jamais couleur seule — AR16)

**Given** une condition avec deadline dépassée de 2 jours
**When** le CountdownBadge est rendu
**Then** il affiche "-2j" en couleur danger (rouge)

**Given** une transaction sans conditions bloquantes
**When** la TransactionCard est rendue
**Then** aucun badge rouge n'apparaît

**Given** le composant en Skeleton loading
**When** les données ne sont pas encore chargées
**Then** un Skeleton mime la structure exacte de la TransactionCard (3 lignes) (AR13)

### Story 2A.2 : TransactionsPage Listing

As a **real estate agent**,
I want **a listing page showing all my transactions as cards sorted by urgency**,
So that **I can answer "Where is my file?" in under 10 seconds (NFR3)**.

**Acceptance Criteria:**

**Given** l'agent a 5 transactions actives
**When** il ouvre TransactionsPage
**Then** 5 TransactionCards sont affichées, triées par urgence (blocages retard > deadlines proches > reste)

**Given** les données chargent
**When** TransactionsPage est en état loading
**Then** 3 Skeleton cards sont affichées (AR13)

**Given** l'API retourne les transactions
**When** React Query fetch les données
**Then** staleTime est 30s pour le listing (AR1)

**Given** un mobile 375px
**When** la page est affichée
**Then** les cards prennent toute la largeur avec espacement vertical 12px

**Given** un desktop 1280px
**When** la page est affichée
**Then** les cards s'affichent en grille 2 colonnes (lg: grid-cols-2)

**Given** l'API retourne une erreur réseau
**When** TransactionsPage tente de charger
**Then** un message d'erreur s'affiche avec bouton "Réessayer"

### Story 2A.3 : SearchBar + Filtrage par Step

As a **real estate agent**,
I want **to search transactions by client or property name and filter by workflow step**,
So that **I can find a specific file instantly**.

**Acceptance Criteria:**

**Given** 10 transactions dont une avec client "André Côté"
**When** l'agent tape "andre cote" dans la SearchBar
**Then** seule la transaction "André Côté" s'affiche (normalizeSearch gère les accents) (FR20, AR4)

**Given** la SearchBar
**When** l'agent tape du texte
**Then** le filtrage est instantané (côté client, pas de requête API)

**Given** les 8 steps du template NB
**When** l'agent clique sur le filtre par step
**Then** les 8 steps sont affichés comme options (+ "Tous")
**And** la sélection d'un step filtre le listing immédiatement (FR22)

**Given** un filtre step "Conditionnel" actif ET une recherche "dupont"
**When** les deux sont combinés
**Then** seules les transactions au step Conditionnel avec client/propriété matchant "dupont" sont affichées

**Given** aucun résultat ne matche
**When** le listing est vide après filtrage
**Then** un message "Aucune transaction trouvée" s'affiche avec suggestion de modifier les filtres

### Story 2A.4 : WeeklySummary

As a **real estate agent**,
I want **a weekly summary showing urgent deadlines and overdue conditions at the top of my listing**,
So that **I know immediately what needs my attention this week (NFR8)**.

**Acceptance Criteria:**

**Given** 2 conditions en retard et 3 deadlines cette semaine
**When** TransactionsPage se charge
**Then** le WeeklySummary affiche "2 en retard · 3 cette semaine" avec icônes sémantiques (FR21)

**Given** aucune urgence cette semaine
**When** TransactionsPage se charge
**Then** le WeeklySummary affiche "Tout est en ordre" avec icône succès (vert)

**Given** un mobile 375px
**When** le WeeklySummary est affiché
**Then** il est compact, une ligne, en haut de page avant les cards

**Given** un desktop 1280px
**When** le WeeklySummary est affiché
**Then** il peut s'étendre avec plus de détails (nombre par catégorie)

### Story 2A.5 : Création Transaction

As a **real estate agent**,
I want **to create a new transaction by selecting client, property, template, and price**,
So that **I can start tracking a new deal in under 5 minutes (NFR4)**.

**Acceptance Criteria:**

**Given** un mobile 375px
**When** l'agent appuie sur le FAB (bouton flottant 56px en bas à droite)
**Then** un Sheet bottom s'ouvre avec le formulaire de création (FR23, FR24, AR12)
**And** le FAB a z-index fab(10) (AR3)

**Given** un desktop 1280px
**When** l'agent clique sur le bouton "Nouvelle transaction" dans le header
**Then** un Dialog s'ouvre avec le formulaire de création (FR23, FR24, AR12)

**Given** le formulaire de création
**When** l'agent remplit client, propriété, template (dropdown NB Purchase/Sale), prix
**Then** tous les champs sont validés (required)
**And** le prix accepte les formats "350000" et "350 000"

**Given** le formulaire soumis avec données valides
**When** l'API createTransaction répond 201
**Then** un Toast confirme la création ("Transaction créée")
**And** le listing se rafraîchit automatiquement (React Query invalidation)
**And** la nouvelle transaction apparaît dans le listing

**Given** le formulaire soumis
**When** l'API retourne une erreur
**Then** un Toast d'erreur s'affiche et le formulaire reste ouvert

### Story 2A.6 : EmptyState + ReturnBanner

As a **new real estate agent**,
I want **a welcoming empty state on day 1 with a clear call to action**,
So that **I know exactly how to start using Ofra (FR25)**.

**Acceptance Criteria:**

**Given** 0 transactions dans le système
**When** TransactionsPage se charge
**Then** un EmptyState s'affiche avec illustration, titre "Aucune transaction", description explicative, et bouton CTA "Créer ma première transaction" (FR25)

**Given** l'EmptyState affiché
**When** l'agent clique sur le CTA
**Then** le formulaire de création (Story 2A.5) s'ouvre

**Given** l'agent revient après > 24h d'absence (nice-to-have)
**When** TransactionsPage se charge
**Then** un ReturnBanner s'affiche en haut : "Bienvenue ! Voici ce qui a changé depuis votre dernière visite" (FR26)
**And** lastSeenAt est stocké en localStorage

**Given** l'agent revient après < 24h
**When** TransactionsPage se charge
**Then** aucun ReturnBanner ne s'affiche

---

## Epic 2B : Comprendre mon dossier (lecture)

L'agent ouvre un dossier et comprend instantanément : quelle étape, quelles conditions, quel état. Tout est lisible, rien n'est interactif. ConditionCard avec `interactive: false`.

### Story 2B.1 : TransactionHeader

As a **real estate agent**,
I want **to see the client name, property address, and a back button at the top of a transaction**,
So that **I always know which file I'm looking at and can return to the listing**.

**Acceptance Criteria:**

**Given** une transaction avec client "Marie Dupont" et propriété "456 Rue Principale, Moncton"
**When** TransactionHeader est rendu
**Then** le nom du client et l'adresse de la propriété sont affichés (FR2)

**Given** je suis sur TransactionDetailPage
**When** je clique sur le bouton retour (flèche gauche)
**Then** je suis redirigé vers TransactionsPage

**Given** un mobile 375px
**When** le header est affiché
**Then** le client et la propriété sont sur deux lignes, texte tronqué avec ellipsis si trop long

**Given** un desktop 1280px
**When** le header est affiché
**Then** le client et la propriété sont sur une ligne

### Story 2B.2 : StepProgressBar (desktop) + StepperPill (mobile)

As a **real estate agent**,
I want **to see the current workflow step visualized as a horizontal progress bar on desktop and a compact pill on mobile**,
So that **I instantly know where the transaction stands in the 8-step process**.

**Acceptance Criteria:**

**Given** une transaction au step 4/8 "Conditionnel" sur desktop (>= 640px)
**When** StepProgressBar est rendu
**Then** les 8 étapes sont affichées horizontalement avec statuts visuels : done (vert + check), active (accent + pulse), future (gris) (FR3)
**And** chaque step a un label visible
**And** couleur + icône + texte sont combinés (jamais couleur seule — AR16)

**Given** une transaction au step 4/8 "Conditionnel" sur mobile (< 640px)
**When** StepperPill est rendu
**Then** une pill compacte affiche "Étape 4/8 — Conditionnel" (FR4)
**And** une barre de progression montre 50% (4/8)

**Given** une transaction au step 1/8 "Consultation"
**When** le stepper est rendu
**Then** seul le step 1 est actif, les 7 autres sont futurs

**Given** une transaction au step 8/8 "Post-closing"
**When** le stepper est rendu
**Then** les steps 1-7 sont done, le step 8 est actif

### Story 2B.3 : StepperBottomSheet

As a **real estate agent on mobile**,
I want **to tap the stepper pill to see the full vertical step list in a bottom sheet**,
So that **I can review all 8 steps with their statuses on my phone**.

**Acceptance Criteria:**

**Given** un mobile (< 640px) avec StepperPill affiché
**When** l'agent tape sur la StepperPill
**Then** un BottomSheet s'ouvre avec le stepper complet en layout vertical (FR5)
**And** le BottomSheet a z-index sheet(50) (AR3)

**Given** le StepperBottomSheet ouvert
**When** les 8 steps sont affichés verticalement
**Then** chaque step montre : numéro, nom, statut (done/active/future) avec icône + couleur
**And** le step actif est visuellement mis en évidence (bordure accent, fond léger)

**Given** le StepperBottomSheet ouvert
**When** l'agent swipe down ou clique sur le backdrop
**Then** le BottomSheet se ferme

**Given** un desktop (>= 640px)
**When** la page est affichée
**Then** StepperPill et StepperBottomSheet ne sont pas rendus (StepProgressBar horizontal suffit)

### Story 2B.4 : TransactionDetailPage Orchestrator + Onglets

As a **real estate agent**,
I want **the transaction detail page organized with header, stepper, and tabbed sections**,
So that **information is hierarchized and I'm not overwhelmed by a wall of data (NFR8)**.

**Acceptance Criteria:**

**Given** l'ancien god component TransactionDetailPage (1600 lignes)
**When** le nouveau orchestrateur est implémenté
**Then** TransactionDetailPage.tsx fait < 200 lignes et assemble TransactionHeader + Stepper + Tabs (FR1, NFR10)

**Given** la page detail
**When** elle se charge
**Then** 5 onglets sont affichés : Conditions, Offres, Documents, Timeline, Notes (FR10)
**And** les onglets sont gérés par React state, pas par le router

**Given** l'onglet "Conditions" est sélectionné par défaut
**When** l'agent clique sur "Offres"
**Then** le contenu bascule vers l'onglet Offres sans rechargement

**Given** React Query fetch la transaction
**When** les données arrivent
**Then** staleTime est 0 pour le detail (AR1)

**Given** un mobile 375px
**When** les onglets sont affichés
**Then** ils sont scrollables horizontalement si la largeur est insuffisante

**Given** l'URL contient `?tab=offres`
**When** la page se charge
**Then** l'onglet Offres est pré-sélectionné au lieu de Conditions

**Given** l'URL contient `?tab=conditions&highlight=abc123`
**When** la page se charge
**Then** l'onglet Conditions est sélectionné et la condition abc123 est scrollée en vue et mise en évidence

**Given** l'API retourne une erreur
**When** la page tente de charger
**Then** un message d'erreur s'affiche avec bouton "Réessayer"

### Story 2B.5 : ConditionsTab + ConditionCard (lecture)

As a **real estate agent**,
I want **to see all conditions for the current step as cards with status, type, deadline, and countdown**,
So that **I understand exactly what needs to be completed before advancing**.

**Acceptance Criteria:**

**Given** le step actuel "Conditionnel" avec 5 conditions
**When** l'onglet Conditions est affiché
**Then** 5 ConditionCards sont listées, groupées par step (FR11)

**Given** une condition "Financement" de type blocking, incomplète, deadline dans 5 jours
**When** la ConditionCard est rendue avec `interactive={false}`
**Then** elle affiche : titre "Financement", statut "En attente", badge "Bloquante" (rouge + bordure gauche rouge), CountdownBadge "5j" (FR12, FR28)
**And** aucune checkbox n'est affichée (lecture seule — Epic 2B)

**Given** une condition complétée
**When** la ConditionCard est rendue
**Then** elle affiche un check vert et le titre est en style "done" (texte atténué ou barré)

**Given** une condition non-blocking
**When** la ConditionCard est rendue
**Then** pas de badge "Bloquante", bordure gauche grise, apparence plus discrète

**Given** des conditions de steps précédents (déjà done)
**When** l'onglet Conditions est affiché
**Then** les conditions des steps passés sont visibles mais visuellement distinctes (collapsed ou section séparée)

---

## Epic 2C : Agir sur mon dossier (interaction)

L'agent peut agir — cocher des conditions, avancer/passer une étape, gérer les blocages. ConditionCard avec `interactive: true`. Zone d'action urgente.

### Story 2C.1 : Toggle Condition (interactive)

As a **real estate agent**,
I want **to check/uncheck conditions directly from the conditions tab with instant visual feedback**,
So that **I can update my file's progress in real time without waiting for server confirmation**.

**Acceptance Criteria:**

**Given** l'onglet Conditions avec ConditionCard `interactive={true}`
**When** l'agent clique sur la checkbox d'une condition incomplète
**Then** la condition passe immédiatement à "complétée" visuellement (optimistic update) (FR13)
**And** un appel API PATCH `/conditions/:id/complete` est envoyé en arrière-plan

**Given** l'optimistic update a été appliqué
**When** l'API confirme le succès (200)
**Then** rien ne change visuellement (déjà à jour)
**And** le cache React Query est invalidé pour la transaction

**Given** l'optimistic update a été appliqué
**When** l'API retourne une erreur
**Then** la condition revient à l'état précédent (rollback)
**And** un Toast d'erreur s'affiche

**Given** une condition complétée
**When** l'agent clique sur la checkbox pour décocher
**Then** la condition revient à "en attente" (optimistic) et l'API est appelée pour uncomplete

**Given** le toggle d'une condition blocking
**When** la condition passe à complétée
**Then** le compteur de conditions bloquantes dans TransactionCard (Epic 2A) se met à jour

**Given** une mutation est en cours sur une condition
**When** l'agent clique à nouveau sur la même checkbox (double-click rapide)
**Then** le click est ignoré (checkbox disabled pendant la mutation)

### Story 2C.2 : ActionZone

As a **real estate agent**,
I want **an action zone showing blocking conditions count, upcoming deadlines, and Advance/Skip buttons**,
So that **I see what's urgent and can progress my transaction with one tap (FR6)**.

**Acceptance Criteria:**

**Given** le step actuel avec 2 conditions bloquantes pending et 1 deadline dans 3 jours
**When** l'ActionZone est rendue
**Then** elle affiche : "2 conditions bloquantes" (rouge) + "Deadline : 3j" (orange) + boutons "Avancer" et "Passer" (FR6)

**Given** toutes les conditions bloquantes sont complétées
**When** l'ActionZone est rendue
**Then** le bouton "Avancer" est en style primaire (prêt à cliquer)
**And** un message "Prêt à avancer" s'affiche en vert

**Given** des conditions bloquantes sont encore pending
**When** l'ActionZone est rendue
**Then** le bouton "Avancer" est toujours visible mais l'agent est prévenu au clic (voir 2C.3)

**Given** un mobile 375px
**When** l'ActionZone est affichée
**Then** elle est positionnée entre le stepper et les onglets, compacte, boutons pleine largeur

**Given** un desktop 1280px
**When** l'ActionZone est affichée
**Then** les boutons sont alignés à droite, le résumé des blocages à gauche

**Given** l'agent clique sur "Passer"
**When** un Dialog de confirmation s'affiche : "Voulez-vous passer l'étape [nom] ? Les conditions non complétées seront ignorées."
**Then** si l'agent confirme, l'API skipStep est appelée
**And** le step actuel passe à "skipped", le step suivant devient actif
**And** un Toast confirme "Étape passée"
**And** le stepper se met à jour

### Story 2C.3 : Blocking System (check + modal + banner)

As a **real estate agent**,
I want **to be warned when I try to advance with pending blocking conditions, with a pedagogical modal the first time and an inline banner afterwards**,
So that **I understand the blocking system and am protected from costly mistakes**.

**Acceptance Criteria:**

**Given** des conditions bloquantes pending ET c'est la PREMIÈRE fois que l'agent est bloqué (localStorage)
**When** l'agent clique sur "Avancer"
**Then** l'API advanceStep retourne une erreur blocking
**And** une Modal s'affiche avec message pédagogique : "Ofra a bloqué l'avancement parce que X conditions critiques ne sont pas complétées. C'est voulu — le système vous protège contre les oublis coûteux." (FR7, FR8)
**And** la Modal a z-index dialog(40) (AR3)
**And** une option "Ne plus afficher" (checkbox) est disponible

**Given** la Modal de premier blocage affichée
**When** l'agent coche "Ne plus afficher" et ferme la Modal
**Then** le flag est stocké en localStorage (`blockingModalDismissed: true`)

**Given** des conditions bloquantes pending ET l'agent a déjà vu la Modal (localStorage flag)
**When** l'agent clique sur "Avancer"
**Then** PAS de Modal — un Banner inline persistant s'affiche en haut de l'ActionZone (FR9)
**And** le Banner affiche "X conditions bloquantes doivent être complétées" avec badge rouge
**And** le Banner a z-index banner(30) (AR3)

**Given** toutes les conditions bloquantes complétées
**When** l'agent clique sur "Avancer"
**Then** l'API advanceStep réussit
**And** le step actuel passe à "completed", le step suivant devient actif
**And** un Toast confirme "Avancé à : [nom du step suivant]"
**And** le stepper, l'ActionZone et le ConditionsTab se mettent à jour

**Given** la transaction est au step 8/8 (dernier)
**When** l'agent clique sur "Avancer"
**Then** le step 8 passe à "completed" et la transaction est marquée comme terminée
**And** un message de félicitations s'affiche

---

## Epic 2D : Historique complet

L'agent accède à l'historique et aux données complémentaires : offres, documents, timeline d'activité, notes.

### Story 2D.1 : OffersTab

As a **real estate agent**,
I want **to see all offers for a transaction in a dedicated tab**,
So that **I can review offer history and status without leaving the transaction detail**.

**Acceptance Criteria:**

**Given** l'onglet "Offres" sélectionné
**When** le contenu se charge
**Then** le composant `OffersSection` existant est affiché, wrappé dans l'onglet (FR14)
**And** aucune réécriture du composant — wrap et intégration uniquement (epic2-decisions.md §3.4)

**Given** la transaction a 3 offres (pending, accepted, rejected)
**When** l'OffersTab est affiché
**Then** les 3 offres sont listées avec leurs statuts respectifs

**Given** la transaction n'a aucune offre
**When** l'OffersTab est affiché
**Then** un message "Aucune offre pour cette transaction" s'affiche avec indication contextuelle

**Given** une offre est créée/modifiée depuis l'OffersTab
**When** l'action est complétée
**Then** le cache React Query est invalidé et l'OffersTab se met à jour

### Story 2D.2 : DocumentsTab

As a **real estate agent**,
I want **to see documents linked to conditions in a dedicated tab**,
So that **I can quickly find and access documents organized by condition**.

**Acceptance Criteria:**

**Given** l'onglet "Documents" sélectionné
**When** le contenu se charge
**Then** les documents sont listés, groupés par condition qui les référence (FR15)

**Given** une condition "Financement" avec 2 documents liés (preuve de pré-approbation, lettre bancaire)
**When** le DocumentsTab est affiché
**Then** les 2 documents apparaissent sous le header "Financement" avec nom, type et lien

**Given** l'agent clique sur un document
**When** le lien est activé
**Then** le document s'ouvre dans un nouvel onglet

**Given** aucun document lié à aucune condition
**When** le DocumentsTab est affiché
**Then** un message "Aucun document pour cette transaction" s'affiche

**Given** un mobile 375px
**When** les documents sont affichés
**Then** chaque document est un item tappable pleine largeur avec icône type + nom

### Story 2D.3 : TimelineTab (ActivityFeed)

As a **real estate agent**,
I want **to see a unified, paginated activity feed for a transaction**,
So that **I can review the complete history of actions taken on this file**.

**Acceptance Criteria:**

**Given** l'onglet "Timeline" sélectionné
**When** le contenu se charge
**Then** l'ActivityFeed affiche les activités récentes en ordre chronologique inverse (plus récent en haut) (FR16)
**And** l'API `GET /api/transactions/:id/activity` est appelée

**Given** des activités de types variés (step_advanced, condition_completed, offer_created, note_added)
**When** le feed est affiché
**Then** chaque activité montre : icône par type, description, auteur, date relative ("il y a 2h")
**And** au-delà de 7 jours, la date bascule en format absolu ("15 jan 2026")

**Given** plus de 20 activités
**When** l'agent scrolle en bas du feed
**Then** la pagination charge la page suivante (infinite scroll ou bouton "Charger plus")

**Given** une activité vient d'être créée (ex: condition cochée dans 2C.1)
**When** l'agent bascule vers l'onglet Timeline
**Then** la nouvelle activité apparaît en haut du feed (cache invalidé)

**Given** aucune activité
**When** le TimelineTab est affiché
**Then** un message "Aucune activité enregistrée" s'affiche

### Story 2D.4 : NotesTab (CRUD)

As a **real estate agent**,
I want **to create, read, update, and delete notes on a transaction**,
So that **I can keep track of important information and communications related to a deal**.

**Acceptance Criteria:**

**Given** l'onglet "Notes" sélectionné
**When** le contenu se charge
**Then** les notes existantes sont listées en ordre chronologique inverse (FR17)
**And** chaque note affiche : contenu, auteur, date de création

**Given** l'agent veut ajouter une note
**When** il tape dans le champ texte et clique "Ajouter"
**Then** la note est créée via API POST
**And** elle apparaît immédiatement en haut de la liste (optimistic update)
**And** un Toast confirme "Note ajoutée"

**Given** une note existante appartenant à l'agent
**When** l'agent clique sur le bouton éditer (icône crayon)
**Then** le contenu devient éditable inline
**And** les boutons "Sauvegarder" et "Annuler" apparaissent

**Given** l'agent modifie une note et clique "Sauvegarder"
**When** l'API PUT répond 200
**Then** la note est mise à jour visuellement et un Toast confirme "Note modifiée"

**Given** l'agent clique sur le bouton supprimer (icône poubelle)
**When** un Dialog de confirmation s'affiche : "Supprimer cette note ?"
**Then** si confirmé, la note est supprimée via API DELETE
**And** elle disparaît de la liste et un Toast confirme "Note supprimée"

**Given** une note créée par un autre utilisateur
**When** le NotesTab est affiché
**Then** les boutons éditer et supprimer ne sont PAS affichés pour cette note

**Given** aucune note
**When** le NotesTab est affiché
**Then** un message "Aucune note" s'affiche avec le champ de saisie visible pour encourager la première note
