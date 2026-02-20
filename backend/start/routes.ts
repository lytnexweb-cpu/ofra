/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import path from 'node:path'
import { middleware } from './kernel.js'
import ConditionEvidence from '#models/condition_evidence'
import TransactionDocument from '#models/transaction_document'
import { TenantScopeService } from '#services/tenant_scope_service'
import Transaction from '#models/transaction'

// Serve uploaded files (authenticated, sanitized, ownership-checked)
router.get('/api/uploads/:filename', async ({ params, response, auth }) => {
  await auth.authenticate()
  const user = auth.user!
  const sanitized = path.basename(params.filename)
  if (!sanitized || sanitized !== params.filename) {
    return response.notFound({ success: false, error: { message: 'File not found' } })
  }

  const fileUrl = `/api/uploads/${sanitized}`

  // Check if file belongs to a condition evidence the user can access
  const evidence = await ConditionEvidence.query()
    .where('fileUrl', fileUrl)
    .preload('condition')
    .first()

  if (evidence) {
    const tx = await TenantScopeService.apply(Transaction.query(), user)
      .where('id', evidence.condition.transactionId)
      .first()
    if (!tx) {
      return response.notFound({ success: false, error: { message: 'File not found' } })
    }
  } else {
    // Check if file belongs to a transaction document the user can access
    const doc = await TransactionDocument.query().where('fileUrl', fileUrl).first()
    if (doc) {
      const tx = await TenantScopeService.apply(Transaction.query(), user)
        .where('id', doc.transactionId)
        .first()
      if (!tx) {
        return response.notFound({ success: false, error: { message: 'File not found' } })
      }
    } else {
      // File not linked to any evidence or document — deny access
      return response.notFound({ success: false, error: { message: 'File not found' } })
    }
  }

  const filePath = app.makePath('storage/uploads', sanitized)
  return response.download(filePath)
}).use(middleware.auth())

// Routes publiques
router.get('/api/health', async () => {
  return { success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }
})

router.get('/api/plans', '#controllers/plans_controller.index')
router.post('/api/register', '#controllers/auth_controller.register').use(middleware.rateLimit())
router.post('/api/login', '#controllers/auth_controller.login').use(middleware.rateLimit())
router.post('/api/forgot-password', '#controllers/auth_controller.forgotPassword').use(middleware.rateLimit())
router.post('/api/reset-password', '#controllers/auth_controller.resetPassword').use(middleware.rateLimit())
router.get('/api/verify-email', '#controllers/auth_controller.verifyEmail')
router.post('/api/resend-verification', '#controllers/auth_controller.resendVerification').use(middleware.rateLimit())

// Public site routes (Bloc 9 — SiteMode)
router.post('/api/site/validate-code', '#controllers/public_site_controller.validateCode').use(middleware.rateLimit())
router.get('/api/public/site-info', '#controllers/public_site_controller.getPublicInfo')
router.post('/api/waitlist', '#controllers/public_site_controller.joinWaitlist').use(middleware.rateLimit())
router.post('/api/promo-codes/validate', '#controllers/public_promo_controller.validate').use(middleware.rateLimit())

// Public share link access (D34 P1.5)
router.get('/api/share/:token', '#controllers/transaction_share_links_controller.publicAccess')

// Public offer intake (D35 — Phase A/B/C)
router.get('/api/offer-intake/:token', '#controllers/offer_intake_controller.info')
router.post('/api/offer-intake/:token', '#controllers/offer_intake_controller.submit').use(middleware.rateLimit())
router.get('/api/offer-intake/:token/status/:offerId', '#controllers/offer_intake_controller.status')
router.post('/api/offer-intake/:token/respond/:offerId', '#controllers/offer_intake_controller.respond').use(middleware.rateLimit())

