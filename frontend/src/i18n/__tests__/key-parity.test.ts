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
    // Words that are legitimately identical in French and English
    const allowedIdentical = [
      'app.name',                   // Brand name
      'nav.transactions',           // "Transactions" = same in FR
      'nav.clients',                // "Clients" = same in FR
      'conditions.types.inspection',// "Inspection" = same in FR
      'conditions.types.documents', // "Documents" = same in FR
      'common.notifications',       // "Notifications" = same in FR
      'tabs.conditions',            // "Conditions" = same in FR
      'tabs.documents',             // "Documents" = same in FR
      'tabs.notes',                 // "Notes" = same in FR
      'transaction.type',           // "Type" = same in FR
      'transaction.client',         // "Client" = same in FR
    ]

    const suspicious: string[] = []
    for (const key of enKeys) {
      if (allowedIdentical.includes(key)) continue
      const enVal = key.split('.').reduce((o: any, k) => o?.[k], en)
      const frVal = key.split('.').reduce((o: any, k) => o?.[k], fr)
      if (typeof enVal === 'string' && enVal === frVal) {
        suspicious.push(`${key}: "${enVal}"`)
      }
    }
    expect(suspicious).toEqual([])
  })
})
