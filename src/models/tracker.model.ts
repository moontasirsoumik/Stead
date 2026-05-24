import type { HouseholdEntity } from './base.model'
import type { DataScope, TrackerValueType, TargetDirection } from './enums'

export interface Tracker extends HouseholdEntity {
  owner_id: string | null
  scope: DataScope
  name: string
  description: string | null
  icon: string | null
  color: string | null
  value_type: TrackerValueType
  unit: string | null
  categories: string | null
  target_value: number | null
  target_direction: TargetDirection | null
  is_cyclic: boolean
  position: number
}

export interface TrackerEntry extends HouseholdEntity {
  tracker_id: string
  entry_date: string
  numeric_value: number | null
  text_value: string | null
  boolean_value: boolean | null
  notes: string | null
  tags: string | null
}
