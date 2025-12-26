import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'

const APP_ROOT = new URL('./', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('./start/env.js')
    })
  })
  .testRunner()
  .start(async () => {
    const User = (await import('#models/user')).default
    const hash = (await import('@adonisjs/core/services/hash')).default

    console.log('\n=== Testing Auth ===\n')

    // Find user
    const user = await User.findBy('email', 'yanick@crm.local')
    if (!user) {
      console.error('User not found!')
      process.exit(1)
    }

    console.log('User found:', user.email)
    console.log('Password hash:', user.password.substring(0, 50) + '...')

    // Test password verification
    const plainPassword = 'password123'
    console.log('\nTesting password:', plainPassword)

    const isValid = await hash.verify(user.password, plainPassword)
    console.log('Password valid?', isValid)

    // Try verifyCredentials
    try {
      const verifiedUser = await User.verifyCredentials('yanick@crm.local', 'password123')
      console.log('✓ verifyCredentials SUCCESS:', verifiedUser.email)
    } catch (error) {
      console.error('✗ verifyCredentials FAILED:', error.message)
    }

    process.exit(0)
  })
