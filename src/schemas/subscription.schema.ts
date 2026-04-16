import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const subscriptionSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid(),
  name: z.string(),
  amount: z.number().int(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  category: z.string(),
  next_billing_date: z.string().nullable(),
  auto_renew: z.coerce.boolean(),
  url: z.string(),
  note: z.string(),
  status: z.enum(['active', 'paused', 'cancelled']),
})
