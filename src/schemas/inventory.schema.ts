import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const inventorySchema = householdEntitySchema.extend({
  name: z.string(),
  category: z.string().nullable(),
  location: z.string().nullable(),
  stock_status: z.enum(['out', 'almost_finished', 'low', 'enough', 'extra_stock']),
  target_level: z.enum(['keep_1', 'keep_2', 'keep_3_plus', 'weekly_item', 'monthly_item']),
  restock_needed: z.coerce.boolean(),
  last_checked_date: z.string().nullable(),
  note: z.string().nullable(),
})
