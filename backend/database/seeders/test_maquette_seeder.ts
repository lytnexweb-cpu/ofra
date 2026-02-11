import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Seed a complete test transaction matching Maquette 01
 * Run: node ace db:seed --files=database/seeders/test_maquette_seeder.ts
 */
export default class TestMaquetteSeeder extends BaseSeeder {
  async run() {
    const now = DateTime.now().toSQL()

    // 1. Find existing user
    const user = await db.from('users').select('id').first()
    if (!user) {
      console.log('ERROR: No user found. Run user_seeder first.')
      return
    }
    const userId = user.id
    console.log(`Using user ID: ${userId}`)

    // Clean up any previous test data
    const existingClient = await db.from('clients')
      .where('first_name', 'Marie-Claire')
      .where('last_name', 'Dupont')
      .select('id')
      .first()
    if (existingClient) {
      // Delete transactions linked to this client (cascades to steps, conditions, offers, etc.)
      await db.from('transactions').where('client_id', existingClient.id).delete()
      await db.from('clients').where('id', existingClient.id).delete()
      console.log('Cleaned up previous test data')
    }

    // 2. Create client — Marie-Claire Dupont
    const [clientId] = await db.table('clients').insert({
      owner_user_id: userId,
      first_name: 'Marie-Claire',
      last_name: 'Dupont',
      email: 'mc.dupont@email.com',
      phone: '506-555-1234',
      cell_phone: '506-555-1234',
      city: 'Moncton',
      province_state: 'NB',
      postal_code: 'E1C 1A1',
      created_at: now,
      updated_at: now,
    }).returning('id')
    const cId = typeof clientId === 'object' ? clientId.id : clientId
    console.log(`Client created: ID ${cId}`)

    // 3. Create property
    const [propertyId] = await db.table('properties').insert({
      owner_user_id: userId,
      address: '123 rue Principale',
      city: 'Moncton',
      postal_code: 'E1C 2B3',
      property_type: 'house',
      created_at: now,
      updated_at: now,
    }).returning('id')
    const pId = typeof propertyId === 'object' ? propertyId.id : propertyId
    console.log(`Property created: ID ${pId}`)

    // 4. Find NB Purchase workflow template
    const template = await db.from('workflow_templates')
      .where('slug', 'nb-purchase')
      .select('id')
      .first()
    if (!template) {
      console.log('ERROR: NB Purchase template not found. Run nb_workflow_template_seeder first.')
      return
    }
    const templateId = template.id

    // Get workflow steps for this template
    const workflowSteps = await db.from('workflow_steps')
      .where('template_id', templateId)
      .orderBy('step_order', 'asc')
      .select('id', 'step_order', 'name', 'slug')
    console.log(`Found ${workflowSteps.length} workflow steps`)

    // 5. Create transaction (without currentStepId for now)
    const closingDate = DateTime.fromISO('2026-03-15').toSQLDate()
    const [transactionId] = await db.table('transactions').insert({
      owner_user_id: userId,
      status: 'active',
      client_id: cId,
      property_id: pId,
      type: 'purchase',
      workflow_template_id: templateId,
      current_step_id: null, // set after creating steps
      sale_price: 350000,
      closing_date: closingDate,
      language: 'fr',
      created_at: now,
      updated_at: now,
    }).returning('id')
    const txId = typeof transactionId === 'object' ? transactionId.id : transactionId
    console.log(`Transaction created: ID ${txId}`)

    // 6. Create transaction steps
    const stepStatuses = ['completed', 'completed', 'completed', 'active', 'pending', 'pending', 'pending', 'pending']
    const stepDates = [
      { entered: '2026-01-28', completed: '2026-01-28' }, // Step 1
      { entered: '2026-01-28', completed: '2026-02-02' }, // Step 2
      { entered: '2026-02-02', completed: '2026-02-05' }, // Step 3
      { entered: '2026-02-05', completed: null },          // Step 4 (active)
      { entered: null, completed: null },                  // Step 5-8
      { entered: null, completed: null },
      { entered: null, completed: null },
      { entered: null, completed: null },
    ]

    const txStepIds: number[] = []
    for (let i = 0; i < workflowSteps.length; i++) {
      const ws = workflowSteps[i]
      const status = stepStatuses[i] || 'pending'
      const dates = stepDates[i] || { entered: null, completed: null }

      const [stepId] = await db.table('transaction_steps').insert({
        transaction_id: txId,
        workflow_step_id: ws.id,
        step_order: ws.step_order,
        status,
        entered_at: dates.entered ? DateTime.fromISO(dates.entered).toSQL() : null,
        completed_at: dates.completed ? DateTime.fromISO(dates.completed).toSQL() : null,
        created_at: now,
        updated_at: now,
      }).returning('id')
      const sId = typeof stepId === 'object' ? stepId.id : stepId
      txStepIds.push(sId)
    }
    console.log(`Created ${txStepIds.length} transaction steps`)

    // 7. Set currentStepId to step 4 (index 3)
    const currentStepId = txStepIds[3]
    await db.from('transactions').where('id', txId).update({ current_step_id: currentStepId })
    console.log(`Set current step to ID ${currentStepId} (step 4)`)

    // 8. Create transaction profile
    await db.table('transaction_profiles').insert({
      transaction_id: txId,
      property_type: 'house',
      property_context: 'urban',
      is_financed: true,
      has_well: false,
      has_septic: false,
      condo_docs_required: false,
      appraisal_required: true,
      created_at: now,
      updated_at: now,
    })
    console.log('Transaction profile created')

    // 9. Create conditions on step 4 (current step)
    // Blocking: Financement approuvé (overdue -2j) + Inspection en bâtiment (3j)
    // Required: Certificat de localisation (11j)
    // Recommended: Test de radon (completed)

    const today = DateTime.now()

    // Blocking 1: Financement — overdue by 2 days
    await db.table('conditions').insert({
      transaction_id: txId,
      transaction_step_id: currentStepId,
      title: 'Financement approuvé',
      label_fr: 'Financement approuvé',
      label_en: 'Financing approved',
      status: 'pending',
      type: 'financing',
      priority: 'high',
      is_blocking: true,
      level: 'blocking',
      source_type: 'legal',
      due_date: today.minus({ days: 2 }).toSQLDate(),
      created_at: now,
      updated_at: now,
    })

    // Blocking 2: Inspection — in 3 days
    await db.table('conditions').insert({
      transaction_id: txId,
      transaction_step_id: currentStepId,
      title: 'Inspection en bâtiment',
      label_fr: 'Inspection en bâtiment',
      label_en: 'Building inspection',
      status: 'pending',
      type: 'inspection',
      priority: 'high',
      is_blocking: true,
      level: 'blocking',
      source_type: 'industry',
      due_date: today.plus({ days: 3 }).toSQLDate(),
      created_at: now,
      updated_at: now,
    })

    // Required: Certificat de localisation — in 11 days
    await db.table('conditions').insert({
      transaction_id: txId,
      transaction_step_id: currentStepId,
      title: 'Certificat de localisation',
      label_fr: 'Certificat de localisation',
      label_en: 'Location certificate',
      status: 'pending',
      type: 'documents',
      priority: 'medium',
      is_blocking: false,
      level: 'required',
      source_type: 'industry',
      due_date: today.plus({ days: 11 }).toSQLDate(),
      created_at: now,
      updated_at: now,
    })

    // Recommended: Test de radon — completed
    await db.table('conditions').insert({
      transaction_id: txId,
      transaction_step_id: currentStepId,
      title: 'Test de radon',
      label_fr: 'Test de radon',
      label_en: 'Radon test',
      status: 'completed',
      type: 'inspection',
      priority: 'low',
      is_blocking: false,
      level: 'recommended',
      source_type: 'best_practice',
      due_date: null,
      completed_at: today.minus({ days: 1 }).toSQL(),
      created_at: now,
      updated_at: now,
    })
    console.log('Created 4 conditions on step 4')

    // 10. Create 3 offers

    // Offer 1: Received — $345,000
    const [offer1Id] = await db.table('offers').insert({
      transaction_id: txId,
      status: 'received',
      created_at: DateTime.fromISO('2026-02-08').toSQL(),
      updated_at: now,
    }).returning('id')
    const o1Id = typeof offer1Id === 'object' ? offer1Id.id : offer1Id

    await db.table('offer_revisions').insert({
      offer_id: o1Id,
      revision_number: 1,
      price: 345000,
      deposit: 10000,
      financing_amount: 280000,
      direction: 'buyer_to_seller',
      notes: 'Offre conditionnelle à l\'inspection',
      created_at: DateTime.fromISO('2026-02-08').toSQL(),
    })

    // Offer 2: Accepted — $340,000
    const [offer2Id] = await db.table('offers').insert({
      transaction_id: txId,
      status: 'accepted',
      accepted_at: DateTime.fromISO('2026-02-05').toSQL(),
      created_at: DateTime.fromISO('2026-02-05').toSQL(),
      updated_at: now,
    }).returning('id')
    const o2Id = typeof offer2Id === 'object' ? offer2Id.id : offer2Id

    await db.table('offer_revisions').insert({
      offer_id: o2Id,
      revision_number: 1,
      price: 340000,
      deposit: 10000,
      financing_amount: 270000,
      direction: 'buyer_to_seller',
      created_at: DateTime.fromISO('2026-02-05').toSQL(),
    })

    // Offer 3: Rejected — $330,000
    const [offer3Id] = await db.table('offers').insert({
      transaction_id: txId,
      status: 'rejected',
      created_at: DateTime.fromISO('2026-02-03').toSQL(),
      updated_at: now,
    }).returning('id')
    const o3Id = typeof offer3Id === 'object' ? offer3Id.id : offer3Id

    await db.table('offer_revisions').insert({
      offer_id: o3Id,
      revision_number: 1,
      price: 330000,
      deposit: 8000,
      financing_amount: 260000,
      direction: 'buyer_to_seller',
      created_at: DateTime.fromISO('2026-02-03').toSQL(),
    })
    console.log(`Created 3 offers: received(${o1Id}), accepted(${o2Id}), rejected(${o3Id})`)

    console.log('\n✅ Test transaction Maquette 01 created successfully!')
    console.log(`   Transaction ID: ${txId}`)
    console.log(`   URL: /transactions/${txId}`)
  }
}
