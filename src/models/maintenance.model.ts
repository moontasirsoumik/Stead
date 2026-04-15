import type { HouseholdEntity } from '@/models/base.model'
import type { MaintenanceStatus } from '@/models/enums'

export interface MaintenanceItem extends HouseholdEntity {
  item: string
  type: string | null
  last_done_date: string | null
  next_due_date: string | null
  recurring_rule: string | null
  estimated_cost: number | null
  assigned_to: string | null
  vendor: string | null
  contact: string | null
  status: MaintenanceStatus
  note: string | null
}
