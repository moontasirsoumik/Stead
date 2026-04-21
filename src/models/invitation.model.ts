import type { MemberRole } from '@/models/enums'

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface Invitation {
  id: string
  household_id: string
  invited_by: string
  invite_code: string
  email: string | null
  role: MemberRole
  status: InvitationStatus
  accepted_by: string | null
  expires_at: string
  created_at: string
}
