import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { budgetsDataService } from '@/services/data/budgets.data'
import { useExpensesStore } from '@/stores/expenses.store'
import type { Budget } from '@/models/budget.model'

export const useBudgetsStore = defineStore('budgets', () => {
  const items = ref<Budget[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedMonth = ref(currentYM())

  function currentYM(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  async function fetchFresh(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await budgetsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load budgets'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await budgetsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create budget'
      throw err
    }
  }

  async function update(id: string, data: Partial<Budget>) {
    error.value = null
    try {
      const updated = await budgetsDataService.update(id, data)
      const idx = items.value.findIndex((b) => b.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update budget'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await budgetsDataService.softDelete(id)
      const idx = items.value.findIndex((b) => b.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete budget'
      throw err
    }
  }

  const currentMonthBudgets = computed(() =>
    items.value.filter((b) => b.month === selectedMonth.value),
  )

  function spentForCategory(category: string): number {
    const expensesStore = useExpensesStore()
    return expensesStore.items
      .filter(
        (e) =>
          e.category === category &&
          e.date.startsWith(selectedMonth.value),
      )
      .reduce((sum, e) => sum + e.amount, 0)
  }

  return {
    items,
    loading,
    error,
    selectedMonth,
    fetchFresh,
    create,
    update,
    remove,
    currentMonthBudgets,
    spentForCategory,
  }
})
