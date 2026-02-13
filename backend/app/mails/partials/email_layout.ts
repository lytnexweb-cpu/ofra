/**
 * Ofra Email Layout
 * Shared header, footer, and styles for all transactional emails
 *
 * Brand colors from frontend/src/index.css (Ofra palette)
 */

import { getCommonTranslation, type EmailLanguage } from './email_translations.js'

export const OFRA_COLORS = {
  // Primary brand colors
  primary: '#1E3A5F',       // Bleu marine Ofra
  primaryLight: '#2D4A6F',
  accent: '#D97706',        // Or/Ambre (roof color)
  accentLight: '#F59E0B',   // Ambre clair

  // Text colors
  text: '#0F172A',          // Foreground
  textMuted: '#64748B',     // Muted
  textLight: '#94A3B8',

  // Backgrounds
  background: '#FFFFFF',
  backgroundAlt: '#F8FAFC', // Ofra background

  // Borders
  border: '#E2E8F0',

  // Semantic colors
  success: '#10B981',       // Emeraude
  warning: '#F97316',       // Orange
  error: '#EF4444',         // Rouge
}

// SVG Logo embedded (from OfraLogo.tsx)
export const OFRA_LOGO_SVG = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 8L8 22V40H40V22L24 8Z" fill="#FFFFFF"/>
  <path d="M24 4L2 22L8 22L24 8L40 22L46 22L24 4Z" fill="#D97706"/>
  <circle cx="24" cy="28" r="6" fill="#1E3A5F"/>
</svg>
`

export function getEmailStyles(): string {
  return `
    <style>
      body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: ${OFRA_COLORS.text};
        background-color: ${OFRA_COLORS.backgroundAlt};
        margin: 0;
        padding: 0;
      }

      .email-wrapper {
        width: 100%;
        background-color: ${OFRA_COLORS.backgroundAlt};
        padding: 40px 20px;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: ${OFRA_COLORS.background};
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .email-header {
        background-color: ${OFRA_COLORS.primary};
        padding: 28px 40px;
        text-align: center;
      }
      .email-logo-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .email-logo-text {
        font-family: 'Outfit', -apple-system, sans-serif;
        font-size: 28px;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: -0.5px;
      }
      .header-bar {
        height: 4px;
        background: linear-gradient(90deg, ${OFRA_COLORS.accent}, ${OFRA_COLORS.accentLight});
      }

      .email-body {
        padding: 40px;
      }

      h1 {
        font-size: 26px;
        font-weight: 700;
        color: ${OFRA_COLORS.primary};
        margin: 0 0 16px 0;
        line-height: 1.3;
      }
      h2 {
        font-size: 18px;
        font-weight: 600;
        color: ${OFRA_COLORS.primary};
        margin: 24px 0 12px 0;
      }
      p {
        margin: 0 0 16px 0;
        color: ${OFRA_COLORS.text};
      }
      a {
        color: ${OFRA_COLORS.primary};
      }

      .cta-button {
        display: inline-block;
        padding: 14px 32px;
        background-color: ${OFRA_COLORS.accent};
        color: #FFFFFF !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        margin: 24px 0;
      }
      .cta-button:hover {
        background-color: ${OFRA_COLORS.accentLight};
      }
      .cta-button-primary {
        background-color: ${OFRA_COLORS.primary};
      }
      .cta-button-warning {
        background-color: ${OFRA_COLORS.warning};
      }

      .info-box {
        background-color: ${OFRA_COLORS.backgroundAlt};
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border-left: 4px solid ${OFRA_COLORS.primary};
      }
      .warning-box {
        background-color: #FEF3C7;
        border-left-color: ${OFRA_COLORS.warning};
      }
      .success-box {
        background-color: #D1FAE5;
        border-left-color: ${OFRA_COLORS.success};
      }
      .error-box {
        background-color: #FEE2E2;
        border-left-color: ${OFRA_COLORS.error};
      }

      ul {
        margin: 16px 0;
        padding-left: 24px;
      }
      li {
        margin: 8px 0;
        color: ${OFRA_COLORS.text};
      }

      .email-footer {
        background-color: ${OFRA_COLORS.primary};
        padding: 28px 40px;
        text-align: center;
      }
      .footer-brand {
        font-weight: 600;
        color: #FFFFFF;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .footer-tagline {
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
        margin-bottom: 12px;
      }
      .footer-divider {
        width: 40px;
        height: 2px;
        background-color: ${OFRA_COLORS.accent};
        margin: 16px auto;
      }
      .footer-links {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 16px;
      }
      .footer-links a {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: underline;
      }

      .text-muted { color: ${OFRA_COLORS.textMuted}; }
      .text-small { font-size: 14px; }
      .text-center { text-align: center; }
      .mt-4 { margin-top: 16px; }
      .mb-4 { margin-bottom: 16px; }
    </style>
  `
}

export function getEmailHeader(): string {
  return `
    <div class="email-header">
      <div class="email-logo-container">
        ${OFRA_LOGO_SVG}
        <span class="email-logo-text">OFRA</span>
      </div>
    </div>
    <div class="header-bar"></div>
  `
}

export function getEmailFooter(lang: EmailLanguage = 'fr', options?: { includeUnsubscribe?: boolean; unsubscribeUrl?: string }): string {
  const t = getCommonTranslation(lang)
  const unsubscribeHtml = options?.includeUnsubscribe && options?.unsubscribeUrl
    ? `<p class="footer-links"><a href="${options.unsubscribeUrl}">${t.unsubscribe}</a></p>`
    : ''

  return `
    <div class="email-footer">
      <p class="footer-brand">${t.footerBrand}</p>
      <p class="footer-tagline">${t.footerTagline}</p>
      <div class="footer-divider"></div>
      <p class="footer-tagline" style="font-size: 12px;">
        ${t.footerLocation} 🇨🇦
      </p>
      ${unsubscribeHtml}
    </div>
  `
}

export function wrapEmailContent(
  body: string,
  lang: EmailLanguage = 'fr',
  options?: { includeUnsubscribe?: boolean; unsubscribeUrl?: string }
): string {
  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>OFRA</title>
      ${getEmailStyles()}
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          ${getEmailHeader()}
          <div class="email-body">
            ${body}
          </div>
          ${getEmailFooter(lang, options)}
        </div>
      </div>
    </body>
    </html>
  `
}
