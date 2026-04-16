import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { subscriptionSchema } from '@/schemas/subscription.schema'
import type { Subscription } from '@/models/subscription.model'

export const subscriptionsDataService = new BaseDataService<Subscription>(
  'subscriptions',
  db.subscriptions,
  subscriptionSchema,
)
