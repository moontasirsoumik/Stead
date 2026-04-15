import type { HouseholdEntity } from '@/models/base.model'

export interface Income extends HouseholdEntity {
  date: string
  amount: number
  source: string
  category: string
  received_by: string
  recurring: boolean
  recurring_rule: string | null
  note: string | null
}
