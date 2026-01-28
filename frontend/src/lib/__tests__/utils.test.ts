import { describe, it, expect } from 'vitest'
import { normalizeSearch } from '../utils'

describe('normalizeSearch', () => {
  it('removes French accents', () => {
    expect(normalizeSearch('Étape')).toBe('etape')
  })

  it('removes multiple diacritics', () => {
    expect(normalizeSearch('Évaluation LÉGALE')).toBe('evaluation legale')
  })

  it('converts to lowercase', () => {
    expect(normalizeSearch('HELLO')).toBe('hello')
  })

  it('trims whitespace', () => {
    expect(normalizeSearch('  test  ')).toBe('test')
  })

  it('handles combined accents, case, and whitespace', () => {
    expect(normalizeSearch('  Étape conditionnel  ')).toBe('etape conditionnel')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeSearch('')).toBe('')
  })

  it('passes through strings without accents', () => {
    expect(normalizeSearch('hello world')).toBe('hello world')
  })

  it('handles special French characters', () => {
    expect(normalizeSearch('ça fait très bien')).toBe('ca fait tres bien')
  })

  it('handles mixed numbers and accents', () => {
    expect(normalizeSearch('Dossier #123 clôturé')).toBe('dossier #123 cloture')
  })
})
