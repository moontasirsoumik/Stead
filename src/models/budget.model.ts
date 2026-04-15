import type { HouseholdEntity } from '@/models/base.model'

export interface Budget extends HouseholdEntity {
  month: string
  category: string
  budget_amount: number
}
