import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { documentsDataService } from '@/services/data/documents.data'
import type { HouseholdDocument } from '@/models/document.model'
import type { DocType } from '@/models/enums'

export const useDocumentsStore = defineStore('documents', () => {
  const items = ref<HouseholdDocument[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDocuments(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await documentsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load documents'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<HouseholdDocument, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await documentsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create document'
      throw err
    }
  }

  async function update(id: string, data: Partial<HouseholdDocument>) {
    error.value = null
    try {
      const updated = await documentsDataService.update(id, data)
      const idx = items.value.findIndex((d) => d.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update document'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await documentsDataService.softDelete(id)
      const idx = items.value.findIndex((d) => d.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document'
      throw err
    }
  }

  const expiringSoon = computed(() => {
    const now = new Date()
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return items.value.filter((d) => {
      if (!d.expiry_date) return false
      const exp = new Date(d.expiry_date)
      return exp >= now && exp <= thirtyDaysOut
    })
  })

  const expired = computed(() => {
    const now = new Date()
    return items.value.filter((d) => {
      if (!d.expiry_date) return false
      return new Date(d.expiry_date) < now
    })
  })

  function byType(type: DocType) {
    return items.value.filter((d) => d.doc_type === type)
  }

  return {
    items,
    loading,
    error,
    fetchDocuments,
    create,
    update,
    remove,
    expiringSoon,
    expired,
    byType,
  }
})
