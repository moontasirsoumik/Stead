import { z } from 'zod'
import { baseEntitySchema } from '@/schemas/base.schema'

export const householdSchema = baseEntitySchema.extend({
  name: z.string(),
})
