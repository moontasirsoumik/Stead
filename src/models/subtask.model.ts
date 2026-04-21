import type { HouseholdEntity } from '@/models/base.model'

export interface Subtask extends HouseholdEntity {
  task_id: string
  title: string
  done: boolean
  order: number
}
