import type { HouseholdEntity } from '@/models/base.model'
import type { BillFrequency, BillStatus } from '@/models/enums'

export interface Bill extends HouseholdEntity {
  name: string
  amount: number
  category: string
  due_day: number
  frequency: BillFrequency
  auto_pay: boolean
  paid_by: string | null
  status: BillStatus
  last_paid_date: string | null
  note: string | null
}
