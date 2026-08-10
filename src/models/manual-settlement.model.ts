import type { HouseholdEntity } from '@/models/base.model'

export type ManualSettlementVisibility = 'private' | 'public'
export type ManualSettlementDirection = 'i_owe' | 'owed_to_me'
export type ManualSettlementStatus = 'outstanding' | 'settled'

export interface ManualSettlement extends HouseholdEntity {
  owner_id: string
  visibility: ManualSettlementVisibility
  direction: ManualSettlementDirection
  counterparty_member_id: string | null
  counterparty_name: string
  amount: number
  date: string
  description: string
  note: string | null
  status: ManualSettlementStatus
  settled_at: string | null
}
