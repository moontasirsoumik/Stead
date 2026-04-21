import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { taskSchema } from '@/schemas/task.schema'
import type { Task } from '@/models/task.model'

export const tasksDataService = new BaseDataService<Task>(
  'tasks',
  db.tasks,
  taskSchema,
)
