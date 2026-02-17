---
project_name: OFRA
user_name: Sam
date: 2026-02-13
sections_completed:
  [
    'technology_stack',
    'market_context',
    'domain_terminology',
    'architecture',
    'api_routes',
    'feature_status',
    'testing_patterns',
    'critical_rules',
  ]
existing_patterns_found: 24
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## 1. Product Identity

- **Name**: OFRA (pronounced "off-ra")
- **Type**: Transaction Management System for Canadian real estate agents
- **NOT a CRM**: OFRA starts where CRMs end (post-lead, post-signature). Lead management stays in FollowUpBoss etc.
- **Differentiator**: "Blocking conditions" — the system **forces** discipline by preventing step advancement when critical conditions are incomplete

## 2. Market Context

> **CRITICAL**: OFRA V1 targets **New Brunswick** (Moncton), NOT Quebec.
> Quebec is a future expansion. All NB-specific terminology, workflows, and regulations apply first.

- **Launch market**: New Brunswick (Moncton area)
- **Target**: Individual real estate agents (solo, high-volume 15-40 transactions/year)
- **Future**: National expansion (province-by-province via configurable workflow templates)
- **Language**: NB is officially bilingual (FR/EN) — both languages are a real product advantage
- **Compliance**: FINTRAC is mandatory for Canadian real estate transactions (module planned — see `_bmad-output/fintrac-spec.md`)
- **MLS**: NOT used in New Brunswick — removed from codebase (commit 8078e18). No MLS/PID integration planned for V1

## 3. Domain Terminology (from NB broker source)

These terms come directly from a practicing NB broker and MUST be used consistently in code, UI, and documentation.

### Workflow Steps (8-step NB pipeline)

| # | Step Name (EN) | Slug | Duration |
|---|----------------|------|----------|
| 1 | Buyer/Seller Consultation | `consultation` | open |
| 2 | Offer Submitted | `offer-submitted` | 3 days |
| 3 | Offer Accepted | `offer-accepted` | 1 day |
| 4 | Conditional Period | `conditional-period` | 14 days |
| 5 | Firm Pending | `firm-pending` | 7 days |
| 6 | Pre-Closing Tasks | `pre-closing` | 14 days |
| 7 | Closing Day / Key Delivery | `closing-day` | 1 day |
| 8 | Post-Closing Follow-Up | `post-closing` | 30 days |

### Condition Types (checkable during Conditional Period)

| Condition | Type Key | Blocking | Priority |
|-----------|----------|----------|----------|
| Financing | `financing` | Yes | high |
| Deposit | `deposit` | Yes | high |
| Inspection | `inspection` | Yes | high |
| Water Test | `water_test` | Yes | high |
| RPDS Review | `rpds_review` | Yes | high |
| Custom (free-form) | `other` | Configurable | Configurable |

### Bilingual Glossary

| Concept | Code (EN) | UI English | UI French |
|---------|-----------|------------|-----------|
| Deal/File | `transaction` | Transaction / Deal | Dossier / Transaction |
| Step | `workflow_step` | Step | Etape |
| Condition | `condition` | Condition | Condition |
| Offer | `offer` | Offer | Offre |
| Agent/Broker | `agent` / `user` | Agent | Courtier |
| Brokerage | `organization` | Brokerage | Courtage |
| Closing | `closing` | Closing | Clature |