// Stripe webhooks (public, signature-verified internally)
router.post('/api/webhooks/stripe', '#controllers/stripe_webhooks_controller.handle')

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

  // D40: Onboarding
  router.put('/me/onboarding', '#controllers/profile_controller.saveOnboarding')
  router.post('/me/onboarding/skip', '#controllers/profile_controller.skipOnboarding')

  // K2: Subscription
  router.get('/me/subscription', '#controllers/profile_controller.subscription')
  router.post('/me/plan', '#controllers/profile_controller.changePlan')

  // Stripe billing
  router.post('/stripe/setup-intent', '#controllers/stripe_controller.setupIntent')
  router.post('/stripe/subscribe', '#controllers/stripe_controller.subscribe')
  router.post('/stripe/change-plan', '#controllers/stripe_controller.changePlan')
  router.post('/stripe/cancel', '#controllers/stripe_controller.cancel')
  router.put('/stripe/payment-method', '#controllers/stripe_controller.updatePaymentMethod')

  // Dashboard
  router.get('/dashboard/summary', '#controllers/dashboard_controller.summary')
  router.get('/dashboard/urgencies', '#controllers/dashboard_controller.urgencies')

  // Clients
  router.get('/clients', '#controllers/clients_controller.index')
  router.post('/clients', '#controllers/clients_controller.store')
  router.post('/clients/import', '#controllers/clients_controller.importCsv')
  router.get('/clients/import/template', '#controllers/clients_controller.getTemplate')
  router.get('/clients/:id', '#controllers/clients_controller.show')
  router.get('/clients/:id/transactions', '#controllers/clients_controller.transactions')
  router.put('/clients/:id', '#controllers/clients_controller.update')
  router.delete('/clients/:id', '#controllers/clients_controller.destroy')

  // Professional Contacts (Carnet de pros)
  router.get('/pros', '#controllers/professional_contacts_controller.index')
  router.post('/pros', '#controllers/professional_contacts_controller.store')
  router.get('/pros/:id', '#controllers/professional_contacts_controller.show')
  router.put('/pros/:id', '#controllers/professional_contacts_controller.update')
  router.delete('/pros/:id', '#controllers/professional_contacts_controller.destroy')

  // Workflow Templates
  router.get('/workflow-templates', '#controllers/workflow_templates_controller.index')
  router.post('/workflow-templates', '#controllers/workflow_templates_controller.store')
  router.get('/workflow-templates/:id', '#controllers/workflow_templates_controller.show')
  router.put('/workflow-templates/:id', '#controllers/workflow_templates_controller.update')
  router.delete('/workflow-templates/:id', '#controllers/workflow_templates_controller.destroy')

  // Transactions — list & create (no txPermission, uses TenantScope internally)
  router.get('/transactions', '#controllers/transactions_controller.index')
  router.post('/transactions', '#controllers/transactions_controller.store').use(middleware.planLimit())

  // Transactions — viewer+ (read)
  router.get('/transactions/:id', '#controllers/transactions_controller.show').use(middleware.txPermission({ minRole: 'viewer' }))
  router.get('/transactions/:id/activity', '#controllers/transactions_controller.activity').use(middleware.txPermission({ minRole: 'viewer' }))

  // Transactions — editor+ (modify)
  router.put('/transactions/:id', '#controllers/transactions_controller.update').use(middleware.txPermission({ minRole: 'editor' }))
  router.patch('/transactions/:id/advance', '#controllers/transactions_controller.advanceStep').use(middleware.txPermission({ minRole: 'editor' }))
  router.patch('/transactions/:id/skip', '#controllers/transactions_controller.skipStep').use(middleware.txPermission({ minRole: 'editor' }))
  router.patch('/transactions/:id/goto/:stepOrder', '#controllers/transactions_controller.goToStep').use(middleware.txPermission({ minRole: 'editor' }))

  // Transactions — export (viewer+ can export)
  router.post('/transactions/:id/export/pdf', '#controllers/export_controller.pdf').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:id/export/email', '#controllers/export_controller.email').use(middleware.txPermission({ minRole: 'viewer' }))

  // Transactions — admin+ (cancel/archive/restore)
  router.patch('/transactions/:id/cancel', '#controllers/transactions_controller.cancel').use(middleware.txPermission({ minRole: 'admin' }))
  router.patch('/transactions/:id/archive', '#controllers/transactions_controller.archive').use(middleware.txPermission({ minRole: 'admin' }))
  router.patch('/transactions/:id/restore', '#controllers/transactions_controller.restore').use(middleware.txPermission({ minRole: 'admin' }))

  // Transactions — owner only (delete)
  router.delete('/transactions/:id', '#controllers/transactions_controller.destroy').use(middleware.txPermission({ minRole: 'owner' }))

  // Offers — viewer+ (read), editor+ (modify)
  router.get('/transactions/:id/offers', '#controllers/offers_controller.index').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:id/offers', '#controllers/offers_controller.store').use(middleware.txPermission({ minRole: 'editor' }))
  // Offer sub-resource routes (no transaction ID in URL — internal TenantScope)
  router.get('/offers/:offerId', '#controllers/offers_controller.show')
  router.post('/offers/:offerId/revisions', '#controllers/offers_controller.addRevision')
  router.patch('/offers/:offerId/accept', '#controllers/offers_controller.accept')
  router.patch('/offers/:offerId/reject', '#controllers/offers_controller.reject')
  router.patch('/offers/:offerId/withdraw', '#controllers/offers_controller.withdraw')
  router.delete('/offers/:offerId', '#controllers/offers_controller.destroy')

  // Condition Packs (D34 P3.4 — maquette 12)
  router.get('/condition-packs', '#controllers/offer_packs_controller.index')
  router.get('/condition-packs/:packType/templates', '#controllers/offer_packs_controller.templates')
  router.post('/offers/:offerId/apply-pack', '#controllers/offer_packs_controller.applyPack')

  // Conditions — viewer+ (read), editor+ (modify)
  router.post('/transactions/:id/conditions', '#controllers/conditions_controller.store').use(middleware.txPermission({ minRole: 'editor' }))
  // Condition sub-resource routes (no transaction ID in URL — internal TenantScope)
  router.put('/conditions/:id', '#controllers/conditions_controller.update')
  router.patch('/conditions/:id/complete', '#controllers/conditions_controller.complete')
  router.delete('/conditions/:id', '#controllers/conditions_controller.destroy')

  // Conditions Premium (D4/D27)
  router.post('/conditions/:id/resolve', '#controllers/conditions_controller.resolve')
  router.get('/conditions/:id/history', '#controllers/conditions_controller.history')
  router.get('/conditions/:id/evidence', '#controllers/conditions_controller.listEvidence')
  router.post('/conditions/:id/evidence', '#controllers/conditions_controller.addEvidence')
  router.delete('/conditions/:id/evidence/:evidenceId', '#controllers/conditions_controller.removeEvidence')

  // Transaction Conditions - Timeline & Active (Premium) — viewer+
  router.get('/transactions/:id/conditions/timeline', '#controllers/conditions_controller.timeline').use(middleware.txPermission({ minRole: 'viewer' }))
  router.get('/transactions/:id/conditions/active', '#controllers/conditions_controller.active').use(middleware.txPermission({ minRole: 'viewer' }))
  router.get('/transactions/:id/conditions/advance-check', '#controllers/conditions_controller.advanceCheck').use(middleware.txPermission({ minRole: 'viewer' }))

  // Transaction Profiles (D1) — viewer+ (read), editor+ (modify)
  router.get('/transactions/:id/profile', '#controllers/transaction_profiles_controller.show').use(middleware.txPermission({ minRole: 'viewer' }))
  router.put('/transactions/:id/profile', '#controllers/transaction_profiles_controller.upsert').use(middleware.txPermission({ minRole: 'editor' }))
  router.get('/transactions/:id/profile/status', '#controllers/transaction_profiles_controller.status').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:id/profile/load-pack', '#controllers/transaction_profiles_controller.loadPack').use(middleware.txPermission({ minRole: 'editor' }))
  router.get('/transactions/:id/applicable-templates', '#controllers/condition_templates_controller.applicableForTransaction').use(middleware.txPermission({ minRole: 'viewer' }))

  // Condition Templates (D27) — no transaction context
  router.get('/conditions/templates', '#controllers/condition_templates_controller.index')
  router.get('/conditions/templates/by-pack', '#controllers/condition_templates_controller.byPack')
  router.get('/conditions/templates/:id', '#controllers/condition_templates_controller.show')

  // FINTRAC Compliance — viewer+ (read), editor+ (modify)
  router.get('/transactions/:id/fintrac', '#controllers/fintrac_controller.index').use(middleware.txPermission({ minRole: 'viewer' }))
  router.get('/fintrac/:id', '#controllers/fintrac_controller.show')
  router.patch('/fintrac/:id/complete', '#controllers/fintrac_controller.complete')
  router.post('/fintrac/:id/resolve', '#controllers/fintrac_controller.resolve')

  // Transaction Parties (D34 P1.3) — viewer+ (read), editor+ (modify)
  router.get('/transactions/:id/parties', '#controllers/transaction_parties_controller.index').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:id/parties', '#controllers/transaction_parties_controller.store').use(middleware.txPermission({ minRole: 'editor' }))
  // Party sub-resource routes (no transaction ID in URL — internal TenantScope)
  router.put('/parties/:id', '#controllers/transaction_parties_controller.update')
  router.delete('/parties/:id', '#controllers/transaction_parties_controller.destroy')

  // Transaction Documents (D34 P1.2) — viewer+ (read), editor+ (modify)
  router.get('/transactions/:id/documents', '#controllers/transaction_documents_controller.index').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:id/documents', '#controllers/transaction_documents_controller.store').use(middleware.txPermission({ minRole: 'editor' }))
  // Document sub-resource routes (no transaction ID in URL — internal TenantScope)
  router.get('/documents/:id', '#controllers/transaction_documents_controller.show')
  router.put('/documents/:id', '#controllers/transaction_documents_controller.update')
  router.patch('/documents/:id/validate', '#controllers/transaction_documents_controller.validate')
  router.patch('/documents/:id/reject', '#controllers/transaction_documents_controller.reject')
  router.delete('/documents/:id', '#controllers/transaction_documents_controller.destroy')

  // Transaction Members (D34 P1.4) — viewer+ (list), admin+ (manage)
  router.get('/transactions/:transactionId/members', '#controllers/transaction_members_controller.index').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:transactionId/members', '#controllers/transaction_members_controller.store').use(middleware.txPermission({ minRole: 'admin' }))
  router.patch('/transactions/:transactionId/members/:id', '#controllers/transaction_members_controller.update').use(middleware.txPermission({ minRole: 'admin' }))
  router.delete('/transactions/:transactionId/members/:id', '#controllers/transaction_members_controller.destroy').use(middleware.txPermission({ minRole: 'admin' }))

  // Transaction Share Links (D34 P1.5) — admin+ (manage links)
  router.get('/transactions/:transactionId/share-link', '#controllers/transaction_share_links_controller.show').use(middleware.txPermission({ minRole: 'admin' }))
  router.post('/transactions/:transactionId/share-link', '#controllers/transaction_share_links_controller.store').use(middleware.txPermission({ minRole: 'admin' }))
  router.patch('/transactions/:transactionId/share-link/:id', '#controllers/transaction_share_links_controller.update').use(middleware.txPermission({ minRole: 'admin' }))
  router.delete('/transactions/:transactionId/share-link/:id', '#controllers/transaction_share_links_controller.destroy').use(middleware.txPermission({ minRole: 'admin' }))

  // Notes — viewer+ (read), editor+ (modify)
  router.get('/transactions/:id/notes', '#controllers/notes_controller.index').use(middleware.txPermission({ minRole: 'viewer' }))
  router.post('/transactions/:id/notes', '#controllers/notes_controller.store').use(middleware.txPermission({ minRole: 'editor' }))
  // Note sub-resource (no transaction ID in URL — internal check)
  router.delete('/notes/:id', '#controllers/notes_controller.destroy')

}).prefix('/api').use([middleware.auth(), middleware.siteMode(), middleware.trialGuard()])

