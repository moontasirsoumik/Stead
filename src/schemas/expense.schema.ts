import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const expenseSchema = householdEntitySchema.extend({
  date: z.string(),
  amount: z.number().int(),
  category: z.string(),
  subcategory: z.string().nullable(),
  description: z.string(),
  paid_by: z.string().uuid(),
  shared: z.coerce.boolean(),
  tags: z.array(z.string()).nullable(),
  note: z.string().nullable(),
})
