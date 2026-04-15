import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notesDataService } from '@/services/data/notes.data'
import type { Note } from '@/models/note.model'

export const useNotesStore = defineStore('notes', () => {
  const items = ref<Note[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNotes(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await notesDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load notes'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await notesDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create note'
      throw err
    }
  }

  async function update(id: string, data: Partial<Note>) {
    error.value = null
    try {
      const updated = await notesDataService.update(id, data)
      const idx = items.value.findIndex((n) => n.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update note'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await notesDataService.softDelete(id)
      const idx = items.value.findIndex((n) => n.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete note'
      throw err
    }
  }

  async function togglePin(id: string) {
    const note = items.value.find((n) => n.id === id)
    if (!note) return
    return update(id, { pinned: !note.pinned })
  }

  const pinnedNotes = computed(() =>
    items.value.filter((n) => n.pinned),
  )

  const recentNotes = computed(() =>
    [...items.value].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    ),
  )

  function filteredByCategory(category: string) {
    return items.value.filter((n) => n.category === category)
  }

  return {
    items,
    loading,
    error,
    fetchNotes,
    create,
    update,
    remove,
    togglePin,
    pinnedNotes,
    recentNotes,
    filteredByCategory,
  }
})
