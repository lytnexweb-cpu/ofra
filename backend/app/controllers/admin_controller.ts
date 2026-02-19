import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AdminNote from '#models/admin_note'
import AdminTask from '#models/admin_task'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { AdminMetricsService } from '#services/admin_metrics_service'

/**
 * Admin Dashboard Controller
 * Phase 1: Overview, Subscribers, Activity, System Health
 * CRM Features: Notes, Tasks, Engagement Scores
 */
export default class AdminController {
  /**
   * GET /api/admin/overview
   * Dashboard overview with KPIs and charts data
   */
  async overview({ response }: HttpContext) {
    const [kpiData, signupsByWeek, transactionsByWeek] = await Promise.all([
      AdminMetricsService.getKpiSummary(),
      AdminMetricsService.getSignupsByWeek(),
      AdminMetricsService.getTransactionsByWeek(),
    ])

    return response.ok({
      success: true,
      data: {
        ...kpiData,
        charts: {
          signupsByWeek,
          transactionsByWeek,
        },
      },
    })
  }

  /**
   * GET /api/admin/subscribers
   * List all users with pagination, filtering, and engagement scores
   */
  async subscribers({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search', '')
    const role = request.input('role', '')
    const subscription = request.input('subscription', '') // trial, active, past_due, cancelled, expired
    const engagement = request.input('engagement', '') // active, warm, inactive
    const founder = request.input('founder', '')
    const sortBy = request.input('sortBy', 'createdAt')
    const sortOrder = request.input('sortOrder', 'desc')

    let query = User.query()
      .select([
        'id',
        'email',
        'fullName',
        'role',
        'agency',
        'isFounder',
        'createdAt',
        'updatedAt',
        'onboardingCompleted',
        'practiceType',
        'annualVolume',
        'subscriptionStatus',
        'subscriptionStartedAt',
        'subscriptionEndsAt',
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

    // Subscription filter
    if (subscription) {
      query = query.where('subscriptionStatus', subscription)
    }

    // Founder filter (§11.K C1 fix)
    if (founder === 'true') {
      query = query.where('isFounder', true)
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'email', 'fullName', 'role', 'updatedAt']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const order = sortOrder === 'asc' ? 'asc' : 'desc'
    query = query.orderBy(sortField, order)

    const users = await query.paginate(page, limit)
    const userIds = users.all().map((u) => u.id)

    // Get engagement scores
    const engagementScores = await AdminMetricsService.getEngagementScores(userIds)

    // Get notes and tasks counts
    const [noteCounts, taskCounts] = await Promise.all([
      AdminNote.query()
        .select('userId')
        .count('* as count')
        .whereIn('userId', userIds)
        .groupBy('userId'),
      AdminTask.query()
        .select('userId')
        .count('* as count')
        .whereIn('userId', userIds)
        .where('completed', false)
        .groupBy('userId'),
    ])

    const noteCountMap = new Map(noteCounts.map((n) => [n.userId, Number(n.$extras.count)]))
    const taskCountMap = new Map(taskCounts.map((t) => [t.userId, Number(t.$extras.count)]))

    // Filter by engagement if specified
    let filteredUsers = users.all()
    if (engagement) {
      filteredUsers = filteredUsers.filter((u) => {
        const score = engagementScores.get(u.id)
        return score?.level === engagement
      })
    }

    return response.ok({
      success: true,
      data: {
        users: filteredUsers.map((u) => {
          const score = engagementScores.get(u.id)
          return {
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            agency: u.agency,
            isFounder: u.isFounder ?? false,
            createdAt: u.createdAt,
            lastActivity: u.updatedAt,
            onboardingCompleted: u.onboardingCompleted,
            practiceType: u.practiceType,
            annualVolume: u.annualVolume,
            subscriptionStatus: u.subscriptionStatus || 'trial',
            subscriptionStartedAt: u.subscriptionStartedAt,
            subscriptionEndsAt: u.subscriptionEndsAt,
            engagement: {
              level: score?.level || 'inactive',
              transactionCount: score?.transactionCount || 0,
              completedConditions: score?.completedConditions || 0,
              daysSinceLastLogin: score?.daysSinceLastLogin,
            },
            noteCount: noteCountMap.get(u.id) || 0,
            pendingTaskCount: taskCountMap.get(u.id) || 0,
          }
        }),
        meta: {
          total: engagement ? filteredUsers.length : users.total,
          perPage: users.perPage,
          currentPage: users.currentPage,
          lastPage: engagement ? Math.ceil(filteredUsers.length / limit) : users.lastPage,
        },
      },
    })
  }

  /**
   * GET /api/admin/subscribers/export
   * Export all subscribers as CSV
   */
  async exportSubscribers({ response }: HttpContext) {
    const users = await User.query()
      .select([
        'id',
        'email',
        'fullName',
        'role',
        'agency',
        'phone',
        'createdAt',
        'updatedAt',
        'onboardingCompleted',
        'practiceType',
        'annualVolume',
      ])
      .orderBy('createdAt', 'desc')

    const userIds = users.map((u) => u.id)
    const engagementScores = await AdminMetricsService.getEngagementScores(userIds)

    // Build CSV
    const headers = [
      'ID',
      'Email',
      'Full Name',
      'Role',
      'Agency',
      'Phone',
      'Created At',
      'Last Activity',
      'Onboarding Completed',
      'Practice Type',
      'Annual Volume',
      'Engagement Level',
      'Transaction Count',
      'Completed Conditions',
    ]

    const rows = users.map((u) => {
      const score = engagementScores.get(u.id)
      return [
        u.id,
        u.email,
        u.fullName || '',
        u.role,
        u.agency || '',
        u.phone || '',
        u.createdAt.toISO(),
        u.updatedAt?.toISO() || '',
        u.onboardingCompleted ? 'Yes' : 'No',
        u.practiceType || '',
        u.annualVolume || '',
        score?.level || 'inactive',
        score?.transactionCount || 0,
        score?.completedConditions || 0,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',')
      ),
    ].join('\n')

    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', 'attachment; filename="ofra-subscribers.csv"')
    return response.send(csvContent)
  }

  /**
   * GET /api/admin/subscribers/:id/notes
   * Get notes for a user
   */
  async getNotes({ params, response }: HttpContext) {
    const notes = await AdminNote.query()
      .where('user_id', params.id)
      .preload('author', (q) => q.select(['id', 'email', 'fullName']))
      .orderBy('createdAt', 'desc')

    return response.ok({
      success: true,
      data: {
        notes: notes.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          author: {
            id: n.author.id,
            email: n.author.email,
            fullName: n.author.fullName,
          },
        })),
      },
    })
  }

