import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { billSchema } from '@/schemas/bill.schema'
import type { Bill } from '@/models/bill.model'

export const billsDataService = new BaseDataService<Bill>(
  'bills',
  db.bills,
  billSchema,
)
