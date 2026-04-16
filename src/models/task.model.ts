import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope, TaskPriority, TaskStatus, TaskType } from '@/models/enums'

export interface Task extends HouseholdEntity {
  title: string
  description: string | null
  task_type: TaskType
  assignee: string | null
  created_by: string | null
  room: string | null
  category: string | null
  due_date: string | null
  recurring_rule: string | null
  priority: TaskPriority
  status: TaskStatus
  completed_at: string | null
  last_done_date: string | null
  estimated_cost: number | null
  vendor: string | null
  contact: string | null
  note: string | null
  scope: DataScope
  owner_id: string | null
  rotation_enabled: boolean
  rotation_members: string
  rotation_index: number
}
