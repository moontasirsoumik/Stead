import type { HouseholdEntity } from './base.model'
import type { HabitFrequency } from './enums'

export interface Habit extends HouseholdEntity {
  owner_id: string
  name: string
  description: string | null
  frequency: HabitFrequency
  target_days: string | null
  color: string | null
  active: boolean
}

export interface HabitLog {
  id: string
  habit_id: string
  household_id: string
  owner_id: string
  log_date: string
  completed: boolean
  note: string | null
  created_at: string
}
