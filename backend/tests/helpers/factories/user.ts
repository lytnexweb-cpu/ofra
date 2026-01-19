import User from '#models/user'

let userCounter = 0

export async function createUser(
  overrides: Partial<{
    email: string
    password: string
    fullName: string
  }> = {}
): Promise<User> {
  userCounter++
  return User.create({
    email: overrides.email ?? `testuser${userCounter}@test.com`,
    password: overrides.password ?? 'password123',
    fullName: overrides.fullName ?? `Test User ${userCounter}`,
  })
}
