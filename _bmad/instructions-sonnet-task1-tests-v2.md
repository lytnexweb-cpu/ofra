# Instructions Sonnet - Tâche 1: Tests Automatisés (v2 Corrigée)

**Auteur**: Architecte Senior
**Date**: 2026-01-18
**Objectif**: Implémenter une suite de tests fiables et non-flaky pour CI

---

## RÈGLES ABSOLUES

1. **NE JAMAIS modifier** les fichiers dans `app/`, `database/migrations/`, `src/pages/`, `src/api/`
2. **NE JAMAIS remplacer** un fichier existant - uniquement MODIFIER ou AJOUTER
3. **La commande test backend est `node ace test`** (PAS `node --import=tsx`)
4. **Le fichier `backend/bin/test.ts` EXISTE DÉJÀ** - ne pas le créer
5. **Le fichier `backend/tests/bootstrap.ts` EXISTE DÉJÀ** - le MODIFIER, pas le remplacer
6. **`@vitejs/plugin-react` est DÉJÀ installé** dans frontend - ne pas le réinstaller

---

## VAGUE A: Smoke Tests Essentiels (À faire EN PREMIER)

### A1. Créer la DB de test

Exécuter cette commande Docker:

```bash
docker exec -it crm-yanick-postgres psql -U root -c "CREATE DATABASE crm_yanick_test;"
```

Si erreur "already exists", c'est OK, continuer.

---

### A2. Créer `.env.test` pour le backend

**Créer**: `backend/.env.test`

```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=crm_yanick_test
APP_KEY=test-app-key-that-is-at-least-32-characters-long
SESSION_DRIVER=cookie
ENFORCE_BLOCKING_CONDITIONS=true
```

---

### A3. MODIFIER `backend/tests/bootstrap.ts`

**ATTENTION**: Ce fichier existe déjà. Tu dois AJOUTER du code, pas remplacer.

**Fichier actuel** (pour référence):
```typescript
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'

export const plugins: Config['plugins'] = [assert(), apiClient(), pluginAdonisJS(app)]

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [],
  teardown: [],
}

export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
```

**Remplacer par** (version modifiée):

```typescript
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'

export const plugins: Config['plugins'] = [assert(), apiClient(), pluginAdonisJS(app)]

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      // Run migrations on test database
      await testUtils.db().migrate()
    },
  ],
  teardown: [
    async () => {
      // Truncate all tables after all tests complete
      await testUtils.db().truncate()
    },
  ],
}

export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
```

---

### A4. Créer les Helpers/Factories

**Créer**: `backend/tests/helpers/index.ts`

```typescript
export * from './db.js'
export * from './auth.js'
export * from './factories/user.js'
export * from './factories/client.js'
export * from './factories/transaction.js'
export * from './factories/condition.js'
```

---

**Créer**: `backend/tests/helpers/db.ts`

```typescript
import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import Note from '#models/note'
import TransactionStatusHistory from '#models/transaction_status_history'

/**
 * Truncate all tables in correct order (respecting FK constraints)
 */
export async function truncateAll() {
  await Note.query().delete()
  await Condition.query().delete()
  await TransactionStatusHistory.query().delete()
  await Transaction.query().delete()
  await Client.query().delete()
  await User.query().delete()
}
```

---

**Créer**: `backend/tests/helpers/auth.ts`

```typescript
import type { ApiClient } from '@japa/api-client'
import User from '#models/user'

/**
 * Login as a user and return cookies for authenticated requests
 */
export async function loginAs(client: ApiClient, user: User): Promise<Record<string, any>> {
  const response = await client.post('/api/login').json({
    email: user.email,
    password: 'password123', // All test users use this password
  })
  return response.cookies()
}

/**
 * Create a user and login, returning both user and cookies
 */
export async function createAndLogin(
  client: ApiClient,
  overrides: { email?: string } = {}
): Promise<{ user: User; cookies: Record<string, any> }> {
  const { createUser } = await import('./factories/user.js')
  const user = await createUser(overrides)
  const cookies = await loginAs(client, user)
  return { user, cookies }
}
```

---

**Créer**: `backend/tests/helpers/factories/user.ts`