// Notifications — exempt from trialGuard so expired trial users can still read their notifications
router.group(() => {
  router.get('/notifications', '#controllers/notifications_controller.index')
  router.get('/notifications/unread-count', '#controllers/notifications_controller.unreadCount')
  router.patch('/notifications/:id/read', '#controllers/notifications_controller.markRead')
  router.post('/notifications/read-all', '#controllers/notifications_controller.markAllRead')
  router.delete('/notifications/:id', '#controllers/notifications_controller.destroy')
  router.delete('/notifications', '#controllers/notifications_controller.destroyAll')
}).prefix('/api').use([middleware.auth(), middleware.siteMode()])

// Admin routes (require admin or superadmin role)
router.group(() => {
  // Dashboard
  router.get('/overview', '#controllers/admin_controller.overview')
  router.get('/activity', '#controllers/admin_controller.activity')
  router.get('/system', '#controllers/admin_controller.system')

  // Subscribers CRM
  router.get('/subscribers', '#controllers/admin_controller.subscribers')
  router.get('/subscribers/export', '#controllers/admin_controller.exportSubscribers')

  // Notes per user
  router.get('/subscribers/:id/notes', '#controllers/admin_controller.getNotes')
  router.post('/subscribers/:id/notes', '#controllers/admin_controller.createNote')
  router.put('/notes/:id', '#controllers/admin_controller.updateNote')
  router.delete('/notes/:id', '#controllers/admin_controller.deleteNote')

  // Tasks per user
  router.get('/subscribers/:id/tasks', '#controllers/admin_controller.getTasks')
  router.post('/subscribers/:id/tasks', '#controllers/admin_controller.createTask')
  router.patch('/tasks/:id', '#controllers/admin_controller.updateTask')
  router.delete('/tasks/:id', '#controllers/admin_controller.deleteTask')

  // Plans management (G2) — read-only for admin
  router.get('/plans', '#controllers/admin_plans_controller.index')
  router.get('/plan-changes', '#controllers/admin_plans_controller.getChanges')

  // Pulse dashboard (Bloc 9)
  router.get('/pulse', '#controllers/admin_pulse_controller.index')

  // Site settings (Bloc 9)
  router.get('/site-settings', '#controllers/admin_site_settings_controller.index')

  // Promo codes (Bloc 9 Sprint B)
  router.get('/promo-codes', '#controllers/admin_promo_codes_controller.index')

  // Waitlist (Bloc 9 Sprint B)
  router.get('/waitlist', '#controllers/admin_waitlist_controller.index')
  router.get('/waitlist/export', '#controllers/admin_waitlist_controller.export')
}).prefix('/api/admin').use([middleware.auth(), middleware.admin()])

