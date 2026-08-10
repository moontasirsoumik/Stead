import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope } from '@/models/enums'

export interface GoalContribution extends HouseholdEntity {
  goal_id: string
  amount: number
  date: string
  contributed_by: string | null
  contributed_by_type: 'member' | 'external'
  contributed_by_name: string | null
  note: string | null
  scope: DataScope
  owner_id: string | null
}
