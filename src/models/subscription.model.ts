import type { HouseholdEntity } from './base.model'
import type { SubscriptionFrequency, SubscriptionStatus } from './enums'

export interface Subscription extends HouseholdEntity {
  owner_id: string
  name: string
  amount: number
  frequency: SubscriptionFrequency
  category: string
  next_billing_date: string | null
  auto_renew: boolean
  url: string
  note: string
  status: SubscriptionStatus
}
