import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enCA } from 'date-fns/locale/en-CA'
import { fr } from 'date-fns/locale/fr'

// Mock i18n module to control language
vi.mock('../../i18n', () => ({
  default: { language: 'en' },
}))

import i18n from '../../i18n'
import { getDateLocale, formatDate, formatDistanceToNow, differenceInDays, parseISO } from '../date'

describe('getDateLocale', () => {
  it('returns enCA when language is en', () => {
    ;(i18n as any).language = 'en'
    expect(getDateLocale()).toBe(enCA)
  })

  it('returns fr when language is fr', () => {
    ;(i18n as any).language = 'fr'
    expect(getDateLocale()).toBe(fr)
  })

  it('returns enCA for en-CA variant', () => {
    ;(i18n as any).language = 'en-CA'
    expect(getDateLocale()).toBe(enCA)
  })

  it('returns fr for fr-CA variant', () => {
    ;(i18n as any).language = 'fr-CA'
    expect(getDateLocale()).toBe(fr)
  })

  it('falls back to enCA for unknown language', () => {
    ;(i18n as any).language = 'de'
    expect(getDateLocale()).toBe(enCA)
  })

  it('falls back to enCA when language is undefined', () => {
    ;(i18n as any).language = undefined
    expect(getDateLocale()).toBe(enCA)
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    ;(i18n as any).language = 'en'
    const date = new Date(2026, 0, 15) // Jan 15, 2026
    const result = formatDate(date, 'yyyy-MM-dd')
    expect(result).toBe('2026-01-15')
  })

  it('formats a string date', () => {
    ;(i18n as any).language = 'en'
    const result = formatDate('2026-01-15T12:00:00.000Z', 'yyyy-MM-dd')
    expect(result).toBe('2026-01-15')
  })

  it('uses French locale when language is fr', () => {
    ;(i18n as any).language = 'fr'
    const date = new Date(2026, 0, 15)
    const result = formatDate(date, 'MMMM')
    expect(result).toBe('janvier')
  })

  it('uses English locale when language is en', () => {
    ;(i18n as any).language = 'en'
    const date = new Date(2026, 0, 15)
    const result = formatDate(date, 'MMMM')
    expect(result).toBe('January')
  })
})

describe('formatDistanceToNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a string with suffix in English', () => {
    ;(i18n as any).language = 'en'
    const date = new Date(2026, 0, 26, 12, 0, 0) // 1 day ago
    const result = formatDistanceToNow(date)
    expect(result).toContain('ago')
  })

  it('returns a string with suffix in French', () => {
    ;(i18n as any).language = 'fr'
    const date = new Date(2026, 0, 26, 12, 0, 0) // 1 day ago
    const result = formatDistanceToNow(date)
    expect(result).toContain('il y a')
  })

  it('accepts string dates', () => {
    ;(i18n as any).language = 'en'
    const result = formatDistanceToNow('2026-01-26T12:00:00.000Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('re-exported utilities', () => {
  it('exports differenceInDays', () => {
    const result = differenceInDays(new Date(2026, 0, 27), new Date(2026, 0, 20))
    expect(result).toBe(7)
  })

  it('exports parseISO', () => {
    const result = parseISO('2026-01-15')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2026)
  })
})
