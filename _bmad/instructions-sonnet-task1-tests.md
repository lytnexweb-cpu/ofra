# Instructions Sonnet 4.5 - Tâche 1: Implémentation Tests Automatisés

## Objectif
Implémenter une suite de tests automatisés complète pour le CRM Yanick (backend + frontend). Le projet n'a actuellement AUCUN test.

## Contexte Technique
- **Backend**: AdonisJS v6, TypeScript, PostgreSQL, Japa (test framework inclus)
- **Frontend**: React 19, Vite, TanStack Query, TypeScript
- **Multi-tenancy**: Toutes les données filtrées par `owner_user_id`

---

# PARTIE A: Tests Backend (Japa)

## A1. Configuration Bootstrap

Le fichier `backend/tests/bootstrap.ts` existe peut-être déjà. Vérifie et assure-toi qu'il est correctement configuré:

```typescript
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { configure, processCLIArgs, run } from '@japa/runner'

processCLIArgs(process.argv.splice(2))

configure({
  files: ['tests/functional/**/*.spec.ts', 'tests/unit/**/*.spec.ts'],
  plugins: [
    assert(),
    apiClient({
      baseURL: 'http://localhost:3333',
    }),
    pluginAdonisJS(app),
  ],
  setup: [
    async () => {
      await testUtils.db().migrate()
      return async () => {
        await testUtils.db().truncate()
      }
    },
  ],
})

run()
```

## A2. Fichier Helper pour Tests

**Créer:** `backend/tests/helpers.ts`

```typescript
import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import hash from '@adonisjs/core/services/hash'

export async function createTestUser(overrides: Partial<{
  email: string
  password: string
  fullName: string
}> = {}) {
  const user = await User.create({
    email: overrides.email || `test-${Date.now()}@test.com`,
    password: overrides.password || 'password123',
    fullName: overrides.fullName || 'Test User',
  })
  return user
}

export async function createTestClient(userId: number, overrides: Partial<{
  firstName: string
  lastName: string
  email: string
}> = {}) {
  const client = await Client.create({
    ownerUserId: userId,
    firstName: overrides.firstName || 'John',
    lastName: overrides.lastName || 'Doe',
    email: overrides.email || `client-${Date.now()}@test.com`,
  })
  return client
}

export async function createTestTransaction(userId: number, clientId: number, overrides: Partial<{
  type: 'purchase' | 'sale'
  status: string
  salePrice: number
}> = {}) {
  const transaction = await Transaction.create({
    ownerUserId: userId,
    clientId: clientId,
    type: overrides.type || 'purchase',
    status: overrides.status || 'consultation',
    salePrice: overrides.salePrice || 500000,
  })
  return transaction
}

export async function loginUser(client: any, email: string, password: string) {
  const response = await client.post('/api/login').json({
    email,
    password,
  })
  return response
}
```

## A3. Tests Auth

**Créer:** `backend/tests/functional/auth.spec.ts`

```typescript
import { test } from '@japa/runner'
import { createTestUser } from '../helpers.js'
import User from '#models/user'

test.group('Auth - Login', (group) => {
  group.each.setup(async () => {
    await User.query().delete()
  })

  test('login succeeds with valid credentials', async ({ client }) => {
    await createTestUser({ email: 'test@test.com', password: 'password123' })

    const response = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('login fails with wrong password', async ({ client }) => {
    await createTestUser({ email: 'test@test.com', password: 'password123' })

    const response = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'wrongpassword',
    })

    response.assertStatus(401)
    response.assertBodyContains({ success: false })
  })

  test('login fails with non-existent email', async ({ client }) => {
    const response = await client.post('/api/login').json({
      email: 'nonexistent@test.com',
      password: 'password123',
    })

    response.assertStatus(401)
    response.assertBodyContains({ success: false })
  })
})

test.group('Auth - Me', (group) => {
  group.each.setup(async () => {
    await User.query().delete()
  })

  test('GET /api/me returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/me')
    response.assertStatus(401)
  })

  test('GET /api/me returns user when authenticated', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })

    // Login first
    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })

    // Get cookies from login response
    const cookies = loginResponse.cookies()

    const response = await client.get('/api/me').cookies(cookies)
    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        user: {
          email: 'test@test.com',
        },
      },
    })
  })
})

test.group('Auth - Logout', (group) => {
  group.each.setup(async () => {
    await User.query().delete()
  })

  test('logout clears session', async ({ client }) => {
    await createTestUser({ email: 'test@test.com', password: 'password123' })

    // Login
    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    // Logout
    const logoutResponse = await client.post('/api/logout').cookies(cookies)
    logoutResponse.assertStatus(200)

    // Verify session is cleared
    const meResponse = await client.get('/api/me').cookies(cookies)
    meResponse.assertStatus(401)
  })
})
```

