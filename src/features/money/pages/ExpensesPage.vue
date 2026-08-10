<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SButton from '@/components/ui/SButton.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SToggle from '@/components/ui/SToggle.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import MonthSummary from '@/features/money/components/MonthSummary.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import { useExpensesStore } from '@/stores/expenses.store'
import { useExpenseSplitsStore } from '@/stores/expense-splits.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useToastStore } from '@/stores/toast.store'
import { formatCents, formatDate } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import { useMobileExpand } from '@/composables/useMobileExpand'
import type { Expense } from '@/models/expense.model'
import type { Member } from '@/models/member.model'
import type { ExpenseSplit } from '@/models/expense-split.model'

type PersonKind = 'member' | 'external'

interface SplitPerson {
  key: string
  type: PersonKind
  member_id: string | null
  name: string
  color?: string
  amount: string
}

const expensesStore = useExpensesStore()
const splitsStore = useExpenseSplitsStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const householdStore = useHouseholdStore()
const toastStore = useToastStore()
const { mobileExpandedId, handleRowClick } = useMobileExpand()
const search = ref('')
const categoryFilter = ref('')
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const confirmDeleteOpen = ref(false)
const payerSearch = ref('')
const payerPickerOpen = ref(false)
const payerPickerRef = ref<HTMLElement | null>(null)
const splitSearch = ref('')
const splitPickerOpen = ref(false)
const splitPickerRef = ref<HTMLElement | null>(null)
const splitParticipants = ref<SplitPerson[]>([])
let externalPersonCounter = 0

const form = ref({
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  category: '',
  subcategory: '',
  description: '',
  paid_by_type: 'member' as 'member' | 'external',
  paid_by: '',
  paid_by_name: '',
  split: false,
  split_mode: 'even' as 'even' | 'custom',
  tags: '',
  note: '',
})

function splitCents(totalCents: number, count: number): number[] {
  if (!count) return []
  const baseCents = Math.floor(totalCents / count)
  let remainder = totalCents - baseCents * count
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0
    remainder -= extra
    return baseCents + extra
  })
}

function recalcEvenSplits() {
  // Even split rows are computed from the current household members.
}

function expenseCents(): number {
  const totalCents = Math.round((parseFloat(form.value.amount || '0') || 0) * 100)
  return Number.isFinite(totalCents) ? totalCents : 0
}

// Reactively update even splits when amount or mode changes
watch(
  () => form.value.amount,
  () => {
    if (form.value.split && form.value.split_mode === 'even') recalcEvenSplits()
  },
)

watch(
  () => form.value.split_mode,
  (mode) => {
    if (mode === 'even' && form.value.split) recalcEvenSplits()
  },
)

watch(
  () => form.value.split,
  (on) => {
    if (on) recalcEvenSplits()
  },
)

const selectedPayer = computed(() => {
  if (form.value.paid_by_type === 'member') {
    const member = householdStore.activeMembers.find((m) => m.id === form.value.paid_by)
    if (!member) return null
    return {
      key: `member:${member.id}`,
      type: 'member' as PersonKind,
      member_id: member.id,
      name: member.name,
      color: member.color,
    }
  }

  const name = form.value.paid_by_name.trim()
  if (!name) return null
  return {
    key: `external:payer:${name.toLowerCase()}`,
    type: 'external' as PersonKind,
    member_id: null,
    name,
    color: undefined,
  }
})

const payerKey = computed(() => selectedPayer.value?.key ?? '')
const normalizedPayerName = computed(() =>
  normalizePersonName(selectedPayer.value?.name || payerSearch.value),
)

const selectedParticipantKeys = computed(() =>
  new Set(
    splitParticipants.value
      .filter((person) => person.key !== payerKey.value && !isSameAsPayerName(person.name))
      .map((person) => person.key),
  ),
)

