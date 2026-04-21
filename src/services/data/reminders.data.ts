import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { reminderSchema } from '@/schemas/reminder.schema'
import type { Reminder } from '@/models/reminder.model'

export const remindersDataService = new BaseDataService<Reminder>(
  'reminders',
  db.reminders,
  reminderSchema,
)
