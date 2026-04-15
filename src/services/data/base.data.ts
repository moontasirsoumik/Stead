import type { Table } from 'dexie'
import type { ZodType } from 'zod'
import { supabase } from '@/lib/supabase'

export interface StaleWhileRevalidateResult<T> {
  cached: T[]
  fresh: T[] | null
}

export class BaseDataService<T extends { id: string }> {
  constructor(
    protected tableName: string,
    protected dexieTable: Table<T, string>,
    protected schema: ZodType,
    protected columns: string = '*',
  ) {}

  async getAll(householdId: string): Promise<StaleWhileRevalidateResult<T>> {
    const cached = await this.dexieTable.toArray()

    let fresh: T[] | null = null
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(this.columns)
        .eq('household_id', householdId)
        .eq('deleted', false)
        .limit(100)

      if (error) throw error

      fresh = (data as unknown[]).map((row) => this.schema.parse(row) as T)
      await this.dexieTable.bulkPut(fresh)
    } catch (err) {
      console.error(`[${this.tableName}] revalidation failed:`, err)
    }

    return { cached, fresh }
  }

  async getById(id: string): Promise<T | undefined> {
    const cached = await this.dexieTable.get(id)
    if (cached) return cached

    const { data, error } = await supabase
      .from(this.tableName)
      .select(this.columns)
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return undefined

    const validated = this.schema.parse(data) as T
    await this.dexieTable.put(validated)
    return validated
  }

  async create(payload: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(payload as Record<string, unknown>)
      .select(this.columns)
      .single()

    if (error) throw error

    const validated = this.schema.parse(data) as T
    await this.dexieTable.put(validated)
    return validated
  }

  async update(id: string, payload: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select(this.columns)
      .single()

    if (error) throw error

    const validated = this.schema.parse(data) as T
    await this.dexieTable.put(validated)
    return validated
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted: true })
      .eq('id', id)

    if (error) throw error

    await this.dexieTable.delete(id)
  }
}
