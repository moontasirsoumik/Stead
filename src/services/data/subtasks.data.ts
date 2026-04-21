import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { subtaskSchema } from '@/schemas/subtask.schema'
import type { Subtask } from '@/models/subtask.model'
import type { Table } from 'dexie'

const tableName = 'subtasks'
const dexieTable: Table<Subtask, string> = db.subtasks
const schema = subtaskSchema

/** Subtasks are scoped by task_id. */
export const subtasksDataService = {
  async getAllByTask(taskId: string) {
    const cached = await dexieTable.where('task_id').equals(taskId).toArray()

    let fresh: Subtask[] | null = null
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('task_id', taskId)
        .eq('deleted', false)
        .limit(100)

      if (error) throw error

      fresh = (data as unknown[]).map((row) => schema.parse(row) as Subtask)
      await dexieTable.bulkPut(fresh)
    } catch (err) {
      console.error(`[${tableName}] revalidation failed:`, err)
    }

    return { cached, fresh }
  },

  async getById(id: string) {
    const cached = await dexieTable.get(id)
    if (cached) return cached

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return undefined

    const validated = schema.parse(data) as Subtask
    await dexieTable.put(validated)
    return validated
  },

  async create(payload: Omit<Subtask, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload as Record<string, unknown>)
      .select('*')
      .single()

    if (error) throw error

    const validated = schema.parse(data) as Subtask
    await dexieTable.put(validated)
    return validated
  },

  async update(id: string, payload: Partial<Subtask>) {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    const validated = schema.parse(data) as Subtask
    await dexieTable.put(validated)
    return validated
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted: true })
      .eq('id', id)

    if (error) throw error

    await dexieTable.delete(id)
  },
}