## 4. Technology Stack & Versions

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| AdonisJS | 6.18.0 | Backend framework (TypeScript Laravel equivalent) |
| Lucid ORM | 21.6.1 | Database ORM |
| PostgreSQL | 16 | Primary database |
| Redis | 7 (alpine) | Cache, rate limiting, sessions |
| VineJS | 3.0.1 | Request validation |
| AdonisJS Mail | 9.2.2 | Email (Brevo SMTP) |
| AdonisJS Auth | 9.4.0 | Session/cookie authentication |
| Sentry | 10.36.0 | Error tracking |
| Luxon | 3.7.2 | Date/time handling |
| TypeScript | ~5.8 | Type system |
| Japa | 4.2.0 | Test runner |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 4.1.18 (v4) | Styling |
| TanStack React Query | 5.90.12 | Server state management |
| React Router | 7.11.0 | Client-side routing |
| react-i18next | 16.5.3 | Internationalization (FR/EN) |
| i18next | 25.8.0 | i18n core |
| Framer Motion | 12.27.1 | Animations |
| Recharts | 3.6.0 | Charts (dashboard) |
| date-fns | 4.1.0 | Date formatting |
| Lucide React | 0.563.0 | Icons (MVP) |
| shadcn/ui (Radix UI) | various | UI components (Dialog, Tabs, Toast, etc.) |
| class-variance-authority | 0.7.1 | Component variants |
| clsx + tailwind-merge | 2.1.1 / 3.4.0 | Class merging utility (`cn()`) |
| TypeScript | ~5.9.3 | Type system |
| Vitest | 4.0.17 | Test runner |
| @testing-library/react | 16.3.1 | Component testing |
| vitest-axe | 0.1.0 | WCAG accessibility testing |

### Infrastructure

| Service | Provider | Notes |
|---------|----------|-------|
| Frontend hosting | Cloudflare Pages | ofra.pages.dev |
| Backend hosting | Fly.io | crm-yanick-backend.fly.dev |
| Database hosting | Fly.io internal | PostgreSQL 16 |
| CI/CD | GitHub Actions | lint + typecheck + tests on push/PR |
| Email provider | Brevo (SMTP) | Fully wired: 23 email templates, fire-and-forget pattern, branded layout |
| Docker | docker-compose.yml | Local dev: postgres:16 + redis:7-alpine |

## 5. Architecture

### 3-Layer Workflow Architecture

```
TEMPLATE LAYER (configurable per province)
  workflow_templates       → province, name, is_default
  workflow_steps           → template_id, step_order, name, slug
  workflow_step_conditions → step_id, condition_type, is_blocking
  workflow_step_automations→ step_id, trigger, action_type, template_ref

INSTANCE LAYER (per transaction at runtime)
  transactions             → linked to template, current_step
  transaction_steps        → progress tracking per step
  conditions               → per transaction, checkable, with due dates

ACTIVITY LAYER (audit trail)
  activity_feed            → unified log: step changes, conditions, offers, automations, notes
```

### Key Architecture Patterns

- **Session/cookie auth** (AdonisJS built-in), NOT JWT
- **Multi-tenancy**: `organization_id` nullable on users/transactions (solo agents = null)
- **Mobile-first responsive**: breakpoints < 640px (default), sm: 640px+, lg: 1024px+, xl: 1280px+
- **React Query caching**: staleTime 30s on listings, 0 on detail views, optimistic updates on mutations
- **State-based tabs** (React state, not router) on TransactionDetailPage
- **i18n**: All UI strings through `t()` — English keys, FR + EN translation files
- **Code language**: Always English. UI: bilingual via i18n

### Component Architecture Rules

- Every component must be < 200 lines
- `cn()` utility from `lib/utils.ts` for Tailwind class merging
- `normalizeSearch()` in `lib/utils.ts` for accent-safe search (NFD + remove diacritics)
- z-index convention: fab(10), toast(20), banner(30), dialog(40), sheet(50)

## 6. API Routes

