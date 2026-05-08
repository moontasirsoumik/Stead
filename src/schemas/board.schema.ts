import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const boardSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid().nullable(),
  scope: z.enum(['household', 'personal']),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  position: z.number().int(),
})

export const boardItemSchema = householdEntitySchema.extend({
  board_id: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  group_name: z.string().nullable(),
  is_checked: z.coerce.boolean(),
  position: z.number().int(),
})
