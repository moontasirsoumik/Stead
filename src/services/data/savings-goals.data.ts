import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { savingsGoalSchema } from '@/schemas/savings-goal.schema'
import type { SavingsGoal } from '@/models/savings-goal.model'

export const savingsGoalsDataService = new BaseDataService<SavingsGoal>(
  'savings_goals',
  db.savings_goals,
  savingsGoalSchema,
)
