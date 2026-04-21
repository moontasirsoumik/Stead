import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { savingsGoalsDataService } from '@/services/data/savings-goals.data'
import { goalContributionsDataService } from '@/services/data/goal-contributions.data'
import type { SavingsGoal } from '@/models/savings-goal.model'
import type { GoalContribution } from '@/models/goal-contribution.model'

export const useSavingsStore = defineStore('savings', () => {
  const goals = ref<SavingsGoal[]>([])
  const contributions = ref<Record<string, GoalContribution[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadGoals(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await savingsGoalsDataService.getAll(householdId)
      goals.value = result.cached
      if (result.fresh) {
        goals.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load savings goals'
    } finally {
      loading.value = false
    }
  }

  async function loadContributions(goalId: string) {
    try {
      const result = await goalContributionsDataService.getAllByGoal(goalId)
      contributions.value[goalId] = result.cached
      if (result.fresh) {
        contributions.value[goalId] = result.fresh
      }
    } catch (err) {
      console.error('Failed to load contributions:', err)
    }
  }

  async function createGoal(data: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await savingsGoalsDataService.create(data)
      goals.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create goal'
      throw err
    }
  }

  async function updateGoal(id: string, data: Partial<SavingsGoal>) {
    error.value = null
    try {
      const updated = await savingsGoalsDataService.update(id, data)
      const idx = goals.value.findIndex((g) => g.id === id)
      if (idx !== -1) goals.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update goal'
      throw err
    }
  }

  async function deleteGoal(id: string) {
    error.value = null
    try {
      await savingsGoalsDataService.softDelete(id)
      const idx = goals.value.findIndex((g) => g.id === id)
      if (idx !== -1) goals.value.splice(idx, 1)
      delete contributions.value[id]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete goal'
      throw err
    }
  }

  async function addContribution(data: Omit<GoalContribution, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await goalContributionsDataService.create(data)
      if (!contributions.value[data.goal_id]) {
        contributions.value[data.goal_id] = []
      }
      contributions.value[data.goal_id].unshift(created)
      // Update goal's current_amount locally
      const goal = goals.value.find((g) => g.id === data.goal_id)
      if (goal) {
        goal.current_amount += data.amount
      }
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add contribution'
      throw err
    }
  }

  const totalSaved = computed(() =>
    goals.value.reduce((sum, g) => sum + g.current_amount, 0),
  )

  function goalProgress(goalId: string): number {
    const goal = goals.value.find((g) => g.id === goalId)
    if (!goal || goal.target_amount === 0) return 0
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  }

  return {
    goals,
    contributions,
    loading,
    error,
    loadGoals,
    loadContributions,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    totalSaved,
    goalProgress,
  }
})
