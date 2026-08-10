import { z } from 'zod'
import { baseEntitySchema } from '@/schemas/base.schema'

export const expenseSplitSchema = baseEntitySchema.extend({
  expense_id: z.string().uuid(),
  household_id: z.string().uuid(),
  member_id: z.string().uuid().nullable(),
  participant_type: z.enum(['member', 'external']).default('member'),
  participant_name: z.string().nullable().default(null),
  amount: z.number().int(),
  settled: z.coerce.boolean(),
  settled_at: z.string().nullable(),
})
