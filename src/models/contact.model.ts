import type { HouseholdEntity } from './base.model'

export interface Contact extends HouseholdEntity {
  name: string
  role: string | null
  phone: string | null
  email: string | null
  address: string | null
  company: string | null
  note: string | null
  category: string | null
}