  /**
   * POST /api/admin/subscribers/:id/notes
   * Create a note for a user
   */
  async createNote({ params, request, response, auth }: HttpContext) {
    const content = request.input('content')
    if (!content || content.trim().length === 0) {
      return response.badRequest({
        success: false,
        error: { message: 'Content is required', code: 'E_VALIDATION' },
      })
    }

    const note = await AdminNote.create({
      userId: params.id,
      authorId: auth.user!.id,
      content: content.trim(),
    })

    await note.load('author', (q) => q.select(['id', 'email', 'fullName']))

    return response.created({
      success: true,
      data: {
        note: {
          id: note.id,
          content: note.content,
          createdAt: note.createdAt,
          author: {
            id: note.author.id,
            email: note.author.email,
            fullName: note.author.fullName,
          },
        },
      },
    })
  }

  /**
   * PUT /api/admin/notes/:id
   * Update a note
   */
  async updateNote({ params, request, response, auth }: HttpContext) {
    const note = await AdminNote.find(params.id)
    if (!note) {
      return response.notFound({
        success: false,
        error: { message: 'Note not found', code: 'E_NOT_FOUND' },
      })
    }

    // Only author can edit
    if (note.authorId !== auth.user!.id) {
      return response.forbidden({
        success: false,
        error: { message: 'You can only edit your own notes', code: 'E_FORBIDDEN' },
      })
    }

    const content = request.input('content')
    if (!content || content.trim().length === 0) {
      return response.badRequest({
        success: false,
        error: { message: 'Content is required', code: 'E_VALIDATION' },
      })
    }

    note.content = content.trim()
    await note.save()

    return response.ok({
      success: true,
      data: { note: { id: note.id, content: note.content, updatedAt: note.updatedAt } },
    })
  }

