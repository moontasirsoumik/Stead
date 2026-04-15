import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { maintenanceDataService } from '@/services/data/maintenance.data'
import type { MaintenanceItem } from '@/models/maintenance.model'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const items = ref<MaintenanceItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await maintenanceDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load maintenance items'
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: Omit<MaintenanceItem, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await maintenanceDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create maintenance item'
      throw err
    }
  }

  async function updateItem(id: string, data: Partial<MaintenanceItem>) {
    error.value = null
    try {
      const updated = await maintenanceDataService.update(id, data)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update maintenance item'
      throw err
    }
  }

  async function removeItem(id: string) {
    error.value = null
    try {
      await maintenanceDataService.softDelete(id)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete maintenance item'
      throw err
    }
  }

  async function markDone(id: string) {
    return updateItem(id, {
      status: 'done',
      last_done_date: new Date().toISOString(),
    })
  }

  async function skip(id: string) {
    return updateItem(id, { status: 'skipped' })
  }

  const overdueItems = computed(() =>
    items.value.filter((i) => {
      if (i.status === 'done' || i.status === 'skipped') return false
      if (!i.next_due_date) return false
      return new Date(i.next_due_date) < new Date(new Date().toDateString())
    }),
  )

  const upcomingItems = computed(() =>
    items.value
      .filter((i) => i.status === 'upcoming')
      .sort((a, b) => {
        if (!a.next_due_date) return 1
        if (!b.next_due_date) return -1
        return a.next_due_date.localeCompare(b.next_due_date)
      }),
  )

  const groupedByStatus = computed(() => {
    const groups: Record<string, MaintenanceItem[]> = {
      upcoming: [],
      overdue: [],
      done: [],
      skipped: [],
    }
    for (const item of items.value) {
      if (groups[item.status]) {
        groups[item.status].push(item)
      }
    }
    return groups
  })

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    removeItem,
    markDone,
    skip,
    overdueItems,
    upcomingItems,
    groupedByStatus,
  }
})
