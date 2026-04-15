import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const savingsGoalSchema = householdEntitySchema.extend({
  name: z.string(),
  target_amount: z.number().int(),
  current_amount: z.number().int(),
  deadline: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['active', 'reached', 'paused', 'cancelled']),
  note: z.string().nullable(),
})
