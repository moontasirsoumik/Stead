import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { goalContributionSchema } from '@/schemas/goal-contribution.schema'
import type { GoalContribution } from '@/models/goal-contribution.model'
import type { Table } from 'dexie'

const tableName = 'goal_contributions'
const dexieTable: Table<GoalContribution, string> = db.goal_contributions
const schema = goalContributionSchema

/** Goal contributions are scoped by goal_id, not directly by household_id for listing. */
export const goalContributionsDataService = {
  async getAllByGoal(goalId: string) {
    const cached = await dexieTable.where('goal_id').equals(goalId).toArray()

    let fresh: GoalContribution[] | null = null
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('goal_id', goalId)
        .eq('deleted', false)
        .limit(100)

      if (error) throw error

      fresh = (data as unknown[]).map((row) => schema.parse(row) as GoalContribution)
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

    const validated = schema.parse(data) as GoalContribution
    await dexieTable.put(validated)
    return validated
  },

  async create(payload: Omit<GoalContribution, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload as Record<string, unknown>)
      .select('*')
      .single()

    if (error) throw error

    const validated = schema.parse(data) as GoalContribution
    await dexieTable.put(validated)
    return validated
  },

  async update(id: string, payload: Partial<GoalContribution>) {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    const validated = schema.parse(data) as GoalContribution
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
