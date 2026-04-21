import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { entityShareSchema } from '@/schemas/entity-share.schema'
import type { EntityShare } from '@/models/entity-share.model'

export const entitySharesDataService = {
  async getByEntity(entityType: string, entityId: string): Promise<EntityShare[]> {
    const cached = await db.entity_shares
      .where('[entity_type+entity_id]')
      .equals([entityType, entityId])
      .toArray()
      .catch(() =>
        db.entity_shares.filter(
          (s) => s.entity_type === entityType && s.entity_id === entityId,
        ).toArray(),
      )

    try {
      const { data, error } = await supabase
        .from('entity_shares')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) throw error
      const fresh = (data as unknown[]).map((row) => entityShareSchema.parse(row) as EntityShare)
      // Clear old cache for this entity and repopulate
      const oldIds = cached.map((s) => s.id)
      if (oldIds.length) await db.entity_shares.bulkDelete(oldIds)
      if (fresh.length) await db.entity_shares.bulkPut(fresh)
      return fresh
    } catch {
      return cached
    }
  },

  async getByHousehold(householdId: string): Promise<EntityShare[]> {
    const cached = await db.entity_shares
      .where('household_id')
      .equals(householdId)
      .toArray()

    try {
      const { data, error } = await supabase
        .from('entity_shares')
        .select('*')
        .eq('household_id', householdId)

      if (error) throw error
      const fresh = (data as unknown[]).map((row) => entityShareSchema.parse(row) as EntityShare)
      await db.entity_shares.where('household_id').equals(householdId).delete()
      if (fresh.length) await db.entity_shares.bulkPut(fresh)
      return fresh
    } catch {
      return cached
    }
  },

  async setShares(
    householdId: string,
    entityType: string,
    entityId: string,
    memberIds: string[],
  ): Promise<EntityShare[]> {
    // Delete all existing shares for this entity
    await supabase
      .from('entity_shares')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    await db.entity_shares
      .filter((s) => s.entity_type === entityType && s.entity_id === entityId)
      .delete()

    if (!memberIds.length) return []

    const rows = memberIds.map((mid) => ({
      household_id: householdId,
      entity_type: entityType,
      entity_id: entityId,
      shared_with: mid,
    }))

    const { data, error } = await supabase.from('entity_shares').insert(rows).select()
    if (error) throw error

    const fresh = (data as unknown[]).map((row) => entityShareSchema.parse(row) as EntityShare)
    if (fresh.length) await db.entity_shares.bulkPut(fresh)
    return fresh
  },

  async deleteByEntity(entityType: string, entityId: string): Promise<void> {
    await supabase
      .from('entity_shares')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    await db.entity_shares
      .filter((s) => s.entity_type === entityType && s.entity_id === entityId)
      .delete()
  },
}
