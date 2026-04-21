import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { memberSchema } from '@/schemas/member.schema'
import type { Member } from '@/models/member.model'
import type { Table } from 'dexie'

const tableName = 'members'
const dexieTable: Table<Member, string> = db.members
const schema = memberSchema

/** Members use `active` instead of `deleted`, and have no `deleted` column. */
export const membersDataService = {
  async getAll(householdId: string) {
    const cached = await dexieTable.toArray()

    let fresh: Member[] | null = null
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('household_id', householdId)
        .limit(100)

      if (error) throw error

      fresh = (data as unknown[]).map((row) => schema.parse(row) as Member)
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

    const validated = schema.parse(data) as Member
    await dexieTable.put(validated)
    return validated
  },

  async create(payload: Omit<Member, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(payload as Record<string, unknown>)
      .select('*')
      .single()

    if (error) throw error

    const validated = schema.parse(data) as Member
    await dexieTable.put(validated)
    return validated
  },

  async update(id: string, payload: Partial<Member>) {
    const { data, error } = await supabase
      .from(tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    const validated = schema.parse(data) as Member
    await dexieTable.put(validated)
    return validated
  },

  async deactivate(id: string) {
    return this.update(id, { active: false } as Partial<Member>)
  },
}
