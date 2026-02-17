/**
 * Centralized brand configuration for Ofra
 * Change values here to rebrand the entire application
 */
export const BRAND = {
  // Core identity
  name: 'OFRA',
  tagline: 'Zéro oubli. Zéro stress.',
  taglineEn: 'Zero oversights. Zero stress.',

  // Contact & links
  domain: 'ofra.ca',
  supportEmail: 'support@ofra.ca',

  // Visual identity — Ofra palette
  colors: {
    primary: '#1E3A5F',    // Bleu marine - professional
    accent: '#D97706',     // Or/ambre - accent (amber-600)
    success: '#10B981',    // Émeraude - trust
    destructive: '#EF4444', // Rouge - errors
  },

  // Legal
  companyName: 'OFRA',
  copyright: `© ${new Date().getFullYear()} OFRA. All rights reserved.`,
} as const

export type Brand = typeof BRAND
