import type { BaseEntity } from '@/models/base.model'

export interface ExpenseSplit extends BaseEntity {
  expense_id: string
  household_id: string
  member_id: string
  amount: number      // cents — the portion owed by this member
  settled: boolean
  settled_at: string | null
}
