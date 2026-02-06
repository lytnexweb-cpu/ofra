/**
 * Email Translations - FR/EN
 * All transactional email content in both languages
 * Default: 'fr' (NB market - 65% francophone)
 */

export type EmailLanguage = 'fr' | 'en'

export const emailTranslations = {
  // ============================================
  // COMMON / SHARED
  // ============================================
  common: {
    fr: {
      greeting: 'Bonjour',
      regards: 'Cordialement',
      teamSignature: "L'équipe Ofra",
      footerBrand: 'OFRA',
      footerTagline: 'Gestion de transactions immobilières',
      footerLocation: 'Conçu au Nouveau-Brunswick, Canada',
      unsubscribe: 'Se désabonner des notifications',
      viewTransaction: 'Voir la transaction',
      viewDashboard: 'Voir le tableau de bord',
      goToOfra: 'Accéder à Ofra',
      client: 'Client',
      property: 'Propriété',
      dueDate: 'Échéance',
      daysOverdue: 'j en retard',
      daysRemaining: 'j restants',
    },
    en: {
      greeting: 'Hello',
      regards: 'Best regards',
      teamSignature: 'The Ofra Team',
      footerBrand: 'OFRA',
      footerTagline: 'Real Estate Transaction Management',
      footerLocation: 'Made in New Brunswick, Canada',
      unsubscribe: 'Unsubscribe from notifications',
      viewTransaction: 'View Transaction',
      viewDashboard: 'View Dashboard',
      goToOfra: 'Go to Ofra',
      client: 'Client',
      property: 'Property',
      dueDate: 'Due Date',
      daysOverdue: 'd overdue',
      daysRemaining: 'd remaining',
    },
  },

  // ============================================
  // WELCOME EMAIL
  // ============================================
  welcome: {
    fr: {
      subject: 'Bienvenue sur Ofra!',
      title: 'Bienvenue sur Ofra!',
      intro: 'Votre compte a été créé avec succès. Vous pouvez maintenant gérer vos transactions immobilières avec Ofra.',
      cta: 'Accéder à Ofra',
      gettingStartedTitle: 'Pour commencer',
      gettingStartedItems: [
        'Ajoutez votre premier client',
        'Créez une transaction',
        'Suivez vos conditions et échéances',
      ],
      helpText: "Si vous avez des questions, n'hésitez pas à nous contacter.",
      welcomeClosing: "Bienvenue dans l'équipe!",
    },
    en: {
      subject: 'Welcome to Ofra!',
      title: 'Welcome to Ofra!',
      intro: 'Your account has been created successfully. You can now manage your real estate transactions with Ofra.',
      cta: 'Go to Ofra',
      gettingStartedTitle: 'Getting Started',
      gettingStartedItems: [
        'Add your first client',
        'Create a transaction',
        'Track your conditions and deadlines',
      ],
      helpText: "If you have any questions, don't hesitate to reach out.",
      welcomeClosing: 'Welcome aboard!',
    },
  },

  // ============================================
  // PASSWORD RESET EMAIL
  // ============================================
  passwordReset: {
    fr: {
      subject: 'Réinitialisation de votre mot de passe',
      title: 'Réinitialisation du mot de passe',
      intro: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe:',
      cta: 'Réinitialiser le mot de passe',
      expiryWarning: 'Ce lien expire dans 1 heure.',
      ignoreNotice: "Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe ne sera pas modifié.",
      linkFallback: 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur:',
    },
    en: {
      subject: 'Reset Your Password',
      title: 'Password Reset Request',
      intro: 'We received a request to reset your password. Click the button below to create a new password:',
      cta: 'Reset Password',
      expiryWarning: 'This link will expire in 1 hour.',
      ignoreNotice: "If you didn't request this, you can safely ignore this email. Your password won't be changed.",
      linkFallback: "If the button doesn't work, copy and paste this link into your browser:",
    },
  },

  // ============================================
  // DAILY DIGEST EMAIL
  // ============================================
  dailyDigest: {
    fr: {
      subjectOverdue: 'en retard',
      subjectThisWeek: 'cette semaine',
      title: 'Voici votre résumé quotidien des conditions à suivre.',
      overdueTitle: 'En retard',
      upcomingTitle: 'Cette semaine',
      cta: 'Voir le tableau de bord',
      autoSentNotice: 'Cet email a été envoyé automatiquement car vous avez des transactions actives.',
    },
    en: {
      subjectOverdue: 'overdue',
      subjectThisWeek: 'this week',
      title: 'Here is your daily summary of conditions to follow.',
      overdueTitle: 'Overdue',
      upcomingTitle: 'This Week',
      cta: 'View Dashboard',
      autoSentNotice: 'This email was sent automatically because you have active transactions.',
    },
  },

  // ============================================
  // DEADLINE WARNING EMAIL
  // ============================================
  deadlineWarning: {
    fr: {
      subjectPrefix: 'Deadline dans 48h',
      warningText: 'Cette condition arrive à échéance dans',
      hours48: '48 heures',
      actionRequired: 'Assurez-vous que cette condition soit complétée avant la date limite pour éviter tout blocage.',
      cta: 'Voir la transaction',
      autoSentNotice: 'Cet email a été envoyé automatiquement car une condition importante approche de son échéance.',
    },
    en: {
      subjectPrefix: 'Deadline in 48h',
      warningText: 'This condition is due in',
      hours48: '48 hours',
      actionRequired: 'Make sure this condition is completed before the deadline to avoid any blocking.',
      cta: 'View Transaction',
      autoSentNotice: 'This email was sent automatically because an important condition is approaching its deadline.',
    },
  },

  // ============================================
  // OFFER ACCEPTED EMAIL
  // ============================================
  offerAccepted: {
    fr: {
      subject: 'Votre offre a été acceptée!',
      title: 'Félicitations',
      excellentNews: 'Excellente nouvelle',
      offerAcceptedText: 'votre offre a été acceptée',
      forProperty: 'pour',
      nextSteps: 'Votre courtier vous contactera sous peu pour les prochaines étapes.',
      closingText: "Ce n'est que le début d'une belle aventure. Nous sommes là pour vous accompagner jusqu'à la remise des clés.",
    },
    en: {
      subject: 'Your Offer Has Been Accepted!',
      title: 'Congratulations',
      excellentNews: 'Great news',
      offerAcceptedText: 'your offer has been accepted',
      forProperty: 'for',
      nextSteps: 'Your agent will be in touch with the next steps shortly.',
      closingText: "This is just the beginning of an exciting journey. We're here to support you until you get the keys.",
    },
  },

  // ============================================
  // FIRM CONFIRMED EMAIL
  // ============================================
  firmConfirmed: {
    fr: {
      subject: 'Votre transaction est maintenant ferme!',
      title: 'Excellente nouvelle',
      transactionFirm: 'est maintenant',
      firmText: 'ferme',
      forProperty: 'pour',
      conditionsMet: 'Toutes les conditions ont été remplies avec succès. Votre courtier vous guidera à travers les dernières étapes avant la clôture.',
      nextStepsTitle: 'Prochaines étapes',
      nextStepsItems: [
        'Finalisation des documents légaux',
        'Coordination avec le notaire',
        'Préparation pour la remise des clés',
      ],
      closingText: 'Vous êtes sur la bonne voie! La date de clôture approche.',
    },
    en: {
      subject: 'Your Transaction is Now Firm!',
      title: 'Great News',
      transactionFirm: 'is now',
      firmText: 'firm',
      forProperty: 'for',
      conditionsMet: 'All conditions have been met successfully. Your agent will guide you through the final steps to closing.',
      nextStepsTitle: 'Next Steps',
      nextStepsItems: [
        'Finalization of legal documents',
        'Coordination with the notary',
        'Preparation for key handover',
      ],
      closingText: "You're on track! The closing date is approaching.",
    },
  },

  // ============================================
  // CELEBRATION EMAIL (Closing Day)
  // ============================================
  celebration: {
    fr: {
      subject: 'Félicitations pour votre nouvelle maison!',
      title: 'Félicitations',
      bigDay: "C'est le grand jour — les clés sont à vous!",
      welcomeHome: 'Bienvenue dans votre nouvelle maison',
      welcomeHomeAt: 'Bienvenue dans votre nouvelle maison au',
      thankYou: 'Merci de nous avoir fait confiance pour cette étape importante de votre vie. Nous vous souhaitons de nombreuses années de bonheur dans votre nouveau chez-vous!',
      moveInHelp: "Si vous avez des questions pendant votre emménagement, n'hésitez pas à nous contacter.",
      celebrationClosing: 'Bonne installation!',
    },
    en: {
      subject: 'Congratulations on Your New Home!',
      title: 'Congratulations',
      bigDay: 'Today is the big day — the keys are yours!',
      welcomeHome: 'Welcome to your new home',
      welcomeHomeAt: 'Welcome to your new home at',
      thankYou: 'Thank you for trusting us with this important milestone. We wish you many happy years in your new space!',
      moveInHelp: "If you have any questions during your move-in, don't hesitate to reach out.",
      celebrationClosing: 'Happy moving in!',
    },
  },

  // ============================================
  // FINTRAC REMINDER EMAIL
  // ============================================
  fintracReminder: {
    fr: {
      subject: 'Rappel de conformité FINTRAC',
      title: 'Rappel de conformité FINTRAC',
      actionRequired: 'Action requise:',
      completeDocumentation: 'Veuillez compléter la documentation de conformité FINTRAC',
      forTransaction: 'pour votre transaction au',
      fintracExplanation: "FINTRAC (Centre d'analyse des opérations et déclarations financières du Canada) exige une documentation de conformité pour toutes les transactions immobilières au Canada.",
      requiredDocsTitle: 'Documents requis',
      requiredDocsItems: [
        "Pièce d'identité valide avec photo",
        'Preuve de résidence',
        'Informations sur la source des fonds',
      ],
      agentHelp: 'Votre courtier vous guidera à travers la documentation requise.',
      mandatoryNotice: 'Cette étape est obligatoire pour finaliser votre transaction.',
    },
    en: {
      subject: 'FINTRAC Compliance Reminder',
      title: 'FINTRAC Compliance Reminder',
      actionRequired: 'Action required:',
      completeDocumentation: 'Please complete the FINTRAC compliance documentation',
      forTransaction: 'for your transaction at',
      fintracExplanation: 'FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) requires compliance documentation for all real estate transactions in Canada.',
      requiredDocsTitle: 'Required Documents',
      requiredDocsItems: [
        'Valid photo ID',
        'Proof of residence',
        'Information on source of funds',
      ],
      agentHelp: 'Your agent will guide you through the required documentation.',
      mandatoryNotice: 'This step is mandatory to finalize your transaction.',
    },
  },

  // ============================================
  // GOOGLE REVIEW REMINDER EMAIL
  // ============================================
  googleReview: {
    fr: {
      subject: 'Comment était votre expérience?',
      title: 'Merci',
      settledIn: 'Nous espérons que vous êtes bien installé! Maintenant que votre transaction est complétée, nous aimerions avoir votre avis.',
      reviewRequest: "vous a offert un excellent service, un avis Google serait grandement apprécié. Cela aide d'autres acheteurs et vendeurs à trouver des professionnels de confiance.",
      ifAgent: 'Si',
      cta: 'Laisser un avis Google',
      thankYou: 'Merci pour votre temps et votre confiance!',
    },
    en: {
      subject: 'How was your experience?',
      title: 'Thank You',
      settledIn: "We hope you're settling in well! Now that your transaction is complete, we'd love to hear about your experience.",
      reviewRequest: 'provided you with excellent service, a Google review would mean the world to us. It helps other buyers and sellers find trusted professionals.',
      ifAgent: 'If',
      cta: 'Leave a Google Review',
      thankYou: 'Thank you for your time and your trust!',
    },
  },
}

/**
 * Get translation for a specific email template
 */
export function getTranslation<T extends keyof typeof emailTranslations>(
  template: T,
  lang: EmailLanguage = 'fr'
): (typeof emailTranslations)[T]['fr'] {
  const translations = emailTranslations[template]
  return translations[lang] ?? translations['fr']
}

/**
 * Get common translations
 */
export function getCommonTranslation(lang: EmailLanguage = 'fr') {
  return emailTranslations.common[lang] ?? emailTranslations.common['fr']
}

/**
 * Normalize language code to 'fr' or 'en'
 * Default: 'fr' (NB market)
 */
export function normalizeLanguage(lang?: string | null): EmailLanguage {
  if (!lang) return 'fr'
  const normalized = lang.toLowerCase().substring(0, 2)
  return normalized === 'en' ? 'en' : 'fr'
}
