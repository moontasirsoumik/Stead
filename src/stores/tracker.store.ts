import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { trackersDataService, trackerEntriesDataService } from '@/services/data/tracker.data'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

export const useTrackerStore = defineStore('trackers', () => {
  const trackers = ref<Tracker[]>([])
  const entries = ref<TrackerEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTrackers(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await trackersDataService.getAll(householdId)
      trackers.value = result.cached
      if (result.fresh) {
        trackers.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load trackers'
    } finally {
      loading.value = false
    }
  }

  async function fetchEntries(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await trackerEntriesDataService.getAll(householdId)
      entries.value = result.cached
      if (result.fresh) {
        entries.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tracker entries'
    } finally {
      loading.value = false
    }
  }

  async function fetchEntriesForTracker(householdId: string, trackerId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await trackerEntriesDataService.getAllByFilter(householdId, {
        tracker_id: trackerId,
      })
      const fetched = result.fresh ?? result.cached
      // Merge: replace entries for this tracker, keep others
      entries.value = [
        ...entries.value.filter((e) => e.tracker_id !== trackerId),
        ...fetched,
      ]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tracker entries'
    } finally {
      loading.value = false
    }
  }

  async function createTracker(data: Omit<Tracker, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await trackersDataService.create(data)
      trackers.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create tracker'
      throw err
    }
  }

  async function updateTracker(id: string, data: Partial<Tracker>) {
    error.value = null
    try {
      const updated = await trackersDataService.update(id, data)
      const idx = trackers.value.findIndex((t) => t.id === id)
      if (idx !== -1) trackers.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update tracker'
      throw err
    }
  }

  async function removeTracker(id: string) {
    error.value = null
    try {
      await trackersDataService.softDelete(id)
      const idx = trackers.value.findIndex((t) => t.id === id)
      if (idx !== -1) trackers.value.splice(idx, 1)
      // Also remove associated entries from local state
      entries.value = entries.value.filter((e) => e.tracker_id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete tracker'
      throw err
    }
  }

  async function createEntry(data: Omit<TrackerEntry, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await trackerEntriesDataService.create(data)
      entries.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create entry'
      throw err
    }
  }

  async function updateEntry(id: string, data: Partial<TrackerEntry>) {
    error.value = null
    try {
      const updated = await trackerEntriesDataService.update(id, data)
      const idx = entries.value.findIndex((e) => e.id === id)
      if (idx !== -1) entries.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update entry'
      throw err
    }
  }

  async function removeEntry(id: string) {
    error.value = null
    try {
      await trackerEntriesDataService.softDelete(id)
      const idx = entries.value.findIndex((e) => e.id === id)
      if (idx !== -1) entries.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete entry'
      throw err
    }
  }

  function getEntriesForTracker(trackerId: string) {
    return entries.value
      .filter((e) => e.tracker_id === trackerId)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
  }

  const sortedTrackers = computed(() =>
    [...trackers.value].sort((a, b) => a.position - b.position),
  )

  return {
    trackers,
    entries,
    loading,
    error,
    fetchTrackers,
    fetchEntries,
    fetchEntriesForTracker,
    createTracker,
    updateTracker,
    removeTracker,
    createEntry,
    updateEntry,
    removeEntry,
    getEntriesForTracker,
    sortedTrackers,
  }
})
