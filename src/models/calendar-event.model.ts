import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope, Visibility } from '@/models/enums'

export interface CalendarEvent extends HouseholdEntity {
  title: string
  description: string | null
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  all_day: boolean
  category: string | null
  assigned_to: string | null
  scope: DataScope
  owner_id: string | null
  recurring_rule: string | null
  color: string | null
  note: string | null
  visibility: Visibility
}