## A4. Tests Clients

**Créer:** `backend/tests/functional/clients.spec.ts`

```typescript
import { test } from '@japa/runner'
import { createTestUser, createTestClient, createTestTransaction, loginUser } from '../helpers.js'
import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'

test.group('Clients CRUD', (group) => {
  let cookies: any

  group.each.setup(async () => {
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('GET /api/clients returns empty array initially', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

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
    await createTestUser({ email: 'test@test.com', password: 'password123' })
    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.post('/api/clients').cookies(cookies).json({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
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

  test('POST /api/clients fails without firstName', async ({ client }) => {
    await createTestUser({ email: 'test@test.com', password: 'password123' })
    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.post('/api/clients').cookies(cookies).json({
      lastName: 'Doe',
    })

    response.assertStatus(422)
  })

  test('GET /api/clients/:id returns the client', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.get(`/api/clients/${testClient.id}`).cookies(cookies)
    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        client: {
          id: testClient.id,
        },
      },
    })
  })

  test('GET /api/clients/:id returns 404 for non-existent client', async ({ client }) => {
    await createTestUser({ email: 'test@test.com', password: 'password123' })
    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.get('/api/clients/99999').cookies(cookies)
    response.assertStatus(404)
  })

  test('PUT /api/clients/:id updates the client', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.put(`/api/clients/${testClient.id}`).cookies(cookies).json({
      firstName: 'Jane',
      lastName: 'Smith',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        client: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      },
    })
  })

  test('DELETE /api/clients/:id deletes the client', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.delete(`/api/clients/${testClient.id}`).cookies(cookies)
    response.assertStatus(200)

    // Verify deleted
    const getResponse = await client.get(`/api/clients/${testClient.id}`).cookies(cookies)
    getResponse.assertStatus(404)
  })

  test('DELETE /api/clients/:id fails if client has transactions', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    await createTestTransaction(user.id, testClient.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.delete(`/api/clients/${testClient.id}`).cookies(cookies)
    response.assertStatus(400)
  })
})

test.group('Clients Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('User cannot see clients of another user', async ({ client }) => {
    // Create user 1 with a client
    const user1 = await createTestUser({ email: 'user1@test.com', password: 'password123' })
    const client1 = await createTestClient(user1.id, { firstName: 'User1Client' })

    // Create user 2
    const user2 = await createTestUser({ email: 'user2@test.com', password: 'password123' })

    // Login as user 2
    const loginResponse = await client.post('/api/login').json({
      email: 'user2@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    // User 2 should NOT see user 1's client
    const listResponse = await client.get('/api/clients').cookies(cookies)
    listResponse.assertStatus(200)
    listResponse.assertBodyContains({
      data: {
        clients: [],
      },
    })

    // User 2 should get 404 trying to access user 1's client directly
    const getResponse = await client.get(`/api/clients/${client1.id}`).cookies(cookies)
    getResponse.assertStatus(404)
  })
})
```

## A5. Tests Transactions

**Créer:** `backend/tests/functional/transactions.spec.ts`

