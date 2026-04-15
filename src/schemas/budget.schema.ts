import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const budgetSchema = householdEntitySchema.extend({
  month: z.string(),
  category: z.string(),
  budget_amount: z.number().int(),
})
