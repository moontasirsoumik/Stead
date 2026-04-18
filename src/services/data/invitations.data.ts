import { supabase } from '@/lib/supabase'
import { invitationSchema } from '@/schemas/invitation.schema'
import type { Invitation } from '@/models/invitation.model'
import type { MemberRole } from '@/models/enums'

const tableName = 'household_invitations'

export const invitationsDataService = {
  async getAll(householdId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as unknown[]).map((row) => invitationSchema.parse(row) as Invitation)
  },

  async create(payload: {
    household_id: string
    invited_by: string
    email?: string | null
    role: MemberRole
    expires_at: string
  }): Promise<Invitation> {
    // Generate invite code via RPC
    const { data: code, error: codeError } = await supabase.rpc('generate_invite_code')
    if (codeError) throw codeError

    const { data, error } = await supabase
      .from(tableName)
      .insert({
        ...payload,
        invite_code: code,
        email: payload.email || null,
      })
      .select('*')
      .single()

    if (error) throw error

    return invitationSchema.parse(data) as Invitation
  },

  async revoke(id: string): Promise<Invitation> {
    const { data, error } = await supabase
      .from(tableName)
      .update({ status: 'revoked' })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return invitationSchema.parse(data) as Invitation
  },

  async accept(code: string): Promise<{ household_id: string; member_id: string }> {
    const { data, error } = await supabase.rpc('accept_invitation', { code })
    if (error) throw error
    return data as { household_id: string; member_id: string }
  },
}
