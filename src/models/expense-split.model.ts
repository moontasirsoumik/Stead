import type { BaseEntity } from '@/models/base.model'

export interface ExpenseSplit extends BaseEntity {
  expense_id: string
  household_id: string
  member_id: string | null
  participant_type: 'member' | 'external'
  participant_name: string | null
  amount: number
  settled: boolean
  settled_at: string | null
}
