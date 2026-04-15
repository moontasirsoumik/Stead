import type { HouseholdEntity } from '@/models/base.model'

export interface Expense extends HouseholdEntity {
  date: string
  amount: number
  category: string
  subcategory: string | null
  description: string
  paid_by: string
  shared: boolean
  tags: string[] | null
  note: string | null
}
