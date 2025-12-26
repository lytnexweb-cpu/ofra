import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

export default class TestAuth extends BaseCommand {
  static commandName = 'test:auth'
  static description = 'Test authentication and password hashing'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('=== Testing Auth ===')

    try {
      // Test DB connection first
      await db.rawQuery('SELECT 1')
      this.logger.info('✓ Database connected')

      const user = await User.findBy('email', 'yanick@crm.local')
      if (!user) {
        this.logger.error('User not found!')
        return
      }

      this.logger.info(`User found: ${user.email}`)
      this.logger.info(`Password hash: ${user.password.substring(0, 60)}...`)

      const plainPassword = 'password123'
      this.logger.info(`\nTesting password: ${plainPassword}`)

      const isValid = await hash.verify(user.password, plainPassword)
      this.logger.info(`Password valid with hash.verify? ${isValid}`)

      // Create a fresh hash and compare
      const freshHash = await hash.make(plainPassword)
      this.logger.info(`\nFresh hash created: ${freshHash.substring(0, 60)}...`)
      const freshHashValid = await hash.verify(freshHash, plainPassword)
      this.logger.info(`Fresh hash validates? ${freshHashValid}`)

      // Update user with correct hash
      this.logger.info('\nUpdating user with correct password hash...')
      user.password = plainPassword // This should trigger @beforeSave hook
      await user.save()
      this.logger.info('User saved!')

      // Reload user to check the hash
      await user.refresh()
      this.logger.info(`\nNew password hash: ${user.password.substring(0, 60)}...`)
      const newHashValid = await hash.verify(user.password, plainPassword)
      this.logger.info(`New hash validates? ${newHashValid}`)

      try {
        const verifiedUser = await User.verifyCredentials('yanick@crm.local', 'password123')
        this.logger.success(`✓ verifyCredentials SUCCESS: ${verifiedUser.email}`)
      } catch (error) {
        this.logger.error(`✗ verifyCredentials FAILED: ${error.message}`)
      }
    } catch (error) {
      this.logger.error(`Error: ${error.message}`)
      this.logger.error(`Stack: ${error.stack}`)
    }
  }
}