// Superadmin-only routes
router.group(() => {
  // Role changes disabled for security - returns 403
  router.patch('/subscribers/:id/role', '#controllers/admin_controller.updateRole')
  // Subscription status management
  router.patch('/subscribers/:id/subscription', '#controllers/admin_controller.updateSubscription')
  // Extend subscription by N days (§11.K P0-2)
  router.patch('/subscribers/:id/extend', '#controllers/admin_controller.extendSubscription')
  // Toggle founder flag (§11.K H4)
  router.patch('/subscribers/:id/founder', '#controllers/admin_controller.toggleFounder')

  // Site settings (Bloc 9 — superadmin only for writes)
  router.put('/site-settings', '#controllers/admin_site_settings_controller.update')

  // Plans — write operations (superadmin only, §11.K H3 fix)
  router.put('/plans/:id', '#controllers/admin_plans_controller.update')
  router.post('/plans/:id/apply-to-existing', '#controllers/admin_plans_controller.applyToExisting')

  // Promo codes — CUD (Bloc 9 Sprint B)
  router.post('/promo-codes', '#controllers/admin_promo_codes_controller.store')
  router.put('/promo-codes/:id', '#controllers/admin_promo_codes_controller.update')
  router.delete('/promo-codes/:id', '#controllers/admin_promo_codes_controller.destroy')
}).prefix('/api/admin').use([middleware.auth(), middleware.superadmin()])
