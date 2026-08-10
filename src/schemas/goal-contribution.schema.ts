import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const goalContributionSchema = householdEntitySchema.extend({
  goal_id: z.string().uuid(),
  amount: z.number().int(),
  date: z.string(),
  contributed_by: z.string().uuid().nullable(),
  contributed_by_type: z.enum(['member', 'external']).default('member'),
  contributed_by_name: z.string().nullable().default(null),
  note: z.string().nullable(),
  scope: z.enum(['household', 'personal']),
  owner_id: z.string().uuid().nullable(),
})
