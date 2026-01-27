import ActivityFeed, { type ActivityType } from '#models/activity_feed'

interface LogParams {
  transactionId: number
  userId?: number | null
  activityType: ActivityType
  metadata?: Record<string, any>
}

export class ActivityFeedService {
  static async log(params: LogParams): Promise<ActivityFeed> {
    return ActivityFeed.create({
      transactionId: params.transactionId,
      userId: params.userId ?? null,
      activityType: params.activityType,
      metadata: params.metadata ?? {},
    })
  }

  static async getForTransaction(
    transactionId: number,
    page: number = 1,
    limit: number = 20
  ) {
    return ActivityFeed.query()
      .where('transactionId', transactionId)
      .preload('user')
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)
  }
}
