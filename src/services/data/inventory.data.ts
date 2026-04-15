import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { inventorySchema } from '@/schemas/inventory.schema'
import type { InventoryItem } from '@/models/inventory.model'

export const inventoryDataService = new BaseDataService<InventoryItem>(
  'inventory',
  db.inventory,
  inventorySchema,
)
