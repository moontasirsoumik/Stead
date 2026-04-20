import type { HouseholdEntity } from './base.model'
import type { Visibility, WishlistPriority, WishlistStatus } from './enums'

export interface WishlistItem extends HouseholdEntity {
  owner_id: string
  name: string
  description: string | null
  url: string | null
  price: number | null
  priority: WishlistPriority
  status: WishlistStatus
  saved_amount: number | null
  category: string | null
  note: string | null
  visibility: Visibility
}
