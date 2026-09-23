import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useInventoryStore } from '@/stores/inventory.store'
import type { InventoryItem } from '@/models/inventory.model'

const { createMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
}))

vi.mock('@/services/data/inventory.data', () => ({
  inventoryDataService: {
    create: createMock,
    update: updateMock,
  },
}))

function inventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'inventory-1',
    household_id: 'household-1',
    name: 'Milk',
    category: 'dairy',
    location: 'fridge',
    stock_status: 'low',
    target_level: 'keep_1',
    restock_needed: true,
    last_checked_date: null,
    note: null,
    deleted: false,
    created_at: '2026-09-20T10:00:00.000Z',
    updated_at: '2026-09-20T10:00:00.000Z',
    ...overrides,
  }
}

describe('inventory store purchases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('restocks an existing inventory item without creating a duplicate', async () => {
    const store = useInventoryStore()
    const existing = inventoryItem()
    const restocked = inventoryItem({
      stock_status: 'enough',
      restock_needed: false,
      last_checked_date: '2026-09-23',
    })
    store.items.push(existing)
    updateMock.mockResolvedValue(restocked)

    await store.recordPurchase(
      { name: ' milk ', category: 'dairy' },
      'household-1',
      '2026-09-23',
    )

    expect(updateMock).toHaveBeenCalledWith('inventory-1', {
      stock_status: 'enough',
      restock_needed: false,
      last_checked_date: '2026-09-23',
    })
    expect(createMock).not.toHaveBeenCalled()
    expect(store.items[0]).toEqual(restocked)
  })

  it('creates inventory for a newly purchased item', async () => {
    const store = useInventoryStore()
    const created = inventoryItem({ id: 'inventory-2', name: 'Bread', category: 'bakery' })
    createMock.mockResolvedValue(created)

    await store.recordPurchase(
      { name: 'Bread', category: 'bakery' },
      'household-1',
      '2026-09-23',
    )

    expect(createMock).toHaveBeenCalledWith({
      name: 'Bread',
      category: 'bakery',
      location: null,
      stock_status: 'enough',
      target_level: 'keep_1',
      restock_needed: false,
      last_checked_date: '2026-09-23',
      note: null,
      household_id: 'household-1',
      deleted: false,
    })
    expect(store.items).toEqual([created])
  })

  it('does not reuse an item cached for another household', async () => {
    const store = useInventoryStore()
    const otherHouseholdItem = inventoryItem({ household_id: 'household-2' })
    const created = inventoryItem({ id: 'inventory-3' })
    store.items.push(otherHouseholdItem)
    createMock.mockResolvedValue(created)

    await store.recordPurchase(
      { name: 'Milk', category: 'dairy' },
      'household-1',
      '2026-09-23',
    )

    expect(updateMock).not.toHaveBeenCalled()
    expect(createMock).toHaveBeenCalledOnce()
  })
})
