<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SectionHeader from '@/components/data/SectionHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SCheckbox from '@/components/ui/SCheckbox.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import MonthSummary from '@/features/money/components/MonthSummary.vue'
import { useExpensesStore } from '@/stores/expenses.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents, formatDate } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import type { Expense } from '@/models/expense.model'

const expensesStore = useExpensesStore()
const authStore = useAuthStore()
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
  shared: false,
  tags: '',
  note: '',
})

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
      const matchCategory = !categoryFilter.value || e.category === categoryFilter.value
      const matchSearch =
        !search.value ||
        e.description.toLowerCase().includes(search.value.toLowerCase()) ||
        e.category.toLowerCase().includes(search.value.toLowerCase())
      return matchCategory && matchSearch
    })
    if (filtered.length) result[date] = filtered
  }
  return result
})

const hasExpenses = computed(() => Object.keys(filteredGroups.value).length > 0)

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
    shared: false,
    tags: '',
    note: '',
  }
  drawerOpen.value = true
}

function openEdit(expense: Expense) {
  editingId.value = expense.id
  form.value = {
    date: expense.date.slice(0, 10),
    amount: String(expense.amount / 100),
    category: expense.category,
    subcategory: expense.subcategory ?? '',
    description: expense.description,
    paid_by: expense.paid_by,
    shared: expense.shared,
    tags: expense.tags?.join(', ') ?? '',
    note: expense.note ?? '',
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
      shared: form.value.shared,
      tags,
      note: form.value.note || null,
      deleted: false,
    }

    if (editingId.value) {
      await expensesStore.update(editingId.value, payload)
    } else {
      await expensesStore.create(payload)
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
    await expensesStore.fetchFresh(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Expenses"
      subtitle="Track your household spending"
      class="page-enter"
      :style="{ '--stagger': 1 }"
    >
      <template #actions>
        <SButton @click="openAdd">Add Expense</SButton>
      </template>
    </PageHeader>

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

    <div v-else-if="hasExpenses" class="expense-groups">
      <div
        v-for="(expenses, date, idx) in filteredGroups"
        :key="date"
        class="expense-group page-enter"
        :style="{ '--stagger': 4 + Number(idx) }"
      >
        <SectionHeader :title="formatDate(String(date))" :count="expenses.length" />

        <div class="expense-list">
          <div
            v-for="expense in expenses"
            :key="expense.id"
            class="expense-row"
            @click="openEdit(expense)"
          >
            <div class="expense-row__left">
              <SBadge variant="brand" size="sm">
                {{ expense.category }}
              </SBadge>
              <span class="expense-row__desc">{{ expense.description }}</span>
              <span v-if="expense.subcategory" class="expense-row__sub">{{ expense.subcategory }}</span>
            </div>
            <div class="expense-row__right">
              <SAvatar :name="getMemberName(expense.paid_by)" :color="getMemberColor(expense.paid_by)" size="sm" />
              <SBadge v-if="expense.shared" variant="info" size="sm">Shared</SBadge>
              <span class="expense-row__amount">{{ formatCents(expense.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 4 }">
      <EmptyState
        title="No expenses to show"
        :subtitle="search || categoryFilter ? 'Try adjusting your filters' : 'Start tracking your spending to see it here'"
        :icon="search || categoryFilter ? 'search' : 'empty'"
        action-label="Add Expense"
        @action="openAdd"
      />
    </ContentCard>

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
        <FormField row>
          <SCheckbox v-model="form.shared" label="Shared expense" />
        </FormField>
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
.expense-groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.expense-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
  box-shadow: var(--shadow-card);
}

.expense-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.expense-row:last-child {
  border-bottom: none;
}

.expense-row:hover {
  background: var(--color-bg-tertiary);
}

.expense-row__left {
  display: flex;
  align-items: center;
  gap: var(--space-m);
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

.expense-row__right {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  flex-shrink: 0;
}

.expense-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  white-space: nowrap;
  min-width: 56px;
  text-align: right;
}

@media (max-width: 640px) {
  .expense-row {
    flex-wrap: wrap;
    padding: var(--space-xs) var(--space-l);
  }

  .expense-row__right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