All routes prefixed with `/api`. Protected routes require session auth.

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/plans` | List available plans |
| POST | `/register` | Create new account (rate limited) |
| POST | `/login` | Login (rate limited) |
| POST | `/forgot-password` | Request password reset email (rate limited) |
| POST | `/reset-password` | Reset password with token (rate limited) |
| GET | `/verify-email` | Verify email with token |
| POST | `/resend-verification` | Resend verification email |
| GET | `/share/:token` | Public share link access |
| GET | `/offer-intake/:token` | Public offer intake info (rate limited) |
| POST | `/offer-intake/:token` | Submit offer via public link (rate limited) |

### Protected (require auth)

**Auth & Profile**

| Method | Path | Controller |
|--------|------|------------|
| POST | `/logout` | auth_controller.logout |
| GET | `/me` | auth_controller.me |
| PUT | `/me/password` | profile_controller.changePassword |
| PUT | `/me` | profile_controller.updateProfile |
| PUT | `/me/profile` | profile_controller.updateProfileInfo |
| POST | `/me/logout-all` | profile_controller.logoutAll |
| PUT | `/me/profile` | profile_controller.updateProfileInfo |
| PUT | `/me/onboarding` | profile_controller.saveOnboarding |
| POST | `/me/onboarding/skip` | profile_controller.skipOnboarding |
| GET | `/me/subscription` | profile_controller.subscription |
| POST | `/me/plan` | profile_controller.changePlan |

**Dashboard**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/dashboard/summary` | dashboard_controller.summary |
| GET | `/dashboard/urgencies` | dashboard_controller.urgencies |

**Clients**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/clients` | clients_controller.index |
| POST | `/clients` | clients_controller.store |
| POST | `/clients/import` | clients_controller.importCsv |
| GET | `/clients/import/template` | clients_controller.getTemplate |
| GET | `/clients/:id` | clients_controller.show |
| GET | `/clients/:id/transactions` | clients_controller.transactions |
| PUT | `/clients/:id` | clients_controller.update |
| DELETE | `/clients/:id` | clients_controller.destroy |

**Workflow Templates**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/workflow-templates` | workflow_templates_controller.index |
| POST | `/workflow-templates` | workflow_templates_controller.store |
| GET | `/workflow-templates/:id` | workflow_templates_controller.show |
| PUT | `/workflow-templates/:id` | workflow_templates_controller.update |
| DELETE | `/workflow-templates/:id` | workflow_templates_controller.destroy |

**Transactions**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/transactions` | transactions_controller.index |
| POST | `/transactions` | transactions_controller.store |
| GET | `/transactions/:id` | transactions_controller.show |
| PUT | `/transactions/:id` | transactions_controller.update |
| PATCH | `/transactions/:id/advance` | transactions_controller.advanceStep |
| PATCH | `/transactions/:id/skip` | transactions_controller.skipStep |
| PATCH | `/transactions/:id/goto/:stepOrder` | transactions_controller.goToStep |
| GET | `/transactions/:id/activity` | transactions_controller.activity |
| DELETE | `/transactions/:id` | transactions_controller.destroy |

**Offers**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/transactions/:id/offers` | offers_controller.index |
| POST | `/transactions/:id/offers` | offers_controller.store |
| GET | `/offers/:offerId` | offers_controller.show |
| POST | `/offers/:offerId/revisions` | offers_controller.addRevision |
| PATCH | `/offers/:offerId/accept` | offers_controller.accept |
| PATCH | `/offers/:offerId/reject` | offers_controller.reject |
| PATCH | `/offers/:offerId/withdraw` | offers_controller.withdraw |
| DELETE | `/offers/:offerId` | offers_controller.destroy |

**Conditions**

| Method | Path | Controller |
|--------|------|------------|
| POST | `/transactions/:id/conditions` | conditions_controller.store |
| PUT | `/conditions/:id` | conditions_controller.update |
| PATCH | `/conditions/:id/complete` | conditions_controller.complete |
| DELETE | `/conditions/:id` | conditions_controller.destroy |

**Notes**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/transactions/:id/notes` | notes_controller.index |
| POST | `/transactions/:id/notes` | notes_controller.store |
| DELETE | `/notes/:id` | notes_controller.destroy |

**Condition Templates & Profiles**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/conditions/templates` | condition_templates_controller.index |
| GET | `/conditions/templates/by-pack` | condition_templates_controller.byPack |
| GET | `/conditions/templates/:id` | condition_templates_controller.show |
| GET | `/transactions/:id/applicable-templates` | condition_templates_controller.applicableForTransaction |
| GET | `/transactions/:id/profile` | transaction_profiles_controller.show |
| PUT | `/transactions/:id/profile` | transaction_profiles_controller.upsert |
| POST | `/transactions/:id/profile/load-pack` | transaction_profiles_controller.loadPack |

