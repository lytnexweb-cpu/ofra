import type { HttpContext } from '@adonisjs/core/http'
import Transaction from '#models/transaction'
import TransactionProfile from '#models/transaction_profile'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { ConditionsEngineService } from '#services/conditions_engine_service'
import { PlanService } from '#services/plan_service'

/**
 * Validators for transaction profile
 */
const createProfileValidator = vine.compile(
  vine.object({
    propertyType: vine.enum(['house', 'condo', 'land']),
    propertyContext: vine.enum(['urban', 'suburban', 'rural']),
    isFinanced: vine.boolean(),
    hasWell: vine.boolean().optional(),
    hasSeptic: vine.boolean().optional(),
    accessType: vine.enum(['public', 'private', 'right_of_way']).optional(),
    condoDocsRequired: vine.boolean().optional(),
    appraisalRequired: vine.boolean().nullable().optional(),
  })
)

const updateProfileValidator = vine.compile(
  vine.object({
    propertyType: vine.enum(['house', 'condo', 'land']).optional(),
    propertyContext: vine.enum(['urban', 'suburban', 'rural']).optional(),
    isFinanced: vine.boolean().optional(),
    hasWell: vine.boolean().nullable().optional(),
    hasSeptic: vine.boolean().nullable().optional(),
    accessType: vine.enum(['public', 'private', 'right_of_way']).nullable().optional(),
    condoDocsRequired: vine.boolean().nullable().optional(),
    appraisalRequired: vine.boolean().nullable().optional(),
  })
)

/**
 * Transaction Profiles Controller
 *
 * Handles D1: Transaction Profile v1 (8 fields)
 * Part of Conditions Engine Premium
 */
export default class TransactionProfilesController {
  /**
   * Get transaction profile
   * GET /api/transactions/:id/profile
   */
  async show({ params, response }: HttpContext) {
    try {
      // txPermission middleware already validated access
      const profile = await TransactionProfile.find(params.id)

      return response.ok({
        success: true,
        data: { profile: profile ?? null },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to get profile', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Create or update transaction profile
   * PUT /api/transactions/:id/profile
   */
  async upsert({ params, request, response }: HttpContext) {
    try {
      // Guard: profile is locked after consultation step (stepOrder > 1)
      const transaction = await Transaction.query()
        .where('id', params.id)
        .preload('currentStep')
        .first()

      if (transaction?.currentStep && transaction.currentStep.stepOrder > 1) {
        return response.conflict({
          success: false,
          error: {
            message: 'Property profile is locked after the Consultation step',
            code: 'E_PROFILE_LOCKED',
          },
        })
      }

      // txPermission middleware already validated access
      const existingProfile = await TransactionProfile.find(params.id)

      if (existingProfile) {
        // Update existing
        const payload = await request.validateUsing(updateProfileValidator)
        existingProfile.merge(payload)
        await existingProfile.save()

        return response.ok({
          success: true,
          data: { profile: existingProfile, created: false },
        })
      } else {
        // Create new
        const payload = await request.validateUsing(createProfileValidator)
        const profile = await TransactionProfile.create({
          transactionId: Number(params.id),
          ...payload,
          condoDocsRequired: payload.condoDocsRequired ?? true,
        })

        return response.created({
          success: true,
          data: { profile, created: true },
        })
      }
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'E_VALIDATION_FAILED',
            details: error.messages,
          },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to save profile', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Check if profile is complete (all required fields for context)
   * GET /api/transactions/:id/profile/status
   */
  async status({ params, response }: HttpContext) {
    try {
      // txPermission middleware already validated access
      const profile = await TransactionProfile.find(params.id)

      if (!profile) {
        return response.ok({
          success: true,
          data: {
            exists: false,
            complete: false,
            missingFields: ['propertyType', 'propertyContext', 'isFinanced'],
          },
        })
      }

      const missingFields: string[] = []

      // Check rural-specific fields
      if (profile.propertyContext === 'rural') {
        if (profile.hasWell === null || profile.hasWell === undefined) {
          missingFields.push('hasWell')
        }
        if (profile.hasSeptic === null || profile.hasSeptic === undefined) {
          missingFields.push('hasSeptic')
        }
        if (!profile.accessType) {
          missingFields.push('accessType')
        }
      }

      // Check condo-specific fields
      if (profile.propertyType === 'condo') {
        if (profile.condoDocsRequired === null || profile.condoDocsRequired === undefined) {
          missingFields.push('condoDocsRequired')
        }
      }

      // Check financed-specific fields
      if (profile.isFinanced && profile.appraisalRequired === null) {
        // appraisalRequired can be null (unknown), but we flag it as incomplete
        missingFields.push('appraisalRequired')
      }

      return response.ok({
        success: true,
        data: {
          exists: true,
          complete: missingFields.length === 0,
          missingFields,
          profile: {
            propertyType: profile.propertyType,
            propertyContext: profile.propertyContext,
            isFinanced: profile.isFinanced,
            isRural: profile.isRural,
            isCondo: profile.isCondo,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to check profile status', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * D39: Load condition pack for transaction
   * POST /api/transactions/:id/profile/load-pack
   *
   * Loads all applicable conditions from templates based on transaction profile.
   * Uses D37 deadlines relatives for automatic due date calculation.
   */
  async loadPack({ params, request, response, auth }: HttpContext) {
    try {
      // Gate: specialized packs require Solo+
      await auth.user!.load('plan')
      if (!PlanService.meetsMinimum(auth.user!.plan?.slug, 'solo')) {
        return response.forbidden(
          PlanService.formatUpgradeError('specialized_packs', auth.user!.plan?.slug ?? 'none', 'solo')
        )
      }

      // txPermission middleware already validated access
      const profile = await TransactionProfile.find(params.id)
      if (!profile) {
        return response.badRequest({
          success: false,
          error: {
            message: 'Profile required before loading pack',
            code: 'E_PROFILE_REQUIRED',
          },
        })
      }

      // Parse optional dates from request
      const body = request.body()
      const dates: {
        acceptanceDate?: DateTime | null
        closingDate?: DateTime | null
      } = {}

      if (body.acceptanceDate) {
        dates.acceptanceDate = DateTime.fromISO(body.acceptanceDate)
      }
      if (body.closingDate) {
        dates.closingDate = DateTime.fromISO(body.closingDate)
      }

      // Load the pack
      const result = await ConditionsEngineService.loadPackForTransaction(
        Number(params.id),
        auth.user!.id,
        dates
      )

      return response.ok({
        success: true,
        data: {
          loaded: result.loaded,
          byStep: result.byStep,
          message: `${result.loaded} conditions loaded from pack`,
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to load condition pack', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
