import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const noteSchema = householdEntitySchema.extend({
  title: z.string(),
  category: z.string().nullable(),
  content: z.string(),
  pinned: z.coerce.boolean(),
  linked_type: z.string().nullable(),
  linked_id: z.string().uuid().nullable(),
  created_by: z.string().uuid().nullable(),
  scope: z.enum(['household', 'personal']),
  owner_id: z.string().uuid().nullable(),
  visibility: z.enum(['private', 'shared', 'household']),
})
