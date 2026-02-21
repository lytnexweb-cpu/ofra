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
      trialNotice: 'Vous bénéficiez d\'un <strong>essai gratuit de 30 jours</strong> avec accès complet à toutes les fonctionnalités Pro. Créez votre première transaction et découvrez la puissance d\'Ofra.',
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
      trialNotice: 'You have a <strong>free 30-day trial</strong> with full access to all Pro features. Create your first transaction and discover the power of Ofra.',
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
  // EMAIL VERIFICATION
  // ============================================
  emailVerification: {
    fr: {
      subject: 'Confirmez votre adresse courriel',
      title: 'Confirmez votre courriel',
      intro: 'Merci de vous être inscrit sur Ofra! Pour activer votre compte, veuillez confirmer votre adresse courriel en cliquant sur le bouton ci-dessous.',
      cta: 'Confirmer mon courriel',
      expiryWarning: 'Ce lien expire dans 24 heures.',
      ignoreNotice: "Si vous n'avez pas créé de compte sur Ofra, vous pouvez ignorer cet email.",
      linkFallback: 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur:',
    },
    en: {
      subject: 'Confirm your email address',
      title: 'Confirm your email',
      intro: 'Thank you for signing up for Ofra! To activate your account, please confirm your email address by clicking the button below.',
      cta: 'Confirm my email',
      expiryWarning: 'This link expires in 24 hours.',
      ignoreNotice: "If you didn't create an account on Ofra, you can safely ignore this email.",
      linkFallback: "If the button doesn't work, copy and paste this link into your browser:",
    },
  },

  // ============================================
  // MEMBER INVITATION EMAIL
  // ============================================
  memberInvitation: {
    fr: {
      subject: 'Vous êtes invité à collaborer sur une transaction',
      title: 'Invitation à collaborer',
      intro: 'vous a invité à collaborer sur une transaction immobilière dans Ofra.',
      roleLabel: 'Rôle attribué',
      roles: {
        admin: 'Administrateur',
        editor: 'Éditeur',
        viewer: 'Lecteur',
      },
      cta: 'Accéder à la transaction',
      noAccountNotice: "Si vous n'avez pas encore de compte Ofra, créez-en un avec cette adresse courriel pour accéder à la transaction.",
    },
    en: {
      subject: 'You are invited to collaborate on a transaction',
      title: 'Collaboration Invitation',
      intro: 'has invited you to collaborate on a real estate transaction in Ofra.',
      roleLabel: 'Assigned role',
      roles: {
        admin: 'Administrator',
        editor: 'Editor',
        viewer: 'Viewer',
      },
      cta: 'Access Transaction',
      noAccountNotice: "If you don't have an Ofra account yet, create one with this email address to access the transaction.",
    },
  },

  // ============================================
  // PARTY ADDED EMAIL
  // ============================================
  partyAdded: {
    fr: {
      subject: 'Vous avez été ajouté à une transaction immobilière',
      title: 'Nouvelle transaction',
      intro: 'Vous avez été ajouté comme partie dans une transaction immobilière gérée par',
      roleLabel: 'Votre rôle',
      roles: {
        buyer: 'Acheteur',
        seller: 'Vendeur',
        lawyer: 'Avocat',
        notary: 'Notaire',
        agent: 'Agent',
        broker: 'Courtier',
        other: 'Autre',
      },
      transactionDetails: 'Détails de la transaction',
      stayInformed: 'Vous recevrez les mises à jour importantes concernant cette transaction.',
      cta: 'En savoir plus',
    },
    en: {
      subject: 'You have been added to a real estate transaction',
      title: 'New Transaction',
      intro: 'You have been added as a party in a real estate transaction managed by',
      roleLabel: 'Your role',
      roles: {
        buyer: 'Buyer',
        seller: 'Seller',
        lawyer: 'Lawyer',
        notary: 'Notary',
        agent: 'Agent',
        broker: 'Broker',
        other: 'Other',
      },
      transactionDetails: 'Transaction details',
      stayInformed: 'You will receive important updates about this transaction.',
      cta: 'Learn more',
    },
  },

  // ============================================
  // SHARE LINK EMAIL
  // ============================================
  shareLink: {
    fr: {
      subject: 'Un lien de partage a été créé pour votre transaction',
      title: 'Lien de partage créé',
      intro: 'Un lien de partage a été créé pour donner accès à votre transaction.',
      accessLevel: "Niveau d'accès",
      roles: {
        viewer: 'Lecture seule',
        editor: 'Modification',
        admin: 'Administration',
      },
      passwordProtected: 'Protégé par mot de passe',
      yes: 'Oui',
      no: 'Non',
      expiresAt: 'Expire le',
      noExpiry: 'Pas d\'expiration',
      securityNotice: 'Partagez ce lien uniquement avec les personnes autorisées. Vous pouvez le désactiver à tout moment depuis Ofra.',
      cta: 'Gérer le lien',
    },
    en: {
      subject: 'A share link has been created for your transaction',
      title: 'Share Link Created',
      intro: 'A share link has been created to give access to your transaction.',
      accessLevel: 'Access level',
      roles: {
        viewer: 'View only',
        editor: 'Edit',
        admin: 'Admin',
      },
      passwordProtected: 'Password protected',
      yes: 'Yes',
      no: 'No',
      expiresAt: 'Expires on',
      noExpiry: 'No expiration',
      securityNotice: 'Share this link only with authorized people. You can disable it anytime from Ofra.',
      cta: 'Manage Link',
    },
  },

  // ============================================
  // TRANSACTION CANCELLED EMAIL (confirmation to broker)
  // ============================================
  transactionCancelled: {
    fr: {
      subject: 'Transaction annulée',
      title: 'Transaction annulée',
      intro: 'Votre transaction a été annulée.',
      reasonLabel: 'Raison',
      noReason: 'Aucune raison fournie',
      cta: 'Voir le tableau de bord',
      archiveNotice: 'Les données de cette transaction restent accessibles depuis votre tableau de bord.',
    },
    en: {
      subject: 'Transaction cancelled',
      title: 'Transaction Cancelled',
      intro: 'Your transaction has been cancelled.',
      reasonLabel: 'Reason',
      noReason: 'No reason provided',
      cta: 'View Dashboard',
      archiveNotice: 'This transaction data remains accessible from your dashboard.',
    },
  },

  // ============================================
  // TRANSACTION RECAP EMAIL
  // ============================================
  transactionRecap: {
    fr: {
      subject: 'Récapitulatif de votre transaction',
      title: 'Récapitulatif',
      intro: 'Voici le récapitulatif de votre transaction.',
      clientLabel: 'Client',
      propertyLabel: 'Propriété',
      statusLabel: 'Statut',
      statuses: {
        active: 'Active',
        cancelled: 'Annulée',
        completed: 'Complétée',
        archived: 'Archivée',
      },
      closingDateLabel: 'Date de clôture',
      salePriceLabel: 'Prix de vente',
      noData: 'N/A',
      customMessageLabel: 'Message',
      sentByBroker: 'Envoyé par votre courtier via Ofra.',
    },
    en: {
      subject: 'Your transaction summary',
      title: 'Summary',
      intro: 'Here is the summary of your transaction.',
      clientLabel: 'Client',
      propertyLabel: 'Property',
      statusLabel: 'Status',
      statuses: {
        active: 'Active',
        cancelled: 'Cancelled',
        completed: 'Completed',
        archived: 'Archived',
      },
      closingDateLabel: 'Closing date',
      salePriceLabel: 'Sale price',
      noData: 'N/A',
      customMessageLabel: 'Message',
      sentByBroker: 'Sent by your broker via Ofra.',
    },
  },

  // ============================================
  // STEP ADVANCED EMAIL (confirmation to broker)
  // ============================================
  stepAdvanced: {
    fr: {
      subject: 'Étape avancée sur votre transaction',
      title: 'Étape avancée',
      intro: 'Votre transaction a progressé vers une nouvelle étape.',
      fromStepLabel: 'Étape précédente',
      toStepLabel: 'Nouvelle étape',
      cta: 'Voir la transaction',
      progressNotice: 'Continuez à suivre vos conditions et échéances depuis Ofra.',
    },
    en: {
      subject: 'Step advanced on your transaction',
      title: 'Step Advanced',
      intro: 'Your transaction has progressed to a new step.',
      fromStepLabel: 'Previous step',
      toStepLabel: 'New step',
      cta: 'View Transaction',
      progressNotice: 'Continue tracking your conditions and deadlines from Ofra.',
    },
  },

  // ============================================
  // CONDITION RESOLVED EMAIL (confirmation to broker)
  // ============================================
  conditionResolved: {
    fr: {
      subject: 'Condition résolue sur votre transaction',
      title: 'Condition résolue',
      intro: 'Une condition a été résolue sur votre transaction.',
      conditionLabel: 'Condition',
      resolutionLabel: 'Résolution',
      resolutionTypes: {
        completed: 'Complétée',
        waived: 'Levée',
        not_applicable: 'Non applicable',
        skipped_with_risk: 'Ignorée avec risque',
      },
      cta: 'Voir la transaction',
      progressNotice: 'Vérifiez les conditions restantes pour avancer à la prochaine étape.',
    },
    en: {
      subject: 'Condition resolved on your transaction',
      title: 'Condition Resolved',
      intro: 'A condition has been resolved on your transaction.',
      conditionLabel: 'Condition',
      resolutionLabel: 'Resolution',
      resolutionTypes: {
        completed: 'Completed',
        waived: 'Waived',
        not_applicable: 'Not applicable',
        skipped_with_risk: 'Skipped with risk',
      },
      cta: 'View Transaction',
      progressNotice: 'Check remaining conditions to advance to the next step.',
    },
  },

  // ============================================
  // BLOCKING CONDITION ALERT EMAIL (warning to broker)
  // ============================================
  blockingConditionAlert: {
    fr: {
      subject: 'Condition bloquante ajoutée à votre transaction',
      title: 'Condition bloquante',
      intro: 'Une condition bloquante a été ajoutée à votre transaction. Elle doit être résolue avant de pouvoir avancer.',
      conditionLabel: 'Condition',
      levelLabel: 'Niveau',
      levelValue: 'Bloquante',
      dueDateLabel: 'Échéance',
      noDueDate: 'Aucune échéance',
      cta: 'Voir la transaction',
      urgentNotice: 'Cette condition bloque l\'avancement de la transaction. Résolvez-la dès que possible.',
    },
    en: {
      subject: 'Blocking condition added to your transaction',
      title: 'Blocking Condition',
      intro: 'A blocking condition has been added to your transaction. It must be resolved before you can advance.',
      conditionLabel: 'Condition',
      levelLabel: 'Level',
      levelValue: 'Blocking',
      dueDateLabel: 'Due date',
      noDueDate: 'No due date',
      cta: 'View Transaction',
      urgentNotice: 'This condition blocks transaction advancement. Resolve it as soon as possible.',
    },
  },

  // ============================================
  // CONDITION ASSIGNED EMAIL (confirmation to broker)
  // ============================================
  conditionAssigned: {
    fr: {
      subject: 'Nouvelle condition ajoutée à votre transaction',
      title: 'Nouvelle condition',
      intro: 'Une nouvelle condition a été ajoutée à votre transaction.',
      conditionLabel: 'Condition',
      levelLabel: 'Niveau',
      levels: {
        blocking: 'Bloquante',
        required: 'Requise',
        recommended: 'Recommandée',
      },
      dueDateLabel: 'Échéance',
      noDueDate: 'Aucune échéance',
      cta: 'Voir la transaction',
      trackNotice: 'Suivez cette condition depuis votre tableau de bord Ofra.',
    },
    en: {
      subject: 'New condition added to your transaction',
      title: 'New Condition',
      intro: 'A new condition has been added to your transaction.',
      conditionLabel: 'Condition',
      levelLabel: 'Level',
      levels: {
        blocking: 'Blocking',
        required: 'Required',
        recommended: 'Recommended',
      },
      dueDateLabel: 'Due date',
      noDueDate: 'No due date',
      cta: 'View Transaction',
      trackNotice: 'Track this condition from your Ofra dashboard.',
    },
  },

  // ============================================
  // OFFER SUBMITTED EMAIL (confirmation to broker)
  // ============================================
  offerSubmitted: {
    fr: {
      subject: 'Offre soumise avec succès',
      title: 'Offre soumise',
      intro: 'Une nouvelle offre a été soumise sur votre transaction.',
      priceLabel: 'Montant',
      directionLabel: 'Direction',
      directions: {
        buyer_to_seller: 'Acheteur → Vendeur',
        seller_to_buyer: 'Vendeur → Acheteur',
      },
      cta: 'Voir la transaction',
      trackNotice: 'Vous pouvez suivre le statut de cette offre depuis votre tableau de bord Ofra.',
    },
    en: {
      subject: 'Offer submitted successfully',
      title: 'Offer Submitted',
      intro: 'A new offer has been submitted on your transaction.',
      priceLabel: 'Amount',
      directionLabel: 'Direction',
      directions: {
        buyer_to_seller: 'Buyer → Seller',
        seller_to_buyer: 'Seller → Buyer',
      },
      cta: 'View Transaction',
      trackNotice: 'You can track this offer status from your Ofra dashboard.',
    },
  },

  // ============================================
  // OFFER COUNTERED EMAIL (confirmation to broker)
  // ============================================
  offerCountered: {
    fr: {
      subject: 'Contre-offre enregistrée',
      title: 'Contre-offre',
      intro: 'Une contre-offre a été ajoutée à votre transaction.',
      revisionLabel: 'Révision #',
      priceLabel: 'Nouveau montant',
      directionLabel: 'Direction',
      directions: {
        buyer_to_seller: 'Acheteur → Vendeur',
        seller_to_buyer: 'Vendeur → Acheteur',
      },
      cta: 'Voir l\'offre',
      negotiationNotice: 'La négociation est en cours. Répondez dans Ofra pour continuer.',
    },
    en: {
      subject: 'Counter-offer recorded',
      title: 'Counter-Offer',
      intro: 'A counter-offer has been added to your transaction.',
      revisionLabel: 'Revision #',
      priceLabel: 'New amount',
      directionLabel: 'Direction',
      directions: {
        buyer_to_seller: 'Buyer → Seller',
        seller_to_buyer: 'Seller → Buyer',
      },
      cta: 'View Offer',
      negotiationNotice: 'Negotiation is in progress. Reply in Ofra to continue.',
    },
  },

  // ============================================
  // OFFER COUNTER NOTIFY BUYER EMAIL (N1 — buyer gets notified of counter)
  // ============================================
  offerCounterBuyer: {
    fr: {
      subject: 'Vous avez reçu une contre-offre',
      title: 'Contre-offre reçue',
      intro: 'Le vendeur a répondu à votre offre avec une contre-proposition.',
      priceLabel: 'Nouveau montant proposé',
      revisionLabel: 'Révision #',
      respondPrompt: 'Cliquez ci-dessous pour consulter les détails et répondre.',
      cta: 'Voir et répondre',
      expiryNotice: 'Répondez rapidement — les offres peuvent avoir une date d\'expiration.',
    },
    en: {
      subject: 'You received a counter-offer',
      title: 'Counter-Offer Received',
      intro: 'The seller has responded to your offer with a counter-proposal.',
      priceLabel: 'New proposed amount',
      revisionLabel: 'Revision #',
      respondPrompt: 'Click below to view the details and respond.',
      cta: 'View & Respond',
      expiryNotice: 'Respond quickly — offers may have an expiration date.',
    },
  },

  // ============================================
  // OFFER RECEIVED CONFIRMATION EMAIL (N3 — buyer gets confirmation)
  // ============================================
  offerReceivedConfirmation: {
    fr: {
      subject: 'Votre offre a bien été reçue',
      title: 'Offre reçue',
      intro: 'Votre offre a été soumise avec succès. Le courtier l\'examinera et vous reviendra sous peu.',
      priceLabel: 'Montant de votre offre',
      trackPrompt: 'Vous pouvez suivre le statut de votre offre en revisitant le lien ci-dessous.',
      cta: 'Suivre mon offre',
      patience: 'Vous recevrez un courriel dès qu\'une réponse sera disponible.',
    },
    en: {
      subject: 'Your offer has been received',
      title: 'Offer Received',
      intro: 'Your offer has been submitted successfully. The broker will review it and get back to you shortly.',
      priceLabel: 'Your offer amount',
      trackPrompt: 'You can track the status of your offer by revisiting the link below.',
      cta: 'Track My Offer',
      patience: 'You will receive an email as soon as a response is available.',
    },
  },

  // ============================================
  // OFFER REJECTED EMAIL (confirmation to broker)
  // ============================================
  offerRejected: {
    fr: {
      subject: 'Offre refusée',
      title: 'Offre refusée',
      intro: 'Une offre a été refusée sur votre transaction.',
      statusLabel: 'Statut',
      statusValue: 'Refusée',
      cta: 'Voir la transaction',
      nextStepsNotice: 'Vous pouvez soumettre une nouvelle offre ou poursuivre les négociations depuis Ofra.',
    },
    en: {
      subject: 'Offer rejected',
      title: 'Offer Rejected',
      intro: 'An offer has been rejected on your transaction.',
      statusLabel: 'Status',
      statusValue: 'Rejected',
      cta: 'View Transaction',
      nextStepsNotice: 'You can submit a new offer or continue negotiations from Ofra.',
    },
  },

  // ============================================
  // OFFER WITHDRAWN EMAIL (confirmation to broker)
  // ============================================
  offerWithdrawn: {
    fr: {
      subject: 'Offre retirée',
      title: 'Offre retirée',
      intro: 'Une offre a été retirée de votre transaction.',
      statusLabel: 'Statut',
      statusValue: 'Retirée',
      cta: 'Voir la transaction',
      nextStepsNotice: 'Vous pouvez soumettre une nouvelle offre depuis Ofra si nécessaire.',
    },
    en: {
      subject: 'Offer withdrawn',
      title: 'Offer Withdrawn',
      intro: 'An offer has been withdrawn from your transaction.',
      statusLabel: 'Status',
      statusValue: 'Withdrawn',
      cta: 'View Transaction',
      nextStepsNotice: 'You can submit a new offer from Ofra if needed.',
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

  // ============================================
  // D53: TRIAL REMINDER EMAILS
  // ============================================
  trialReminder: {
    fr: {
      subjectActive: 'Il vous reste {{days}} jours dans votre essai Ofra',
      subjectUrgent: 'Plus que {{days}} jours — votre essai Ofra se termine bientôt',
      titleActive: 'Votre essai gratuit',
      titleUrgent: 'Votre essai se termine bientôt',
      bodyActive: 'Il vous reste <strong>{{days}} jours</strong> dans votre essai gratuit. Profitez de toutes les fonctionnalités Pro pour gérer vos transactions en toute confiance.',
      bodyUrgent: 'Votre essai gratuit se termine dans <strong>{{days}} jours</strong>. Choisissez un forfait maintenant pour continuer à utiliser Ofra sans interruption.',
      reminderTip: 'Rappel : pendant votre essai, vous avez accès complet à toutes les fonctionnalités Pro, incluant le suivi des conditions, FINTRAC, les preuves et plus encore.',
      ctaPricing: 'Voir les forfaits',
      ctaDashboard: 'Aller au tableau de bord',
      noLoss: 'Vos données sont en sécurité. Elles seront restaurées intégralement dès que vous choisirez un forfait.',
    },
    en: {
      subjectActive: 'You have {{days}} days left in your Ofra trial',
      subjectUrgent: 'Only {{days}} days left — your Ofra trial is ending soon',
      titleActive: 'Your free trial',
      titleUrgent: 'Your trial is ending soon',
      bodyActive: 'You have <strong>{{days}} days</strong> left in your free trial. Make the most of all Pro features to manage your transactions with confidence.',
      bodyUrgent: 'Your free trial ends in <strong>{{days}} days</strong>. Choose a plan now to keep using Ofra without interruption.',
      reminderTip: 'Reminder: during your trial, you have full access to all Pro features, including condition tracking, FINTRAC compliance, evidence management and more.',
      ctaPricing: 'See plans',
      ctaDashboard: 'Go to dashboard',
      noLoss: 'Your data is safe. It will be fully restored as soon as you choose a plan.',
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
