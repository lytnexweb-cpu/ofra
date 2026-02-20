import { describe, it, expect } from 'vitest'
import en from '../locales/en/common.json'
import fr from '../locales/fr/common.json'

/**
 * Flatten a nested object into dot-notation keys.
 * e.g. { a: { b: "x" } } → ["a.b"]
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

describe('i18n key parity', () => {
  const enKeys = flattenKeys(en).sort()
  const frKeys = flattenKeys(fr).sort()

  it('EN and FR have the same number of keys', () => {
    expect(enKeys.length).toBe(frKeys.length)
  })

  it('every EN key exists in FR', () => {
    const missingInFr = enKeys.filter((k) => !frKeys.includes(k))
    expect(missingInFr).toEqual([])
  })

  it('every FR key exists in EN', () => {
    const missingInEn = frKeys.filter((k) => !enKeys.includes(k))
    expect(missingInEn).toEqual([])
  })

  it('no FR value is identical to EN (likely untranslated)', () => {
    // Words that are legitimately identical in French and English.
    // French and English share many cognates (words with the same spelling/meaning),
    // especially for technical, legal, and administrative terms.
    const allowedIdentical = new Set([
      // Brand / app names
      'app.name',
      // Navigation & tabs — French cognates
      'nav.transactions', 'nav.clients', 'nav.admin',
      'tabs.conditions', 'tabs.documents', 'tabs.notes',
      // Common French-English cognates
      'common.notifications',
      'transaction.type', 'transaction.client',
      'transaction.status.active',
      'transaction.profile.accessPublic', 'transaction.profile.condo', 'transaction.profile.rural',
      'transaction.editModal.province', 'transaction.editModal.commission',
      'transaction.actions.members', 'transaction.actions.parties',
      'transaction.acceptOffer.agentLabel',
      'transaction.acceptOffer.successSubtitle',
      'transaction.cancelModal.note',
      'transaction.createOffer.expiration',
      'transaction.detail.addenda', 'transaction.detail.email',
      'transaction.detail.profileForm.type',
      'transaction.detail.propertyTags.commercial', 'transaction.detail.propertyTags.rural',
      // Conditions
      'conditions.types.inspection', 'conditions.types.documents',
      'conditions.debugProfileAbsent',
      'conditions.form.description', 'conditions.form.suggestions',
      // Clients
      'clients.notes', 'client.transactions',
      'clients.address.postalPlaceholder',
      'clients.details.transactionNumber',
      // Contact
      'contact.form.message',
      // Dashboard
      'dashboard.charts.commission', 'dashboard.charts.commissions',
      'dashboard.charts.pipeline', 'dashboard.charts.transaction',
      'dashboard.charts.transactions', 'dashboard.transactions',
      'dashboard.urgencies.greenCount', 'dashboard.urgencies.urgent48h',
      // Landing
      'landing.footer.contact', 'landing.nav.faq',
      // Offers
      'offers.direction', 'offers.directionLabel', 'offers.notes',
      'offers.createModal.inclusions', 'offers.packs.conditionsCount',
      // Onboarding
      'onboarding.steps.contexts.condo', 'onboarding.steps.contexts.rural',
      'onboarding.success.style', 'onboarding.success.volume',
      // Pricing
      'pricing.features.support', 'pricing.features.transactions',
      'pricing.plans.agence.name', 'pricing.plans.essentiel.name', 'pricing.plans.pro.name',
      // Settings
      'settings.language.english', 'settings.language.french',
      'settings.notifications.title',
      // Resolution
      'resolution.notApplicable', 'resolveCondition.noteLabel',
      // Validation / evidence
      'validation.evidence.type.note',
      'validateStep.success.subtitle',
      // Admin
      'admin.clients', 'admin.runtime', 'admin.transactions',
      'admin.conditions', 'admin.crm', 'admin.engagement',
      'admin.notes', 'admin.txShort', 'admin.plans.title',
      'admin.config.plansSection', 'admin.config.title',
      'admin.pulse.conversion', 'admin.pulse.mrr', 'admin.pulse.title',
      'admin.subscription.active', 'admin.subscription.trial',
      // Coming soon
      'comingSoon.founderPill', 'comingSoon.minutes',
      // Auth
      'auth.province', 'auth.adminPanel',
      // Documents
      'documents.addModal.subtitle', 'documents.addModal.addTag',
      'documents.addModal.associateCondition',
      'documents.categories.inspection', 'documents.counters.total',
      'documents.errors.infoFormats', 'documents.statusBar.conditions',
      'documents.title', 'documents.versionModal.active',
      // Edit transaction
      'editTransaction.breadcrumb.transactions',
      'editTransaction.fields.province',
      'editTransaction.propertyContext.rural',
      'editTransaction.propertyType.condo',
      'editTransaction.status.active',
      'editTransaction.tabs.dates', 'editTransaction.tabs.parties',
      // Export
      'export.section.conditions', 'export.section.documents',
      'exportPage.email.message', 'exportPage.linkCreated.expiration',
      // FINTRAC
      'fintrac.fintracBadge',
      // Offer link
      'offerLink.expiration',
      // Add condition / add offer
      'addCondition.conditionsWord',
      'addOffer.badgeActive', 'addOffer.badgePack',
      'addOffer.conditionsInfo',
      'addOffer.exp24h', 'addOffer.exp48h', 'addOffer.expCustom',
      'addOffer.expirationLabel', 'addOffer.inclusionsLabel',
      'addOffer.inspectionLabel', 'addOffer.messageLabel',
      'addOffer.packsTitle', 'addOffer.permErrorOwner',
      'addOffer.permErrorRequiredValue', 'addOffer.serverErrorTimestamp',
      'addOffer.successConditions', 'addOffer.successExpiration',
      'addOffer.successNotification', 'addOffer.successType',
      'addOffer.summaryConditions', 'addOffer.summaryExpiration',
      'addOffer.typeLabel',
      // Parties
      'parties.partiesCount', 'parties.role.agent',
      // Permissions
      'permissionsPage.active', 'permissionsPage.matrix.action',
      // Suggestions
      'suggestions.openPanel', 'suggestions.title',
      // Landing (plan names/prices, mockup labels, cognates)
      'landing.plans.starter.name', 'landing.plans.starter.price',
      'landing.plans.solo.name', 'landing.plans.solo.price',
      'landing.plans.pro.name', 'landing.plans.pro.price',
      'landing.plans.agence.price',
      'landing.mockup.autoBadge', 'landing.mockup.backTransactions',
      'landing.mockup.documents', 'landing.mockup.rural',
      'landing.mockup.step1', 'landing.mockup.step8',
      // Contact
      'contact.form.solo', 'contact.hero.badge',
      // FAQ
      'landing.footer.faq',
      // Offers comparison (symbols/cognates identical in FR/EN)
      'offers.comparison.noValue', 'offers.comparison.parties',
      'offers.comparison.conditions', 'offers.comparison.inspection',
      'offers.comparison.conditionCount', 'offers.comparison.inclusions',
      // Offer form draft direction (template with arrow symbol)
      'addOffer.draftDirection',
      // Offer intake (Phase B — cognate)
      'offerIntake.inclusionsLabel',
      // Pro contacts (cognates)
      'pros.notes',
    ])

    const suspicious: string[] = []
    for (const key of enKeys) {
      if (allowedIdentical.has(key)) continue
      const enVal = key.split('.').reduce((o: any, k) => o?.[k], en)
      const frVal = key.split('.').reduce((o: any, k) => o?.[k], fr)
      if (typeof enVal === 'string' && enVal === frVal) {
        suspicious.push(`${key}: "${enVal}"`)
      }
    }
    expect(suspicious).toEqual([])
  })
})
