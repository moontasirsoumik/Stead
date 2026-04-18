import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const calendarEventSchema = householdEntitySchema.extend({
  title: z.string(),
  description: z.string().nullable(),
  start_date: z.string(),
  start_time: z.string().nullable(),
  end_date: z.string().nullable(),
  end_time: z.string().nullable(),
  all_day: z.coerce.boolean(),
  category: z.string().nullable(),
  assigned_to: z.string().uuid().nullable(),
  scope: z.enum(['household', 'personal']),
  owner_id: z.string().uuid().nullable(),
  recurring_rule: z.string().nullable(),
  color: z.string().nullable(),
  note: z.string().nullable(),
})
