import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Parse CORS origins from environment variable
 * Supports comma-separated list: "http://localhost:5173,https://ofra.pages.dev"
 */
function parseOrigins(): string[] {
  const envOrigins = env.get('CORS_ORIGINS', '')
  const defaultOrigins = ['http://localhost:5173']

  if (!envOrigins) {
    return defaultOrigins
  }

  return envOrigins.split(',').map((origin) => origin.trim())
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: parseOrigins(),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
