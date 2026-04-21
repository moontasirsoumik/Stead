import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { incomeSchema } from '@/schemas/income.schema'
import type { Income } from '@/models/income.model'

export const incomeDataService = new BaseDataService<Income>(
  'income',
  db.income,
  incomeSchema,
)
