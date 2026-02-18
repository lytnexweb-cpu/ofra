import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock i18n before importing date utils
vi.mock('../i18n', () => ({
  default: { language: 'en' },
}))

import { formatDate, formatDistanceToNow, getDateLocale, differenceInDays, parseISO } from './date'

describe('date utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 1, 18)) // Feb 18, 2026
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getDateLocale', () => {
    it('returns enCA locale by default', () => {
      const locale = getDateLocale()
      expect(locale.code).toBe('en-CA')
    })
  })

  describe('formatDate', () => {
    it('formats a Date object', () => {
      const result = formatDate(new Date(2026, 0, 15), 'yyyy-MM-dd')
      expect(result).toBe('2026-01-15')
    })

    it('formats a string date', () => {
      // Use noon UTC to avoid timezone offset issues
      const result = formatDate('2026-01-15T12:00:00.000Z', 'yyyy-MM-dd')
      expect(result).toBe('2026-01-15')
    })

    it('formats with localized pattern', () => {
      const result = formatDate(new Date(2026, 0, 15), 'MMMM dd, yyyy')
      expect(result).toBe('January 15, 2026')
    })
  })

  describe('formatDistanceToNow', () => {
    it('returns relative time string', () => {
      const threeDaysAgo = new Date(2026, 1, 15)
      const result = formatDistanceToNow(threeDaysAgo)
      expect(result).toContain('ago')
    })

    it('handles string dates', () => {
      const result = formatDistanceToNow('2026-02-15T00:00:00.000Z')
      expect(typeof result).toBe('string')
    })
  })

  describe('differenceInDays', () => {
    it('calculates difference correctly', () => {
      const a = new Date(2026, 1, 18)
      const b = new Date(2026, 1, 10)
      expect(differenceInDays(a, b)).toBe(8)
    })
  })

  describe('parseISO', () => {
    it('parses ISO string to Date', () => {
      const result = parseISO('2026-01-15')
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(15)
    })
  })
})
