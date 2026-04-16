import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const wishlistItemSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  url: z.string(),
  price: z.number().int(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['wanted', 'saving', 'bought', 'dropped']),
  saved_amount: z.number().int(),
  category: z.string(),
  note: z.string(),
})
