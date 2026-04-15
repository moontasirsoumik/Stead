import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { billsDataService } from '@/services/data/bills.data'
import type { Bill } from '@/models/bill.model'

export const useBillsStore = defineStore('bills', () => {
  const items = ref<Bill[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFresh(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await billsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load bills'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Bill, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await billsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create bill'
      throw err
    }
  }

  async function update(id: string, data: Partial<Bill>) {
    error.value = null
    try {
      const updated = await billsDataService.update(id, data)
      const idx = items.value.findIndex((b) => b.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update bill'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await billsDataService.softDelete(id)
      const idx = items.value.findIndex((b) => b.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete bill'
      throw err
    }
  }

  const upcomingBills = computed(() =>
    items.value.filter((b) => b.status === 'upcoming'),
  )

  const overdueCount = computed(() =>
    items.value.filter((b) => b.status === 'overdue').length,
  )

  const monthlyTotal = computed(() =>
    items.value
      .filter((b) => b.status !== 'skipped')
      .reduce((sum, b) => sum + b.amount, 0),
  )

  return {
    items,
    loading,
    error,
    fetchFresh,
    create,
    update,
    remove,
    upcomingBills,
    overdueCount,
    monthlyTotal,
  }
})
