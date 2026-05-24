import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { trackerSchema, trackerEntrySchema } from '@/schemas/tracker.schema'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

export const trackersDataService = new BaseDataService<Tracker>(
  'trackers',
  db.trackers,
  trackerSchema,
)

export const trackerEntriesDataService = new BaseDataService<TrackerEntry>(
  'tracker_entries',
  db.tracker_entries,
  trackerEntrySchema,
  '*',
  true,
  2000,
)
