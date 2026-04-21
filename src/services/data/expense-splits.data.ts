import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { expenseSplitSchema } from '@/schemas/expense-split.schema'
import type { ExpenseSplit } from '@/models/expense-split.model'

export const expenseSplitsDataService = {
  async getByExpense(expenseId: string): Promise<ExpenseSplit[]> {
    const cached = await db.expense_splits.where('expense_id').equals(expenseId).toArray()

    try {
      const { data, error } = await supabase
        .from('expense_splits')
        .select('*')
        .eq('expense_id', expenseId)

      if (error) throw error
      const fresh = (data as unknown[]).map((row) => expenseSplitSchema.parse(row) as ExpenseSplit)
      await db.expense_splits.bulkPut(fresh)
      return fresh
    } catch {
      return cached
    }
  },

  async getByHousehold(householdId: string): Promise<ExpenseSplit[]> {
    const cached = await db.expense_splits.where('household_id').equals(householdId).toArray()

    try {
      const { data, error } = await supabase
        .from('expense_splits')
        .select('*')
        .eq('household_id', householdId)

      if (error) throw error
      const fresh = (data as unknown[]).map((row) => expenseSplitSchema.parse(row) as ExpenseSplit)
      await db.expense_splits.bulkPut(fresh)
      return fresh
    } catch {
      return cached
    }
  },

  async upsertForExpense(
    expenseId: string,
    householdId: string,
    splits: Array<{ member_id: string; amount: number }>,
  ): Promise<ExpenseSplit[]> {
    // Delete existing splits for this expense first
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId)
    await db.expense_splits.where('expense_id').equals(expenseId).delete()

    if (!splits.length) return []

    const rows = splits.map((s) => ({
      expense_id: expenseId,
      household_id: householdId,
      member_id: s.member_id,
      amount: s.amount,
      settled: false,
      settled_at: null,
    }))

    const { data, error } = await supabase.from('expense_splits').insert(rows).select()
    if (error) throw error

    const fresh = (data as unknown[]).map((row) => expenseSplitSchema.parse(row) as ExpenseSplit)
    await db.expense_splits.bulkPut(fresh)
    return fresh
  },

  async settle(splitId: string): Promise<void> {
    const now = new Date().toISOString()
    await supabase
      .from('expense_splits')
      .update({ settled: true, settled_at: now })
      .eq('id', splitId)
    await db.expense_splits.update(splitId, { settled: true, settled_at: now })
  },

  async deleteByExpense(expenseId: string): Promise<void> {
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId)
    await db.expense_splits.where('expense_id').equals(expenseId).delete()
  },
}
