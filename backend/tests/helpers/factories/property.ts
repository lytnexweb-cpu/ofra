import Property from '#models/property'

let propertyCounter = 0

export async function createProperty(
  ownerUserId: number,
  overrides: Partial<{
    address: string
    city: string
    postalCode: string
    propertyType: string | null
    notes: string | null
  }> = {}
): Promise<Property> {
  propertyCounter++
  return Property.create({
    ownerUserId,
    address: overrides.address ?? `${100 + propertyCounter} Main St`,
    city: overrides.city ?? 'Moncton',
    postalCode: overrides.postalCode ?? 'E1C 1A1',
    propertyType: overrides.propertyType ?? 'residential',
    notes: overrides.notes ?? null,
  })
}
