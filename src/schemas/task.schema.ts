import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const taskSchema = householdEntitySchema.extend({
  title: z.string(),
  description: z.string().nullable(),
  task_type: z.enum(['regular', 'maintenance']),
  assignee: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  room: z.string().nullable(),
  category: z.string().nullable(),
  due_date: z.string().nullable(),
  recurring_rule: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['not_started', 'in_progress', 'done', 'skipped', 'overdue']),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  last_done_date: z.string().nullable(),
  estimated_cost: z.number().int().nullable(),
  vendor: z.string().nullable(),
  contact: z.string().nullable(),
  note: z.string().nullable(),
  scope: z.enum(['household', 'personal']),
  owner_id: z.string().uuid().nullable(),
  rotation_enabled: z.coerce.boolean(),
  rotation_members: z.string(),
  rotation_index: z.number().int(),
})
