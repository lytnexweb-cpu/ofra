import Client from '#models/client'

let clientCounter = 0

export async function createClient(
  ownerUserId: number,
  overrides: Partial<{
    firstName: string
    lastName: string
    email: string
  }> = {}
): Promise<Client> {
  clientCounter++
  return Client.create({
    ownerUserId,
    firstName: overrides.firstName ?? `John${clientCounter}`,
    lastName: overrides.lastName ?? `Doe${clientCounter}`,
    email: overrides.email ?? `client${clientCounter}@test.com`,
  })
}
