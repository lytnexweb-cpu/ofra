# Phase 1 — Audit Tests & Couverture
## Auditeur : Murat (QA/TEA) — 20 fev 2026

---

## Resume Global

| Metrique | Backend | Frontend | Total |
|----------|---------|----------|-------|
| Tests totaux | 277 | 319 | 596 |
| Fichiers test | 24 | 37 | 61 |
| Passants | 277 (100%) | 311 (97.5%) | 588 (98.7%) |
| Echecs | 0 | 8 (pre-existants) | 8 |
| Couverture approx | 65% | 40% | ~50% |
| Controllers/Pages testees | 18/32 (56%) | 9/25 (36%) | 27/57 (47%) |
| Services testees | 6/17 (35%) | — | 35% |

---

## Inventaire Backend (277 tests, 24 fichiers)

### Tests Fonctionnels (18 fichiers, 209 tests)

| Fichier | Tests | Couverture | Status |
|---------|-------|-----------|--------|
| auth.spec.ts | 20 | Register, Login, Forgot, Reset, Onboarding | COMPREHENSIVE |
| offer_intake.spec.ts | 27 | Soumission, share links, coherence parties | COMPREHENSIVE |
| offers.spec.ts | 22 | CRUD, multi-tenancy, edge cases | COMPREHENSIVE |
| conditions_engine.spec.ts | 10 | Blocking, template matching, edge cases | GOOD |
| conditions.spec.ts | 4 | Workflow, completion | BASIC |
| fintrac.spec.ts | 10 | Controller endpoints, compliance, records | GOOD |
| export.spec.ts | 16 | PDF export, email sharing | GOOD |
| transactions.spec.ts | 11 | Workflow CRUD, multi-tenancy, blocking | GOOD |
| notes.spec.ts | 15 | CRUD, multi-tenancy | GOOD |
| clients.spec.ts | 5 | CRUD, multi-tenancy | BASIC |
| clients_import.spec.ts | 7 | CSV parsing, duplicate detection | GOOD |
| admin.spec.ts | 17 | Notes, tasks, subscriber management | GOOD |
| activity_feed.spec.ts | 4 | Feed logging, pagination | BASIC |
| notifications.spec.ts | 11 | Delivery, multi-tenancy | GOOD |
| transaction_parties.spec.ts | 7 | CRUD, management | BASIC |
| transaction_members.spec.ts | 9 | Members, roles | BASIC |
| transaction_documents.spec.ts | 9 | Document management | BASIC |
| workflow_templates.spec.ts | 5 | Template management | BASIC |

### Tests Unitaires (6 fichiers, 68 tests)

| Fichier | Tests | Couverture | Status |
|---------|-------|-----------|--------|
| fintrac_service.spec.ts | 17 | onStepEnter, onPartyAdded/Removed, isCompliant | COMPREHENSIVE |
| workflow_engine_service.spec.ts | 14 | Creation transaction, advancement steps | GOOD |
| automation_executor_service.spec.ts | 14 | Execution logic automation | GOOD |
| notification_service.spec.ts | 11 | Delivery notifications | GOOD |
| plan_service.spec.ts | 6 | Calculs plans | BASIC |
| tenant_scope_service.spec.ts | 6 | Isolation tenant | BASIC |

---

## Inventaire Frontend (319 tests, 37 fichiers)

### Pages testees (9/25 = 36%)

| Page | Tests | Status |
|------|-------|--------|
| LoginPage | 3 | BASIC |
| ForgotPasswordPage | 5 | GOOD |
| RegisterPage | 5 | GOOD |
| VerifyEmailPage | 4 | BASIC |
| ClientsPage | 3 | BASIC |
| DashboardPage | 9 | GOOD |
| TransactionDetailPage | 7 | GOOD |
| TransactionsPage | 7 | GOOD |

### Composants testes (~28 fichiers, 200+ tests)

**Dashboard :** KPICard(7), PipelineChart(6), RevenueChart(7), RecentActivity(7), UpcomingDeadlines(12)

**Transaction :** ConditionCard(22), ActionZone(8), ConditionsTab(8 FAIL), NotesSection(10), StepperBottomSheet(5), EmptyState(4), DocumentsTab(5), TimelineTab(7), StepperPill(6), StepProgressBar(7), ReturnBanner(6), TransactionCard(17), TransactionHeader(7), WeeklySummary(7)

**General :** Layout(10), NotificationBell(9), OffersSection(10)

**Utils :** date(15), utils(9), apiError(15), key-parity(4 FAIL), canary(2)

---

## Gaps CRITIQUES (Business-Critical sans tests)