function normalizePersonName(name: string | null | undefined): string {
  return (name ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function isSameAsPayerName(name: string): boolean {
  const normalized = normalizePersonName(name)
  return !!normalized && normalized === normalizedPayerName.value
}

function uniqueMembers(members: Member[]): Member[] {
  const seen = new Set<string>()
  const unique: Member[] = []
  for (const member of members) {
    const normalizedName = normalizePersonName(member.name)
    const key = member.id || normalizedName
    const nameKey = `name:${normalizedName}`
    if (seen.has(key) || seen.has(nameKey)) continue
    seen.add(key)
    if (normalizedName) seen.add(nameKey)
    unique.push(member)
  }
  return unique
}

const uniqueActiveMembers = computed(() => uniqueMembers(householdStore.activeMembers))

const payerOptions = computed(() => {
  const query = normalizePersonName(payerSearch.value)
  return uniqueActiveMembers.value.filter((member) =>
    `member:${member.id}` !== payerKey.value
    && (!query || normalizePersonName(member.name).includes(query)),
  )
})

const payerExactMatch = computed(() => {
  const query = normalizePersonName(payerSearch.value)
  if (!query) return null
  return uniqueActiveMembers.value.find((member) => normalizePersonName(member.name) === query) ?? null
})

const splitMemberOptions = computed(() => {
  const query = normalizePersonName(splitSearch.value)
  return uniqueActiveMembers.value.filter((member) => {
    const key = `member:${member.id}`
    const normalizedName = normalizePersonName(member.name)
    return key !== payerKey.value
      && normalizedName !== normalizedPayerName.value
      && !isSameAsPayerName(member.name)
      && !selectedParticipantKeys.value.has(key)
      && !splitParticipants.value.some((person) => normalizePersonName(person.name) === normalizedName)
      && (!query || normalizedName.includes(query))
  })
})

const splitExactMemberMatch = computed(() => {
  const query = normalizePersonName(splitSearch.value)
  if (!query) return null
  if (query === normalizedPayerName.value) return null
  return uniqueActiveMembers.value.find((member) => normalizePersonName(member.name) === query) ?? null
})

const splitExactExternalMatch = computed(() => {
  const query = normalizePersonName(splitSearch.value)
  if (!query) return false
  return splitParticipants.value.some(
    (person) => person.type === 'external' && normalizePersonName(person.name) === query,
  )
})

const nonPayerSplitParticipants = computed(() =>
  splitParticipants.value.filter((person) => person.key !== payerKey.value && !isSameAsPayerName(person.name)),
)

const splitPeople = computed<SplitPerson[]>(() => {
  if (!selectedPayer.value) return [...nonPayerSplitParticipants.value]
  return [{ ...selectedPayer.value, amount: '' }, ...nonPayerSplitParticipants.value]
})

const evenSplitRows = computed<SplitPerson[]>(() => {
  const cents = splitCents(expenseCents(), splitPeople.value.length)
  return splitPeople.value.map((person, index) => ({
    ...person,
    amount: (cents[index] / 100).toFixed(2),
  }))
})

const selectedSplitCents = computed(() =>
  nonPayerSplitParticipants.value.reduce((sum, person) => sum + Math.round((parseFloat(person.amount) || 0) * 100), 0),
)

const payerRemainderCents = computed(() =>
  form.value.split_mode === 'custom' ? expenseCents() - selectedSplitCents.value : 0,
)

const splitDisplayRows = computed<SplitPerson[]>(() => {
  if (!form.value.split) return []
  if (form.value.split_mode === 'even') return evenSplitRows.value

  const rows: SplitPerson[] = []
  if (selectedPayer.value) {
    rows.push({
      ...selectedPayer.value,
      amount: (payerRemainderCents.value / 100).toFixed(2),
    })
  }
  rows.push(...nonPayerSplitParticipants.value)
  return rows
})

const splitBalanced = computed(() => {
  if (!form.value.split) return true
  if (form.value.split_mode === 'even') return true
  return payerRemainderCents.value >= 0
})

const splitRemainingLabel = computed(() =>
  formatCents(Math.abs(payerRemainderCents.value)),
)

const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}))

function getMemberName(id: string): string {
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? 'Unknown'
}

function getMemberColor(id: string | null): string | undefined {
  if (!id) return undefined
  return householdStore.activeMembers.find((m) => m.id === id)?.color
}

function getPayerName(expense: Expense): string {
  if (expense.paid_by_type === 'external') return expense.paid_by_name ?? 'External payer'
  return expense.paid_by ? getMemberName(expense.paid_by) : 'Unknown'
}

function syncPayerSearch() {
  payerSearch.value = selectedPayer.value?.name ?? ''
}

function selectPayerMember(member: Member) {
  const normalized = member.name.trim().toLowerCase()
  form.value.paid_by_type = 'member'
  form.value.paid_by = member.id
  form.value.paid_by_name = ''
  payerSearch.value = member.name
  payerPickerOpen.value = false
  splitParticipants.value = splitParticipants.value.filter(
    (person) => person.key !== `member:${member.id}` && person.name.trim().toLowerCase() !== normalized,
  )
}

function selectExternalPayer(name = payerSearch.value) {
  const trimmed = name.trim()
  if (!trimmed) return
  const normalized = trimmed.toLowerCase()
  form.value.paid_by_type = 'external'
  form.value.paid_by = ''
  form.value.paid_by_name = trimmed
  payerSearch.value = trimmed
  payerPickerOpen.value = false
  splitParticipants.value = splitParticipants.value.filter(
    (person) => person.name.trim().toLowerCase() !== normalized,
  )
}

