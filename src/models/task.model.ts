import type { HouseholdEntity } from '@/models/base.model'
import type { TaskPriority, TaskStatus } from '@/models/enums'

export interface Task extends HouseholdEntity {
  title: string
  description: string | null
  assignee: string | null
  room: string | null
  category: string | null
  due_date: string | null
  recurring_rule: string | null
  priority: TaskPriority
  status: TaskStatus
  completed_at: string | null
  note: string | null
}
