import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Organization from './organization.js'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ownerUserId: number

  @column()
  declare organizationId: number | null

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare notes: string | null

  @column({ columnName: 'address_line1' })
  declare addressLine1: string | null

  @column({ columnName: 'address_line2' })
  declare addressLine2: string | null

  @column()
  declare city: string | null

  @column({ columnName: 'province_state' })
  declare provinceState: string | null

  @column({ columnName: 'postal_code' })
  declare postalCode: string | null

  @column({ columnName: 'home_phone' })
  declare homePhone: string | null

  @column({ columnName: 'work_phone' })
  declare workPhone: string | null

  @column({ columnName: 'cell_phone' })
  declare cellPhone: string | null

  @column({ columnName: 'client_type' })
  declare clientType: string | null

  // Buyer profile fields
  @column({ columnName: 'is_pre_approved' })
  declare isPreApproved: boolean | null

  @column({ columnName: 'pre_approval_amount' })
  declare preApprovalAmount: number | null

  @column({ columnName: 'pre_approval_lender' })
  declare preApprovalLender: string | null

  @column({ columnName: 'financing_budget' })
  declare financingBudget: number | null

  // Seller profile fields
  @column({ columnName: 'motivation_level' })
  declare motivationLevel: string | null

  @column({ columnName: 'floor_price' })
  declare floorPrice: number | null

  @column({ columnName: 'target_close_date', serialize: (value: any) => value ? value : null })
  declare targetCloseDate: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'ownerUserId' })
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>
}
