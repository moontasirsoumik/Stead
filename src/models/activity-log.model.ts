import type { ActivityOperation } from '@/models/enums'

export interface ActivityLogEntry {
  id: string
  household_id: string
  timestamp: string
  actor_id: string | null
  entity_type: string
  entity_id: string
  operation: ActivityOperation
  summary: string | null
}