```typescript
import User from '#models/user'

let userCounter = 0

export async function createUser(
  overrides: Partial<{
    email: string
    password: string
    fullName: string
  }> = {}
): Promise<User> {
  userCounter++
  return User.create({
    email: overrides.email ?? `testuser${userCounter}@test.com`,
    password: overrides.password ?? 'password123',
    fullName: overrides.fullName ?? `Test User ${userCounter}`,
  })
}
```

---

**Créer**: `backend/tests/helpers/factories/client.ts`

```typescript
import Client from '#models/client'

let clientCounter = 0

export async function createClient(
  ownerUserId: number,
  overrides: Partial<{
    firstName: string
    lastName: string
    email: string
  }> = {}
): Promise<Client> {
  clientCounter++
  return Client.create({
    ownerUserId,
    firstName: overrides.firstName ?? `John${clientCounter}`,
    lastName: overrides.lastName ?? `Doe${clientCounter}`,
    email: overrides.email ?? `client${clientCounter}@test.com`,
  })
}
```

---

**Créer**: `backend/tests/helpers/factories/transaction.ts`

```typescript
import Transaction from '#models/transaction'

export type TransactionStatus =
  | 'consultation'
  | 'offer'
  | 'accepted'
  | 'conditions'
  | 'notary'
  | 'closing'
  | 'completed'
  | 'canceled'

export async function createTransaction(
  ownerUserId: number,
  clientId: number,
  overrides: Partial<{
    type: 'purchase' | 'sale'
    status: TransactionStatus
    salePrice: number
  }> = {}
): Promise<Transaction> {
  return Transaction.create({
    ownerUserId,
    clientId,
    type: overrides.type ?? 'purchase',
    status: overrides.status ?? 'consultation',
    salePrice: overrides.salePrice ?? 500000,
  })
}
```

---

**Créer**: `backend/tests/helpers/factories/condition.ts`

```typescript
import Condition from '#models/condition'
import type { TransactionStatus } from './transaction.js'

export type ConditionStatus = 'pending' | 'completed'
export type ConditionType =
  | 'financing'
  | 'deposit'
  | 'inspection'
  | 'water_test'
  | 'rpds_review'
  | 'appraisal'
  | 'legal'
  | 'documents'
  | 'repairs'
  | 'other'
export type ConditionPriority = 'low' | 'medium' | 'high'

let conditionCounter = 0

export async function createCondition(
  transactionId: number,
  overrides: Partial<{
    title: string
    description: string
    status: ConditionStatus
    type: ConditionType
    priority: ConditionPriority
    stage: TransactionStatus
    isBlocking: boolean
  }> = {}
): Promise<Condition> {
  conditionCounter++
  return Condition.create({
    transactionId,
    title: overrides.title ?? `Test Condition ${conditionCounter}`,
    description: overrides.description ?? null,
    status: overrides.status ?? 'pending',
    type: overrides.type ?? 'other',           // OBLIGATOIRE
    priority: overrides.priority ?? 'medium',  // OBLIGATOIRE
    stage: overrides.stage ?? 'conditions',    // OBLIGATOIRE
    isBlocking: overrides.isBlocking ?? true,
  })
}
```

---

### A5. Tests Auth (Vague A)

**Créer**: `backend/tests/functional/auth.spec.ts`

```typescript
import { test } from '@japa/runner'
import { truncateAll, createUser, loginAs } from '#tests/helpers/index'

test.group('Auth - Login', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('login succeeds with valid credentials', async ({ client }) => {
    const user = await createUser({ email: 'auth@test.com' })

    const response = await client.post('/api/login').json({
      email: 'auth@test.com',
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('login fails with wrong password', async ({ client }) => {
    await createUser({ email: 'auth@test.com' })

    const response = await client.post('/api/login').json({
      email: 'auth@test.com',
      password: 'wrongpassword',
    })

    response.assertStatus(401)
  })

  test('GET /api/me returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/me')
    response.assertStatus(401)
  })

  test('GET /api/me returns user when authenticated', async ({ client }) => {
    const user = await createUser({ email: 'me@test.com' })
    const cookies = await loginAs(client, user)

    const response = await client.get('/api/me').cookies(cookies)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        user: {
          email: 'me@test.com',
        },
      },
    })
  })
})
```

