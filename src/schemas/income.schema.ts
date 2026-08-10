import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const incomeSchema = householdEntitySchema.extend({
  date: z.string(),
  amount: z.number().int(),
  source: z.string(),
  category: z.string(),
  received_by: z.string().uuid().nullable(),
  received_by_type: z.enum(['member', 'external']).default('member'),
  received_by_name: z.string().nullable().default(null),
  recurring: z.coerce.boolean(),
  recurring_rule: z.string().nullable(),
  note: z.string().nullable(),
  scope: z.enum(['household', 'personal']),
  owner_id: z.string().uuid().nullable(),
})