function commitPayerSearch() {
  const trimmed = payerSearch.value.trim()
  if (!trimmed || normalizePersonName(selectedPayer.value?.name) === normalizePersonName(trimmed)) return

  const member = uniqueActiveMembers.value.find((m) => normalizePersonName(m.name) === normalizePersonName(trimmed))
  if (member) {
    selectPayerMember(member)
  } else {
    selectExternalPayer(trimmed)
  }
}

function addSplitMember(member: Member) {
  const key = `member:${member.id}`
  const normalizedName = normalizePersonName(member.name)
  const alreadySelected = splitParticipants.value.some((person) =>
    person.key === key || normalizePersonName(person.name) === normalizedName,
  )
  if (key === payerKey.value || isSameAsPayerName(member.name) || alreadySelected) {
    splitSearch.value = ''
    return
  }
  splitParticipants.value.push({
    key,
    type: 'member',
    member_id: member.id,
    name: member.name,
    color: member.color,
    amount: '',
  })
  splitSearch.value = ''
}

function addExternalSplitPerson(name = splitSearch.value) {
  const trimmed = name.trim()
  if (!trimmed) return
  if (isSameAsPayerName(trimmed)) {
    splitSearch.value = ''
    return
  }
  const exactMember = uniqueActiveMembers.value.find((m) => normalizePersonName(m.name) === normalizePersonName(trimmed))
  if (exactMember) {
    addSplitMember(exactMember)
    return
  }
  if (splitParticipants.value.some((person) => normalizePersonName(person.name) === normalizePersonName(trimmed))) {
    splitSearch.value = ''
    return
  }
  const key = `external:${trimmed.toLowerCase()}:${externalPersonCounter++}`
  splitParticipants.value.push({
    key,
    type: 'external',
    member_id: null,
    name: trimmed,
    amount: '',
  })
  splitSearch.value = ''
}

function removeSplitPerson(key: string) {
  splitParticipants.value = splitParticipants.value.filter((person) => person.key !== key)
}

function isAutoPayerRow(person: SplitPerson) {
  return form.value.split_mode === 'custom'
    && person.key === payerKey.value
    && !selectedParticipantKeys.value.has(person.key)
}

function isPayerRow(person: SplitPerson) {
  return person.key === payerKey.value
}

function personAmountLabel(person: SplitPerson) {
  const amount = Math.round((parseFloat(person.amount) || 0) * 100)
  if (amount < 0) return `-${formatCents(Math.abs(amount))}`
  return formatCents(amount)
}

function personFromSplit(split: ExpenseSplit): SplitPerson | null {
  if (split.participant_type === 'external') {
    const name = split.participant_name?.trim()
    if (!name) return null
    return {
      key: `external:${name.toLowerCase()}:${externalPersonCounter++}`,
      type: 'external',
      member_id: null,
      name,
      amount: String(split.amount / 100),
    }
  }

  if (!split.member_id) return null
  const member = householdStore.activeMembers.find((m) => m.id === split.member_id)
  return {
    key: `member:${split.member_id}`,
    type: 'member',
    member_id: split.member_id,
    name: member?.name ?? 'Unknown',
    color: member?.color,
    amount: String(split.amount / 100),
  }
}

function handlePersonPickerPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (payerPickerRef.value && !payerPickerRef.value.contains(target)) {
    commitPayerSearch()
    payerPickerOpen.value = false
  }
  if (splitPickerRef.value && !splitPickerRef.value.contains(target)) {
    splitPickerOpen.value = false
  }
}

const filteredGroups = computed(() => {
  const groups = expensesStore.groupedByDate
  const result: Record<string, Expense[]> = {}
  for (const [date, expenses] of Object.entries(groups)) {
    const filtered = expenses.filter((e) => {
      const matchScope = e.scope === appStore.scope
      const matchCategory = !categoryFilter.value || e.category === categoryFilter.value
      const matchSearch =
        !search.value ||
        e.description.toLowerCase().includes(search.value.toLowerCase()) ||
        e.category.toLowerCase().includes(search.value.toLowerCase())
      return matchScope && matchCategory && matchSearch
    })
    if (filtered.length) result[date] = filtered
  }
  return result
})

const hasExpenses = computed(() => Object.keys(filteredGroups.value).length > 0)

const flatExpenses = computed(() => {
  const all: Expense[] = []
  for (const expenses of Object.values(filteredGroups.value)) {
    all.push(...expenses)
  }
  return all.sort((a, b) => b.date.localeCompare(a.date))
})

