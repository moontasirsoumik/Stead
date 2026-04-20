import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const documentSchema = householdEntitySchema.extend({
  title: z.string(),
  doc_type: z.enum(['warranty', 'insurance', 'lease', 'contract', 'receipt', 'manual', 'other']),
  description: z.string().nullable(),
  issuer: z.string().nullable(),
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  reference_number: z.string().nullable(),
  note: z.string().nullable(),
})
