<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
import { formatCents, formatDate } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import type { Expense } from '@/models/expense.model'

const expensesStore = useExpensesStore()
const splitsStore = useExpenseSplitsStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const householdStore = useHouseholdStore()
const search = ref('')
const categoryFilter = ref('')
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = ref({
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  category: '',
  subcategory: '',
  description: '',
  paid_by: '',
  split: false,
  split_mode: 'even' as 'even' | 'custom',
  tags: '',
  note: '',
})

// Per-member custom split amounts (string for input binding)
const splitAmounts = ref<Record<string, string>>({})

function recalcEvenSplits() {
  const members = householdStore.activeMembers
  if (!members.length) return
  const total = parseFloat(form.value.amount || '0')
  const perPerson = (total / members.length).toFixed(2)
  splitAmounts.value = Object.fromEntries(members.map((m) => [m.id, perPerson]))
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

const splitTotal = computed(() =>
  Object.values(splitAmounts.value).reduce((s, v) => s + (parseFloat(v) || 0), 0),
)
const splitRemaining = computed(() =>
  parseFloat(form.value.amount || '0') - splitTotal.value,
)
const splitBalanced = computed(() => Math.abs(splitRemaining.value) <= 0.01)

const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}))

const memberOptions = computed(() =>
  householdStore.activeMembers.map((m) => ({
    value: m.id,
    label: m.name,
  })),
)

function getMemberName(id: string): string {
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? 'Unknown'
}

function getMemberColor(id: string): string | undefined {
  return householdStore.activeMembers.find((m) => m.id === id)?.color
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
    paid_by: authStore.memberId ?? '',
    split: false,
    split_mode: 'even',
    tags: '',
    note: '',
  }
  splitAmounts.value = {}
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
    paid_by: expense.paid_by,
    split: hasSplits,
    split_mode: hasSplits ? 'custom' : 'even',
    tags: expense.tags?.join(', ') ?? '',
    note: expense.note ?? '',
  }
  if (hasSplits) {
    splitAmounts.value = Object.fromEntries(
      existingSplits.map((s) => [s.member_id, String(s.amount / 100)])
    )
  } else {
    splitAmounts.value = {}
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    const cents = Math.round(parseFloat(form.value.amount) * 100)
    const tags = form.value.tags
      ? form.value.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : null

    const payload = {
      household_id: authStore.householdId!,
      date: form.value.date,
      amount: cents,
      category: form.value.category,
      subcategory: form.value.subcategory || null,
      description: form.value.description,
      paid_by: form.value.paid_by,
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
    } else {
      const created = await expensesStore.create(payload)
      expenseId = created.id
    }

    // Save splits
    if (form.value.split && authStore.householdId) {
      const splitPayload = Object.entries(splitAmounts.value)
        .map(([member_id, val]) => ({ member_id, amount: Math.round(parseFloat(val) * 100) }))
        .filter((s) => s.amount > 0)
      await splitsStore.upsertForExpense(expenseId, authStore.householdId, splitPayload)
    } else if (editingId.value) {
      await splitsStore.deleteByExpense(editingId.value)
    }

    drawerOpen.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
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
        class="expense-row"
        @click="openEdit(expense)"
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
          <SAvatar :name="getMemberName(expense.paid_by)" :color="getMemberColor(expense.paid_by)" size="sm" />
        </div>
        <div class="expense-row__amount">
          {{ formatCents(expense.amount) }}
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
          <SSelect
            v-model="form.paid_by"
            label="Paid by"
            :options="memberOptions"
            placeholder="Select member"
            required
          />
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

          <div class="split-breakdown">
            <div
              v-for="member in householdStore.activeMembers"
              :key="member.id"
              class="split-row"
            >
              <div class="split-row__member">
                <SAvatar :name="member.name" :color="member.color" size="sm" />
                <span class="split-row__name">{{ member.name }}</span>
              </div>
              <div class="split-row__amount">
                <span v-if="form.split_mode === 'even'" class="split-row__value">
                  ${{ splitAmounts[member.id] ?? '0.00' }}
                </span>
                <input
                  v-else
                  v-model="splitAmounts[member.id]"
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  placeholder="0.00"
                  class="split-row__editor"
                />
              </div>
            </div>

            <div class="split-status" :class="splitBalanced ? 'split-status--ok' : 'split-status--error'">
              <span v-if="splitBalanced" class="material-symbols-rounded split-status__icon">check_circle</span>
              <span v-else class="material-symbols-rounded split-status__icon">error</span>
              <span v-if="splitBalanced">Balanced</span>
              <span v-else-if="splitRemaining > 0">${{ splitRemaining.toFixed(2) }} unallocated</span>
              <span v-else>${{ Math.abs(splitRemaining).toFixed(2) }} over budget</span>
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
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
.expense-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.expense-table__header {
  display: grid;
  grid-template-columns: 1fr 120px 120px 60px 110px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
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

.expense-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 60px 110px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.expense-row:last-child { border-bottom: none; }
.expense-row:hover { background: var(--color-bg-tertiary); }

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

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }
  .money-mobile-actions { display: flex; margin-bottom: var(--space-m); }
  .expense-table__header { display: none; }
  .expense-row {
    grid-template-columns: 1fr 28px 5.5rem;
    grid-template-rows: auto auto;
    padding: var(--space-s) var(--space-l);
    row-gap: var(--space-2xs);
    column-gap: var(--space-m);
  }
  .expense-row__name { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .expense-row__payer { grid-column: 2; grid-row: 1 / -1; align-self: center; justify-self: center; }
  .expense-row__amount { grid-column: 3; grid-row: 1 / -1; align-self: center; text-align: right; }
  .expense-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    grid-column: 1;
    grid-row: 2;
    align-items: center;
  }
}

/* ── Split breakdown ───────────────────────────────────── */
.split-breakdown {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
  overflow: hidden;
}

.split-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  flex-shrink: 0;
  width: 132px;
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
    background var(--duration-fast) var(--easing-standard);
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
