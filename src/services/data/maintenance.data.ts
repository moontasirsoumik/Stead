import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { maintenanceSchema } from '@/schemas/maintenance.schema'
import type { MaintenanceItem } from '@/models/maintenance.model'

export const maintenanceDataService = new BaseDataService<MaintenanceItem>(
  'maintenance',
  db.maintenance,
  maintenanceSchema,
)
