import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Transaction from '#models/transaction'
import Client from '#models/client'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/**
 * Admin Dashboard Controller
 * Phase 1: Overview, Subscribers, Activity, System Health
 */
export default class AdminController {
  /**
   * GET /api/admin/overview
   * Dashboard overview with KPIs
   */
  async overview({ response }: HttpContext) {
    const now = DateTime.now()
    const thirtyDaysAgo = now.minus({ days: 30 })
    const sevenDaysAgo = now.minus({ days: 7 })

    // Total counts
    const totalUsers = await User.query().count('* as count').first()
    const totalTransactions = await Transaction.query().count('* as count').first()
    const totalClients = await Client.query().count('* as count').first()

    // New users this month
    const newUsersThisMonth = await User.query()
      .where('createdAt', '>=', thirtyDaysAgo.toSQL())
      .count('* as count')
      .first()

    // Active users (users with activity in last 7 days)
    const activeUsers = await User.query()
      .where('updatedAt', '>=', sevenDaysAgo.toSQL())
      .count('* as count')
      .first()

    // Users by role
    const usersByRole = await User.query()
      .select('role')
      .count('* as count')
      .groupBy('role')

    // Transactions by status (active vs completed)
    const transactionsByStatus = await Transaction.query()
      .select(
        db.raw("CASE WHEN sale_price IS NOT NULL THEN 'completed' ELSE 'active' END as status")
      )
      .count('* as count')
      .groupBy(db.raw("CASE WHEN sale_price IS NOT NULL THEN 'completed' ELSE 'active' END"))

    // Recent signups trend (last 30 days, grouped by day)
    const signupTrend = await User.query()
      .select(db.raw("DATE(created_at) as date"))
      .count('* as count')
      .where('createdAt', '>=', thirtyDaysAgo.toSQL())
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc')

    return response.ok({
      success: true,
      data: {
        kpis: {
          totalUsers: Number(totalUsers?.$extras.count || 0),
          totalTransactions: Number(totalTransactions?.$extras.count || 0),
          totalClients: Number(totalClients?.$extras.count || 0),
          newUsersThisMonth: Number(newUsersThisMonth?.$extras.count || 0),
          activeUsersThisWeek: Number(activeUsers?.$extras.count || 0),
        },
        usersByRole: usersByRole.map((r) => ({
          role: r.role,
          count: Number(r.$extras.count),
        })),
        transactionsByStatus: transactionsByStatus.map((t) => ({
          status: t.$extras.status,
          count: Number(t.$extras.count),
        })),
        signupTrend: signupTrend.map((s) => ({
          date: s.$extras.date,
          count: Number(s.$extras.count),
        })),
      },
    })
  }

