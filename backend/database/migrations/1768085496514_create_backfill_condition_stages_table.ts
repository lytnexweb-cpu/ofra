import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    // Backfill intelligent des stages basé sur le type de condition
    // Cette migration corrige le problème où toutes les conditions ont stage='conditions' par défaut

    // Financement → stage "offer" (négocié dès l'offre)
    await this.db.rawQuery(`
      UPDATE conditions
      SET stage = 'offer'
      WHERE type = 'financing' AND stage = 'conditions'
    `)

    // Dépôt → stage "accepted" (se fait après acceptation)
    await this.db.rawQuery(`
      UPDATE conditions
      SET stage = 'accepted'
      WHERE type = 'deposit' AND stage = 'conditions'
    `)

    // Inspection, water_test, rpds_review, appraisal → stage "accepted"
    await this.db.rawQuery(`
      UPDATE conditions
      SET stage = 'accepted'
      WHERE type IN ('inspection', 'water_test', 'rpds_review', 'appraisal')
      AND stage = 'conditions'
    `)

    // Légal et documents → stage "notary" (révision avec notaire)
    await this.db.rawQuery(`
      UPDATE conditions
      SET stage = 'notary'
      WHERE type IN ('legal', 'documents')
      AND stage = 'conditions'
    `)

    // Réparations et autres → restent à stage "conditions" (période conditionnelle)
    // Pas de changement nécessaire pour type IN ('repairs', 'other')
  }

  async down() {
    // Rollback: remettre toutes les conditions modifiées à 'conditions'
    await this.db.rawQuery(`
      UPDATE conditions
      SET stage = 'conditions'
      WHERE type IN (
        'financing', 'deposit', 'inspection', 'water_test',
        'rpds_review', 'appraisal', 'legal', 'documents'
      )
    `)
  }
}
