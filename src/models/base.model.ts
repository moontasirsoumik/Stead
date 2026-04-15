export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface HouseholdEntity extends BaseEntity {
  household_id: string
  updated_by?: string
  deleted: boolean
}