**Transaction Extensions (Parties, Documents, Members, Share Links)**

| Method | Path | Controller |
|--------|------|------------|
| GET/POST | `/transactions/:id/parties` | transaction_parties_controller |
| PUT/DELETE | `/parties/:id` | transaction_parties_controller |
| GET/POST | `/transactions/:id/documents` | transaction_documents_controller |
| GET/PUT/DELETE | `/documents/:id` | transaction_documents_controller |
| PATCH | `/documents/:id/validate` | transaction_documents_controller.validate |
| PATCH | `/documents/:id/reject` | transaction_documents_controller.reject |
| GET/POST | `/transactions/:tid/members` | transaction_members_controller |
| PATCH/DELETE | `/transactions/:tid/members/:id` | transaction_members_controller |
| GET/POST | `/transactions/:tid/share-link` | transaction_share_links_controller |
| PATCH/DELETE | `/transactions/:tid/share-link/:id` | transaction_share_links_controller |

**Notifications**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/notifications` | notifications_controller.index |
| GET | `/notifications/unread-count` | notifications_controller.unreadCount |
| PATCH | `/notifications/:id/read` | notifications_controller.markRead |
| POST | `/notifications/read-all` | notifications_controller.markAllRead |

**FINTRAC**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/transactions/:id/fintrac` | fintrac_controller.index |
| GET | `/fintrac/:id` | fintrac_controller.show |
| PATCH | `/fintrac/:id/complete` | fintrac_controller.complete |
| POST | `/fintrac/:id/resolve` | fintrac_controller.resolve |

**Export**

| Method | Path | Controller |
|--------|------|------------|
| POST | `/transactions/:id/export/pdf` | export_controller.pdf |
| POST | `/transactions/:id/export/email` | export_controller.email |

**Transaction Actions**

| Method | Path | Controller |
|--------|------|------------|
| PATCH | `/transactions/:id/cancel` | transactions_controller.cancel |
| PATCH | `/transactions/:id/archive` | transactions_controller.archive |
| PATCH | `/transactions/:id/restore` | transactions_controller.restore |

### Admin Routes (require admin role)

| Method | Path | Controller |
|--------|------|------------|
| GET | `/admin/overview` | admin_controller.overview |
| GET | `/admin/subscribers` | admin_controller.subscribers |
| GET | `/admin/activity` | admin_controller.activity |
| GET | `/admin/system` | admin_controller.system |
| GET/PUT | `/admin/plans` | admin_plans_controller |

## 7. Feature Status Matrix

> **CRITICAL**: This section documents what actually works vs what is a stub. Read this before making assumptions about feature completeness.

### Working (fully functional)

