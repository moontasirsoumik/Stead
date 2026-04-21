import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope, GoalStatus, TaskPriority } from '@/models/enums'

export interface SavingsGoal extends HouseholdEntity {
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  priority: TaskPriority
  status: GoalStatus
  note: string | null
  scope: DataScope
  owner_id: string | null
}
