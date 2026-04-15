import type { HouseholdEntity } from '@/models/base.model'
import type { ReminderStatus } from '@/models/enums'

export interface Reminder extends HouseholdEntity {
  title: string
  type: string | null
  linked_entity_type: string | null
  linked_entity_id: string | null
  due_date: string | null
  repeat_rule: string | null
  assigned_to: string | null
  status: ReminderStatus
  note: string | null
}
