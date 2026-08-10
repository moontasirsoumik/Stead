import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const expenseSchema = householdEntitySchema.extend({
  date: z.string(),
  amount: z.number().int(),
  category: z.string(),
  subcategory: z.string().nullable(),
  description: z.string(),
  paid_by: z.string().uuid().nullable(),
  paid_by_type: z.enum(['member', 'external']).default('member'),
  paid_by_name: z.string().nullable().default(null),
  shared: z.coerce.boolean(),
  tags: z.array(z.string()).nullable(),
  note: z.string().nullable(),
  scope: z.enum(['household', 'personal']),
  owner_id: z.string().uuid().nullable(),
})
