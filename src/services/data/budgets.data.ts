import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { budgetSchema } from '@/schemas/budget.schema'
import type { Budget } from '@/models/budget.model'

export const budgetsDataService = new BaseDataService<Budget>(
  'budgets',
  db.budgets,
  budgetSchema,
)
