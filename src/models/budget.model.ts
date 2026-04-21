import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope } from '@/models/enums'

export interface Budget extends HouseholdEntity {
  month: string
  category: string
  budget_amount: number
  scope: DataScope
  owner_id: string | null
}
