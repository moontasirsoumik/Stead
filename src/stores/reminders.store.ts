import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { remindersDataService } from '@/services/data/reminders.data'
import type { Reminder } from '@/models/reminder.model'

export const useRemindersStore = defineStore('reminders', () => {
  const items = ref<Reminder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReminders(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await remindersDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load reminders'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await remindersDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create reminder'
      throw err
    }
  }

  async function update(id: string, data: Partial<Reminder>) {
    error.value = null
    try {
      const updated = await remindersDataService.update(id, data)
      const idx = items.value.findIndex((r) => r.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update reminder'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await remindersDataService.softDelete(id)
      const idx = items.value.findIndex((r) => r.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete reminder'
      throw err
    }
  }

  async function snooze(id: string) {
    return update(id, { status: 'snoozed' })
  }

  async function dismiss(id: string) {
    return update(id, { status: 'dismissed' })
  }

  async function markDone(id: string) {
    return update(id, { status: 'done' })
  }

  const activeReminders = computed(() =>
    items.value.filter((r) => r.status === 'active'),
  )

  const overdueReminders = computed(() =>
    items.value.filter((r) => {
      if (r.status !== 'active') return false
      if (!r.due_date) return false
      return new Date(r.due_date) < new Date(new Date().toDateString())
    }),
  )

  const upcomingReminders = computed(() => {
    const now = new Date()
    const weekFromNow = new Date(now)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    return items.value.filter((r) => {
      if (r.status !== 'active') return false
      if (!r.due_date) return false
      const d = new Date(r.due_date)
      return d >= new Date(now.toDateString()) && d <= weekFromNow
    })
  })

  const groupedByDate = computed(() => {
    const sorted = [...items.value]
      .filter((r) => r.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

    const groups: Record<string, Reminder[]> = {}
    for (const r of sorted) {
      const key = new Date(r.due_date!).toDateString()
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }

    const noDue = items.value.filter((r) => !r.due_date)
    if (noDue.length) {
      groups['No date'] = noDue
    }

    return groups
  })

  return {
    items,
    loading,
    error,
    fetchReminders,
    create,
    update,
    remove,
    snooze,
    dismiss,
    markDone,
    activeReminders,
    overdueReminders,
    upcomingReminders,
    groupedByDate,
  }
})
