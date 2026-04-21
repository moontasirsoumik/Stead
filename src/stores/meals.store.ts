import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mealPlansDataService, mealsDataService } from '@/services/data/meals.data'
import type { MealPlan, Meal } from '@/models/meal.model'

export const useMealsStore = defineStore('meals', () => {
  const plans = ref<MealPlan[]>([])
  const meals = ref<Meal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlans(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await mealPlansDataService.getAll(householdId)
      plans.value = result.cached
      if (result.fresh) {
        plans.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load meal plans'
    } finally {
      loading.value = false
    }
  }

  async function fetchMeals(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await mealsDataService.getAll(householdId)
      meals.value = result.cached
      if (result.fresh) {
        meals.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load meals'
    } finally {
      loading.value = false
    }
  }

  async function createPlan(data: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await mealPlansDataService.create(data)
      plans.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create meal plan'
      throw err
    }
  }

  async function updatePlan(id: string, data: Partial<MealPlan>) {
    error.value = null
    try {
      const updated = await mealPlansDataService.update(id, data)
      const idx = plans.value.findIndex((p) => p.id === id)
      if (idx !== -1) plans.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update meal plan'
      throw err
    }
  }

  async function removePlan(id: string) {
    error.value = null
    try {
      await mealPlansDataService.softDelete(id)
      const idx = plans.value.findIndex((p) => p.id === id)
      if (idx !== -1) plans.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete meal plan'
      throw err
    }
  }

  async function createMeal(data: Omit<Meal, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await mealsDataService.create(data)
      meals.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create meal'
      throw err
    }
  }

  async function updateMeal(id: string, data: Partial<Meal>) {
    error.value = null
    try {
      const updated = await mealsDataService.update(id, data)
      const idx = meals.value.findIndex((m) => m.id === id)
      if (idx !== -1) meals.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update meal'
      throw err
    }
  }

  async function removeMeal(id: string) {
    error.value = null
    try {
      await mealsDataService.softDelete(id)
      const idx = meals.value.findIndex((m) => m.id === id)
      if (idx !== -1) meals.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete meal'
      throw err
    }
  }

  const currentWeekPlan = computed(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    const mondayStr = monday.toISOString().slice(0, 10)
    return plans.value.find((p) => p.week_start === mondayStr) ?? null
  })

  function getMealsForPlan(planId: string) {
    return meals.value.filter((m) => m.meal_plan_id === planId)
  }

  return {
    plans,
    meals,
    loading,
    error,
    fetchPlans,
    fetchMeals,
    createPlan,
    updatePlan,
    removePlan,
    createMeal,
    updateMeal,
    removeMeal,
    currentWeekPlan,
    getMealsForPlan,
  }
})
