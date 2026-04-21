import { z } from 'zod'

export const invitationSchema = z.object({
  id: z.string().uuid(),
  household_id: z.string().uuid(),
  invited_by: z.string().uuid(),
  invite_code: z.string(),
  email: z.string().email().nullable(),
  role: z.enum(['admin', 'member']),
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']),
  accepted_by: z.string().uuid().nullable(),
  expires_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
})
