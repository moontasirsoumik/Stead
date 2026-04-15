import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { householdDataService } from '@/services/data/household.data'
import { membersDataService } from '@/services/data/members.data'
import { useAuthStore } from '@/stores/auth.store'
import type { Household } from '@/models/household.model'
import type { Member } from '@/models/member.model'

export const useHouseholdStore = defineStore('household', () => {
  const household = ref<Household | null>(null)
  const members = ref<Member[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadHousehold(householdId: string) {
    loading.value = true
    error.value = null

    try {
      const data = await householdDataService.getById(householdId)
      if (data) household.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load household'
    } finally {
      loading.value = false
    }
  }

  async function loadMembers(householdId: string) {
    loading.value = true
    error.value = null

    try {
      const result = await membersDataService.getAll(householdId)
      members.value = result.cached

      if (result.fresh) {
        members.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load members'
    } finally {
      loading.value = false
    }
  }

  async function updateHousehold(data: Partial<Household>) {
    if (!household.value) return

    error.value = null
    try {
      const updated = await householdDataService.update(household.value.id, data)
      household.value = updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update household'
      throw err
    }
  }

  async function addMember(data: Omit<Member, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await membersDataService.create(data)
      members.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add member'
      throw err
    }
  }

  async function updateMember(id: string, data: Partial<Member>) {
    error.value = null
    try {
      const updated = await membersDataService.update(id, data)
      const idx = members.value.findIndex((m) => m.id === id)
      if (idx !== -1) members.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update member'
      throw err
    }
  }

  async function removeMember(id: string) {
    error.value = null
    try {
      await membersDataService.deactivate(id)
      const idx = members.value.findIndex((m) => m.id === id)
      if (idx !== -1) {
        members.value[idx] = { ...members.value[idx], active: false }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove member'
      throw err
    }
  }

  const activeMembers = computed(() => members.value.filter((m) => m.active))

  const currentMember = computed(() => {
    const authStore = useAuthStore()
    return members.value.find((m) => m.id === authStore.memberId) ?? null
  })

  return {
    household,
    members,
    loading,
    error,
    activeMembers,
    currentMember,
    loadHousehold,
    loadMembers,
    updateHousehold,
    addMember,
    updateMember,
    removeMember,
  }
})
