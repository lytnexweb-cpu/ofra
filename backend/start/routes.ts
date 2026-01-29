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

router.post('/api/register', '#controllers/auth_controller.register').use(middleware.rateLimit())
router.post('/api/login', '#controllers/auth_controller.login').use(middleware.rateLimit())
router.post('/api/forgot-password', '#controllers/auth_controller.forgotPassword').use(middleware.rateLimit())
router.post('/api/reset-password', '#controllers/auth_controller.resetPassword').use(middleware.rateLimit())

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
  router.post('/clients/import', '#controllers/clients_controller.importCsv')
  router.get('/clients/import/template', '#controllers/clients_controller.getTemplate')
  router.get('/clients/:id', '#controllers/clients_controller.show')
  router.get('/clients/:id/transactions', '#controllers/clients_controller.transactions')
  router.put('/clients/:id', '#controllers/clients_controller.update')
  router.delete('/clients/:id', '#controllers/clients_controller.destroy')

  // Workflow Templates
  router.get('/workflow-templates', '#controllers/workflow_templates_controller.index')
  router.post('/workflow-templates', '#controllers/workflow_templates_controller.store')
  router.get('/workflow-templates/:id', '#controllers/workflow_templates_controller.show')
  router.put('/workflow-templates/:id', '#controllers/workflow_templates_controller.update')
  router.delete('/workflow-templates/:id', '#controllers/workflow_templates_controller.destroy')

  // Transactions
  router.get('/transactions', '#controllers/transactions_controller.index')
  router.post('/transactions', '#controllers/transactions_controller.store')
  router.get('/transactions/:id', '#controllers/transactions_controller.show')
  router.put('/transactions/:id', '#controllers/transactions_controller.update')
  router.patch('/transactions/:id/advance', '#controllers/transactions_controller.advanceStep')
  router.patch('/transactions/:id/skip', '#controllers/transactions_controller.skipStep')
  router.patch('/transactions/:id/goto/:stepOrder', '#controllers/transactions_controller.goToStep')
  router.get('/transactions/:id/activity', '#controllers/transactions_controller.activity')
  router.delete('/transactions/:id', '#controllers/transactions_controller.destroy')

  // Offers
  router.get('/transactions/:id/offers', '#controllers/offers_controller.index')
  router.post('/transactions/:id/offers', '#controllers/offers_controller.store')
  router.get('/offers/:offerId', '#controllers/offers_controller.show')
  router.post('/offers/:offerId/revisions', '#controllers/offers_controller.addRevision')
  router.patch('/offers/:offerId/accept', '#controllers/offers_controller.accept')
  router.patch('/offers/:offerId/reject', '#controllers/offers_controller.reject')
  router.patch('/offers/:offerId/withdraw', '#controllers/offers_controller.withdraw')
  router.delete('/offers/:offerId', '#controllers/offers_controller.destroy')

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
