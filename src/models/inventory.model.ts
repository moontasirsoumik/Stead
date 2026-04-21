import type { HouseholdEntity } from '@/models/base.model'
import type { StockStatus, TargetLevel } from '@/models/enums'

export interface InventoryItem extends HouseholdEntity {
  name: string
  category: string | null
  location: string | null
  stock_status: StockStatus
  target_level: TargetLevel
  restock_needed: boolean
  last_checked_date: string | null
  note: string | null
}