| Feature | Status | Notes |
|---------|--------|-------|
| Workflow template CRUD | Working | NB templates seeded (purchase + sale) |
| Transaction CRUD | Working | Create, read, update, delete |
| Step advancement | Working | Advance, skip, goTo with blocking check |
| Condition CRUD | Working | Create, update, complete, delete |
| Blocking conditions | Working | Prevents step advancement when blocking conditions pending |
| Offers system | Working | Create, revise, accept, reject, withdraw |
| Offer gate | Working | Blocks step advancement on `offer-submitted` slug unless an accepted offer exists |
| Notes CRUD | Working | Create, list, delete per transaction |
| Activity feed | Working | Unified log of all transaction events |
| Dashboard summary | Working | KPIs, pipeline, revenue, deadlines |
| Client management | Working | CRUD with transaction association |
| Auth (login/logout/register) | Working | Session/cookie based + registration + password reset |
| i18n (FR/EN) | Working | All UI strings translated |
| Dark mode | Working | Auto (prefers-color-scheme) + manual toggle |
| Automation execution | Working | `automation_executor_service.ts` | Sends emails + logs tasks + creates notification twins via `AutomationExecutorService`. Supports delayed execution via BullMQ. 5 email templates + 5 notification twins |
| Email templates (23/23) | Working | `backend/app/mails/` (23 files) | Auth (3): welcome, verification, password_reset. Automation (5): offer_accepted, firm_confirmed, fintrac_reminder, celebration, google_review. Reminders (2): daily_digest, deadline_warning. Collab (3): member_invitation, party_added, share_link. Offres (4): submitted, countered, rejected, withdrawn. Conditions (4): step_advanced, condition_resolved, blocking_alert, condition_assigned. Transaction (2): cancelled, recap |
| Auto conditions engine | Working | 52 templates across 4 packs (Universal, Rural NB, Condo NB, Financé NB). Controlled by `autoConditionsEnabled` flag |
| Property profile | Working | Type/Context/Financed at creation, locked after step 1 (frontend only — backend guard in Sprint 2) |
| Parties management | Working | Full CRUD, 7 roles, PartiesCard inline on detail page, PartiesModal for editing |
| ValidateStepModal | Working | 3 states: conditions OK (green), offer gate blocked (amber), blocking conditions (red) |
| Documents & Preuves (M08) | Working | DocumentsSection (list by category), UploadDocumentModal, DocumentProofModal, DocumentVersionModal. 100% maquette-conforme |
| Document StatusBar | Working | Inline collapsible on detail page (Phase C). Badges: validated/pending/missing. Counts conditions only, not general docs |
| Edit/Create Transaction (M09) | Working | Unified page at `/transactions/:id/edit` (edit) and `/transactions/new` (create). 3 tabs (Property, Parties, Dates), sidebar, 5 states. Icon cards for profile, autoConditionsEnabled toggle |
| MembersPanel | Working | Converted from Sheet to centered Dialog (max-w-2xl) in Phase C |
| ExportSharePanel | Working | Converted from Sheet to centered Dialog (max-w-md) in Phase C |

### Removed Components

| Component | Reason | Replaced By |
|-----------|--------|-------------|
| `CreateTransactionModal.tsx` | Phase C (C5) — modal replaced by full page | `EditTransactionPage.tsx` at `/transactions/new` |
| `DocumentsDrawer.tsx` | Phase C (C1) — right-side Sheet eliminated | Inline collapsible section in `TransactionDetailPage.tsx` |

### Stub / Not Implemented

| Feature | Status | Location | Details |
|---------|--------|----------|---------|
| ~~BullMQ job queue~~ | ✅ DONE | `backend/app/services/queue_service.ts` | Delayed automations, daily digest, deadline warnings |
| CSV Import API | ✅ DONE | `backend/app/services/csv_import_service.ts` | Bilingual headers, duplicate detection |
| CSV Import UI | Not implemented | Epic 5 | Drag & drop frontend needed |
| Document uploads | Not implemented | Epic 5 | S3 storage, quota per tier |
| FINTRAC module | **Working** | `fintrac_controller.ts`, `fintrac_service.ts`, `FintracComplianceModal.tsx` | FintracRecord model, blocking condition at firm-pending, identity verification form, compliance gate. Override autoConditionsEnabled |
| Birthday reminder | Not implemented | From broker requirements | "Register client birthday in CRM after FINTRAC complete" |
| Social media reminders | Not implemented | From broker requirements | Triggered at Offer Accepted, SOLD, Key Day |
| Conditional follow-ups | Not implemented | From broker requirements | Financing + inspection follow-up during conditional period |
| Client onboarding form | Not implemented | From broker requirements | External form sent to client after listing appointment |
| ~~Multi-tenant enforcement~~ | ✅ DONE | `TenantScopeService` | Org-scoped queries for clients and transactions |
| Notifications in-app | **Working** | `NotificationBell.tsx`, `notification_service.ts` | Bell component with badge, Radix DropdownMenu, polling 60s, mark read/all read. 4 API routes. 31 tests GREEN |
| Email system (23 emails) | **Working** | `backend/app/mails/` (23 files) | 10 original + 13 new. All branded (OFRA_COLORS, wrapEmailContent). Notification twin pattern: each email trigger also creates in-app notification for broker |
| Auth redesign | **Working** | `RegisterPage.tsx`, `LoginPage.tsx`, `AdminLoginPage.tsx` | Split-screen premium layout, email verification (SHA256 token, 24h expiry), VerifyEmailPage |
| Export & Partage (M10) | **Working** | `ExportSharePage.tsx` | 3 cards: PDF export (options), shareable link, email recap. Plan-gated PDF (Starter: 3/month) |
| Permissions & Rôles (M11) | **Working** | `PermissionsPage.tsx` | Member management, roles (owner/admin/editor/viewer), invitation, activity log |
| Ajouter Offre (M12) | **Working** | `CreateOfferModal.tsx` | Réécriture 6 états conforme maquette |
| Offer Intake (D35) | **Working** | `OfferIntakePage.tsx`, `offer_intake_controller.ts` | Public offer submission via share link token. Party + offer created. Rate limited |
| Plans & Pricing | **Working** | `PlanService`, `PlanLimitMiddleware`, `plans_seeder.ts` | 4 plans in DB, hierarchy check, soft limit 7-day grace, plan change logs |
| Admin Panel | **Working** | `AdminDashboardPage.tsx`, `admin_controller.ts` | Overview, subscribers, activity, system health, notes, tasks, plan management |

