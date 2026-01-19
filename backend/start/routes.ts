/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Routes publiques
router.get('/api/health', async () => {
  return { success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }
})

router.post('/api/login', '#controllers/auth_controller.login').use(middleware.rateLimit())

// Routes protégées
router.group(() => {
  // Auth
  router.post('/logout', '#controllers/auth_controller.logout')
  router.get('/me', '#controllers/auth_controller.me')

  // Profile
  router.put('/me/password', '#controllers/profile_controller.changePassword')
  router.put('/me', '#controllers/profile_controller.updateProfile')
  router.put('/me/profile', '#controllers/profile_controller.updateProfileInfo')
  router.post('/me/logout-all', '#controllers/profile_controller.logoutAll')

  // Dashboard
  router.get('/dashboard/summary', '#controllers/dashboard_controller.summary')

  // Clients
  router.get('/clients', '#controllers/clients_controller.index')
  router.post('/clients', '#controllers/clients_controller.store')
  router.get('/clients/:id', '#controllers/clients_controller.show')
  router.get('/clients/:id/transactions', '#controllers/clients_controller.transactions')
  router.put('/clients/:id', '#controllers/clients_controller.update')
  router.delete('/clients/:id', '#controllers/clients_controller.destroy')

  // Transactions
  router.get('/transactions', '#controllers/transactions_controller.index')
  router.post('/transactions', '#controllers/transactions_controller.store')
  router.get('/transactions/:id', '#controllers/transactions_controller.show')
  router.put('/transactions/:id', '#controllers/transactions_controller.update')
  router.patch('/transactions/:id/status', '#controllers/transactions_controller.updateStatus')
  router.get('/transactions/:id/allowed-transitions', '#controllers/transactions_controller.allowedTransitions')
  router.delete('/transactions/:id', '#controllers/transactions_controller.destroy')

  // Conditions
  router.post('/transactions/:id/conditions', '#controllers/conditions_controller.store')
  router.put('/conditions/:id', '#controllers/conditions_controller.update')
  router.patch('/conditions/:id/complete', '#controllers/conditions_controller.complete')
  router.delete('/conditions/:id', '#controllers/conditions_controller.destroy')

  // Notes
  router.get('/transactions/:id/notes', '#controllers/notes_controller.index')
  router.post('/transactions/:id/notes', '#controllers/notes_controller.store')
  router.delete('/notes/:id', '#controllers/notes_controller.destroy')
}).prefix('/api').use(middleware.auth())
