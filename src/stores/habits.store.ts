import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { habitsDataService, habitLogsDataService } from '@/services/data/habits.data'
import type { Habit, HabitLog } from '@/models/habit.model'

export const useHabitsStore = defineStore('habits', () => {
  const items = ref<Habit[]>([])
  const logs = ref<HabitLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchHabits(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await habitsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load habits'
    } finally {
      loading.value = false
    }
  }

  async function fetchLogs(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await habitLogsDataService.getAll(householdId)
      logs.value = result.cached
      if (result.fresh) {
        logs.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load habit logs'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await habitsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create habit'
      throw err
    }
  }

  async function update(id: string, data: Partial<Habit>) {
    error.value = null
    try {
      const updated = await habitsDataService.update(id, data)
      const idx = items.value.findIndex((h) => h.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update habit'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await habitsDataService.softDelete(id)
      const idx = items.value.findIndex((h) => h.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete habit'
      throw err
    }
  }

  async function toggleLog(habitId: string, date: string) {
    error.value = null
    try {
      const existing = logs.value.find(
        (l) => l.habit_id === habitId && l.log_date === date,
      )
      if (existing) {
        await habitLogsDataService.softDelete(existing.id)
        const idx = logs.value.findIndex((l) => l.id === existing.id)
        if (idx !== -1) logs.value.splice(idx, 1)
      } else {
        const habit = items.value.find((h) => h.id === habitId)
        if (!habit) return
        const created = await habitLogsDataService.create({
          habit_id: habitId,
          household_id: habit.household_id,
          owner_id: habit.owner_id,
          log_date: date,
          completed: true,
          note: '',
        })
        logs.value.push(created)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle habit log'
      throw err
    }
  }

  const activeHabits = computed(() =>
    items.value.filter((h) => h.active),
  )

  function getLogsForDate(date: string) {
    return logs.value.filter((l) => l.log_date === date)
  }

  function getStreak(habitId: string): number {
    const today = new Date()
    let streak = 0
    let current = new Date(today)

    while (true) {
      const dateStr = current.toISOString().slice(0, 10)
      const hasLog = logs.value.some(
        (l) => l.habit_id === habitId && l.log_date === dateStr && l.completed,
      )
      if (!hasLog) break
      streak++
      current.setDate(current.getDate() - 1)
    }

    return streak
  }

  return {
    items,
    logs,
    loading,
    error,
    fetchHabits,
    fetchLogs,
    create,
    update,
    remove,
    toggleLog,
    activeHabits,
    getLogsForDate,
    getStreak,
  }
})
