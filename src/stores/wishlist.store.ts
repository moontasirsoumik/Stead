import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wishlistDataService } from '@/services/data/wishlist.data'
import type { WishlistItem } from '@/models/wishlist.model'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<WishlistItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await wishlistDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load wishlist items'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<WishlistItem, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await wishlistDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create wishlist item'
      throw err
    }
  }

  async function update(id: string, data: Partial<WishlistItem>) {
    error.value = null
    try {
      const updated = await wishlistDataService.update(id, data)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update wishlist item'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await wishlistDataService.softDelete(id)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete wishlist item'
      throw err
    }
  }

  const wantedItems = computed(() =>
    items.value.filter((i) => i.status === 'wanted'),
  )

  const savingItems = computed(() =>
    items.value.filter((i) => i.status === 'saving'),
  )

  const boughtItems = computed(() =>
    items.value.filter((i) => i.status === 'bought'),
  )

  const totalWishlistValue = computed(() =>
    items.value
      .filter((i) => i.status === 'wanted' || i.status === 'saving')
      .reduce((sum, i) => sum + i.price, 0),
  )

  return {
    items,
    loading,
    error,
    fetchItems,
    create,
    update,
    remove,
    wantedItems,
    savingItems,
    boughtItems,
    totalWishlistValue,
  }
})
