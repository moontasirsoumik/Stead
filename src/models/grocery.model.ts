import type { HouseholdEntity } from '@/models/base.model'
import type { GroceryStatus, TaskPriority } from '@/models/enums'

export interface GroceryItem extends HouseholdEntity {
  name: string
  quantity: number
  unit: string | null
  category: string | null
  priority: TaskPriority
  assigned_to: string | null
  status: GroceryStatus
  preferred_store: string | null
  note: string | null
}
