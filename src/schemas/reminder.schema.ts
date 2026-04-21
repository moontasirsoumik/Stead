import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const reminderSchema = householdEntitySchema.extend({
  title: z.string(),
  type: z.string().nullable(),
  linked_entity_type: z.string().nullable(),
  linked_entity_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  repeat_rule: z.string().nullable(),
  assigned_to: z.string().uuid().nullable(),
  status: z.enum(['active', 'snoozed', 'dismissed', 'done']),
  note: z.string().nullable(),
})
