import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const wishlistItemSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  price: z.number().int().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['wanted', 'saving', 'bought', 'dropped']),
  saved_amount: z.number().int().nullable(),
  category: z.string().nullable(),
  note: z.string().nullable(),
})
