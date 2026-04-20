import { z } from 'zod'

export const entityShareSchema = z.object({
  id: z.string().uuid(),
  household_id: z.string().uuid(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  shared_with: z.string().uuid(),
  created_at: z.string().datetime({ offset: true }),
})
