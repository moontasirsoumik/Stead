import { supabase } from '@/lib/supabase'
import { householdSchema } from '@/schemas/household.schema'
import type { Household } from '@/models/household.model'

/**
 * Household data service — no Dexie cache (single record, stored in Pinia).
 * Household is fetched by its own ID; it IS the root entity.
 */
export const householdDataService = {
  async getById(id: string): Promise<Household | undefined> {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return undefined

    return householdSchema.parse(data)
  },

  async update(id: string, payload: Partial<Household>): Promise<Household> {
    const { data, error } = await supabase
      .from('households')
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return householdSchema.parse(data)
  },
}