```typescript
import { test } from '@japa/runner'
import { createTestUser, createTestClient, createTestTransaction } from '../helpers.js'
import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import Note from '#models/note'
import TransactionStatusHistory from '#models/transaction_status_history'

test.group('Transactions CRUD', (group) => {
  group.each.setup(async () => {
    await Note.query().delete()
    await Condition.query().delete()
    await TransactionStatusHistory.query().delete()
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('GET /api/transactions returns transactions for user', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    await createTestTransaction(user.id, testClient.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.get('/api/transactions').cookies(cookies)
    response.assertStatus(200)
    response.assertBodyContains({ success: true })
  })

  test('POST /api/transactions creates a transaction', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

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

  test('POST /api/transactions fails without clientId', async ({ client }) => {
    await createTestUser({ email: 'test@test.com', password: 'password123' })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.post('/api/transactions').cookies(cookies).json({
      type: 'purchase',
      status: 'consultation',
    })

    response.assertStatus(422)
  })

  test('GET /api/transactions/:id returns the transaction', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.get(`/api/transactions/${transaction.id}`).cookies(cookies)
    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
        },
      },
    })
  })

  test('PUT /api/transactions/:id updates the transaction', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.put(`/api/transactions/${transaction.id}`).cookies(cookies).json({
      salePrice: 600000,
      notesText: 'Updated notes',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        transaction: {
          salePrice: 600000,
        },
      },
    })
  })

  test('PATCH /api/transactions/:id/status changes status', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id, { status: 'consultation' })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.patch(`/api/transactions/${transaction.id}/status`).cookies(cookies).json({
      status: 'offer',
    })

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

  test('DELETE /api/transactions/:id deletes with cascade', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)

    // Add a condition and note
    await Condition.create({
      transactionId: transaction.id,
      title: 'Test Condition',
      status: 'pending',
      isBlocking: true,
    })
    await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'Test note',
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.delete(`/api/transactions/${transaction.id}`).cookies(cookies)
    response.assertStatus(200)

    // Verify cascade deleted conditions and notes
    const conditions = await Condition.query().where('transaction_id', transaction.id)
    const notes = await Note.query().where('transaction_id', transaction.id)

    // These should be empty arrays
  })
})

test.group('Transactions Multi-tenancy', (group) => {
  group.each.setup(async () => {
    await Note.query().delete()
    await Condition.query().delete()
    await TransactionStatusHistory.query().delete()
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('User cannot see transactions of another user', async ({ client }) => {
    // Create user 1 with a transaction
    const user1 = await createTestUser({ email: 'user1@test.com', password: 'password123' })
    const client1 = await createTestClient(user1.id)
    const transaction1 = await createTestTransaction(user1.id, client1.id)

    // Create user 2
    const user2 = await createTestUser({ email: 'user2@test.com', password: 'password123' })

    // Login as user 2
    const loginResponse = await client.post('/api/login').json({
      email: 'user2@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    // User 2 should NOT see user 1's transaction
    const getResponse = await client.get(`/api/transactions/${transaction1.id}`).cookies(cookies)
    getResponse.assertStatus(404)
  })
})
```

## A6. Tests Conditions (avec Blocking)

**Créer:** `backend/tests/functional/conditions.spec.ts`

