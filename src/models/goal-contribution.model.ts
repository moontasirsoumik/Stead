import type { HouseholdEntity } from '@/models/base.model'

export interface GoalContribution extends HouseholdEntity {
  goal_id: string
  amount: number
  date: string
  contributed_by: string
  note: string | null
}
