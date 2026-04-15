import { z } from 'zod'

export const settingSchema = z.object({
  id: z.string().uuid(),
  household_id: z.string().uuid(),
  key: z.string(),
  value: z.string(),
  updated_at: z.string().datetime({ offset: true }),
})
