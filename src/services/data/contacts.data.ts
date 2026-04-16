import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { contactSchema } from '@/schemas/contact.schema'
import type { Contact } from '@/models/contact.model'

export const contactsDataService = new BaseDataService<Contact>(
  'contacts',
  db.contacts,
  contactSchema,
)
