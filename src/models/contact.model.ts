import type { HouseholdEntity } from './base.model'

export interface Contact extends HouseholdEntity {
  name: string
  role: string
  phone: string
  email: string
  address: string
  company: string
  note: string
  category: string
}
