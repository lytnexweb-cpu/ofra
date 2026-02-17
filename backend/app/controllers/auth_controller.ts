import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes, createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/user'
import Organization from '#models/organization'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '#validators/auth_validator'
import WelcomeMail from '#mails/welcome_mail'
import { ReminderService } from '#services/reminder_service'
import PasswordResetMail from '#mails/password_reset_mail'
import EmailVerificationMail from '#mails/email_verification_mail'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)

      // Check if email already exists - but don't reveal this to prevent enumeration
      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        // Return same success response to prevent email enumeration
        // User will realize email exists when they try to login or reset password
        return response.created({
          success: true,
          data: {
            message: 'If this email is available, your account has been created. Please check your email.',
          },
        })
      }

      // Create a personal organization for the user
      const organization = await Organization.create({
        name: `${data.fullName ?? data.email}'s Organization`,
        provinceCode: 'NB', // Default to New Brunswick
      })

      // Create user with organization — D53: trial 30 days starts now
      const user = await User.create({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        provinceCode: data.provinceCode ?? 'NB',
        agency: data.agency ?? null,
        licenseNumber: data.licenseNumber ?? null,
        preferredLanguage: data.preferredLanguage ?? 'en',
        language: data.preferredLanguage ?? 'en',
        dateFormat: 'YYYY-MM-DD',
        timezone: 'America/Moncton',
        organizationId: organization.id,
        subscriptionStatus: 'trial',
        subscriptionStartedAt: DateTime.now(),
        subscriptionEndsAt: DateTime.now().plus({ days: 30 }),
      })

      // Generate email verification token
      const verificationToken = randomBytes(32).toString('hex')
      const tokenHash = createHash('sha256').update(verificationToken).digest('hex')
      user.emailVerificationToken = tokenHash
      user.emailVerificationExpires = DateTime.now().plus({ hours: 24 })
      await user.save()

      // Send verification email
      const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.app')
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`

      mail
        .send(
          new EmailVerificationMail({
            to: user.email,
            userName: user.fullName ?? 'there',
            verifyUrl,
            language: data.preferredLanguage,
          })
        )
        .catch(() => {
          // Log but don't fail registration
        })

      // D53: Schedule trial reminder emails (J7, J21, J27) — fire and forget
      ReminderService.scheduleTrialReminders(user).catch(() => {})

      return response.created({
        success: true,
        data: {
          message: 'If this email is available, your account has been created. Please check your email.',
          requiresVerification: true,
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

  async login({ request, response, auth }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)

      try {
        const user = (await User.verifyCredentials(email, password)) as User

        // Block login if email not verified (admins/superadmins bypass)
        if (!user.emailVerified && user.role === 'user') {
          return response.forbidden({
            success: false,
            error: {
              message: 'Please verify your email address before logging in.',
              code: 'E_EMAIL_NOT_VERIFIED',
            },
          })
        }

        await auth.use('web').login(user)

        return response.ok({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
            },
          },
        })
      } catch (error) {
        return response.unauthorized({
          success: false,
          error: {
            message: 'Invalid credentials',
            code: 'E_INVALID_CREDENTIALS',
          },
        })
      }
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

  async logout({ response, auth }: HttpContext) {
    try {
      await auth.use('web').logout()
      return response.ok({
        success: true,
        data: { message: 'Logged out successfully' },
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

  async me({ response, auth }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return response.unauthorized({
          success: false,
          error: {
            message: 'Not authenticated',
            code: 'E_UNAUTHORIZED',
          },
        })
      }

      // Load plan for subscription info
      await user.load('plan')

      return response.ok({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            language: user.language,
            role: user.role,
            // D40: Onboarding profile
            onboardingCompleted: user.onboardingCompleted,
            onboardingSkipped: user.onboardingSkipped,
            practiceType: user.practiceType,
            propertyContexts: user.propertyContexts,
            annualVolume: user.annualVolume,
            preferAutoConditions: user.preferAutoConditions,
            // K2: Subscription info
            isFounder: user.isFounder,
            planSlug: user.plan?.slug ?? null,
            planName: user.plan?.name ?? null,
            billingCycle: user.billingCycle,
            gracePeriodStart: user.gracePeriodStart?.toISO() ?? null,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        error: {
          message: 'Failed to retrieve user information',
          code: 'E_INTERNAL_ERROR',
        },
      })
    }
  }

  async forgotPassword({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(forgotPasswordValidator)

      const user = await User.findBy('email', email)

      // Always return success to prevent email enumeration
      if (!user) {
        return response.ok({
          success: true,
          data: {
            message: 'If an account exists with this email, a password reset link has been sent',
          },
        })
      }

      // Generate token and hash it for storage (SHA256 for deterministic lookup)
      const token = randomBytes(32).toString('hex')
      const tokenHash = createHash('sha256').update(token).digest('hex')
      user.passwordResetToken = tokenHash
      user.passwordResetExpires = DateTime.now().plus({ hours: 1 })
      await user.save()

      // Send reset email with original (unhashed) token
      const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.app')
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`

      await mail.send(
        new PasswordResetMail({
          to: user.email,
          userName: user.fullName ?? 'there',
          resetUrl,
        })
      )

      return response.ok({
        success: true,
        data: {
          message: 'If an account exists with this email, a password reset link has been sent',
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

  async resetPassword({ request, response }: HttpContext) {
    try {
      const { token, password } = await request.validateUsing(resetPasswordValidator)

      // Hash the incoming token to compare with stored hash
      const tokenHash = createHash('sha256').update(token).digest('hex')

      const user = await User.query()
        .where('passwordResetToken', tokenHash)
        .where('passwordResetExpires', '>', DateTime.now().toSQL())
        .first()

      if (!user) {
        return response.badRequest({
          success: false,
          error: {
            message: 'Invalid or expired reset token',
            code: 'E_INVALID_TOKEN',
          },
        })
      }

      // Update password and clear token
      user.password = password
      user.passwordResetToken = null
      user.passwordResetExpires = null
      await user.save()

      return response.ok({
        success: true,
        data: {
          message: 'Password has been reset successfully',
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

  async verifyEmail({ request, response }: HttpContext) {
    const token = request.input('token')
    if (!token) {
      return response.badRequest({
        success: false,
        error: { message: 'Token is required', code: 'E_MISSING_TOKEN' },
      })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')

    const user = await User.query()
      .where('emailVerificationToken', tokenHash)
      .where('emailVerificationExpires', '>', DateTime.now().toSQL())
      .first()

    if (!user) {
      return response.badRequest({
        success: false,
        error: { message: 'Invalid or expired verification link', code: 'E_INVALID_TOKEN' },
      })
    }

    user.emailVerified = true
    user.emailVerificationToken = null
    user.emailVerificationExpires = null
    await user.save()

    // Send welcome email now that they're verified
    const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.app')
    mail
      .send(
        new WelcomeMail({
          to: user.email,
          userName: user.fullName ?? 'there',
          loginUrl: frontendUrl,
          language: user.preferredLanguage,
        })
      )
      .catch(() => {})

    return response.ok({
      success: true,
      data: { message: 'Email verified successfully' },
    })
  }

  async resendVerification({ request, response }: HttpContext) {
    const email = request.input('email')
    if (!email) {
      return response.badRequest({
        success: false,
        error: { message: 'Email is required', code: 'E_MISSING_EMAIL' },
      })
    }

    const user = await User.findBy('email', email)

    // Always return success to prevent enumeration
    if (!user || user.emailVerified) {
      return response.ok({
        success: true,
        data: { message: 'If the account exists and is unverified, a new verification email has been sent.' },
      })
    }

    // Generate new token
    const verificationToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(verificationToken).digest('hex')
    user.emailVerificationToken = tokenHash
    user.emailVerificationExpires = DateTime.now().plus({ hours: 24 })
    await user.save()

    const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.app')
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`

    mail
      .send(
        new EmailVerificationMail({
          to: user.email,
          userName: user.fullName ?? 'there',
          verifyUrl,
          language: user.preferredLanguage,
        })
      )
      .catch(() => {})

    return response.ok({
      success: true,
      data: { message: 'If the account exists and is unverified, a new verification email has been sent.' },
    })
  }
}