  /**
   * DELETE /api/admin/notes/:id
   * Delete a note
   */
  async deleteNote({ params, response, auth }: HttpContext) {
    const note = await AdminNote.find(params.id)
    if (!note) {
      return response.notFound({
        success: false,
        error: { message: 'Note not found', code: 'E_NOT_FOUND' },
      })
    }

    // Only author can delete
    if (note.authorId !== auth.user!.id) {
      return response.forbidden({
        success: false,
        error: { message: 'You can only delete your own notes', code: 'E_FORBIDDEN' },
      })
    }

    await note.delete()
    return response.ok({ success: true, data: { message: 'Note deleted' } })
  }

  /**
   * GET /api/admin/subscribers/:id/tasks
   * Get tasks for a user
   */
  async getTasks({ params, response }: HttpContext) {
    const tasks = await AdminTask.query()
      .where('user_id', params.id)
      .preload('author', (q) => q.select(['id', 'email', 'fullName']))
      .orderBy('dueDate', 'asc')
      .orderBy('createdAt', 'desc')

    return response.ok({
      success: true,
      data: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate,
          completed: t.completed,
          completedAt: t.completedAt,
          createdAt: t.createdAt,
          author: {
            id: t.author.id,
            email: t.author.email,
            fullName: t.author.fullName,
          },
        })),
      },
    })
  }

  /**
   * POST /api/admin/subscribers/:id/tasks
   * Create a task for a user
   */
  async createTask({ params, request, response, auth }: HttpContext) {
    const title = request.input('title')
    const dueDate = request.input('dueDate')

    if (!title || title.trim().length === 0) {
      return response.badRequest({
        success: false,
        error: { message: 'Title is required', code: 'E_VALIDATION' },
      })
    }

    const task = await AdminTask.create({
      userId: params.id,
      authorId: auth.user!.id,
      title: title.trim(),
      dueDate: dueDate ? DateTime.fromISO(dueDate) : null,
      completed: false,
    })

    await task.load('author', (q) => q.select(['id', 'email', 'fullName']))

    return response.created({
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          completed: task.completed,
          createdAt: task.createdAt,
          author: {
            id: task.author.id,
            email: task.author.email,
            fullName: task.author.fullName,
          },
        },
      },
    })
  }

  /**
   * PATCH /api/admin/tasks/:id
   * Update a task (title, dueDate, or toggle completed)
   */
  async updateTask({ params, request, response }: HttpContext) {
    const task = await AdminTask.find(params.id)
    if (!task) {
      return response.notFound({
        success: false,
        error: { message: 'Task not found', code: 'E_NOT_FOUND' },
      })
    }

    const title = request.input('title')
    const dueDate = request.input('dueDate')
    const completed = request.input('completed')

    if (title !== undefined) {
      task.title = title.trim()
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? DateTime.fromISO(dueDate) : null
    }
    if (completed !== undefined) {
      task.completed = completed
      task.completedAt = completed ? DateTime.now() : null
    }

    await task.save()

    return response.ok({
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          completed: task.completed,
          completedAt: task.completedAt,
        },
      },
    })
  }

  /**
   * DELETE /api/admin/tasks/:id
   * Delete a task
   */
  async deleteTask({ params, response }: HttpContext) {
    const task = await AdminTask.find(params.id)
    if (!task) {
      return response.notFound({
        success: false,
        error: { message: 'Task not found', code: 'E_NOT_FOUND' },
      })
    }

    await task.delete()
    return response.ok({ success: true, data: { message: 'Task deleted' } })
  }

  /**
   * PATCH /api/admin/subscribers/:id/role
   * DISABLED - Role changes are not allowed via UI for security reasons
   * Only the database superadmin can promote users
   */
  async updateRole({ response }: HttpContext) {
    return response.forbidden({
      success: false,
      error: {
        message: 'Role changes are disabled for security reasons. Contact the system administrator.',
        code: 'E_ROLE_CHANGE_DISABLED',
      },
    })
  }

  /**
   * PATCH /api/admin/subscribers/:id/subscription
   * Update user subscription status (superadmin only)
   */
  async updateSubscription({ params, request, response }: HttpContext) {
    const targetUserId = params.id
    const newStatus = request.input('subscriptionStatus')

    const validStatuses = ['trial', 'active', 'past_due', 'cancelled', 'expired']
    if (!validStatuses.includes(newStatus)) {
      return response.badRequest({
        success: false,
        error: { message: 'Invalid subscription status', code: 'E_INVALID_STATUS' },
      })
    }

    const user = await User.find(targetUserId)
    if (!user) {
      return response.notFound({
        success: false,
        error: { message: 'User not found', code: 'E_NOT_FOUND' },
      })
    }

    const previousStatus = user.subscriptionStatus
    user.subscriptionStatus = newStatus

    // Set subscription dates on activation
    if (newStatus === 'active' && previousStatus !== 'active') {
      user.subscriptionStartedAt = DateTime.now()
    }

    await user.save()

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionStartedAt: user.subscriptionStartedAt,
          subscriptionEndsAt: user.subscriptionEndsAt,
        },
      },
    })
  }

  /**
   * PATCH /api/admin/subscribers/:id/extend
   * Extend a user's subscription by N days (superadmin only)
   */
  async extendSubscription({ params, request, response }: HttpContext) {
    const days = request.input('days')
    const reason = request.input('reason')

    if (!days || typeof days !== 'number' || days < 1 || days > 365) {
      return response.badRequest({
        success: false,
        error: { message: 'days must be between 1 and 365', code: 'E_INVALID_DAYS' },
      })
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return response.badRequest({
        success: false,
        error: { message: 'reason is required (min 3 chars)', code: 'E_INVALID_REASON' },
      })
    }

    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({
        success: false,
        error: { message: 'User not found', code: 'E_NOT_FOUND' },
      })
    }

    const currentEnd = user.subscriptionEndsAt || DateTime.now()
    const baseDate = currentEnd > DateTime.now() ? currentEnd : DateTime.now()
    user.subscriptionEndsAt = baseDate.plus({ days })

    await user.save()

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndsAt: user.subscriptionEndsAt,
        },
        extended: { days, reason, newEndDate: user.subscriptionEndsAt },
      },
    })
  }

  /**
   * PATCH /api/admin/subscribers/:id/founder
   * Toggle isFounder flag (superadmin only)
   */
  async toggleFounder({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({
        success: false,
        error: { message: 'User not found', code: 'E_NOT_FOUND' },
      })
    }

    user.isFounder = !user.isFounder
    await user.save()

    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          isFounder: user.isFounder,
        },
      },
    })
  }

  /**
   * GET /api/admin/activity
   * Activity feed with at-risk users and overdue conditions
   */
  async activity({ request, response }: HttpContext) {
    const limit = Math.min(request.input('limit', 50), 100)

    const [atRiskUsers, overdueConditions, recentUsers, recentTransactions] = await Promise.all([
      AdminMetricsService.getAtRiskUsers(),
      AdminMetricsService.getOverdueConditions(),
      User.query()
        .select(['id', 'email', 'fullName', 'createdAt'])
        .orderBy('createdAt', 'desc')
        .limit(20),
      db.from('transactions')
        .select([
          'transactions.id',
          'transactions.type',
          'transactions.created_at',
          'clients.first_name',
          'clients.last_name',
          'users.email as owner_email',
        ])
        .leftJoin('clients', 'clients.id', 'transactions.client_id')
        .leftJoin('users', 'users.id', 'transactions.owner_user_id')
        .orderBy('transactions.created_at', 'desc')
        .limit(20),
    ])

    // Build activity feed
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
        timestamp: tx.created_at,
        data: {
          transactionId: tx.id,
          type: tx.type,
          clientName: tx.first_name ? `${tx.first_name} ${tx.last_name}` : null,
          ownerEmail: tx.owner_email,
        },
      })
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return response.ok({
      success: true,
      data: {
        atRiskUsers: atRiskUsers.slice(0, 10),
        overdueConditions: overdueConditions.slice(0, 10),
        activities: activities.slice(0, limit),
      },
    })
  }

  /**
   * GET /api/admin/system
   * System health and status
   */
  async system({ response }: HttpContext) {
    const now = DateTime.now()

    let dbStatus = 'healthy'
    try {
      await db.rawQuery('SELECT 1')
    } catch {
      dbStatus = 'error'
    }

    const [userCount, transactionCount] = await Promise.all([
      User.query().count('* as count').first(),
      db.from('transactions').count('* as count').first(),
    ])

    const memUsage = process.memoryUsage()

    return response.ok({
      success: true,
      data: {
        status: dbStatus === 'healthy' ? 'operational' : 'degraded',
        timestamp: now.toISO(),
        checks: { database: dbStatus },
        stats: {
          totalUsers: Number(userCount?.$extras.count || 0),
          totalTransactions: Number(transactionCount?.count || 0),
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
