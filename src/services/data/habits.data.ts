import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { habitSchema } from '@/schemas/habit.schema'
import { habitLogSchema } from '@/schemas/habit.schema'
import type { Habit, HabitLog } from '@/models/habit.model'

export const habitsDataService = new BaseDataService<Habit>(
  'habits',
  db.habits,
  habitSchema,
)

export const habitLogsDataService = new BaseDataService<HabitLog>(
  'habit_logs',
  db.habit_logs,
  habitLogSchema,
  '*',
  false,
)
