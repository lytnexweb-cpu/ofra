import { DateTime } from 'luxon'
import TransactionTemplate from '#models/transaction_template'
import Condition from '#models/condition'
import type Transaction from '#models/transaction'

/**
 * TemplateService
 *
 * Service responsable de l'application des templates de transaction.
 * Crée automatiquement les conditions pré-configurées avec des dates d'échéance relatives.
 */
export class TemplateService {
  /**
   * Applique un template à une transaction en créant toutes les conditions associées.
   * Les dates d'échéance sont calculées relativement à une date de référence (par défaut: aujourd'hui).
   *
   * @param transaction - La transaction à laquelle appliquer le template
   * @param templateId - L'ID du template à appliquer
   * @param referenceDate - Date de référence pour calculer les due dates (défaut: maintenant)
   * @returns Les conditions créées
   */
  public static async applyTemplate(
    transaction: Transaction,
    templateId: number,
    referenceDate?: DateTime
  ): Promise<Condition[]> {
    const template = await TransactionTemplate.query()
      .where('id', templateId)
      .where('is_active', true)
      .preload('conditions', (query) => query.orderBy('sort_order', 'asc'))
      .first()

    if (!template) {
      console.log(`[TemplateService] Template ${templateId} not found or inactive`)
      return []
    }

    const baseDate = referenceDate || DateTime.now()
    const createdConditions: Condition[] = []

    for (const templateCondition of template.conditions) {
      const dueDate = baseDate.plus({ days: templateCondition.dueDateOffsetDays })

      const condition = await Condition.create({
        transactionId: transaction.id,
        title: templateCondition.title,
        description: templateCondition.description,
        type: templateCondition.type,
        priority: templateCondition.priority,
        stage: templateCondition.stage,
        isBlocking: templateCondition.isBlocking,
        dueDate: dueDate,
        status: 'pending',
      })

      createdConditions.push(condition)
    }

    console.log(
      `[TemplateService] Applied template "${template.name}" to transaction ${transaction.id}: ${createdConditions.length} conditions created`
    )

    return createdConditions
  }

  /**
   * Récupère les templates disponibles pour un type de transaction donné.
   * Inclut les templates système (ownerUserId = null) et les templates personnalisés de l'utilisateur.
   *
   * @param transactionType - Type de transaction ('purchase' ou 'sale')
   * @param userId - ID de l'utilisateur pour récupérer ses templates personnalisés
   * @returns Liste des templates disponibles
   */
  public static async getAvailableTemplates(
    transactionType?: 'purchase' | 'sale',
    userId?: number
  ): Promise<TransactionTemplate[]> {
    const query = TransactionTemplate.query()
      .where('is_active', true)
      .where((subQuery) => {
        // Include system templates (no owner)
        subQuery.whereNull('owner_user_id')
        // Include user's custom templates if userId provided
        if (userId) {
          subQuery.orWhere('owner_user_id', userId)
        }
      })
      .preload('conditions', (conditionQuery) => conditionQuery.orderBy('sort_order', 'asc'))
      .orderBy('is_default', 'desc')
      .orderBy('name', 'asc')

    if (transactionType) {
      query.where('transaction_type', transactionType)
    }

    return query
  }

  /**
   * Récupère un template par son ID avec ses conditions.
   *
   * @param templateId - ID du template
   * @param userId - ID de l'utilisateur (pour vérifier l'accès aux templates personnalisés)
   * @returns Le template avec ses conditions, ou null si non trouvé/non autorisé
   */
  public static async getTemplateById(
    templateId: number,
    userId?: number
  ): Promise<TransactionTemplate | null> {
    const query = TransactionTemplate.query()
      .where('id', templateId)
      .where('is_active', true)
      .where((subQuery) => {
        subQuery.whereNull('owner_user_id')
        if (userId) {
          subQuery.orWhere('owner_user_id', userId)
        }
      })
      .preload('conditions', (conditionQuery) => conditionQuery.orderBy('sort_order', 'asc'))

    return query.first()
  }

  /**
   * Récupère le template par défaut pour un type de transaction.
   *
   * @param transactionType - Type de transaction
   * @returns Le template par défaut, ou null si aucun n'est défini
   */
  public static async getDefaultTemplate(
    transactionType: 'purchase' | 'sale'
  ): Promise<TransactionTemplate | null> {
    return TransactionTemplate.query()
      .where('transaction_type', transactionType)
      .where('is_default', true)
      .where('is_active', true)
      .whereNull('owner_user_id')
      .preload('conditions', (query) => query.orderBy('sort_order', 'asc'))
      .first()
  }
}