  /**
   * GET /api/admin/subscribers
   * List all users with pagination and filtering
   */
  async subscribers({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search', '')
    const role = request.input('role', '')
    const sortBy = request.input('sortBy', 'createdAt')
    const sortOrder = request.input('sortOrder', 'desc')

    let query = User.query()
      .select([
        'id',
        'email',
        'fullName',
        'role',
        'agency',
        'createdAt',
        'onboardingCompleted',
        'practiceType',
        'annualVolume',
      ])

    // Search filter
    if (search) {
      query = query.where((q) => {
        q.whereILike('email', `%${search}%`)
          .orWhereILike('fullName', `%${search}%`)
          .orWhereILike('agency', `%${search}%`)
      })
    }

    // Role filter
    if (role) {
      query = query.where('role', role)
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'email', 'fullName', 'role']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const order = sortOrder === 'asc' ? 'asc' : 'desc'
    query = query.orderBy(sortField, order)

    const users = await query.paginate(page, limit)

    // Get transaction and client counts for each user
    const userIds = users.all().map((u) => u.id)

    const transactionCounts = await Transaction.query()
      .select('ownerUserId')
      .count('* as count')
      .whereIn('ownerUserId', userIds)
      .groupBy('ownerUserId')

    const clientCounts = await Client.query()
      .select('ownerUserId')
      .count('* as count')
      .whereIn('ownerUserId', userIds)
      .groupBy('ownerUserId')

    const txCountMap = new Map(transactionCounts.map((t) => [t.ownerUserId, Number(t.$extras.count)]))
    const clientCountMap = new Map(clientCounts.map((c) => [c.ownerUserId, Number(c.$extras.count)]))

    return response.ok({
      success: true,
      data: {
        users: users.all().map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          agency: u.agency,
          createdAt: u.createdAt,
          onboardingCompleted: u.onboardingCompleted,
          practiceType: u.practiceType,
          annualVolume: u.annualVolume,
          transactionCount: txCountMap.get(u.id) || 0,
          clientCount: clientCountMap.get(u.id) || 0,
        })),
        meta: {
          total: users.total,
          perPage: users.perPage,
          currentPage: users.currentPage,
          lastPage: users.lastPage,
        },
      },
    })
  }

  /**
   * PATCH /api/admin/subscribers/:id/role
   * Update user role (superadmin only)
   */
  async updateRole({ params, request, response, auth }: HttpContext) {
    const targetUserId = params.id
    const newRole = request.input('role')

    // Validate role
    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      return response.badRequest({
        success: false,
        error: { message: 'Invalid role', code: 'E_INVALID_ROLE' },
      })
    }

    // Prevent self-demotion from superadmin
    if (auth.user!.id === Number(targetUserId) && newRole !== 'superadmin') {
      return response.badRequest({
        success: false,
        error: { message: 'Cannot demote yourself', code: 'E_SELF_DEMOTION' },
      })
    }

    const user = await User.find(targetUserId)
    if (!user) {
      return response.notFound({
        success: false,
        error: { message: 'User not found', code: 'E_NOT_FOUND' },
      })
    }

    user.role = newRole
    await user.save()

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    })
  }

  /**
   * GET /api/admin/activity
   * Recent system activity feed
   */
  async activity({ request, response }: HttpContext) {
    const limit = Math.min(request.input('limit', 50), 100)

    // Get recent user registrations
    const recentUsers = await User.query()
      .select(['id', 'email', 'fullName', 'createdAt'])
      .orderBy('createdAt', 'desc')
      .limit(20)

    // Get recent transactions
    const recentTransactions = await Transaction.query()
      .preload('client', (q) => q.select(['id', 'firstName', 'lastName']))
      .preload('owner', (q) => q.select(['id', 'email', 'fullName']))
      .orderBy('createdAt', 'desc')
      .limit(20)

    // Combine and sort activities
    const activities: Array<{
      type: string
      timestamp: string
      data: Record<string, unknown>
    }> = []

    for (const user of recentUsers) {
      activities.push({
        type: 'user_registered',
        timestamp: user.createdAt.toISO()!,
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      })
    }

    for (const tx of recentTransactions) {
      activities.push({
        type: 'transaction_created',
        timestamp: tx.createdAt.toISO()!,
        data: {
          transactionId: tx.id,
          type: tx.type,
          clientName: tx.client ? `${tx.client.firstName} ${tx.client.lastName}` : null,
          ownerEmail: tx.owner?.email,
        },
      })
    }

    // Sort by timestamp descending and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limitedActivities = activities.slice(0, limit)

    return response.ok({
      success: true,
      data: { activities: limitedActivities },
    })
  }

  /**
   * GET /api/admin/system
   * System health and status
   */
  async system({ response }: HttpContext) {
    const now = DateTime.now()

    // Database check - simple query
    let dbStatus = 'healthy'
    try {
      await db.rawQuery('SELECT 1')
    } catch {
      dbStatus = 'error'
    }

    // Get some stats
    const userCount = await User.query().count('* as count').first()
    const transactionCount = await Transaction.query().count('* as count').first()

    // Memory usage (Node.js)
    const memUsage = process.memoryUsage()

    return response.ok({
      success: true,
      data: {
        status: dbStatus === 'healthy' ? 'operational' : 'degraded',
        timestamp: now.toISO(),
        checks: {
          database: dbStatus,
        },
        stats: {
          totalUsers: Number(userCount?.$extras.count || 0),
          totalTransactions: Number(transactionCount?.$extras.count || 0),
        },
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          memoryTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          uptimeSeconds: Math.round(process.uptime()),
        },
      },
    })
  }
}
