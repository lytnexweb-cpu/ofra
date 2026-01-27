import { format as fnsFormat, formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns'
import { enCA } from 'date-fns/locale/en-CA'

/**
 * Default locale for all date formatting (AR15: enCA, not US).
 */
const defaultLocale = enCA

/**
 * Format a date with enCA locale by default.
 */
export function formatDate(date: Date | number | string, formatStr: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return fnsFormat(d, formatStr, { locale: defaultLocale })
}

/**
 * Format distance to now with enCA locale by default.
 */
export function formatDistanceToNow(date: Date | number | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return fnsFormatDistanceToNow(d, { addSuffix: true, locale: defaultLocale })
}

export { defaultLocale }
