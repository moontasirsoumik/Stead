import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { incomeDataService } from '@/services/data/income.data'
import type { Income } from '@/models/income.model'

export const useIncomeStore = defineStore('income', () => {
  const items = ref<Income[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFresh(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await incomeDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load income'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Income, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await incomeDataService.create(data)
      items.value.unshift(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create income'
      throw err
    }
  }

  async function update(id: string, data: Partial<Income>) {
    error.value = null
    try {
      const updated = await incomeDataService.update(id, data)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update income'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await incomeDataService.softDelete(id)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete income'
      throw err
    }
  }

  const sorted = computed(() =>
    [...items.value].sort((a, b) => b.date.localeCompare(a.date)),
  )

  const currentMonthTotal = computed(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return items.value
      .filter((i) => i.date.startsWith(ym))
      .reduce((sum, i) => sum + i.amount, 0)
  })

  return {
    items,
    loading,
    error,
    fetchFresh,
    create,
    update,
    remove,
    sorted,
    currentMonthTotal,
  }
})
