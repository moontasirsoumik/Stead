import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { manualSettlementSchema } from '@/schemas/manual-settlement.schema'
import type { ManualSettlement } from '@/models/manual-settlement.model'

const tableName = 'manual_settlements'
const dexieTable = db.manual_settlements

export const manualSettlementsDataService = {
  async getAll(householdId: string): Promise<ManualSettlement[]> {
    const cached = await dexieTable
      .where('household_id')
      .equals(householdId)
      .and((item) => !item.deleted)
      .toArray()

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('household_id', householdId)
        .eq('deleted', false)
        .order('date', { ascending: false })
        .limit(200)

      if (error) throw error

      const fresh = (data as unknown[]).map((row) => manualSettlementSchema.parse(row) as ManualSettlement)
      await dexieTable.bulkPut(fresh)
      return fresh
    } catch (err) {
      console.error(`[${tableName}] revalidation failed:`, err)
      return cached
    }
  },

  async create(payload: Omit<ManualSettlement, 'id' | 'created_at' | 'updated_at'>): Promise<ManualSettlement> {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload as Record<string, unknown>)
      .select('*')
      .single()

    if (error) throw error

    const validated = manualSettlementSchema.parse(data) as ManualSettlement
    await dexieTable.put(validated)
    return validated
  },

  async update(id: string, payload: Partial<ManualSettlement>): Promise<ManualSettlement> {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    const validated = manualSettlementSchema.parse(data) as ManualSettlement
    await dexieTable.put(validated)
    return validated
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from(tableName)
      .update({ deleted: true })
      .eq('id', id)

    if (error) throw error
    await dexieTable.delete(id)
  },
}
