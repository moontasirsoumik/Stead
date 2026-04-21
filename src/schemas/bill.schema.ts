import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const billSchema = householdEntitySchema.extend({
  name: z.string(),
  amount: z.number().int(),
  category: z.string(),
  due_day: z.number().int().min(1).max(31),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'custom']),
  auto_pay: z.coerce.boolean(),
  paid_by: z.string().uuid().nullable(),
  status: z.enum(['upcoming', 'paid', 'overdue', 'skipped']),
  last_paid_date: z.string().nullable(),
  note: z.string().nullable(),
})
