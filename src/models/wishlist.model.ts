import type { HouseholdEntity } from './base.model'
import type { WishlistPriority, WishlistStatus } from './enums'

export interface WishlistItem extends HouseholdEntity {
  owner_id: string
  name: string
  description: string
  url: string
  price: number
  priority: WishlistPriority
  status: WishlistStatus
  saved_amount: number
  category: string
  note: string
}
