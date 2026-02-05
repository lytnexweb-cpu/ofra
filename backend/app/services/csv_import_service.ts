import { parse } from 'csv-parse/sync'
import Client from '#models/client'
import logger from '@adonisjs/core/services/logger'

export interface CsvImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{
    row: number
    message: string
    data?: Record<string, string>
  }>
}

export interface ClientCsvRow {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  notes?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  provinceState?: string
  postalCode?: string
  homePhone?: string
  workPhone?: string
  cellPhone?: string
}

// Map of possible CSV column headers to our field names
const COLUMN_MAPPING: Record<string, keyof ClientCsvRow> = {
  // firstName variations
  firstname: 'firstName',
  first_name: 'firstName',
  'first name': 'firstName',
  prenom: 'firstName',
  prénom: 'firstName',

  // lastName variations
  lastname: 'lastName',
  last_name: 'lastName',
  'last name': 'lastName',
  nom: 'lastName',
  'nom de famille': 'lastName',

  // email variations
  email: 'email',
  courriel: 'email',
  'e-mail': 'email',

  // phone variations
  phone: 'phone',
  telephone: 'phone',
  téléphone: 'phone',
  tel: 'phone',

  // notes
  notes: 'notes',
  note: 'notes',
  commentaires: 'notes',
  comments: 'notes',

  // address
  addressline1: 'addressLine1',
  address_line1: 'addressLine1',
  address: 'addressLine1',
  adresse: 'addressLine1',
  'address line 1': 'addressLine1',

  addressline2: 'addressLine2',
  address_line2: 'addressLine2',
  'address line 2': 'addressLine2',
  apt: 'addressLine2',
  apartment: 'addressLine2',
  suite: 'addressLine2',

  // city
  city: 'city',
  ville: 'city',

  // province/state
  provincestate: 'provinceState',
  province_state: 'provinceState',
  province: 'provinceState',
  state: 'provinceState',

  // postal code
  postalcode: 'postalCode',
  postal_code: 'postalCode',
  'postal code': 'postalCode',
  zip: 'postalCode',
  zipcode: 'postalCode',
  'code postal': 'postalCode',

  // phone variations
  homephone: 'homePhone',
  home_phone: 'homePhone',
  'home phone': 'homePhone',
  'tel maison': 'homePhone',

  workphone: 'workPhone',
  work_phone: 'workPhone',
  'work phone': 'workPhone',
  'tel travail': 'workPhone',

  cellphone: 'cellPhone',
  cell_phone: 'cellPhone',
  'cell phone': 'cellPhone',
  mobile: 'cellPhone',
  'tel cellulaire': 'cellPhone',
  cellulaire: 'cellPhone',
}

export class CsvImportService {
  /**
   * Import clients from CSV content
   */
  static async importClients(
    csvContent: string,
    ownerUserId: number,
    organizationId: number | null
  ): Promise<CsvImportResult> {
    const result: CsvImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
    }

    try {
      // Parse CSV with flexible options
      const records = parse(csvContent, {
        columns: true, // First row is headers
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        bom: true, // Handle BOM character from Excel
      }) as Record<string, string>[]

      if (records.length === 0) {
        result.success = false
        result.errors.push({ row: 0, message: 'CSV file is empty or has no data rows' })
        return result
      }

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const rowNumber = i + 2 // +2 because row 1 is header, and we're 0-indexed
        const rawRow = records[i]

        try {
          const mappedRow = this.mapColumns(rawRow)

          // Validate required fields with explicit error messages
          if (!mappedRow.firstName && !mappedRow.lastName) {
            result.errors.push({
              row: rowNumber,
              message: 'Missing firstName and lastName',
              data: rawRow,
            })
            result.skipped++
            continue
          }
          if (!mappedRow.firstName) {
            const name = mappedRow.lastName || 'Unknown'
            result.errors.push({
              row: rowNumber,
              message: `Missing firstName for ${name}`,
              data: rawRow,
            })
            result.skipped++
            continue
          }
          if (!mappedRow.lastName) {
            result.errors.push({
              row: rowNumber,
              message: `Missing lastName for ${mappedRow.firstName}`,
              data: rawRow,
            })
            result.skipped++
            continue
          }

          // Check for duplicate (same name + email)
          if (mappedRow.email) {
            const existing = await Client.query()
              .where('owner_user_id', ownerUserId)
              .where('first_name', mappedRow.firstName)
              .where('last_name', mappedRow.lastName)
              .where('email', mappedRow.email)
              .first()

            if (existing) {
              result.errors.push({
                row: rowNumber,
                message: `Client already exists: ${mappedRow.firstName} ${mappedRow.lastName} (${mappedRow.email})`,
              })
              result.skipped++
              continue
            }
          }

          // Create client
          await Client.create({
            ownerUserId,
            organizationId,
            firstName: mappedRow.firstName,
            lastName: mappedRow.lastName,
            email: mappedRow.email || null,
            phone: mappedRow.phone || null,
            notes: mappedRow.notes || null,
            addressLine1: mappedRow.addressLine1 || null,
            addressLine2: mappedRow.addressLine2 || null,
            city: mappedRow.city || null,
            provinceState: mappedRow.provinceState || null,
            postalCode: mappedRow.postalCode || null,
            homePhone: mappedRow.homePhone || null,
            workPhone: mappedRow.workPhone || null,
            cellPhone: mappedRow.cellPhone || null,
          })

          result.imported++
        } catch (err) {
          logger.error({ err, row: rowNumber }, 'Failed to import client row')
          result.errors.push({
            row: rowNumber,
            message: `Error: ${String(err)}`,
            data: rawRow,
          })
          result.skipped++
        }
      }

      result.success = result.errors.length === 0 || result.imported > 0

      logger.info(
        { imported: result.imported, skipped: result.skipped, errors: result.errors.length },
        'CSV import completed'
      )

      return result
    } catch (err) {
      logger.error({ err }, 'CSV parsing failed')
      result.success = false
      result.errors.push({ row: 0, message: `CSV parsing error: ${String(err)}` })
      return result
    }
  }

  /**
   * Map CSV columns to our field names using flexible matching
   */
  private static mapColumns(row: Record<string, string>): ClientCsvRow {
    const mapped: ClientCsvRow = {
      firstName: '',
      lastName: '',
    }

    for (const [csvColumn, value] of Object.entries(row)) {
      const normalizedColumn = csvColumn.toLowerCase().trim()
      const fieldName = COLUMN_MAPPING[normalizedColumn]

      if (fieldName && value) {
        mapped[fieldName] = value.trim()
      }
    }

    return mapped
  }

  /**
   * Generate a sample CSV template
   */
  static generateTemplate(): string {
    const headers = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'provinceState',
      'postalCode',
      'notes',
    ]

    const sampleRow = [
      'Jean',
      'Dupont',
      'jean.dupont@example.com',
      '506-555-1234',
      '123 Rue Principale',
      'Apt 4B',
      'Moncton',
      'NB',
      'E1C 1A1',
      'Client référé par Marie',
    ]

    return headers.join(',') + '\n' + sampleRow.join(',')
  }
}
