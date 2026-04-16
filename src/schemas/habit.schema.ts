import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const habitSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
  target_days: z.string(),
  color: z.string(),
  active: z.coerce.boolean(),
})

export const habitLogSchema = z.object({
  id: z.string().uuid(),
  habit_id: z.string().uuid(),
  household_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  log_date: z.string(),
  completed: z.coerce.boolean(),
  note: z.string(),
  created_at: z.string().datetime({ offset: true }),
})
