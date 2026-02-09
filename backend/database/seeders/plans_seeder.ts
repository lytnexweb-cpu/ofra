import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Plan from '#models/plan'

export default class PlansSeeder extends BaseSeeder {
  async run() {
    // Upsert to avoid duplicates on re-run
    await Plan.updateOrCreateMany('slug', [
      {
        name: 'Starter',
        slug: 'starter',
        monthlyPrice: 29,
        annualPrice: 290,
        maxTransactions: 5,
        maxStorageGb: 1,
        historyMonths: 6,
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Solo',
        slug: 'solo',
        monthlyPrice: 49,
        annualPrice: 490,
        maxTransactions: 12,
        maxStorageGb: 3,
        historyMonths: 12,
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Pro',
        slug: 'pro',
        monthlyPrice: 79,
        annualPrice: 790,
        maxTransactions: 25,
        maxStorageGb: 10,
        historyMonths: null, // Unlimited
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Agence',
        slug: 'agence',
        monthlyPrice: 149,
        annualPrice: 1490,
        maxTransactions: null, // Unlimited
        maxStorageGb: 25,
        historyMonths: null, // Unlimited
        isActive: true,
        displayOrder: 4,
      },
    ])
  }
}