| Module | Tests | Impact | Effort |
|--------|-------|--------|--------|
| **Stripe Payments** | 0 | Flow paiement non teste | 20+ tests, 1-2 jours |
| **Stripe Webhooks** | 0 | Events webhook non testes | 15+ tests, 1 jour |
| **Admin Metrics Service** | 0 | Engagement, at-risk, metriques | 12+ tests, 1 jour |
| **Admin Plans** | 0 | CRUD plans, activation | 15+ tests, 1 jour |
| **Promo Codes** | 0 | Validation, application, expiration | 12+ tests, 1 jour |
| **Professional Contacts** | 0 | Carnet pros, directory | 8+ tests, 0.5 jour |

---

## Gaps HAUTE (Pages frontend sans tests — 16/25)

| Page | Priorite | Raison |
|------|----------|--------|
| **PricingPage** | P1 | Point d'entree subscription |
| **OnboardingPage** | P1 | Setup premier utilisateur |
| **EditTransactionPage** | P1 | Editeur transaction complexe |
| **OfferIntakePage** | P1 | Soumission offre publique |
| **AccountPage** | P2 | Settings, billing, profil |
| **AdminPulsePage** | P2 | Metriques admin |
| **ClientDetailsPage** | P2 | Profil client, historique |
| **AdminConfigPage** | P3 | Configuration admin |
| **AdminGensPage** | P3 | Activite agents |
| **AdminSubscribersPage** | P3 | Gestion users |
| **ExportSharePage** | P3 | Vue export partagee |
| **NotFoundPage** | P3 | 404 |
| **PermissionsPage** | P3 | Matrice permissions |
| **ProsPage** | P3 | Directory professionnels |
| **ResetPasswordPage** | P3 | Reset mot de passe |
| **SettingsPage** | P3 | Settings user |

---

## Gaps Services Backend sans tests (11/17)

| Service | Teste? | Priorite |
|---------|--------|----------|
| StripeService | NON | P1 |
| AdminMetricsService | NON | P1 |
| PDFExportService | NON (via controller) | P2 |
| EmailService | NON | P2 |
| CSVImportService | NON (via controller) | P2 |
| QueueService | NON | P2 |
| ReminderService | NON | P3 |
| ConditionsEngineService | PARTIEL | P2 |
| ActivityFeedService | BASIQUE | P3 |
| OfferService | VIA controller | P2 |
| ShareLinkService | NON | P2 |

---

## Qualite des Tests

### Forces
- Infrastructure test solide : factories, helpers, truncateAll
- Tests fonctionnels couvrent HTTP request/response complet
- Multi-tenancy verifie (user A ne peut pas acceder user B)
- Email mocke et asserte
- Frontend : renderWithProviders, axe accessibility

### Faiblesses
- Majorite happy path seulement — peu de cas d'erreur
- Dates hardcodees (fragilite temporelle)
- Pas de tests unitaires pour modals (CreateOfferModal, etc.)
- Pas de tests pour hooks custom ou context providers
- Ratio 75% integration / 25% unitaire — manque d'unitaires

---

## Echecs Pre-existants (8 tests)

### ConditionsTab.test.tsx (8 echecs)
**Cause probable :** Selecteurs testId decales (`toggle-condition-${id}`, `step-group-${order}`) ne matchent plus le DOM actuel.
**Fix :** Revoir le composant, mettre a jour les selecteurs.

### key-parity.test.ts (i18n)
**Cause :** Cles FR/EN desynchronisees.
**Fix :** Linter i18n, synchroniser avant merge.

**Impact :** Metadata/UI, pas de bugs business critiques.

---

## Roadmap Recommande

### Phase 1 : Paiement (1-2 jours)
1. `stripe.spec.ts` — 20+ tests (setupIntent, subscribe, changePlan)
2. `stripe_webhooks.spec.ts` — 15+ tests (events)

### Phase 2 : Admin (2-3 jours)
3. `admin_plans.spec.ts` — 15 tests
4. `admin_promo_codes.spec.ts` — 12 tests
5. `admin_site_settings.spec.ts` — 10 tests

### Phase 3 : Services unitaires (2-3 jours)
6. AdminMetricsService unit tests
7. ConditionsEngineService edge cases
8. WorkflowEngineService transitions complexes

### Phase 4 : Pages frontend (3-4 jours)
9. PricingPage, OnboardingPage
10. AdminPulsePage, ClientDetailsPage, EditTransactionPage

### Phase 5 : Fix pre-existants (1 jour)
11. ConditionsTab selecteurs
12. Sync i18n FR/EN

---

## Cible Recommandee

| Metrique | Actuel | Cible |
|----------|--------|-------|
| Couverture globale | ~50% | 70% |
| Controllers testes | 56% | 80% |
| Services testes | 35% | 70% |
| Pages frontend testees | 36% | 60% |
| Tests totaux | 596 | 800+ |
