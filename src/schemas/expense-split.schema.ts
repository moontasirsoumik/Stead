import { z } from 'zod'
import { baseEntitySchema } from '@/schemas/base.schema'

export const expenseSplitSchema = baseEntitySchema.extend({
  expense_id: z.string().uuid(),
  household_id: z.string().uuid(),
  member_id: z.string().uuid(),
  amount: z.number().int(),
  settled: z.coerce.boolean(),
  settled_at: z.string().nullable(),
})
