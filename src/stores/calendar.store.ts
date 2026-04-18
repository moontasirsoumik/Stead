import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { calendarEventsDataService } from '@/services/data/calendar-events.data'
import { useTasksStore } from '@/stores/tasks.store'
import { useRemindersStore } from '@/stores/reminders.store'
import { useBillsStore } from '@/stores/bills.store'
import { useAppStore } from '@/stores/app.store'
import type { CalendarEvent } from '@/models/calendar-event.model'
import type { DataScope } from '@/models/enums'

export interface CalendarItem {
  id: string
  title: string
  date: string
  end_date: string | null
  time: string | null
  all_day: boolean
  source: 'event' | 'task' | 'reminder' | 'bill'
  color: string | null
  category: string | null
  status: string | null
  assigned_to: string | null
  original_id: string
}

export const useCalendarStore = defineStore('calendar', () => {
  const items = ref<CalendarEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEvents(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await calendarEventsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load calendar events'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await calendarEventsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create event'
      throw err
    }
  }

  async function update(id: string, data: Partial<CalendarEvent>) {
    error.value = null
    try {
      const updated = await calendarEventsDataService.update(id, data)
      const idx = items.value.findIndex((e) => e.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update event'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await calendarEventsDataService.softDelete(id)
      const idx = items.value.findIndex((e) => e.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete event'
      throw err
    }
  }

  /** Aggregate all sources into a unified CalendarItem list for a given month */
  function getItemsForMonth(year: number, month: number): CalendarItem[] {
    const appStore = useAppStore()
    const tasksStore = useTasksStore()
    const remindersStore = useRemindersStore()
    const billsStore = useBillsStore()

    const pad = (n: number) => String(n).padStart(2, '0')
    const monthStr = `${year}-${pad(month)}`
    const result: CalendarItem[] = []

    // Calendar events
    for (const ev of items.value) {
      if (appStore.isPersonal && ev.scope !== 'personal') continue
      if (!appStore.isPersonal && ev.scope === 'personal') continue
      if (ev.start_date.startsWith(monthStr)) {
        result.push({
          id: `event-${ev.id}`,
          title: ev.title,
          date: ev.start_date,
          end_date: ev.end_date,
          time: ev.start_time,
          all_day: ev.all_day,
          source: 'event',
          color: ev.color,
          category: ev.category,
          status: null,
          assigned_to: ev.assigned_to,
          original_id: ev.id,
        })
      }
    }

    // Tasks with due dates
    for (const task of tasksStore.items) {
      if (!task.due_date) continue
      if (task.status === 'done' || task.status === 'skipped') continue
      if (appStore.isPersonal && task.scope !== 'personal') continue
      if (!appStore.isPersonal && task.scope === 'personal') continue
      if (task.due_date.startsWith(monthStr)) {
        result.push({
          id: `task-${task.id}`,
          title: task.title,
          date: task.due_date,
          end_date: null,
          time: null,
          all_day: true,
          source: 'task',
          color: null,
          category: task.category,
          status: task.status,
          assigned_to: task.assignee,
          original_id: task.id,
        })
      }
    }

    // Reminders with due dates
    for (const rem of remindersStore.items) {
      if (!rem.due_date) continue
      if (rem.status === 'done' || rem.status === 'dismissed') continue
      if (rem.due_date.startsWith(monthStr)) {
        result.push({
          id: `reminder-${rem.id}`,
          title: rem.title,
          date: rem.due_date,
          end_date: null,
          time: null,
          all_day: true,
          source: 'reminder',
          color: null,
          category: rem.type,
          status: rem.status,
          assigned_to: rem.assigned_to,
          original_id: rem.id,
        })
      }
    }

    // Bills mapped to this month
    if (!appStore.isPersonal) {
      for (const bill of billsStore.items) {
        if (bill.status === 'paid') continue
        const dueDay = Math.min(bill.due_day, new Date(year, month, 0).getDate())
        const billDate = `${year}-${pad(month)}-${pad(dueDay)}`
        result.push({
          id: `bill-${bill.id}`,
          title: bill.name,
          date: billDate,
          end_date: null,
          time: null,
          all_day: true,
          source: 'bill',
          color: null,
          category: bill.category,
          status: bill.status,
          assigned_to: bill.paid_by,
          original_id: bill.id,
        })
      }
    }

    return result.sort((a, b) => a.date.localeCompare(b.date))
  }

  /** Get items for a specific date string (YYYY-MM-DD) */
  function getItemsForDate(dateStr: string): CalendarItem[] {
    const [yearStr, monthStr] = dateStr.split('-')
    const allMonth = getItemsForMonth(Number(yearStr), Number(monthStr))
    return allMonth.filter((item) => item.date === dateStr)
  }

  const eventCount = computed(() => items.value.length)

  return {
    items,
    loading,
    error,
    fetchEvents,
    create,
    update,
    remove,
    getItemsForMonth,
    getItemsForDate,
    eventCount,
  }
})
