import { BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'

export default class TempUpgrade extends BaseCommand {
  static commandName = 'temp:upgrade'
  static description = 'Upgrade user to superadmin'

  async run() {
    const user = await User.findBy('email', 'samir.ouridjel@pm.me')
    if (user) {
      user.role = 'superadmin'
      await user.save()
      this.logger.success(`Upgraded ${user.email} to superadmin!`)
    } else {
      this.logger.error('User not found')
    }
  }
}
