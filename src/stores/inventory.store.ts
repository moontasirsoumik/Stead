import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { inventoryDataService } from '@/services/data/inventory.data'
import type { InventoryItem } from '@/models/inventory.model'
import type { GroceryItem } from '@/models/grocery.model'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await inventoryDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load inventory'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await inventoryDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add item'
      throw err
    }
  }

  async function update(id: string, data: Partial<InventoryItem>) {
    error.value = null
    try {
      const updated = await inventoryDataService.update(id, data)
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
      await inventoryDataService.softDelete(id)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item'
      throw err
    }
  }

  async function recordPurchase(
    purchase: Pick<GroceryItem, 'name' | 'category'>,
    householdId: string,
    checkedOn = new Date().toISOString().slice(0, 10),
  ) {
    const normalizedName = purchase.name.trim().toLocaleLowerCase()
    const existingItem = items.value.find(
      (item) =>
        item.household_id === householdId &&
        !item.deleted &&
        item.name.trim().toLocaleLowerCase() === normalizedName,
    )

    if (existingItem) {
      return update(existingItem.id, {
        stock_status: 'enough',
        restock_needed: false,
        last_checked_date: checkedOn,
      })
    }

    return create({
      name: purchase.name.trim(),
      category: purchase.category,
      location: null,
      stock_status: 'enough',
      target_level: 'keep_1',
      restock_needed: false,
      last_checked_date: checkedOn,
      note: null,
      household_id: householdId,
      deleted: false,
    })
  }

  const lowStockItems = computed(() =>
    items.value.filter((i) =>
      i.stock_status === 'out' || i.stock_status === 'almost_finished' || i.stock_status === 'low',
    ),
  )

  const restockNeeded = computed(() =>
    items.value.filter((i) => i.restock_needed),
  )

  const groupedByCategory = computed(() => {
    const groups: Record<string, InventoryItem[]> = {}
    for (const item of items.value) {
      const cat = item.category ?? 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  })

  const groupedByLocation = computed(() => {
    const groups: Record<string, InventoryItem[]> = {}
    for (const item of items.value) {
      const loc = item.location ?? 'Unspecified'
      if (!groups[loc]) groups[loc] = []
      groups[loc].push(item)
    }
    return groups
  })

  return {
    items,
    loading,
    error,
    fetchItems,
    create,
    update,
    remove,
    recordPurchase,
    lowStockItems,
    restockNeeded,
    groupedByCategory,
    groupedByLocation,
  }
})
