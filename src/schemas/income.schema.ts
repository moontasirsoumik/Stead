import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const incomeSchema = householdEntitySchema.extend({
  date: z.string(),
  amount: z.number().int(),
  source: z.string(),
  category: z.string(),
  received_by: z.string().uuid(),
  recurring: z.coerce.boolean(),
  recurring_rule: z.string().nullable(),
  note: z.string().nullable(),
})
