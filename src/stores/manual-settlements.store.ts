import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { manualSettlementsDataService } from '@/services/data/manual-settlements.data'
import type { ManualSettlement } from '@/models/manual-settlement.model'

export const useManualSettlementsStore = defineStore('manual-settlements', () => {
  const items = ref<ManualSettlement[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFresh(householdId: string) {
    loading.value = true
    error.value = null
    try {
      items.value = await manualSettlementsDataService.getAll(householdId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load manual settlements'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<ManualSettlement, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await manualSettlementsDataService.create(data)
      items.value.unshift(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create settlement'
      throw err
    }
  }

  async function update(id: string, data: Partial<ManualSettlement>) {
    error.value = null
    try {
      const updated = await manualSettlementsDataService.update(id, data)
      const idx = items.value.findIndex((item) => item.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update settlement'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await manualSettlementsDataService.softDelete(id)
      items.value = items.value.filter((item) => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete settlement'
      throw err
    }
  }

  async function markSettled(id: string) {
    return update(id, {
      status: 'settled',
      settled_at: new Date().toISOString(),
    })
  }

  const outstanding = computed(() => items.value.filter((item) => item.status === 'outstanding'))

  return {
    items,
    loading,
    error,
    outstanding,
    fetchFresh,
    create,
    update,
    remove,
    markSettled,
  }
})
