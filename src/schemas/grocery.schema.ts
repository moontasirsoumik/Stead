import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const grocerySchema = householdEntitySchema.extend({
  name: z.string(),
  quantity: z.number().int(),
  unit: z.string().nullable(),
  category: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  assigned_to: z.string().uuid().nullable(),
  status: z.enum(['needed', 'in_cart', 'bought', 'skipped']),
  preferred_store: z.string().nullable(),
  note: z.string().nullable(),
})