const summaryStats = computed(() => [
  {
    label: 'Spent this month',
    value: formatCents(expensesStore.currentMonthTotal),
  },
  {
    label: 'Transactions',
    value: String(expensesStore.currentMonthCount),
  },
  {
    label: 'Top category',
    value: expensesStore.topCategory.charAt(0).toUpperCase() + expensesStore.topCategory.slice(1),
  },
])

function openAdd() {
  editingId.value = null
  form.value = {
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: '',
    subcategory: '',
    description: '',
    paid_by_type: 'member',
    paid_by: authStore.memberId ?? '',
    paid_by_name: '',
    split: false,
    split_mode: 'even',
    tags: '',
    note: '',
  }
  splitParticipants.value = []
  syncPayerSearch()
  drawerOpen.value = true
}

function openEdit(expense: Expense) {
  editingId.value = expense.id
  const existingSplits = splitsStore.splitsById[expense.id] ?? []
  const hasSplits = existingSplits.length > 0
  form.value = {
    date: expense.date.slice(0, 10),
    amount: String(expense.amount / 100),
    category: expense.category,
    subcategory: expense.subcategory ?? '',
    description: expense.description,
    paid_by_type: expense.paid_by_type,
    paid_by: expense.paid_by ?? '',
    paid_by_name: expense.paid_by_name ?? '',
    split: hasSplits,
    split_mode: hasSplits ? 'custom' : 'even',
    tags: expense.tags?.join(', ') ?? '',
    note: expense.note ?? '',
  }
  if (hasSplits) {
    syncPayerSearch()
    splitParticipants.value = existingSplits
      .map(personFromSplit)
      .filter((person): person is SplitPerson => !!person && person.key !== payerKey.value)
  } else {
    splitParticipants.value = []
    syncPayerSearch()
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    commitPayerSearch()

    const cents = Math.round(parseFloat(form.value.amount) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      toastStore.warning('Add an amount', 'Expense amount must be greater than zero.')
      return
    }

    if (!selectedPayer.value) {
      toastStore.warning('Choose a payer', 'Pick a household member or add an outside person.')
      return
    }

    const tags = form.value.tags
      ? form.value.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : null

    const splitPayload = form.value.split
      ? splitDisplayRows.value
        .map((person) => ({
          participant_type: person.type,
          member_id: person.type === 'member' ? person.member_id : null,
          participant_name: person.type === 'external' ? person.name : null,
          amount: Math.round((parseFloat(person.amount) || 0) * 100),
        }))
        .filter((split) => split.amount > 0)
      : []

    if (form.value.split) {
      const splitCents = splitPayload.reduce((sum, split) => sum + split.amount, 0)
      if (splitCents !== cents) {
        toastStore.warning('Split is not balanced', `${formatCents(Math.abs(cents - splitCents))} is off the expense total.`)
        return
      }

      if (form.value.split_mode === 'custom' && payerRemainderCents.value < 0) {
        toastStore.warning('Split is over budget', `${splitRemainingLabel.value} is over the expense total.`)
        return
      }
    }

    const payload = {
      household_id: authStore.householdId!,
      date: form.value.date,
      amount: cents,
      category: form.value.category,
      subcategory: form.value.subcategory || null,
      description: form.value.description,
      paid_by_type: selectedPayer.value.type,
      paid_by: selectedPayer.value.type === 'member' ? selectedPayer.value.member_id : null,
      paid_by_name: selectedPayer.value.type === 'external' ? selectedPayer.value.name : null,
      shared: form.value.split,
      tags,
      note: form.value.note || null,
      deleted: false,
      scope: appStore.scope,
      owner_id: appStore.scope === 'personal' ? authStore.memberId : null,
    }

    let expenseId: string
    if (editingId.value) {
      await expensesStore.update(editingId.value, payload)
      expenseId = editingId.value
      toastStore.success('Expense updated')
    } else {
      const created = await expensesStore.create(payload)
      expenseId = created.id
      toastStore.success('Expense added')
    }

    // Save splits
    if (form.value.split && authStore.householdId) {
      await splitsStore.upsertForExpense(expenseId, authStore.householdId, splitPayload)
    } else if (editingId.value) {
      await splitsStore.deleteByExpense(editingId.value)
    }

    drawerOpen.value = false
  } catch (err) {
    toastStore.error('Expense was not saved', err instanceof Error ? err.message : 'Please try again.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!editingId.value) return
  deleting.value = true
  try {
    await splitsStore.deleteByExpense(editingId.value)
    await expensesStore.remove(editingId.value)
    toastStore.success('Expense removed')
    confirmDeleteOpen.value = false
    drawerOpen.value = false
  } catch (err) {
    toastStore.error('Expense was not removed', err instanceof Error ? err.message : 'Please try again.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  document.addEventListener('pointerdown', handlePersonPickerPointerDown, true)
  if (authStore.householdId) {
    if (!householdStore.activeMembers.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
    await Promise.all([
      expensesStore.fetchFresh(authStore.householdId),
      splitsStore.fetchByHousehold(authStore.householdId),
    ])
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePersonPickerPointerDown, true)
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Expenses"
      subtitle="Track your household spending"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    >
      <template #actions>
        <SButton @click="openAdd">Add Expense</SButton>
      </template>
    </PageHeader>

    <MoneyTabs />

    <div class="money-mobile-actions">
      <SButton @click="openAdd">Add Expense</SButton>
    </div>

    <ErrorBanner
      v-if="expensesStore.error"
      :message="expensesStore.error"
      class="page-enter"
      :style="{ '--stagger': 2 }"
      @dismiss="expensesStore.error = null"
    />

    <MonthSummary
      :stats="summaryStats"
      class="page-enter"
      :style="{ '--stagger': 2 }"
    />

    <FilterBar
      v-model:search="search"
      show-search
      class="page-enter"
      :style="{ '--stagger': 3 }"
    >
      <SSelect
        v-model="categoryFilter"
        :options="[{ value: '', label: 'All categories' }, ...categoryOptions]"
        placeholder="Category"
      />
    </FilterBar>

    <div v-if="expensesStore.loading && !expensesStore.items.length" class="page-enter" :style="{ '--stagger': 4 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="hasExpenses" class="expense-table">
      <div class="expense-table__header">
        <span class="expense-table__th">Description</span>
        <span class="expense-table__th expense-table__th--center">Date</span>
        <span class="expense-table__th expense-table__th--center">Category</span>
        <span class="expense-table__th expense-table__th--center">Paid by</span>
        <span class="expense-table__th expense-table__th--right">Amount</span>
      </div>
      <div
        v-for="expense in flatExpenses"
        :key="expense.id"
        class="expense-entry"
      >
        <div
          class="expense-row"
          :class="{ 'expense-row--m-expanded': mobileExpandedId === expense.id }"
          @click="handleRowClick(expense.id, () => openEdit(expense))"
        >
          <div class="expense-row__name">
            <span class="expense-row__desc">{{ expense.description }}</span>
            <span v-if="expense.subcategory" class="expense-row__sub">{{ expense.subcategory }}</span>
          </div>
          <div class="expense-row__chips">
            <div class="expense-row__date">
              <SBadge variant="default" size="sm">{{ formatDate(expense.date) }}</SBadge>
            </div>
            <div class="expense-row__category">
              <SBadge variant="brand" size="sm">{{ expense.category }}</SBadge>
            </div>
          </div>
          <div class="expense-row__payer">
            <SAvatar :name="getPayerName(expense)" :color="getMemberColor(expense.paid_by)" size="sm" />
          </div>
          <div class="expense-row__amount">
            {{ formatCents(expense.amount) }}
          </div>
          <span class="expense-row__chevron material-symbols-rounded">expand_more</span>
        </div>
        <div class="m-detail" :class="{ 'm-detail--open': mobileExpandedId === expense.id }">
          <div class="m-detail__inner">
            <div class="m-detail__body">
              <SBadge variant="brand" size="sm">{{ expense.category }}</SBadge>
              <span class="m-detail__chip">{{ formatDate(expense.date) }}</span>
              <span v-if="expense.subcategory" class="m-detail__chip">{{ expense.subcategory }}</span>
              <span v-if="getPayerName(expense)" class="m-detail__who">
                <SAvatar :name="getPayerName(expense)" :color="getMemberColor(expense.paid_by)" size="sm" />
                <span>{{ getPayerName(expense) }}</span>
              </span>
              <button class="m-detail__edit" @click.stop="openEdit(expense)">
                <span class="material-symbols-rounded">edit</span>
              </button>
              <span v-if="expense.note" class="m-detail__note">{{ expense.note }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-section page-enter" :style="{ '--stagger': 4 }">
      <EmptyState
        title="No expenses to show"
        :subtitle="search || categoryFilter ? 'Try adjusting your filters' : 'Start tracking your spending to see it here'"
        :icon="search || categoryFilter ? 'search' : 'empty'"
        action-label="Add Expense"
        @action="openAdd"
      />
    </div>

    <FormDrawer
      :open="drawerOpen"
      :title="editingId ? 'Edit Expense' : 'Add Expense'"
      :submit-label="editingId ? 'Update' : 'Add'"
      :loading="saving"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection title="Details">
        <FormField>
          <SInput v-model="form.date" label="Date" type="text" placeholder="YYYY-MM-DD" required />
        </FormField>
        <FormField>
          <SInput v-model="form.amount" label="Amount ($)" type="number" placeholder="0.00" required />
        </FormField>
        <FormField>
          <SSelect
            v-model="form.category"
            label="Category"
            :options="categoryOptions"
            placeholder="Select category"
            required
          />
        </FormField>
        <FormField>
          <SInput v-model="form.subcategory" label="Subcategory" placeholder="Optional" />
        </FormField>
        <FormField>
          <SInput v-model="form.description" label="Description" placeholder="What was this for?" required />
        </FormField>
      </FormSection>

      <FormSection title="Assignment">
        <FormField>
          <div ref="payerPickerRef" class="person-picker">
            <label class="person-picker__label">Paid by <span aria-hidden="true">*</span></label>
            <div class="person-picker__control">
              <SAvatar
                v-if="selectedPayer"
                :name="selectedPayer.name"
                :color="selectedPayer.color"
                size="sm"
              />
              <input
                v-model="payerSearch"
                class="person-picker__input"
                type="text"
                autocomplete="off"
                placeholder="Search or add a payer"
                @focus="payerPickerOpen = true"
                @input="payerPickerOpen = true"
                @keydown.enter.prevent="commitPayerSearch()"
                @keydown.esc.prevent="payerPickerOpen = false"
              />
            </div>
            <div v-if="payerPickerOpen" class="person-picker__menu">
              <div v-if="payerOptions.length" class="person-picker__section">Household</div>
              <button
                v-for="member in payerOptions"
                :key="member.id"
                class="person-picker__option"
                type="button"
                @mousedown.prevent="selectPayerMember(member)"
              >
                <SAvatar :name="member.name" :color="member.color" size="sm" />
                <span>{{ member.name }}</span>
              </button>
              <div v-if="payerSearch.trim() && !payerExactMatch" class="person-picker__section">Outside household</div>
              <button
                v-if="payerSearch.trim() && !payerExactMatch"
                class="person-picker__option person-picker__option--add"
                type="button"
                @mousedown.prevent="selectExternalPayer()"
              >
                <span class="material-symbols-rounded">add</span>
                <span>Add "{{ payerSearch.trim() }}"</span>
              </button>
            </div>
          </div>
        </FormField>

        <FormField>
          <SToggle v-model="form.split" label="Split between members" />
        </FormField>

        <template v-if="form.split">
          <FormField>
            <SSelect
              v-model="form.split_mode"
              label="Split method"
              :options="[
                { value: 'even', label: 'Split evenly' },
                { value: 'custom', label: 'Custom amounts' },
              ]"
            />
          </FormField>

          <FormField>
            <div ref="splitPickerRef" class="person-picker">
              <label class="person-picker__label">Sharing with</label>
              <div class="person-picker__control">
                <span class="material-symbols-rounded person-picker__lead">group_add</span>
                <input
                  v-model="splitSearch"
                  class="person-picker__input"
                  type="text"
                  autocomplete="off"
                  placeholder="Search or add a person"
                  @focus="splitPickerOpen = true"
                  @input="splitPickerOpen = true"
                  @keydown.enter.prevent="addExternalSplitPerson()"
                  @keydown.esc.prevent="splitPickerOpen = false"
                />
              </div>
              <div v-if="splitPickerOpen" class="person-picker__menu">
                <div class="person-picker__menu-head">
                  <span>Add everyone who shared this expense</span>
                  <button type="button" @mousedown.prevent="splitPickerOpen = false">Done</button>
                </div>
                <div v-if="splitMemberOptions.length" class="person-picker__section">Household</div>
                <button
                  v-for="member in splitMemberOptions"
                  :key="member.id"
                  class="person-picker__option"
                  type="button"
                  @mousedown.prevent="addSplitMember(member)"
                >
                  <span class="material-symbols-rounded person-picker__check">add_circle</span>
                  <SAvatar :name="member.name" :color="member.color" size="sm" />
                  <span>{{ member.name }}</span>
                </button>
                <div v-if="splitSearch.trim() && !splitExactMemberMatch && !splitExactExternalMatch && !isSameAsPayerName(splitSearch)" class="person-picker__section">Outside household</div>
                <button
                  v-if="splitSearch.trim() && !splitExactMemberMatch && !splitExactExternalMatch && !isSameAsPayerName(splitSearch)"
                  class="person-picker__option person-picker__option--add"
                  type="button"
                  @mousedown.prevent="addExternalSplitPerson()"
                >
                  <span class="material-symbols-rounded">add</span>
                  <span>Add "{{ splitSearch.trim() }}"</span>
                </button>
                <div v-if="!splitMemberOptions.length && (!splitSearch.trim() || splitExactMemberMatch || splitExactExternalMatch)" class="person-picker__empty">
                  No more matches
                </div>
              </div>
            </div>
          </FormField>

          <div class="split-breakdown">
            <div
              v-for="person in splitDisplayRows"
              :key="person.key"
              class="split-row"
            >
              <div class="split-row__member">
                <SAvatar :name="person.name" :color="person.color" size="sm" />
                <span class="split-row__name">{{ person.name }}</span>
                <SBadge v-if="isPayerRow(person)" variant="default" size="sm">Payer</SBadge>
              </div>
              <div class="split-row__amount">
                <span v-if="form.split_mode === 'even' || isAutoPayerRow(person)" class="split-row__value">
                  {{ personAmountLabel(person) }}
                </span>
                <input
                  v-else
                  v-model="person.amount"
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  placeholder="0.00"
                  class="split-row__editor"
                />
              </div>
              <button
                v-if="!isPayerRow(person)"
                class="split-row__remove"
                type="button"
                aria-label="Remove from split"
                @click="removeSplitPerson(person.key)"
              >
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <div class="split-status" :class="splitBalanced ? 'split-status--ok' : 'split-status--error'">
              <span v-if="splitBalanced" class="material-symbols-rounded split-status__icon">check_circle</span>
              <span v-else class="material-symbols-rounded split-status__icon">error</span>
              <span v-if="form.split_mode === 'custom' && splitBalanced && selectedPayer">
                {{ splitRemainingLabel }} assigned to {{ selectedPayer.name }}
              </span>
              <span v-else-if="splitBalanced">Balanced</span>
              <span v-else>{{ splitRemainingLabel }} over budget</span>
            </div>
          </div>
        </template>
      </FormSection>

      <FormSection title="Extra">
        <FormField>
          <SInput v-model="form.tags" label="Tags" placeholder="Comma-separated" />
        </FormField>
        <FormField>
          <STextarea v-model="form.note" label="Note" placeholder="Additional details…" :rows="3" />
        </FormField>
      </FormSection>

      <template v-if="editingId" #footer-start>
        <SButton variant="danger" :loading="deleting" @click="confirmDeleteOpen = true">
          Remove
        </SButton>
      </template>
    </FormDrawer>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="Remove Expense"
      message="This expense and its split rows will be removed."
      confirm-label="Remove"
      variant="danger"
      @confirm="handleDelete"
      @cancel="confirmDeleteOpen = false"
    />
  </PageContainer>
</template>

<style scoped>
/* ── Expense Table ── */
.expense-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.expense-table__header {
  display: grid;
  grid-template-columns: 1fr 120px 120px 60px 110px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
  gap: var(--space-m);
}

.expense-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.expense-table__th--center { text-align: center; }
.expense-table__th--right { text-align: right; }

.expense-entry {
  border-bottom: 1px solid var(--color-border-subtle);
}
.expense-entry:last-child { border-bottom: none; }

.expense-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 60px 110px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.expense-row__chevron { display: none; }
.m-detail { display: none; }
.expense-row:hover { background: var(--color-bg-tertiary); }
.expense-row:active { transform: scale(0.98); transition: transform var(--duration-fast) var(--easing-standard); }

.expense-row__name {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-width: 0;
}

.expense-row__desc {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expense-row__sub {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.expense-row__date,
.expense-row__category {
  display: flex;
  align-items: center;
  justify-content: center;
}

.expense-row__payer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.expense-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  white-space: nowrap;
  text-align: right;
}

.expense-row__chips {
  display: contents;
}

.money-mobile-actions {
  display: none;
}

.person-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.person-picker__label {
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.person-picker__label span {
  color: var(--color-error);
  margin-left: var(--space-2xs);
}

.person-picker__control {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-height: var(--height-input);
  padding: 0 var(--space-m);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.person-picker__control:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(74, 85, 120, 0.12);
}

.person-picker__lead {
  color: var(--color-fg-tertiary);
  font-size: 20px;
}

.person-picker__input {
  flex: 1;
  min-width: 0;
  height: calc(var(--height-input) - 2px);
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-fg-primary);
  font: var(--text-body-1);
}

.person-picker__input::placeholder {
  color: var(--color-fg-tertiary);
}

.person-picker__menu {
  position: absolute;
  top: calc(100% + var(--space-2xs));
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
  padding: var(--space-s);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-dialog);
  box-shadow: var(--shadow-dialog);
}

.person-picker__menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  padding: var(--space-xs) var(--space-s) var(--space-s);
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: var(--space-xs);
}

.person-picker__menu-head span {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

.person-picker__menu-head button {
  height: 26px;
  padding: 0 var(--space-s);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-s);
  background: var(--color-surface-container-low);
  color: var(--color-fg-primary);
  font: var(--text-label-sm);
  cursor: pointer;
}

.person-picker__section {
  padding: var(--space-xs) var(--space-s) var(--space-2xs);
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.person-picker__option {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  width: 100%;
  min-height: 42px;
  padding: var(--space-s);
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-fg-primary);
  font: var(--text-body-2);
  text-align: left;
  cursor: pointer;
}

.person-picker__option:hover {
  background: var(--color-surface-container-low);
}

.person-picker__option--add {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
}

.person-picker__option .material-symbols-rounded {
  font-size: 18px;
}

.person-picker__check {
  color: var(--color-brand-primary);
}

.person-picker__empty {
  padding: var(--space-m) var(--space-s);
  color: var(--color-fg-tertiary);
  font: var(--text-body-2);
  text-align: center;
}

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }
  .money-mobile-actions { display: flex; margin-bottom: var(--space-m); }
  .expense-table__header { display: none; }

  .expense-row {
    grid-template-columns: 1fr 5.5rem 20px;
    grid-template-rows: auto;
    padding: var(--space-s) var(--space-m);
    column-gap: var(--space-s);
  }
  .expense-row__name { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .expense-row__amount { grid-column: 2; grid-row: 1; align-self: center; text-align: right; }
  .expense-row__chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-column: 3;
    grid-row: 1;
    color: var(--color-fg-disabled);
    font-size: 18px;
    transition: transform var(--duration-fast) var(--easing-out);
  }
  .expense-row--m-expanded .expense-row__chevron {
    transform: rotate(180deg);
  }
  .expense-row__chips { display: none; }
  .expense-row__payer { display: none; }

  /* ── Expandable detail ── */
  .m-detail {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--duration-normal) var(--easing-out);
  }
  .m-detail--open { grid-template-rows: 1fr; }
  .m-detail__inner { overflow: hidden; }
  .m-detail__body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-xs) var(--space-m);
    border-top: 1px solid var(--color-border-subtle);
    background: var(--color-bg-secondary);
  }
  .m-detail__chip {
    font: var(--text-label-sm);
    color: var(--color-fg-secondary);
    background: var(--color-bg-tertiary);
    padding: 2px var(--space-s);
    border-radius: var(--radius-pill);
    white-space: nowrap;
  }
  .m-detail__who {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font: var(--text-label-sm);
    color: var(--color-fg-secondary);
  }
  .m-detail__note {
    font: var(--text-caption);
    color: var(--color-fg-tertiary);
    font-style: italic;
    flex-basis: 100%;
    line-height: 1.4;
  }
  .m-detail__edit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-left: auto;
    border-radius: var(--radius-s);
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-elevated);
    color: var(--color-fg-tertiary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color var(--duration-fast) var(--easing-standard),
                color var(--duration-fast) var(--easing-standard);
  }
  .m-detail__edit:active { background: var(--color-bg-tertiary); color: var(--color-fg-primary); }
  .m-detail__edit .material-symbols-rounded { font-size: 15px; }
}

