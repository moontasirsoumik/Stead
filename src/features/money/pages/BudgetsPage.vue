<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import SButton from '@/components/ui/SButton.vue'
import SInput from '@/components/ui/SInput.vue'
import SSelect from '@/components/ui/SSelect.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import { useBudgetsStore } from '@/stores/budgets.store'
import { useExpensesStore } from '@/stores/expenses.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatCents } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import type { Budget } from '@/models/budget.model'

const budgetsStore = useBudgetsStore()
const expensesStore = useExpensesStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = ref({
  month: budgetsStore.selectedMonth,
  category: '',
  budget_amount: '',
})

const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}))

interface BudgetCard {
  budget: Budget
  spent: number
  remaining: number
  percent: number
  variant: 'green' | 'yellow' | 'red'
}

const budgetCards = computed<BudgetCard[]>(() =>
  budgetsStore.currentMonthBudgets
    .filter((b) => b.scope === appStore.scope)
    .map((b) => {
    const spent = budgetsStore.spentForCategory(b.category)
    const remaining = b.budget_amount - spent
    const percent = b.budget_amount > 0 ? (spent / b.budget_amount) * 100 : 0
    const variant = percent > 100 ? 'red' : percent >= 75 ? 'yellow' : 'green'
    return { budget: b, spent, remaining, percent, variant }
  }),
)

function openAdd() {
  editingId.value = null
  form.value = {
    month: budgetsStore.selectedMonth,
    category: '',
    budget_amount: '',
  }
  drawerOpen.value = true
}

function openEdit(card: BudgetCard) {
  editingId.value = card.budget.id
  form.value = {
    month: card.budget.month,
    category: card.budget.category,
    budget_amount: String(card.budget.budget_amount / 100),
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    const cents = Math.round(parseFloat(form.value.budget_amount) * 100)
    const payload = {
      household_id: authStore.householdId!,
      month: form.value.month,
      category: form.value.category,
      budget_amount: cents,
      deleted: false,
      scope: appStore.scope,
      owner_id: appStore.scope === 'personal' ? authStore.memberId : null,
    }
    if (editingId.value) {
      await budgetsStore.update(editingId.value, payload)
    } else {
      await budgetsStore.create(payload)
    }
    drawerOpen.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      budgetsStore.fetchFresh(authStore.householdId),
      expensesStore.fetchFresh(authStore.householdId),
    ])
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Budgets"
      subtitle="Set and track spending limits"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    >
      <template #actions>
        <SInput
          v-model="budgetsStore.selectedMonth"
          type="text"
          placeholder="YYYY-MM"
        />
        <SButton @click="openAdd">Add Budget</SButton>
      </template>
    </PageHeader>

    <MoneyTabs />

    <ErrorBanner
      v-if="budgetsStore.error"
      :message="budgetsStore.error"
      class="page-enter"
      :style="{ '--stagger': 2 }"
      @dismiss="budgetsStore.error = null"
    />

    <div v-if="budgetsStore.loading && !budgetsStore.items.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="budgetCards.length" class="budgets-table">
      <div class="budgets-table__header">
        <span class="budgets-table__th">Category</span>
        <span class="budgets-table__th budgets-table__th--center">Progress</span>
        <span class="budgets-table__th budgets-table__th--right">Spent</span>
        <span class="budgets-table__th budgets-table__th--right">Budget</span>
        <span class="budgets-table__th budgets-table__th--right">Remaining</span>
        <span class="budgets-table__th budgets-table__th--right">%</span>
      </div>
      <div
        v-for="(card, idx) in budgetCards"
        :key="card.budget.id"
        class="budget-row page-enter"
        :style="{ '--stagger': 2 + idx }"
        @click="openEdit(card)"
      >
        <div class="budget-row__category">
          {{ card.budget.category.charAt(0).toUpperCase() + card.budget.category.slice(1) }}
        </div>
        <div class="budget-row__progress">
          <div class="budget-bar">
            <div
              class="budget-bar__fill"
              :class="`budget-bar__fill--${card.variant}`"
              :style="{ width: `${Math.min(card.percent, 100)}%` }"
            />
          </div>
        </div>
        <div class="budget-row__spent">{{ formatCents(card.spent) }}</div>
        <div class="budget-row__budget">{{ formatCents(card.budget.budget_amount) }}</div>
        <div :class="['budget-row__remaining', card.remaining < 0 ? 'budget-row__remaining--over' : '']">
          {{ card.remaining >= 0 ? formatCents(card.remaining) + ' left' : formatCents(Math.abs(card.remaining)) + ' over' }}
        </div>
        <div class="budget-row__percent">{{ Math.round(card.percent) }}%</div>
      </div>
    </div>

    <div v-else class="empty-section page-enter" :style="{ '--stagger': 2 }">
      <EmptyState
        title="No budgets for this month"
        subtitle="Create budgets to keep your spending in check"
        icon="empty"
        action-label="Add Budget"
        @action="openAdd"
      />
    </div>

    <FormDrawer
      :open="drawerOpen"
      :title="editingId ? 'Edit Budget' : 'Add Budget'"
      :submit-label="editingId ? 'Update' : 'Add'"
      :loading="saving"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection title="Budget Details">
        <FormField>
          <SInput v-model="form.month" label="Month (YYYY-MM)" type="text" placeholder="2026-04" required />
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
          <SInput v-model="form.budget_amount" label="Budget amount ($)" type="number" placeholder="0.00" required />
        </FormField>
      </FormSection>
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
.budgets-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.budgets-table__header {
  display: grid;
  grid-template-columns: 120px 1fr 100px 100px 110px 50px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

.budgets-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.budgets-table__th--center { text-align: center; }
.budgets-table__th--right { text-align: right; }

.budget-row {
  display: grid;
  grid-template-columns: 120px 1fr 100px 100px 110px 50px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.budget-row:last-child { border-bottom: none; }
.budget-row:hover { background: var(--color-bg-tertiary); }

.budget-row__category {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
}

.budget-row__progress {
  display: flex;
  align-items: center;
}

.budget-bar {
  width: 100%;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-circle);
  overflow: hidden;
}

.budget-bar__fill {
  height: 100%;
  border-radius: var(--radius-circle);
  transition: width var(--duration-normal) var(--easing-standard);
}

.budget-bar__fill--green { background: var(--color-success); }
.budget-bar__fill--yellow { background: var(--color-warning); }
.budget-bar__fill--red { background: var(--color-error); }

.budget-row__spent {
  font: var(--text-body-2);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  white-space: nowrap;
  text-align: right;
}

.budget-row__budget {
  font: var(--text-caption);
  font-family: var(--font-mono);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  text-align: right;
}

.budget-row__remaining {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  white-space: nowrap;
  text-align: right;
}

.budget-row__remaining--over {
  color: var(--color-error);
}

.budget-row__percent {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: right;
}

@media (max-width: 640px) {
  .budgets-table__header { display: none; }
  .budget-row {
    grid-template-columns: 1fr auto auto;
    padding: var(--space-s) var(--space-l);
  }
  .budget-row__progress { display: none; }
  .budget-row__budget { display: none; }
  .budget-row__percent { display: none; }
}
</style>
