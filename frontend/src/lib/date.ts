import {
  format as fnsFormat,
  formatDistanceToNow as fnsFormatDistanceToNow,
  differenceInDays as fnsDifferenceInDays,
  parseISO as fnsParseISO,
} from 'date-fns'
import { enCA } from 'date-fns/locale/en-CA'
import { fr } from 'date-fns/locale/fr'
import i18n from '../i18n'

const localeMap: Record<string, Locale> = {
  en: enCA,
  fr: fr,
}

/**
 * Get the date-fns locale matching the current i18n language.
 * Falls back to enCA (AR15: Canadian, not US).
 */
export function getDateLocale(): Locale {
  const lang = i18n.language?.substring(0, 2) ?? 'en'
  return localeMap[lang] ?? enCA
}

/**
 * Format a date with the current i18n locale.
 */
export function formatDate(date: Date | number | string, formatStr: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return fnsFormat(d, formatStr, { locale: getDateLocale() })
}

/**
 * Format distance to now with the current i18n locale.
 */
export function formatDistanceToNow(date: Date | number | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return fnsFormatDistanceToNow(d, { addSuffix: true, locale: getDateLocale() })
}

// Re-export utility functions for centralized imports
export const differenceInDays = fnsDifferenceInDays
export const parseISO = fnsParseISO
