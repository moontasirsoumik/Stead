import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const subtaskSchema = householdEntitySchema.extend({
  task_id: z.string().uuid(),
  title: z.string(),
  done: z.coerce.boolean(),
  order: z.number().int(),
})
