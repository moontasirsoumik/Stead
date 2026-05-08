import type { HouseholdEntity } from './base.model'

export type BoardScope = 'household' | 'personal'

export interface Board extends HouseholdEntity {
  owner_id: string | null
  scope: BoardScope
  name: string
  description: string | null
  color: string | null
  position: number
}

export interface BoardItem extends HouseholdEntity {
  board_id: string
  name: string
  notes: string | null
  group_name: string | null
  is_checked: boolean
  position: number
}
