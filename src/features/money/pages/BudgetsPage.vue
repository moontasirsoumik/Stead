<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import SButton from '@/components/ui/SButton.vue'
import SInput from '@/components/ui/SInput.vue'
import SSelect from '@/components/ui/SSelect.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import { useBudgetsStore } from '@/stores/budgets.store'
import { useExpensesStore } from '@/stores/expenses.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatCents } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import type { Budget } from '@/models/budget.model'

const budgetsStore = useBudgetsStore()
const expensesStore = useExpensesStore()
const authStore = useAuthStore()

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
  budgetsStore.currentMonthBudgets.map((b) => {
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
      :style="{ '--stagger': 1 }"
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

    <div v-else-if="budgetCards.length" class="budgets-grid">
      <ContentCard
        v-for="(card, idx) in budgetCards"
        :key="card.budget.id"
        padding="md"
        hoverable
        class="budget-card page-enter"
        :style="{ '--stagger': 2 + idx }"
        @click="openEdit(card)"
      >
        <div class="budget-card__header">
          <span class="budget-card__category">
            {{ card.budget.category.charAt(0).toUpperCase() + card.budget.category.slice(1) }}
          </span>
        </div>

        <div class="budget-card__amounts">
          <span class="budget-card__spent">{{ formatCents(card.spent) }}</span>
          <span class="budget-card__of">of {{ formatCents(card.budget.budget_amount) }}</span>
        </div>

        <div class="budget-card__bar">
          <div
            class="budget-card__fill"
            :class="`budget-card__fill--${card.variant}`"
            :style="{ width: `${Math.min(card.percent, 100)}%` }"
          />
        </div>

        <div class="budget-card__footer">
          <span :class="['budget-card__remaining', card.remaining < 0 ? 'budget-card__remaining--over' : '']">
            {{ card.remaining >= 0 ? formatCents(card.remaining) + ' left' : formatCents(Math.abs(card.remaining)) + ' over' }}
          </span>
          <span class="budget-card__percent">{{ Math.round(card.percent) }}%</span>
        </div>
      </ContentCard>
    </div>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 2 }">
      <EmptyState
        title="No budgets for this month"
        subtitle="Create budgets to keep your spending in check"
        icon="empty"
        action-label="Add Budget"
        @action="openAdd"
      />
    </ContentCard>

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
.budgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-l);
}

.budget-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.budget-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.budget-card__category {
  font: var(--text-body-1);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
}

.budget-card__amounts {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.budget-card__spent {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.budget-card__of {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.budget-card__bar {
  height: 3px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.budget-card__fill {
  height: 100%;
  border-radius: 2px;
  transition: width var(--duration-normal) var(--easing-standard);
}

.budget-card__fill--green {
  background: var(--color-success);
}

.budget-card__fill--yellow {
  background: var(--color-warning);
}

.budget-card__fill--red {
  background: var(--color-error);
}

.budget-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-card__remaining {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

.budget-card__remaining--over {
  color: var(--color-error);
}

.budget-card__percent {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}
</style>