## 8. Testing Patterns

### Frontend (Vitest + Testing Library)

**Test count**: 34 test files (all passing)

**Key patterns**:

```typescript
// 1. Fake timers with React state flushing (for animated components)
vi.useFakeTimers({ shouldAdvanceTime: true })
await act(async () => { vi.advanceTimersByTime(1200) })

// 2. Explicit mock function pattern (preferred over vi.mocked)
const mockGetSummary = vi.fn()
vi.mock('../../api/dashboard.api', async () => {
  const actual = await vi.importActual('../../api/dashboard.api')
  return {
    ...(actual as object),
    dashboardApi: {
      getSummary: (...args: unknown[]) => mockGetSummary(...args),
    },
  }
})

// 3. Test helper with providers
// renderWithProviders() wraps component in MemoryRouter + i18n + QueryClient
// QueryClient configured with retry: false for tests

// 4. Factory pattern for test data
function makeDeadline(overrides: Record<string, any> = {}) {
  return { id: 1, title: 'Financing', ...overrides }
}

// 5. WCAG accessibility test (every component)
const results = await axe(container)
expect(results).toHaveNoViolations()
```

**Test file naming**: `__tests__/ComponentName.test.tsx` alongside component

### Backend (Japa)

- Integration tests via `@japa/api-client`
- Test database with migrations + seeders
- Factory helpers in `tests/helpers/factories/`

## 9. Critical Implementation Rules

### Must Follow

1. **NB first, not Quebec** — All province-specific code, data, and terminology targets New Brunswick initially
2. **Automations fully wired** — `AutomationExecutorService` sends real emails via Brevo SMTP + creates in-app notification twins. All 5 automation templates are live. Fire-and-forget pattern (`.catch()`) to avoid SMTP timeouts
3. **i18n mandatory** — All UI strings must go through `t()`. No hardcoded strings in components
4. **Mobile-first** — Design for < 640px first, then scale up. Touch targets minimum 44px
5. **Component size** — Keep every component under 200 lines
6. **WCAG 2.1 AA** — Every component must pass vitest-axe. Contrast 4.5:1, keyboard navigation, ARIA labels
7. **Code in English** — Variables, functions, comments in English. Only i18n values in French
8. **No secrets in code** — Use environment variables (`.env`) via AdonisJS `Env.get()`
9. **Session auth** — Use AdonisJS session middleware, not JWT. Cookie-based auth with CSRF protection

### Naming Conventions

- **Files**: kebab-case for backend (`workflow_engine_service.ts`), PascalCase for React components (`KPICard.tsx`)
- **Database**: snake_case for tables and columns
- **API**: camelCase in JSON responses (Lucid serialization)
- **Routes**: kebab-case paths (`/workflow-templates`)
- **i18n keys**: dot-notation English (`dashboard.activeTransactions`)

### Known Pitfalls

