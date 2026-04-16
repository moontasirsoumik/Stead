import type { HouseholdEntity } from './base.model'
import type { Mood } from './enums'

export interface JournalEntry extends HouseholdEntity {
  owner_id: string
  entry_date: string
  content: string
  mood: Mood | null
  tags: string
}
