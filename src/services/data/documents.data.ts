import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { documentSchema } from '@/schemas/document.schema'
import type { HouseholdDocument } from '@/models/document.model'

export const documentsDataService = new BaseDataService<HouseholdDocument>(
  'documents',
  db.documents,
  documentSchema,
)
