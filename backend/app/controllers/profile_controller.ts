import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import Plan from '#models/plan'
import Transaction from '#models/transaction'
import ActivityFeed from '#models/activity_feed'
import {
  changePasswordValidator,
  updateProfileValidator,
  updateProfileInfoValidator,
  onboardingValidator,
} from '#validators/profile_validator'
import { changePlanValidator } from '#validators/change_plan_validator'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class ProfileController {
  /**
   * Change user password
   * PUT /api/me/password
   */
  async changePassword({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Validate request
      const payload = await request.validateUsing(changePasswordValidator)

      // Verify current password
      const isCurrentPasswordValid = await hash.verify(user.password, payload.currentPassword)
      if (!isCurrentPasswordValid) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Current password is incorrect',
            code: 'E_INVALID_CURRENT_PASSWORD',
          },
        })
      }

      // Hash and save new password
      user.password = payload.newPassword // Will be hashed by model hook
      await user.save()

      return response.ok({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
      })
    } catch (error) {
      // Validation error
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
      throw error
    }
  }

  /**
   * Update user profile (email)
   * PUT /api/me
   */
  async updateProfile({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Validate request
      const payload = await request.validateUsing(updateProfileValidator)

      // Verify current password for security
      const isPasswordValid = await hash.verify(user.password, payload.currentPassword)
      if (!isPasswordValid) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Current password is incorrect',
            code: 'E_INVALID_CURRENT_PASSWORD',
          },
        })
      }

      // Check if email is already taken by another user
      if (payload.email !== user.email) {
        const existingUser = await User.query()
          .where('email', payload.email)
          .whereNot('id', user.id)
          .first()

        if (existingUser) {
          return response.unprocessableEntity({
            success: false,
            error: {
              message: 'This email is already in use',
              code: 'E_EMAIL_IN_USE',
            },
          })
        }
      }

      // Update email
      user.email = payload.email
      await user.save()

      return response.ok({
        success: true,
        data: {
          message: 'Profile updated successfully',
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        },
      })
    } catch (error) {
      // Validation error
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
      throw error
    }
  }

  /**
   * Sign out from all devices (invalidate all sessions)
   * POST /api/me/logout-all
   *
   * Note: For cookie-based sessions, we can only logout the current session.
   * True "logout everywhere" would require database session storage or token blacklisting.
   * This implementation logs out the current session and returns a message.
   */
  async logoutAll({ response, auth }: HttpContext) {
    try {
      // Logout current session
      await auth.use('web').logout()

      return response.ok({
        success: true,
        data: {
          message:
            'Logged out successfully. Note: Cookie-based sessions on other devices will expire naturally.',
        },
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        error: {
          message: 'Logout failed',
          code: 'E_LOGOUT_FAILED',
        },
      })
    }
  }

  /**
   * Update user profile information (phone, agency, license, photo, email signature, preferences)
   * PUT /api/me/profile
   * Does NOT require password for less sensitive info
   */
  async updateProfileInfo({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Validate request
      const payload = await request.validateUsing(updateProfileInfoValidator)

      // Update profile fields
      if (payload.fullName !== undefined) user.fullName = payload.fullName
      if (payload.phone !== undefined) user.phone = payload.phone
      if (payload.agency !== undefined) user.agency = payload.agency
      if (payload.licenseNumber !== undefined) user.licenseNumber = payload.licenseNumber
      if (payload.profilePhoto !== undefined) user.profilePhoto = payload.profilePhoto
      if (payload.emailSignature !== undefined) user.emailSignature = payload.emailSignature
      if (payload.language !== undefined) user.language = payload.language
      if (payload.dateFormat !== undefined) user.dateFormat = payload.dateFormat
      if (payload.timezone !== undefined) user.timezone = payload.timezone

      await user.save()

      return response.ok({
        success: true,
        data: {
          message: 'Profile information updated successfully',
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            agency: user.agency,
            licenseNumber: user.licenseNumber,
            profilePhoto: user.profilePhoto,
            emailSignature: user.emailSignature,
            language: user.language,
            dateFormat: user.dateFormat,
            timezone: user.timezone,
          },
        },
      })
    } catch (error) {
      // Validation error
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
      throw error
    }
  }

  /**
   * Save onboarding profile (3-step action onboarding)
   * PUT /api/me/onboarding
   */
  async saveOnboarding({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      const payload = await request.validateUsing(onboardingValidator)

      user.language = payload.language
      user.agency = payload.agency
      user.licenseNumber = payload.licenseNumber
      if (payload.fullName !== undefined) user.fullName = payload.fullName
      if (payload.phone !== undefined) user.phone = payload.phone
      user.onboardingCompleted = true
      user.onboardingSkipped = false
      user.onboardingCompletedAt = DateTime.now()

      await user.save()

      return response.ok({
        success: true,
        data: {
          message: 'Onboarding completed successfully',
          language: user.language,
          agency: user.agency,
          licenseNumber: user.licenseNumber,
          onboardingCompleted: user.onboardingCompleted,
        },
      })
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
      throw error
    }
  }

  /**
   * D40: Skip onboarding
   * POST /api/me/onboarding/skip
   */
  async skipOnboarding({ response, auth }: HttpContext) {
    const user = auth.user!

    user.onboardingSkipped = true
    user.onboardingCompleted = true
    user.onboardingCompletedAt = DateTime.now()

    await user.save()

    return response.ok({
      success: true,
      data: {
        message: 'Onboarding skipped',
      },
    })
  }

  /**
   * K2: Get subscription info + usage stats
   * GET /api/me/subscription
   */
  async subscription({ response, auth }: HttpContext) {
    const user = auth.user!
    await user.load('plan')

    // Count active transactions
    const activeResult = await Transaction.query()
      .where('owner_user_id', user.id)
      .where('status', 'active')
      .count('* as total')
      .first()
    const activeTransactions = Number(activeResult?.$extras?.total ?? 0)

    // Calculate storage used
    const storageResult = await db
      .from('transaction_documents')
      .join('transactions', 'transactions.id', 'transaction_documents.transaction_id')
      .where('transactions.owner_user_id', user.id)
      .sum('transaction_documents.file_size as total_bytes')
      .first()
    const storageUsedGb = Number(
      (Number(storageResult?.total_bytes ?? 0) / (1024 ** 3)).toFixed(2)
    )

    // PDF exports this month (for Starter plan gate display)
    const startOfMonth = DateTime.now().startOf('month')
    const pdfExportResult = await ActivityFeed.query()
      .where('userId', user.id)
      .where('activityType', 'pdf_exported')
      .where('createdAt', '>=', startOfMonth.toSQL()!)
      .count('* as total')
      .first()
    const pdfExportsThisMonth = Number(pdfExportResult?.$extras?.total ?? 0)

    // Grace period info
    let graceDaysRemaining: number | null = null
    if (user.gracePeriodStart) {
      const elapsed = DateTime.now().diff(user.gracePeriodStart, 'days').days
      graceDaysRemaining = Math.max(0, Math.round(7 - elapsed))
    }

    // D53: Trial info
    const now = DateTime.now()
    const isTrial = !user.planId && user.subscriptionStatus === 'trial'
    const trialEnd = user.subscriptionEndsAt
    let trialDaysRemaining: number | null = null
    let trialSoftWall = false
    let trialHardWall = false

    if (isTrial && trialEnd) {
      if (now < trialEnd) {
        trialDaysRemaining = Math.ceil(trialEnd.diff(now, 'days').days)
      } else {
        trialDaysRemaining = 0
        const softWallEnd = trialEnd.plus({ days: 3 })
        trialSoftWall = now < softWallEnd
        trialHardWall = now >= softWallEnd
      }
    }

    const plan = user.plan

    return response.ok({
      success: true,
      data: {
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              maxTransactions: plan.maxTransactions,
              maxStorageGb: plan.maxStorageGb,
              maxUsers: plan.maxUsers,
              historyMonths: plan.historyMonths,
            }
          : null,
        billing: {
          cycle: user.billingCycle,
          isFounder: user.isFounder,
          lockedPrice: user.planLockedPrice,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionStartedAt: user.subscriptionStartedAt?.toISO() ?? null,
          subscriptionEndsAt: user.subscriptionEndsAt?.toISO() ?? null,
        },
        usage: {
          activeTransactions,
          maxTransactions: plan?.maxTransactions ?? null,
          storageUsedGb,
          maxStorageGb: plan?.maxStorageGb ?? 0,
          pdfExportsThisMonth,
          pdfExportsLimit: plan?.slug === 'starter' ? 3 : null,
        },
        grace: {
          active: user.gracePeriodStart !== null,
          startedAt: user.gracePeriodStart?.toISO() ?? null,
          daysRemaining: graceDaysRemaining,
        },
        trial: {
          active: isTrial && trialDaysRemaining !== null && trialDaysRemaining > 0,
          daysRemaining: trialDaysRemaining,
          endsAt: trialEnd?.toISO() ?? null,
          txUsed: user.trialTxUsed,
          softWall: trialSoftWall,
          hardWall: trialHardWall,
        },
      },
    })
  }

  /**
   * POST /api/me/plan
   * Change user's plan (non-paying test endpoint)
   */
  async changePlan({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(changePlanValidator)

    const newPlan = await Plan.query()
      .where('slug', payload.planSlug)
      .where('isActive', true)
      .first()

    if (!newPlan) {
      return response.notFound({
        success: false,
        error: { message: 'Plan not found', code: 'E_NOT_FOUND' },
      })
    }

    // Downgrade check: block if too many active TX
    if (newPlan.maxTransactions !== null) {
      const activeResult = await Transaction.query()
        .where('owner_user_id', user.id)
        .where('status', 'active')
        .count('* as total')
        .first()
      const activeTx = Number(activeResult?.$extras?.total ?? 0)

      if (activeTx > newPlan.maxTransactions) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Too many active transactions for this plan',
            code: 'E_DOWNGRADE_BLOCKED',
            meta: {
              activeTransactions: activeTx,
              maxTransactions: newPlan.maxTransactions,
              archiveNeeded: activeTx - newPlan.maxTransactions,
            },
          },
        })
      }
    }

    // Apply plan change
    user.planId = newPlan.id
    if (payload.billingCycle) {
      user.billingCycle = payload.billingCycle
    }
    user.gracePeriodStart = null
    await user.save()

    // Return updated subscription data
    await user.load('plan')
    const plan = user.plan

    return response.ok({
      success: true,
      data: {
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              maxTransactions: plan.maxTransactions,
              maxStorageGb: plan.maxStorageGb,
              maxUsers: plan.maxUsers,
              historyMonths: plan.historyMonths,
            }
          : null,
        message: `Plan changed to ${newPlan.name}`,
      },
    })
  }
}
