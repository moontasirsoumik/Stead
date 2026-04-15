import { z } from 'zod'
import { baseEntitySchema } from '@/schemas/base.schema'

export const memberSchema = baseEntitySchema.extend({
  household_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  name: z.string(),
  role: z.enum(['admin', 'member']),
  color: z.string(),
  active: z.coerce.boolean(),
})