---

### A6. Tests Clients (Vague A)

**Créer**: `backend/tests/functional/clients.spec.ts`

```typescript
import { test } from '@japa/runner'
import {
  truncateAll,
  createUser,
  createClient,
  createAndLogin,
} from '#tests/helpers/index'

test.group('Clients - CRUD', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('GET /api/clients returns empty array for new user', async ({ client }) => {
    const { cookies } = await createAndLogin(client, { email: 'clients@test.com' })

    const response = await client.get('/api/clients').cookies(cookies)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        clients: [],
      },
    })
  })

  test('POST /api/clients creates a client', async ({ client }) => {
    const { cookies } = await createAndLogin(client, { email: 'clients@test.com' })

    const response = await client.post('/api/clients').cookies(cookies).json({
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        client: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    })
  })

  test('POST /api/clients fails without firstName (validation)', async ({ client }) => {
    const { cookies } = await createAndLogin(client, { email: 'clients@test.com' })

    const response = await client.post('/api/clients').cookies(cookies).json({
      lastName: 'Doe',
    })

    response.assertStatus(422)
  })
})

test.group('Clients - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('User A cannot list User B clients', async ({ client }) => {
    // Create User A with a client
    const userA = await createUser({ email: 'usera@test.com' })
    await createClient(userA.id, { firstName: 'ClientOfA' })

    // Create User B and login
    const userB = await createUser({ email: 'userb@test.com' })
    const cookiesB = await client.post('/api/login').json({
      email: 'userb@test.com',
      password: 'password123',
    }).then((r) => r.cookies())

    // User B should see empty list
    const response = await client.get('/api/clients').cookies(cookiesB)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        clients: [],
      },
    })
  })

  test('User A cannot GET User B client by ID', async ({ client }) => {
    // Create User A with a client
    const userA = await createUser({ email: 'usera@test.com' })
    const clientOfA = await createClient(userA.id, { firstName: 'ClientOfA' })

    // Create User B and login
    const userB = await createUser({ email: 'userb@test.com' })
    const cookiesB = await client.post('/api/login').json({
      email: 'userb@test.com',
      password: 'password123',
    }).then((r) => r.cookies())

    // User B should get 404 trying to access User A's client
    const response = await client.get(`/api/clients/${clientOfA.id}`).cookies(cookiesB)

    response.assertStatus(404)
  })
})
```

---

### A7. Tests Transactions + Blocking Conditions (Vague A)

**Créer**: `backend/tests/functional/transactions.spec.ts`

