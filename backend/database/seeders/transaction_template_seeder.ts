import { BaseSeeder } from '@adonisjs/lucid/seeders'
import TransactionTemplate from '#models/transaction_template'
import TemplateCondition from '#models/template_condition'

export default class extends BaseSeeder {
  async run() {
    // Clear existing templates and conditions (for re-running)
    await TemplateCondition.query().delete()
    await TransactionTemplate.query().delete()

    // ========================================
    // Template VENTE (Sale)
    // ========================================
    const saleTemplate = await TransactionTemplate.create({
      name: 'Vente standard',
      slug: 'vente-standard',
      description: 'Template par défaut pour les transactions de vente',
      transactionType: 'sale',
      isDefault: true,
      isActive: true,
      ownerUserId: null, // System template
    })

    const saleConditions = [
      {
        templateId: saleTemplate.id,
        title: 'Financement',
        description: "Confirmation du financement de l'acheteur",
        type: 'financing' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 14,
        sortOrder: 1,
      },
      {
        templateId: saleTemplate.id,
        title: 'Inspection',
        description: 'Inspection de la propriété par un professionnel',
        type: 'inspection' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 7,
        sortOrder: 2,
      },
      {
        templateId: saleTemplate.id,
        title: 'RPDS / Déclaration vendeur',
        description: 'Révision du formulaire de déclaration du vendeur',
        type: 'rpds_review' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 7,
        sortOrder: 3,
      },
      {
        templateId: saleTemplate.id,
        title: 'Documents légaux',
        description: "Préparation et signature des documents légaux chez le notaire",
        type: 'legal' as const,
        priority: 'high' as const,
        stage: 'firm' as const,
        isBlocking: true,
        dueDateOffsetDays: 21,
        sortOrder: 4,
      },
      {
        templateId: saleTemplate.id,
        title: 'Clés et accès',
        description: 'Remise des clés et accès à la propriété',
        type: 'other' as const,
        priority: 'high' as const,
        stage: 'closing' as const,
        isBlocking: true,
        dueDateOffsetDays: 30,
        sortOrder: 5,
      },
    ]

    await TemplateCondition.createMany(saleConditions)
    console.log(`[Seeder] Template "Vente standard" created with ${saleConditions.length} conditions`)

    // ========================================
    // Template ACHAT (Purchase)
    // ========================================
    const purchaseTemplate = await TransactionTemplate.create({
      name: 'Achat standard',
      slug: 'achat-standard',
      description: "Template par défaut pour les transactions d'achat",
      transactionType: 'purchase',
      isDefault: true,
      isActive: true,
      ownerUserId: null, // System template
    })

    const purchaseConditions = [
      {
        templateId: purchaseTemplate.id,
        title: 'Financement approuvé',
        description: 'Obtention de la confirmation du prêt hypothécaire',
        type: 'financing' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 14,
        sortOrder: 1,
      },
      {
        templateId: purchaseTemplate.id,
        title: 'Inspection effectuée',
        description: 'Inspection complète de la propriété par un inspecteur certifié',
        type: 'inspection' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 7,
        sortOrder: 2,
      },
      {
        templateId: purchaseTemplate.id,
        title: 'Révision du RPDS',
        description: 'Examen et acceptation de la déclaration du vendeur',
        type: 'rpds_review' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 7,
        sortOrder: 3,
      },
      {
        templateId: purchaseTemplate.id,
        title: 'Évaluation bancaire',
        description: 'Évaluation de la propriété par un évaluateur agréé',
        type: 'appraisal' as const,
        priority: 'high' as const,
        stage: 'conditional' as const,
        isBlocking: true,
        dueDateOffsetDays: 10,
        sortOrder: 4,
      },
      {
        templateId: purchaseTemplate.id,
        title: 'Dépôt versé',
        description: 'Versement du dépôt de garantie',
        type: 'deposit' as const,
        priority: 'high' as const,
        stage: 'offer' as const,
        isBlocking: true,
        dueDateOffsetDays: 3,
        sortOrder: 5,
      },
      {
        templateId: purchaseTemplate.id,
        title: 'Documents légaux signés',
        description: "Signature de l'acte de vente chez le notaire",
        type: 'legal' as const,
        priority: 'high' as const,
        stage: 'firm' as const,
        isBlocking: true,
        dueDateOffsetDays: 21,
        sortOrder: 6,
      },
      {
        templateId: purchaseTemplate.id,
        title: 'Remise des clés',
        description: 'Prise de possession et remise des clés',
        type: 'other' as const,
        priority: 'high' as const,
        stage: 'closing' as const,
        isBlocking: true,
        dueDateOffsetDays: 30,
        sortOrder: 7,
      },
    ]

    await TemplateCondition.createMany(purchaseConditions)
    console.log(`[Seeder] Template "Achat standard" created with ${purchaseConditions.length} conditions`)

    console.log('[Seeder] Transaction templates seeding completed!')
  }
}
