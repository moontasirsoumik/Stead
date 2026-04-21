import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { expenseSplitsDataService } from '@/services/data/expense-splits.data'
import type { ExpenseSplit } from '@/models/expense-split.model'

export const useExpenseSplitsStore = defineStore('expense-splits', () => {
  const splits = ref<ExpenseSplit[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function fetchByHousehold(householdId: string) {
    loading.value = true
    error.value = null
    try {
      splits.value = await expenseSplitsDataService.getByHousehold(householdId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load splits'
    } finally {
      loading.value = false
    }
  }

  async function upsertForExpense(
    expenseId: string,
    householdId: string,
    newSplits: Array<{ member_id: string; amount: number }>,
  ) {
    const fresh = await expenseSplitsDataService.upsertForExpense(expenseId, householdId, newSplits)
    // Merge into local splits
    splits.value = [
      ...splits.value.filter((s) => s.expense_id !== expenseId),
      ...fresh,
    ]
    return fresh
  }

  async function settle(splitId: string) {
    await expenseSplitsDataService.settle(splitId)
    const s = splits.value.find((x) => x.id === splitId)
    if (s) {
      s.settled = true
      s.settled_at = new Date().toISOString()
    }
  }

  async function deleteByExpense(expenseId: string) {
    await expenseSplitsDataService.deleteByExpense(expenseId)
    splits.value = splits.value.filter((s) => s.expense_id !== expenseId)
  }

  /** Splits where the given member OWES someone else (they didn't pay but have a share) */
  function owedByMember(memberId: string, paidByMap: Record<string, string>): ExpenseSplit[] {
    return splits.value.filter(
      (s) => s.member_id === memberId && paidByMap[s.expense_id] !== memberId && !s.settled,
    )
  }

  /** Splits on expenses paid by this member (others owe them) */
  function owedToMember(memberId: string, paidByMap: Record<string, string>): ExpenseSplit[] {
    return splits.value.filter(
      (s) => paidByMap[s.expense_id] === memberId && s.member_id !== memberId && !s.settled,
    )
  }

  /** Total cents the member owes to others */
  function totalOwedByMember(memberId: string, paidByMap: Record<string, string>): number {
    return owedByMember(memberId, paidByMap).reduce((sum, s) => sum + s.amount, 0)
  }

  /** Total cents others owe the member */
  function totalOwedToMember(memberId: string, paidByMap: Record<string, string>): number {
    return owedToMember(memberId, paidByMap).reduce((sum, s) => sum + s.amount, 0)
  }

  /** Per-member breakdown of what they owe this member */
  function perMemberOwedTo(
    memberId: string,
    paidByMap: Record<string, string>,
  ): Array<{ member_id: string; amount: number; splits: ExpenseSplit[] }> {
    const byMember: Record<string, ExpenseSplit[]> = {}
    for (const s of owedToMember(memberId, paidByMap)) {
      if (!byMember[s.member_id]) byMember[s.member_id] = []
      byMember[s.member_id].push(s)
    }
    return Object.entries(byMember).map(([mid, ss]) => ({
      member_id: mid,
      amount: ss.reduce((sum, s) => sum + s.amount, 0),
      splits: ss,
    }))
  }

  /** Per-person breakdown of what this member owes */
  function perMemberOwedBy(
    memberId: string,
    paidByMap: Record<string, string>,
  ): Array<{ member_id: string; amount: number; splits: ExpenseSplit[] }> {
    const byPayer: Record<string, ExpenseSplit[]> = {}
    for (const s of owedByMember(memberId, paidByMap)) {
      const payer = paidByMap[s.expense_id]
      if (!payer) continue
      if (!byPayer[payer]) byPayer[payer] = []
      byPayer[payer].push(s)
    }
    return Object.entries(byPayer).map(([mid, ss]) => ({
      member_id: mid,
      amount: ss.reduce((sum, s) => sum + s.amount, 0),
      splits: ss,
    }))
  }

  const splitsById = computed<Record<string, ExpenseSplit[]>>(() => {
    const map: Record<string, ExpenseSplit[]> = {}
    for (const s of splits.value) {
      if (!map[s.expense_id]) map[s.expense_id] = []
      map[s.expense_id].push(s)
    }
    return map
  })

  return {
    splits,
    loading,
    error,
    splitsById,
    fetchByHousehold,
    upsertForExpense,
    settle,
    deleteByExpense,
    owedByMember,
    owedToMember,
    totalOwedByMember,
    totalOwedToMember,
    perMemberOwedTo,
    perMemberOwedBy,
  }
})
