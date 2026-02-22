import Client from '#models/client'
import logger from '@adonisjs/core/services/logger'

export interface FubContact {
  id: number
  firstName: string | null
  lastName: string | null
  emails: Array<{ value: string; type?: string }> | null
  phones: Array<{ value: string; type?: string }> | null
  addresses: Array<{
    street?: string
    city?: string
    state?: string
    code?: string
  }> | null
}

export interface FubImportResult {
  imported: number
  skipped: number
  errors: Array<{ contactId: number; message: string }>
}

export class FollowUpBossService {
  /**
   * Validate API key and fetch contacts from FollowUpBoss
   */
  static async validateAndFetchContacts(apiKey: string): Promise<FubContact[]> {
    const allContacts: FubContact[] = []
    let nextOffset = 0
    const limit = 100

    // Paginate through all contacts (cursor-based via offset)
    while (true) {
      const url = `https://api.followupboss.com/v1/people?limit=${limit}&offset=${nextOffset}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key')
        }
        throw new Error(`FollowUpBoss API error: ${response.status}`)
      }

      const data = await response.json() as {
        people: FubContact[]
        _metadata?: { total?: number }
      }

      if (!data.people || data.people.length === 0) break

      allContacts.push(...data.people)

      // Stop if we got fewer than limit (no more pages)
      if (data.people.length < limit) break
      nextOffset += limit

      // Safety cap at 5000 contacts for onboarding
      if (allContacts.length >= 5000) break
    }

    return allContacts
  }

  /**
   * Import FUB contacts as Client records in DB
   */
  static async importContacts(
    contacts: FubContact[],
    ownerUserId: number,
    organizationId: number | null,
    selectedIds?: number[]
  ): Promise<FubImportResult> {
    const result: FubImportResult = { imported: 0, skipped: 0, errors: [] }

    const toImport = selectedIds
      ? contacts.filter((c) => selectedIds.includes(c.id))
      : contacts

    for (const contact of toImport) {
      try {
        const firstName = (contact.firstName || '').trim()
        const lastName = (contact.lastName || '').trim()

        if (!firstName && !lastName) {
          result.skipped++
          continue
        }

        const email = contact.emails?.[0]?.value?.trim() || null
        const phone = contact.phones?.[0]?.value?.trim() || null
        const addr = contact.addresses?.[0]

        // Dedup by email (same pattern as csv_import_service)
        if (email) {
          const existing = await Client.query()
            .where('owner_user_id', ownerUserId)
            .where('first_name', firstName || '')
            .where('last_name', lastName || '')
            .where('email', email)
            .first()

          if (existing) {
            result.skipped++
            continue
          }
        }

        await Client.create({
          ownerUserId,
          organizationId,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'Unknown',
          email,
          phone,
          addressLine1: addr?.street || null,
          city: addr?.city || null,
          provinceState: addr?.state || null,
          postalCode: addr?.code || null,
        })

        result.imported++
      } catch (err) {
        logger.error({ err, contactId: contact.id }, 'Failed to import FUB contact')
        result.errors.push({ contactId: contact.id, message: String(err) })
        result.skipped++
      }
    }

    logger.info(
      { imported: result.imported, skipped: result.skipped, errors: result.errors.length },
      'FollowUpBoss import completed'
    )

    return result
  }
}