/* ── Split breakdown ───────────────────────────────────── */
.split-breakdown {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.split-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px auto;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
}

.split-row:last-of-type {
  border-bottom: none;
}

.split-row__member {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  flex: 1;
  min-width: 0;
}

.split-row__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.split-row__amount {
  width: 132px;
}

.split-row__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-fg-tertiary);
  cursor: pointer;
}

.split-row__remove:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.split-row__remove .material-symbols-rounded {
  font-size: 17px;
}

.split-row__value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: var(--height-control-sm);
  padding: 0 var(--space-m);
  font: var(--text-body-2);
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.split-row__editor {
  width: 100%;
  box-sizing: border-box;
  height: var(--height-control-sm);
  padding: 0 calc(var(--space-m) + var(--space-2xs)) 0 var(--space-m);
  border-color: var(--color-border-input);
  background: var(--color-surface-input);
  border-style: solid;
  border-width: 1px;
  box-shadow: none;
  border-radius: var(--radius-s);
  outline: none;
  text-align: right;
  font: var(--text-body-2);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  -moz-appearance: textfield;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.split-row__editor::placeholder {
  color: var(--color-fg-tertiary);
}

.split-row__editor:hover {
  background: var(--color-surface-input-hover);
  border-color: var(--color-border-input-hover);
}

.split-row__editor:focus {
  background: var(--color-surface-card);
  border-color: var(--color-brand-primary);
}

.split-row__editor::-webkit-outer-spin-button,
.split-row__editor::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.split-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-l);
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
  border-top: 1px solid var(--color-border-subtle);
}

.split-status__icon {
  font-size: 16px;
}

.split-status--ok {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 6%, transparent);
}

.split-status--error {
  color: var(--color-error);
  background: color-mix(in srgb, var(--color-error) 6%, transparent);
}
</style>
