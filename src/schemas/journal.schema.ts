import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const journalEntrySchema = householdEntitySchema.extend({
  owner_id: z.string().uuid(),
  entry_date: z.string(),
  content: z.string(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).nullable(),
  tags: z.string(),
})
