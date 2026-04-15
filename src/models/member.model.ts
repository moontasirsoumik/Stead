import type { BaseEntity } from '@/models/base.model'
import type { MemberRole } from '@/models/enums'

export interface Member extends BaseEntity {
  household_id: string
  user_id: string | null
  name: string
  role: MemberRole
  color: string
  active: boolean
}
