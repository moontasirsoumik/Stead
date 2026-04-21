import type { HouseholdEntity } from './base.model'
import type { DocType } from './enums'

export interface HouseholdDocument extends HouseholdEntity {
  title: string
  doc_type: DocType
  description: string | null
  issuer: string | null
  issue_date: string | null
  expiry_date: string | null
  reference_number: string | null
  note: string | null
}
