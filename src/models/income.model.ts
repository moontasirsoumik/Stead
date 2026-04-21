import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope } from '@/models/enums'

export interface Income extends HouseholdEntity {
  date: string
  amount: number
  source: string
  category: string
  received_by: string
  recurring: boolean
  recurring_rule: string | null
  note: string | null
  scope: DataScope
  owner_id: string | null
}