```typescript
import { test } from '@japa/runner'
import {
  truncateAll,
  createUser,
  createClient,
  createTransaction,
  createCondition,
  createAndLogin,
} from '#tests/helpers/index'

test.group('Transactions - CRUD', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('POST /api/transactions creates a transaction', async ({ client }) => {
    const { user, cookies } = await createAndLogin(client, { email: 'tx@test.com' })
    const testClient = await createClient(user.id)

    const response = await client.post('/api/transactions').cookies(cookies).json({
      clientId: testClient.id,
      type: 'purchase',
      status: 'consultation',
      salePrice: 500000,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          type: 'purchase',
          status: 'consultation',
        },
      },
    })
  })

  test('PATCH /api/transactions/:id/status changes status', async ({ client }) => {
    const { user, cookies } = await createAndLogin(client, { email: 'tx@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'consultation' })

    const response = await client
      .patch(`/api/transactions/${transaction.id}/status`)
      .cookies(cookies)
      .json({ status: 'offer' })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          status: 'offer',
        },
      },
    })
  })
})

test.group('Transactions - Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('User A cannot access User B transaction', async ({ client }) => {
    // Create User A with transaction
    const userA = await createUser({ email: 'usera@test.com' })
    const clientA = await createClient(userA.id)
    const txA = await createTransaction(userA.id, clientA.id)

    // Create User B and login
    const userB = await createUser({ email: 'userb@test.com' })
    const cookiesB = await client.post('/api/login').json({
      email: 'userb@test.com',
      password: 'password123',
    }).then((r) => r.cookies())

    // User B should get 404
    const response = await client.get(`/api/transactions/${txA.id}`).cookies(cookiesB)

    response.assertStatus(404)
  })
})

test.group('Transactions - Blocking Conditions', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('status change BLOCKED when pending blocking condition at current stage', async ({ client }) => {
    const { user, cookies } = await createAndLogin(client, { email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add blocking condition at SAME stage as transaction
    await createCondition(transaction.id, {
      title: 'Financing Approval',
      status: 'pending',
      stage: 'conditions', // Same as transaction.status
      isBlocking: true,
    })

    // Try to advance status - should be blocked
    const response = await client
      .patch(`/api/transactions/${transaction.id}/status`)
      .cookies(cookies)
      .json({ status: 'notary' })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: {
        code: 'E_BLOCKING_CONDITIONS',
      },
    })
  })

  test('status change ALLOWED when blocking condition is completed', async ({ client }) => {
    const { user, cookies } = await createAndLogin(client, { email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add blocking condition but mark it COMPLETED
    await createCondition(transaction.id, {
      title: 'Financing Approval',
      status: 'completed', // Already done
      stage: 'conditions',
      isBlocking: true,
    })

    // Status change should succeed
    const response = await client
      .patch(`/api/transactions/${transaction.id}/status`)
      .cookies(cookies)
      .json({ status: 'notary' })

    response.assertStatus(200)
  })

  test('status change ALLOWED when condition is NOT blocking', async ({ client }) => {
    const { user, cookies } = await createAndLogin(client, { email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add non-blocking condition (isBlocking = false)
    await createCondition(transaction.id, {
      title: 'Optional Inspection',
      status: 'pending',
      stage: 'conditions',
      isBlocking: false, // Not blocking!
    })

    // Status change should succeed
    const response = await client
      .patch(`/api/transactions/${transaction.id}/status`)
      .cookies(cookies)
      .json({ status: 'notary' })

    response.assertStatus(200)
  })

  test('status change ALLOWED when blocking condition is at DIFFERENT stage', async ({ client }) => {
    const { user, cookies } = await createAndLogin(client, { email: 'blocking@test.com' })
    const testClient = await createClient(user.id)
    const transaction = await createTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add blocking condition at DIFFERENT stage
    await createCondition(transaction.id, {
      title: 'Final Walkthrough',
      status: 'pending',
      stage: 'closing', // Different from transaction.status (conditions)
      isBlocking: true,
    })

    // Status change should succeed (condition is for a later stage)
    const response = await client
      .patch(`/api/transactions/${transaction.id}/status`)
      .cookies(cookies)
      .json({ status: 'notary' })

    response.assertStatus(200)
  })
})
```

---

## VAGUE A - FRONTEND

### A8. Installer les dépendances frontend

**Exécuter dans `frontend/`**:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**NE PAS installer @vitejs/plugin-react** (déjà présent).

---

### A9. Créer la config Vitest

**Créer**: `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

---

### A10. Créer le setup de test

**Créer**: `frontend/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup DOM after each test
afterEach(() => {
  cleanup()
})

// Mock fetch globally
export const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Reset mock before each test
beforeEach(() => {
  mockFetch.mockReset()
})
```

---

### A11. Ajouter les scripts npm frontend

**Modifier**: `frontend/package.json` - ajouter dans "scripts":

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

### A12. Test LoginPage

**Créer**: `frontend/src/pages/__tests__/LoginPage.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '../LoginPage'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderLoginPage = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    renderLoginPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderLoginPage()

    const button = screen.getByRole('button', { name: /sign in|login|log in|submit/i })
    expect(button).toBeInTheDocument()
  })

  it('allows typing in form fields', () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('test@test.com')
    expect(passwordInput.value).toBe('password123')
  })
})
```

---

## VAGUE A - CI

### A13. Créer le workflow GitHub Actions

**Créer**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  backend:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: root
          POSTGRES_PASSWORD: root
          POSTGRES_DB: crm_yanick_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Lint
        working-directory: backend
        run: npm run lint

      - name: Typecheck
        working-directory: backend
        run: npm run typecheck

      - name: Run migrations
        working-directory: backend
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: root
          DB_PASSWORD: root
          DB_DATABASE: crm_yanick_test
          NODE_ENV: test
          APP_KEY: ci-test-app-key-that-is-at-least-32-chars
        run: node ace migration:run

      - name: Run tests
        working-directory: backend
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_USER: root
          DB_PASSWORD: root
          DB_DATABASE: crm_yanick_test
          NODE_ENV: test
          APP_KEY: ci-test-app-key-that-is-at-least-32-chars
          ENFORCE_BLOCKING_CONDITIONS: 'true'
        run: node ace test

  frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Lint
        working-directory: frontend
        run: npm run lint

      - name: Build (includes typecheck)
        working-directory: frontend
        run: npm run build

      - name: Run tests
        working-directory: frontend
        run: npm run test:run
```

