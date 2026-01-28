---
project_name: OFRA
user_name: Sam
date: 2026-01-28
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
- **Compliance**: FINTRAC is mandatory for Canadian real estate transactions

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
| Email provider | Brevo (SMTP) | Not yet wired to automations |
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
| POST | `/login` | Login (rate limited) |

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

**Dashboard**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/dashboard/summary` | dashboard_controller.summary |

**Clients**

| Method | Path | Controller |
|--------|------|------------|
| GET | `/clients` | clients_controller.index |
| POST | `/clients` | clients_controller.store |
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
| Notes CRUD | Working | Create, list, delete per transaction |
| Activity feed | Working | Unified log of all transaction events |
| Dashboard summary | Working | KPIs, pipeline, revenue, deadlines |
| Client management | Working | CRUD with transaction association |
| Auth (login/logout) | Working | Session/cookie based |
| i18n (FR/EN) | Working | All UI strings translated |
| Dark mode | Working | Auto (prefers-color-scheme) + manual toggle |

### Stub / Not Implemented

| Feature | Status | Location | Details |
|---------|--------|----------|---------|
| **Automation execution** | **STUB** | `workflow_engine_service.ts:428-458` | Logs automation events to activity feed but does NOT send emails or create tasks. The `executeAutomations()` method only calls `ActivityFeedService.log()`. |
| Email sending | Not wired | Mail provider configured (Brevo) but not called from automations | Template refs exist (`offer_accepted`, `firm_confirmed`, `fintrac_reminder`, `celebration`, `google_review_reminder`) but no email templates or sending logic |
| BullMQ job queue | Not installed | Referenced in decisions doc for async jobs | Required for delayed automations (e.g., Google review 7 days post-closing) |
| Birthday reminder | Not implemented | From broker requirements | "Register client birthday in CRM after FINTRAC complete" |
| Social media reminders | Not implemented | From broker requirements | Triggered at Offer Accepted, SOLD, Key Day |
| Conditional follow-ups | Not implemented | From broker requirements | Financing + inspection follow-up during conditional period |
| Client onboarding form | Not implemented | From broker requirements | External form sent to client after listing appointment |
| Multi-tenant enforcement | Schema only | `organizations` table exists, `organization_id` on users | No row-level security or org-scoped queries yet |
| Notifications in-app | Not implemented | Planned for Epic 3 | Architecture designed but not built |

## 8. Testing Patterns

### Frontend (Vitest + Testing Library)

**Test count**: 248 tests across 30 files (all passing)

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
2. **Automation stub awareness** — `executeAutomations()` in `workflow_engine_service.ts` only logs. Any feature that depends on email/task execution must wire up actual sending first
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

## 10. Roadmap (Validated Epics)

| Epic | Status | Description |
|------|--------|-------------|
| Epic 0: Foundation | Done | Design system, layout, i18n, test infrastructure |
| Epic 1: Workflow Engine | Done | Backend models, API, services, tests (44 backend tests) |
| Epic 2A: Voir et creer mes dossiers | Done | Transaction listing, search, filter, create |
| Epic 2B: Comprendre mon dossier | Done | Transaction detail, stepper, conditions read |
| Epic 2C: Agir sur mon dossier | Done | Condition toggle, action zone, blocking system |
| Epic 2D: Historique complet | Done | Offers, documents, timeline, notes tabs |
| Dashboard coverage | Done | KPI, pipeline, revenue, activity, deadlines tests |
| **Epic 3: Automations & Reminders** | **Next** | Wire automation execution, email templates, BullMQ |
| Epic 4: Onboarding & Import | Backlog | Client onboarding form, CSV import, FollowUpBoss |

### Epic 3 Priority (validated by team)

1. **Automation execution** — Wire `executeAutomations()` to actually send emails and create tasks
2. **Auth hardening** — Registration flow, password reset, session management
3. **Multi-tenant enforcement** — Organization-scoped queries, row-level security

## 11. NB Broker Automations (Source of Truth)

These automations are defined in the seeder (`nb_workflow_template_seeder.ts`) but **only log to activity feed** — they do NOT execute.

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

_Generated 2026-01-28 by BMAD team. Source: broker email, codebase audit, decision documents._
_This file MUST be updated when features move from stub to functional._
