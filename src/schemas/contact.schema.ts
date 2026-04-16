import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const contactSchema = householdEntitySchema.extend({
  name: z.string(),
  role: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  company: z.string(),
  note: z.string(),
  category: z.string(),
})
