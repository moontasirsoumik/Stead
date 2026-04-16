import type { HouseholdEntity } from '@/models/base.model'
import type { DataScope } from '@/models/enums'

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
  scope: DataScope
  owner_id: string | null
}
