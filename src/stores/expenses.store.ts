import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expensesDataService } from '@/services/data/expenses.data'
import type { Expense } from '@/models/expense.model'

export const useExpensesStore = defineStore('expenses', () => {
  const items = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFromCache(householdId: string) {
    const result = await expensesDataService.getAll(householdId)
    items.value = result.cached.length ? result.cached : []
  }

  async function fetchFresh(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await expensesDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load expenses'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await expensesDataService.create(data)
      items.value.unshift(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create expense'
      throw err
    }
  }

  async function update(id: string, data: Partial<Expense>) {
    error.value = null
    try {
      const updated = await expensesDataService.update(id, data)
      const idx = items.value.findIndex((e) => e.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update expense'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await expensesDataService.softDelete(id)
      const idx = items.value.findIndex((e) => e.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete expense'
      throw err
    }
  }

  const sorted = computed(() =>
    [...items.value].sort((a, b) => b.date.localeCompare(a.date)),
  )

  const groupedByDate = computed(() => {
    const groups: Record<string, Expense[]> = {}
    for (const exp of sorted.value) {
      const key = exp.date.slice(0, 10)
      if (!groups[key]) groups[key] = []
      groups[key].push(exp)
    }
    return groups
  })

  const currentMonthTotal = computed(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return items.value
      .filter((e) => e.date.startsWith(ym))
      .reduce((sum, e) => sum + e.amount, 0)
  })

  const currentMonthCount = computed(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return items.value.filter((e) => e.date.startsWith(ym)).length
  })

  const topCategory = computed(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthExpenses = items.value.filter((e) => e.date.startsWith(ym))
    const catTotals: Record<string, number> = {}
    for (const e of monthExpenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount
    }
    let top = ''
    let max = 0
    for (const [cat, total] of Object.entries(catTotals)) {
      if (total > max) {
        max = total
        top = cat
      }
    }
    return top || '—'
  })

  function filteredByCategory(category: string) {
    return items.value.filter((e) => e.category === category)
  }

  return {
    items,
    loading,
    error,
    loadFromCache,
    fetchFresh,
    create,
    update,
    remove,
    sorted,
    groupedByDate,
    currentMonthTotal,
    currentMonthCount,
    topCategory,
    filteredByCategory,
  }
})
