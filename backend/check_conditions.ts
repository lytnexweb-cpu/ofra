import Condition from '#models/condition'

async function main() {
  const conditions = await Condition.query().whereIn('transactionId', [1, 7])
  console.log('Conditions found:', conditions.length)
  for (const c of conditions) {
    console.log(`TX=${c.transactionId} ID=${c.id} level=${c.level} status=${c.status} step=${c.stepWhenCreated} archived=${c.archived}`)
  }
}

main().catch(console.error)
