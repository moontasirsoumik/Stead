import { z } from 'zod'

export const activityLogSchema = z.object({
  id: z.string().uuid(),
  household_id: z.string().uuid(),
  timestamp: z.string().datetime({ offset: true }),
  actor_id: z.string().uuid().nullable(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  summary: z.string().nullable(),
})
