import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import Transaction from '#models/transaction'
import {
  changePasswordValidator,
  updateProfileValidator,
  updateProfileInfoValidator,
  onboardingValidator,
} from '#validators/profile_validator'
import { DateTime } from 'luxon'

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
   * D40: Save onboarding profile
   * PUT /api/me/onboarding
   */
  async saveOnboarding({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Validate request
      const payload = await request.validateUsing(onboardingValidator)

      // Update user profile with onboarding data
      user.language = payload.language
      user.practiceType = payload.practiceType
      user.propertyContexts = payload.propertyContexts
      user.annualVolume = payload.annualVolume
      user.preferAutoConditions = payload.preferAutoConditions
      user.onboardingCompleted = true
      user.onboardingSkipped = payload.skipped ?? false
      user.onboardingCompletedAt = DateTime.now()

      await user.save()

      return response.ok({
        success: true,
        data: {
          message: 'Onboarding completed successfully',
          profile: {
            practiceType: user.practiceType,
            propertyContexts: user.propertyContexts,
            annualVolume: user.annualVolume,
            preferAutoConditions: user.preferAutoConditions,
            onboardingCompleted: user.onboardingCompleted,
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

    // Grace period info
    let graceDaysRemaining: number | null = null
    if (user.gracePeriodStart) {
      const elapsed = DateTime.now().diff(user.gracePeriodStart, 'days').days
      graceDaysRemaining = Math.max(0, Math.round(7 - elapsed))
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
          storageUsedGb: 0, // TODO: implement storage tracking
          maxStorageGb: plan?.maxStorageGb ?? 0,
        },
        grace: {
          active: user.gracePeriodStart !== null,
          startedAt: user.gracePeriodStart?.toISO() ?? null,
          daysRemaining: graceDaysRemaining,
        },
      },
    })
  }
}
