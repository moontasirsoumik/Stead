import type { HouseholdEntity } from '@/models/base.model'

export interface Note extends HouseholdEntity {
  title: string
  category: string | null
  content: string
  pinned: boolean
  linked_type: string | null
  linked_id: string | null
  created_by: string | null
}
