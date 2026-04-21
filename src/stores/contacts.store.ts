import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contactsDataService } from '@/services/data/contacts.data'
import type { Contact } from '@/models/contact.model'

export const useContactsStore = defineStore('contacts', () => {
  const items = ref<Contact[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchContacts(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await contactsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load contacts'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await contactsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create contact'
      throw err
    }
  }

  async function update(id: string, data: Partial<Contact>) {
    error.value = null
    try {
      const updated = await contactsDataService.update(id, data)
      const idx = items.value.findIndex((c) => c.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update contact'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await contactsDataService.softDelete(id)
      const idx = items.value.findIndex((c) => c.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete contact'
      throw err
    }
  }

  const sortedByName = computed(() =>
    [...items.value].sort((a, b) => a.name.localeCompare(b.name)),
  )

  return {
    items,
    loading,
    error,
    fetchContacts,
    create,
    update,
    remove,
    sortedByName,
  }
})
