import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const attempts = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of attempts.entries()) {
      if (entry.resetAt < now) {
        attempts.delete(key)
      }
    }
  },
  5 * 60 * 1000
)

/**
 * Rate limit middleware for auth protection
 * Limits to 20 attempts per 5 minutes per IP
 */
export default class RateLimitMiddleware {
  private maxAttempts = 20
  private windowMs = 5 * 60 * 1000 // 5 minutes

  async handle(ctx: HttpContext, next: NextFn) {
    // Skip rate limiting in test environment
    if (app.inTest) {
      return next()
    }

    const ip = ctx.request.ip()
    const key = `login:${ip}`
    const now = Date.now()

    let entry = attempts.get(key)

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + this.windowMs }
      attempts.set(key, entry)
    }

    entry.count++

    if (entry.count > this.maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      ctx.response.header('Retry-After', String(retryAfter))
      return ctx.response.tooManyRequests({
        success: false,
        error: {
          message: 'Too many login attempts. Please try again later.',
          code: 'E_RATE_LIMIT',
          retryAfter,
        },
      })
    }

    return next()
  }
}