- **Recharts in JSDOM** — `ResponsiveContainer` renders nothing (no container dimensions). Text content is testable but chart elements are not
- **Timezone in tests** — Use `vi.setSystemTime()` with UTC dates to avoid CI/local timezone mismatches
- **Tailwind v4** — Uses `@tailwindcss/postcss` plugin, NOT the v3 `tailwindcss` PostCSS plugin. CSS variables for theming, not `tailwind.config.js`
- **Workflow step slugs** — The slug in DB is `offer-submitted`, NOT `negotiation` or `en-negociation`. Always verify slugs against actual DB data before coding guards
- **autoConditionsEnabled** — Default `true`. Controls whether conditions are auto-generated at creation AND at step advancement. Both `advanceStep` and `skipStep` check this flag. **Exception**: FINTRAC conditions are ALWAYS created regardless of this flag (compliance override)
- **Offer gate** — Backend is source of truth (throws `E_ACCEPTED_OFFER_REQUIRED`). Frontend reads `requiresAcceptedOffer` + `hasAcceptedOffer` from advance-check endpoint
- **FINTRAC compliance** — Triggers at `firm-pending` step as `blocking` condition. 1 condition per buyer (purchase) or seller (sale). Cannot be escaped/skipped. Data stored in dedicated `fintrac_records` table (not on Party model). See `_bmad-output/fintrac-spec.md`
- **No right-side Sheets on desktop** — Phase C decision: all right-side drawers eliminated. Documents = inline collapsible, MembersPanel = Dialog (max-w-2xl), ExportSharePanel = Dialog (max-w-md)
- **CreateTransactionModal deleted** — Replaced by `/transactions/new` route pointing to `EditTransactionPage.tsx` in create mode. Do NOT recreate a modal for transaction creation
- **EditTransactionPage dual mode** — `isCreateMode = !id`. Create mode loads clients, auto-selects workflow template, shows client picker. Edit mode loads transaction data with change tracking

## 10. Roadmap (Validated Epics)

| Epic | Status | Description |
|------|--------|-------------|
| Epic 0: Foundation | Done | Design system, layout, i18n, test infrastructure |
| Epic 1: Workflow Engine | Done | Backend models, API, services, tests (70 backend tests) |
| Epic 2A: Voir et creer mes dossiers | Done | Transaction listing, search, filter, create |
| Epic 2B: Comprendre mon dossier | Done | Transaction detail, stepper, conditions read |
| Epic 2C: Agir sur mon dossier | Done | Condition toggle, action zone, blocking system |
| Epic 2D: Historique complet | Done | Offers, documents, timeline, notes tabs |
| Dashboard coverage | Done | KPI, pipeline, revenue, activity, deadlines tests |
| Epic 3: Automations & Reminders | Done | Email templates, BullMQ, auth hardening, multi-tenant |
| Epic 4: CSV Import API | Done | Backend API only, UI in Epic 5 |
| Maquettes 01-09 + 13 | Done | 10/13 maquettes implemented |
| Maquette 10: Export & Partage | Done | 100% conforme, audité (12 écarts corrigés) |
| Maquette 11: Permissions & Rôles | Done | 100% conforme, audité (6 écarts corrigés) |
| Maquette 12: Ajouter Offre | Done | 100% conforme, réécriture 6 états (commit 275cf25) |
| Phase C UX Overhaul | Done | Zero right-side Sheets on desktop. Documents inline, MembersPanel/ExportSharePanel as centered Dialogs |
| FINTRAC Module | Done | FintracRecord model, FintracService, FintracComplianceModal, blocking at firm-pending (commit dfadaee) |
| Email & Notifications System | Done | 23 emails + NotificationBell + notification twins. 7 phases, 31 tests GREEN |
| Auth Redesign | Done | Split-screen Register/Login, AdminLogin, email verification, VerifyEmailPage |
| Plans & Admin Backend | Done | 4 plans seeded, PlanService, PlanLimitMiddleware, AdminPlansPage, grace period |
| Epic 5: UI Import + Uploads | Backlog | Frontend import CSV, S3 documents, quota per tier |
| Epic 6: Landing Page | In Progress | LandingPage.tsx exists, hero needs polish for conversion |
| Epic 7: Stripe Billing | **Next** | Subscriptions, webhooks, checkout, plan enforcement — LAST step before launch |

