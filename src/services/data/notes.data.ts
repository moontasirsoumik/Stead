import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { noteSchema } from '@/schemas/note.schema'
import type { Note } from '@/models/note.model'

export const notesDataService = new BaseDataService<Note>(
  'notes',
  db.notes,
  noteSchema,
)
