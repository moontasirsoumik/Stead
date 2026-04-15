import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const goalContributionSchema = householdEntitySchema.extend({
  goal_id: z.string().uuid(),
  amount: z.number().int(),
  date: z.string(),
  contributed_by: z.string().uuid(),
  note: z.string().nullable(),
})
