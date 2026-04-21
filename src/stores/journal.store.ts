import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { journalDataService } from '@/services/data/journal.data'
import type { JournalEntry } from '@/models/journal.model'

export const useJournalStore = defineStore('journal', () => {
  const items = ref<JournalEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEntries(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await journalDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load journal entries'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await journalDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create journal entry'
      throw err
    }
  }

  async function update(id: string, data: Partial<JournalEntry>) {
    error.value = null
    try {
      const updated = await journalDataService.update(id, data)
      const idx = items.value.findIndex((e) => e.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update journal entry'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await journalDataService.softDelete(id)
      const idx = items.value.findIndex((e) => e.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete journal entry'
      throw err
    }
  }

  const sortedEntries = computed(() =>
    [...items.value].sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    ),
  )

  const todayEntry = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return items.value.find((e) => e.entry_date === today) ?? null
  })

  return {
    items,
    loading,
    error,
    fetchEntries,
    create,
    update,
    remove,
    sortedEntries,
    todayEntry,
  }
})
