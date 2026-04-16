import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope } from '@/models/enums'

export interface GoalContribution extends HouseholdEntity {
  goal_id: string
  amount: number
  date: string
  contributed_by: string
  note: string | null
  scope: DataScope
  owner_id: string | null
}
