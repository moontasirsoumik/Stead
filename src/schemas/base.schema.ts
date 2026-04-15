import { z } from 'zod'

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export const householdEntitySchema = baseEntitySchema.extend({
  household_id: z.string().uuid(),
  updated_by: z.string().uuid().nullable().optional(),
  deleted: z.coerce.boolean(),
})
