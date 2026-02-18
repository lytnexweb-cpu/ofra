import User from '#models/user'
import type { PracticeType, PropertyContext, AnnualVolume, UserRole } from '#models/user'

let userCounter = 0

export async function createUser(
  overrides: Partial<{
    email: string
    password: string
    fullName: string
    language: string
    dateFormat: string
    timezone: string
    preferredLanguage: string
    onboardingCompleted: boolean
    onboardingSkipped: boolean
    practiceType: PracticeType
    propertyContexts: PropertyContext[]
    annualVolume: AnnualVolume
    preferAutoConditions: boolean
    emailVerified: boolean
    role: UserRole
  }> = {}
): Promise<User> {
  userCounter++
  return User.create({
    email: overrides.email ?? `testuser${userCounter}@test.com`,
    password: overrides.password ?? 'password123',
    fullName: overrides.fullName ?? `Test User ${userCounter}`,
    language: overrides.language ?? 'en',
    dateFormat: overrides.dateFormat ?? 'YYYY-MM-DD',
    timezone: overrides.timezone ?? 'America/Moncton',
    preferredLanguage: overrides.preferredLanguage ?? 'en',
    onboardingCompleted: overrides.onboardingCompleted ?? false,
    onboardingSkipped: overrides.onboardingSkipped ?? false,
    practiceType: overrides.practiceType ?? null,
    propertyContexts: overrides.propertyContexts ?? [],
    annualVolume: overrides.annualVolume ?? null,
    preferAutoConditions: overrides.preferAutoConditions ?? true,
    emailVerified: overrides.emailVerified ?? true,
    role: overrides.role ?? 'user',
  })
}
