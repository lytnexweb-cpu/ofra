/**
 * Centralized brand configuration for Ofra
 * Change values here to rebrand the entire application
 */
export const BRAND = {
  // Core identity
  name: 'Ofra',
  tagline: "De l'offre aux cles",
  taglineEn: 'From offer to keys',

  // Contact & links
  domain: 'ofra.ca',
  supportEmail: 'support@ofra.ca',

  // Visual identity
  colors: {
    primary: '#2563EB',    // Blue - professional
    secondary: '#059669',  // Green - trust
  },

  // Legal
  companyName: 'Ofra',
  copyright: `© ${new Date().getFullYear()} Ofra. All rights reserved.`,
} as const

export type Brand = typeof BRAND
