import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const maintenanceSchema = householdEntitySchema.extend({
  item: z.string(),
  type: z.string().nullable(),
  last_done_date: z.string().nullable(),
  next_due_date: z.string().nullable(),
  recurring_rule: z.string().nullable(),
  estimated_cost: z.number().int().nullable(),
  assigned_to: z.string().uuid().nullable(),
  vendor: z.string().nullable(),
  contact: z.string().nullable(),
  status: z.enum(['upcoming', 'overdue', 'done', 'skipped']),
  note: z.string().nullable(),
})