```typescript
import { test } from '@japa/runner'
import { createTestUser, createTestClient, createTestTransaction } from '../helpers.js'
import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import Note from '#models/note'
import TransactionStatusHistory from '#models/transaction_status_history'

test.group('Conditions CRUD', (group) => {
  group.each.setup(async () => {
    await Note.query().delete()
    await Condition.query().delete()
    await TransactionStatusHistory.query().delete()
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('POST /api/transactions/:id/conditions adds a condition', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.post(`/api/transactions/${transaction.id}/conditions`).cookies(cookies).json({
      title: 'Home Inspection',
      description: 'Full home inspection required',
      type: 'inspection',
      priority: 'high',
      isBlocking: true,
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        condition: {
          title: 'Home Inspection',
          isBlocking: true,
        },
      },
    })
  })

  test('PUT /api/conditions/:id updates a condition', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)
    const condition = await Condition.create({
      transactionId: transaction.id,
      title: 'Original Title',
      status: 'pending',
      isBlocking: true,
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.put(`/api/conditions/${condition.id}`).cookies(cookies).json({
      title: 'Updated Title',
      isBlocking: false,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        condition: {
          title: 'Updated Title',
          isBlocking: false,
        },
      },
    })
  })

  test('PATCH /api/conditions/:id/complete marks condition as completed', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)
    const condition = await Condition.create({
      transactionId: transaction.id,
      title: 'Test Condition',
      status: 'pending',
      isBlocking: true,
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.patch(`/api/conditions/${condition.id}/complete`).cookies(cookies)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      data: {
        condition: {
          status: 'completed',
        },
      },
    })
  })

  test('DELETE /api/conditions/:id deletes a condition', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)
    const condition = await Condition.create({
      transactionId: transaction.id,
      title: 'Test Condition',
      status: 'pending',
      isBlocking: true,
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.delete(`/api/conditions/${condition.id}`).cookies(cookies)
    response.assertStatus(200)
  })
})

test.group('Blocking Conditions', (group) => {
  group.each.setup(async () => {
    await Note.query().delete()
    await Condition.query().delete()
    await TransactionStatusHistory.query().delete()
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('Status change blocked when blocking condition pending at current stage', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add blocking condition at current stage
    await Condition.create({
      transactionId: transaction.id,
      title: 'Blocking Condition',
      status: 'pending',
      stage: 'conditions',
      isBlocking: true,
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    // Try to change status - should be blocked
    const response = await client.patch(`/api/transactions/${transaction.id}/status`).cookies(cookies).json({
      status: 'notary',
    })

    response.assertStatus(400)
    response.assertBodyContains({
      success: false,
      error: {
        code: 'E_BLOCKING_CONDITIONS',
      },
    })
  })

  test('Status change allowed when blocking condition is completed', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add blocking condition but mark it completed
    await Condition.create({
      transactionId: transaction.id,
      title: 'Completed Condition',
      status: 'completed',
      stage: 'conditions',
      isBlocking: true,
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    // Status change should succeed
    const response = await client.patch(`/api/transactions/${transaction.id}/status`).cookies(cookies).json({
      status: 'notary',
    })

    response.assertStatus(200)
  })

  test('Status change allowed when condition is not blocking', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id, { status: 'conditions' })

    // Add non-blocking condition
    await Condition.create({
      transactionId: transaction.id,
      title: 'Non-Blocking Condition',
      status: 'pending',
      stage: 'conditions',
      isBlocking: false,
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    // Status change should succeed
    const response = await client.patch(`/api/transactions/${transaction.id}/status`).cookies(cookies).json({
      status: 'notary',
    })

    response.assertStatus(200)
  })
})
```

## A7. Tests Notes

**Créer:** `backend/tests/functional/notes.spec.ts`

```typescript
import { test } from '@japa/runner'
import { createTestUser, createTestClient, createTestTransaction } from '../helpers.js'
import User from '#models/user'
import Client from '#models/client'
import Transaction from '#models/transaction'
import Condition from '#models/condition'
import Note from '#models/note'
import TransactionStatusHistory from '#models/transaction_status_history'

test.group('Notes CRUD', (group) => {
  group.each.setup(async () => {
    await Note.query().delete()
    await Condition.query().delete()
    await TransactionStatusHistory.query().delete()
    await Transaction.query().delete()
    await Client.query().delete()
    await User.query().delete()
  })

  test('GET /api/transactions/:id/notes returns notes', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)

    await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'Test note content',
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.get(`/api/transactions/${transaction.id}/notes`).cookies(cookies)
    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })
  })

  test('POST /api/transactions/:id/notes adds a note', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.post(`/api/transactions/${transaction.id}/notes`).cookies(cookies).json({
      content: 'New note content',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      data: {
        note: {
          content: 'New note content',
        },
      },
    })
  })

  test('DELETE /api/notes/:id deletes a note', async ({ client }) => {
    const user = await createTestUser({ email: 'test@test.com', password: 'password123' })
    const testClient = await createTestClient(user.id)
    const transaction = await createTestTransaction(user.id, testClient.id)
    const note = await Note.create({
      transactionId: transaction.id,
      authorUserId: user.id,
      content: 'Note to delete',
    })

    const loginResponse = await client.post('/api/login').json({
      email: 'test@test.com',
      password: 'password123',
    })
    const cookies = loginResponse.cookies()

    const response = await client.delete(`/api/notes/${note.id}`).cookies(cookies)
    response.assertStatus(200)
  })
})
```