---

## COMMANDES DE VÉRIFICATION

Après avoir terminé, exécute ces commandes pour valider:

### Backend

```bash
cd backend

# Créer la DB test si pas déjà fait
docker exec -it crm-yanick-postgres psql -U root -c "CREATE DATABASE crm_yanick_test;" 2>/dev/null || true

# Lancer les tests
set DB_DATABASE=crm_yanick_test
node ace test
```

**Résultat attendu**: 15 tests passent (4 auth + 5 clients + 6 transactions)

### Frontend

```bash
cd frontend
npm run test:run
```

**Résultat attendu**: 3 tests passent

---

## CHECKLIST FINALE

Avant de considérer la tâche terminée, vérifie:

- [ ] `backend/.env.test` créé
- [ ] `backend/tests/bootstrap.ts` modifié (pas remplacé)
- [ ] `backend/tests/helpers/` créé avec 6 fichiers
- [ ] `backend/tests/functional/auth.spec.ts` créé (4 tests)
- [ ] `backend/tests/functional/clients.spec.ts` créé (5 tests)
- [ ] `backend/tests/functional/transactions.spec.ts` créé (6 tests)
- [ ] `frontend/vitest.config.ts` créé
- [ ] `frontend/src/test/setup.ts` créé
- [ ] `frontend/src/pages/__tests__/LoginPage.test.tsx` créé (3 tests)
- [ ] `frontend/package.json` modifié (scripts test ajoutés)
- [ ] `.github/workflows/test.yml` créé
- [ ] `node ace test` passe (backend)
- [ ] `npm run test:run` passe (frontend)
- [ ] AUCUN fichier dans `app/`, `database/migrations/`, `src/pages/`, `src/api/` n'a été modifié

---

## STRUCTURE FINALE ATTENDUE

```
backend/
├── tests/
│   ├── bootstrap.ts          # MODIFIÉ
│   ├── helpers/
│   │   ├── index.ts          # NOUVEAU
│   │   ├── db.ts             # NOUVEAU
│   │   ├── auth.ts           # NOUVEAU
│   │   └── factories/
│   │       ├── user.ts       # NOUVEAU
│   │       ├── client.ts     # NOUVEAU
│   │       ├── transaction.ts # NOUVEAU
│   │       └── condition.ts  # NOUVEAU
│   └── functional/
│       ├── auth.spec.ts      # NOUVEAU
│       ├── clients.spec.ts   # NOUVEAU
│       └── transactions.spec.ts # NOUVEAU
└── .env.test                 # NOUVEAU

frontend/
├── vitest.config.ts          # NOUVEAU
└── src/
    ├── test/
    │   └── setup.ts          # NOUVEAU
    └── pages/
        └── __tests__/
            └── LoginPage.test.tsx # NOUVEAU

.github/
└── workflows/
    └── test.yml              # NOUVEAU
```

---

## NOTES IMPORTANTES

1. **Si un test échoue**, analyse l'erreur et corrige LE TEST, pas le code métier
2. **Les cookies sont essentiels** - utilise toujours `.cookies()` après login
3. **L'ordre de suppression compte** - respecte l'ordre FK dans `truncateAll()`
4. **Les champs Condition sont obligatoires** - `type`, `priority`, `stage` doivent toujours être fournis

---

FIN DES INSTRUCTIONS VAGUE A
