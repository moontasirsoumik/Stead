import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { groceriesDataService } from '@/services/data/groceries.data'
import type { GroceryItem } from '@/models/grocery.model'
import type { GroceryStatus } from '@/models/enums'

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<GroceryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await groceriesDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load shopping items'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<GroceryItem, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await groceriesDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add item'
      throw err
    }
  }

  async function update(id: string, data: Partial<GroceryItem>) {
    error.value = null
    try {
      const updated = await groceriesDataService.update(id, data)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update item'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await groceriesDataService.softDelete(id)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item'
      throw err
    }
  }

  async function toggleStatus(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    const nextStatus: Record<GroceryStatus, GroceryStatus> = {
      needed: 'in_cart',
      in_cart: 'bought',
      bought: 'needed',
      skipped: 'needed',
    }
    return update(id, { status: nextStatus[item.status] })
  }

  async function clearBought() {
    const boughtItems = items.value.filter((i) => i.status === 'bought')
    for (const item of boughtItems) {
      await remove(item.id)
    }
  }

  const groupedByCategory = computed(() => {
    const groups: Record<string, GroceryItem[]> = {}
    for (const item of items.value) {
      const cat = item.category ?? 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  })

  const groupedByStatus = computed(() => {
    const groups: Record<string, GroceryItem[]> = {
      needed: [],
      in_cart: [],
      bought: [],
      skipped: [],
    }
    for (const item of items.value) {
      if (groups[item.status]) {
        groups[item.status].push(item)
      }
    }
    return groups
  })

  const neededCount = computed(() =>
    items.value.filter((i) => i.status === 'needed').length,
  )

  const inCartCount = computed(() =>
    items.value.filter((i) => i.status === 'in_cart').length,
  )

  return {
    items,
    loading,
    error,
    fetchItems,
    create,
    update,
    remove,
    toggleStatus,
    clearBought,
    groupedByCategory,
    groupedByStatus,
    neededCount,
    inCartCount,
  }
})
