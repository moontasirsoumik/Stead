import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const taskSchema = householdEntitySchema.extend({
  title: z.string(),
  description: z.string().nullable(),
  assignee: z.string().uuid().nullable(),
  room: z.string().nullable(),
  category: z.string().nullable(),
  due_date: z.string().nullable(),
  recurring_rule: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['not_started', 'in_progress', 'done', 'skipped', 'overdue']),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  note: z.string().nullable(),
})
