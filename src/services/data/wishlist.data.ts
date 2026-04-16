import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { wishlistItemSchema } from '@/schemas/wishlist.schema'
import type { WishlistItem } from '@/models/wishlist.model'

export const wishlistDataService = new BaseDataService<WishlistItem>(
  'wishlists',
  db.wishlists,
  wishlistItemSchema,
)