---

# PARTIE B: Tests Frontend (Vitest)

## B1. Installation dépendances

Exécute dans le dossier `frontend`:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

## B2. Configuration Vitest

**Créer:** `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
})
```

## B3. Setup file

**Créer:** `frontend/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()
```

## B4. Modifier package.json

**Modifier:** `frontend/package.json` - ajouter dans scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## B5. Test LoginPage

**Créer:** `frontend/src/pages/__tests__/LoginPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '../LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderLoginPage = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renders login form', () => {
    renderLoginPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in|login|log in/i })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    renderLoginPage()

    const submitButton = screen.getByRole('button', { name: /sign in|login|log in/i })
    fireEvent.click(submitButton)

    // Form should show required validation (HTML5 or custom)
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toBeRequired()
  })

  it('allows typing in email and password fields', () => {
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

## B6. Test DashboardPage

**Créer:** `frontend/src/pages/__tests__/DashboardPage.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '../DashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const mockFetch = vi.fn()
global.fetch = mockFetch

const renderDashboardPage = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderDashboardPage()

    // Should show loading indicator or skeleton
    expect(screen.getByText(/loading|dashboard/i)).toBeInTheDocument()
  })

  it('renders dashboard statistics after loading', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          summary: {
            totalTransactions: 10,
            activeTransactions: 5,
            completedTransactions: 3,
            overdueConditions: 2,
            dueSoonConditions: 1,
          },
        },
      }),
    })

    renderDashboardPage()

    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
    })
  })
})
```

## B7. Test Layout Component

**Créer:** `frontend/src/components/__tests__/Layout.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '../Layout'

const queryClient = new QueryClient()

const renderLayout = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Layout', () => {
  it('renders children content', () => {
    renderLayout()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderLayout()

    // Check for main navigation items
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/clients/i)).toBeInTheDocument()
    expect(screen.getByText(/transactions/i)).toBeInTheDocument()
  })
})
```

---

# PARTIE C: Scripts et Configuration Finale

## C1. Vérifier/Modifier backend package.json

Assure-toi que les scripts test existent dans `backend/package.json`:

```json
{
  "scripts": {
    "test": "node --import=tsx bin/test.ts",
    "test:watch": "node --import=tsx bin/test.ts --watch"
  }
}
```

## C2. Créer bin/test.ts si manquant

**Créer si manquant:** `backend/bin/test.ts`

```typescript
import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

const ignitor = new Ignitor(APP_ROOT)

ignitor
  .tap((app) => {
    app.booting(async () => {
      await import('../tests/bootstrap.js')
    })
  })
  .testRunner()
  .run()
```

---

# CHECKLIST DE VALIDATION

Quand tu as terminé, vérifie que:

- [ ] `cd backend && npm test` s'exécute sans erreur
- [ ] Tous les tests backend passent (minimum 20 tests)
- [ ] `cd frontend && npm test` s'exécute sans erreur
- [ ] Tous les tests frontend passent (minimum 5 tests)
- [ ] Tests multi-tenancy présents (utilisateurs ne voient pas les données des autres)
- [ ] Tests blocking conditions présents
- [ ] Aucune modification du code métier existant (seulement ajout de fichiers de test)

---

# NOTES IMPORTANTES

1. **N'utilise PAS de base de données de test séparée** - utilise la même DB avec truncate entre les tests
2. **Adapte les tests** si la structure des réponses API diffère légèrement
3. **Vérifie les imports** - ils peuvent varier selon la config AdonisJS existante
4. **Si un test échoue**, analyse pourquoi et corrige le test, pas le code métier
5. **Les cookies** sont essentiels pour les tests authentifiés - utilise `.cookies()` de Japa

Bonne chance!
