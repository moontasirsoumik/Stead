import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { expenseSchema } from '@/schemas/expense.schema'
import type { Expense } from '@/models/expense.model'

export const expensesDataService = new BaseDataService<Expense>(
  'expenses',
  db.expenses,
  expenseSchema,
)
