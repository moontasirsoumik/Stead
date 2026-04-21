import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invitationsDataService } from '@/services/data/invitations.data'
import { useAuthStore } from '@/stores/auth.store'
import type { Invitation } from '@/models/invitation.model'
import type { MemberRole } from '@/models/enums'

export const useInvitationStore = defineStore('invitation', () => {
  const invitations = ref<Invitation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadInvitations(householdId: string) {
    loading.value = true
    error.value = null

    try {
      invitations.value = await invitationsDataService.getAll(householdId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load invitations'
    } finally {
      loading.value = false
    }
  }

  async function createInvitation(payload: {
    email?: string | null
    role: MemberRole
    expiry_days?: number
  }) {
    const authStore = useAuthStore()
    if (!authStore.householdId || !authStore.memberId) return null

    error.value = null
    loading.value = true

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (payload.expiry_days ?? 7))

      const created = await invitationsDataService.create({
        household_id: authStore.householdId,
        invited_by: authStore.memberId,
        email: payload.email || null,
        role: payload.role,
        expires_at: expiresAt.toISOString(),
      })

      invitations.value.unshift(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create invitation'
      return null
    } finally {
      loading.value = false
    }
  }

  async function revokeInvitation(id: string) {
    error.value = null

    try {
      const updated = await invitationsDataService.revoke(id)
      const idx = invitations.value.findIndex((i) => i.id === id)
      if (idx !== -1) invitations.value[idx] = updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to revoke invitation'
    }
  }

  async function acceptInvitation(code: string) {
    error.value = null
    loading.value = true

    try {
      const result = await invitationsDataService.accept(code)
      const authStore = useAuthStore()
      authStore.householdId = result.household_id
      authStore.memberId = result.member_id
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid or expired invitation code'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    invitations,
    loading,
    error,
    loadInvitations,
    createInvitation,
    revokeInvitation,
    acceptInvitation,
  }
})
