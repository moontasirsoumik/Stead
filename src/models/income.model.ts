import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope } from '@/models/enums'

export interface Income extends HouseholdEntity {
  date: string
  amount: number
  source: string
  category: string
  received_by: string | null
  received_by_type: 'member' | 'external'
  received_by_name: string | null
  recurring: boolean
  recurring_rule: string | null
  note: string | null
  scope: DataScope
  owner_id: string | null
}
