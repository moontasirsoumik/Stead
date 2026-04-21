import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { journalEntrySchema } from '@/schemas/journal.schema'
import type { JournalEntry } from '@/models/journal.model'

export const journalDataService = new BaseDataService<JournalEntry>(
  'journal_entries',
  db.journal_entries,
  journalEntrySchema,
)
