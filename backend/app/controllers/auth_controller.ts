import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth_validator'

export default class AuthController {
  async login({ request, response, auth }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(loginValidator)

      try {
        const user = (await User.verifyCredentials(email, password)) as User
        await auth.use('web').login(user)

        return response.ok({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
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

      return response.ok({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
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
}
