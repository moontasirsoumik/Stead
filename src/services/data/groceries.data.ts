import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { grocerySchema } from '@/schemas/grocery.schema'
import type { GroceryItem } from '@/models/grocery.model'

export const groceriesDataService = new BaseDataService<GroceryItem>(
  'groceries',
  db.groceries,
  grocerySchema,
)
