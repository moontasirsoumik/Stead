import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { calendarEventSchema } from '@/schemas/calendar-event.schema'
import type { CalendarEvent } from '@/models/calendar-event.model'

export const calendarEventsDataService = new BaseDataService<CalendarEvent>(
  'calendar_events',
  db.calendar_events,
  calendarEventSchema,
)
