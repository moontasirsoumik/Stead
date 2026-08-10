import { z } from 'zod'
import { householdEntitySchema } from '@/schemas/base.schema'

export const manualSettlementSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid(),
  visibility: z.enum(['private', 'public']),
  direction: z.enum(['i_owe', 'owed_to_me']),
  counterparty_member_id: z.string().uuid().nullable(),
  counterparty_name: z.string(),
  amount: z.number().int(),
  date: z.string(),
  description: z.string(),
  note: z.string().nullable(),
  status: z.enum(['outstanding', 'settled']),
  settled_at: z.string().nullable(),
})
