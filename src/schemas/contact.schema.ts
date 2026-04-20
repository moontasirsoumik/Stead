import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const contactSchema = householdEntitySchema.extend({
  name: z.string(),
  role: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  company: z.string().nullable(),
  note: z.string().nullable(),
  category: z.string().nullable(),
})
