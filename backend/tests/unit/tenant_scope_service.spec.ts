import { test } from '@japa/runner'
import { truncateAll, createUser } from '#tests/helpers/index'
import { TenantScopeService } from '#services/tenant_scope_service'
import Organization from '#models/organization'
import User from '#models/user'

test.group('TenantScopeService', (group) => {
  group.each.setup(async () => {
    await truncateAll()
  })

  test('canAccess returns true for owner of resource (solo agent)', async ({ assert }) => {
    const user = await createUser({ email: 'solo@test.com' })
    const resource = { ownerUserId: user.id, organizationId: null }

    assert.isTrue(TenantScopeService.canAccess(resource, user))
  })

  test('canAccess returns false for non-owner (solo agent)', async ({ assert }) => {
    const user = await createUser({ email: 'solo@test.com' })
    const otherUser = await createUser({ email: 'other@test.com' })
    const resource = { ownerUserId: otherUser.id, organizationId: null }

    assert.isFalse(TenantScopeService.canAccess(resource, user))
  })

  test('canAccess returns true for same organization member', async ({ assert }) => {
    const org = await Organization.create({ name: 'Test Org', provinceCode: 'NB' })
    const user = await createUser({ email: 'member@test.com' })
    user.organizationId = org.id
    await user.save()

    const resource = { ownerUserId: 999, organizationId: org.id }

    assert.isTrue(TenantScopeService.canAccess(resource, user))
  })

  test('canAccess returns false for different organization', async ({ assert }) => {
    const org1 = await Organization.create({ name: 'Org 1', provinceCode: 'NB' })
    const org2 = await Organization.create({ name: 'Org 2', provinceCode: 'NB' })
    const user = await createUser({ email: 'member@test.com' })
    user.organizationId = org1.id
    await user.save()

    const resource = { ownerUserId: 999, organizationId: org2.id }

    assert.isFalse(TenantScopeService.canAccess(resource, user))
  })

  test('getOrganizationId returns user organization id', async ({ assert }) => {
    const org = await Organization.create({ name: 'Test Org', provinceCode: 'NB' })
    const user = await createUser({ email: 'org@test.com' })
    user.organizationId = org.id
    await user.save()

    assert.equal(TenantScopeService.getOrganizationId(user), org.id)
  })

  test('getOrganizationId returns null for solo agent', async ({ assert }) => {
    const user = await createUser({ email: 'solo@test.com' })
    // Factory doesn't set organizationId by default
    const freshUser = await User.find(user.id)

    assert.isNull(TenantScopeService.getOrganizationId(freshUser!))
  })
})