### Epic 3 Completed

1. ✅ **Automation execution** — `AutomationExecutorService` sends emails (5 templates)
2. ✅ **Auth hardening** — Registration, forgot-password, reset-password
3. ✅ **Multi-tenant enforcement** — `TenantScopeService` for org-scoped queries
4. ✅ **BullMQ** — Delayed automations, daily digest, deadline warnings

### SaaS Pricing (⚠️ UPDATED 2026-02-06 — PRD v2 is source of truth)

| Plan | Mensuel | Annuel (−17%) | TX actives | Stockage | Historique |
|------|---------|--------------|-----------|----------|------------|
| Starter | 29$ CAD | 290$ | 5 | 1 Go | 6 mois |
| Solo | 49$ CAD | 490$ | 12 | 3 Go | 12 mois |
| Pro | 79$ CAD | 790$ | 25 | 10 Go | Illimité |
| Agence | 149$ CAD | 1 490$ | Illimité | 25 Go | Illimité (Phase 2) |

**Programme Fondateur**: 25 places, 1 mois gratuit, −20% à vie sur plan choisi (−30% si annuel)

Voir `_bmad-output/planning-artifacts/prd.md` pour détails complets.

## 11. NB Broker Automations (Source of Truth)

These automations are defined in the seeder (`nb_workflow_template_seeder.ts`) and are **fully executed** by `AutomationExecutorService`. Each automation sends an email AND creates an in-app notification twin for the broker.

### Client-Facing Emails

| Trigger Step | Action | Template Ref | Subject |
|-------------|--------|--------------|---------|
| Offer Accepted (on_enter) | send_email | `offer_accepted` | "Offer Accepted -- Congratulations!" |
| Firm Pending (on_enter) | send_email | `firm_confirmed` | "Transaction is now Firm" |

### Internal Tasks

| Trigger Step | Action | Template Ref | Title | Delay |
|-------------|--------|--------------|-------|-------|
| Firm Pending (on_enter) | create_task | `fintrac_reminder` | "Complete FINTRAC compliance" | 0 days |
| Closing Day (on_enter) | create_task | `celebration` | "Celebration -- keys delivered!" | 0 days |
| Post-Closing (on_enter) | create_task | `google_review_reminder` | "Ask client for Google review" | 7 days |

### Not Yet Seeded (from broker requirements)

- Birthday reminder (after FINTRAC complete)
- Social media reminders (Offer Accepted, SOLD, Key Day)
- Conditional follow-ups (financing + inspection monitoring)
- Rejected offer handling (manual, no automation)

---

## 12. Conditions/Profile Pipeline — Sprint Plan

### Sprint 1 (DONE — commit 49ab4d7)
- `autoConditionsEnabled` boolean flag on transactions table
- Property profile (type/context/financed) sent atomically at creation
- Condition packs auto-generate only when flag is ON
- Offer gate: blocks advancement on `offer-submitted` without accepted offer
- ValidateStepModal with 3 states (green/amber/red)
- PartiesCard inline on detail page
- PropertyProfileCard locked visually after step 1

### Sprint 2 (TODO)
- Backend guard: reject profile/flag modifications after step 1
- Toggle in ValidateStepModal: "Load next step conditions" when `autoConditionsEnabled=true`
- Unit tests for backend guards

### Sprint 3 (TODO)
- Admin override with type-to-confirm (`OVERRIDE`)
- Recalculate conditions after profile change (admin only)
- Audit log for overrides

### Sprint 4 (TODO)
- E2E tests for full pipeline
- Edge cases (empty profile, template with no conditions, etc.)
- UX polish

---

_Updated 2026-02-11 by Paige (BMAD). Source: broker email, codebase audit, decision documents, M08+M09+Phase C implementation._
_This file MUST be updated when features move from stub to functional._
