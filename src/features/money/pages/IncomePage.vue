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
import STextarea from '@/components/ui/STextarea.vue'
import SToggle from '@/components/ui/SToggle.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import MonthSummary from '@/features/money/components/MonthSummary.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import { useIncomeStore } from '@/stores/income.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents, formatDate } from '@/utils/format'
import type { Income } from '@/models/income.model'

const incomeStore = useIncomeStore()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = ref({
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  source: '',
  category: '',
  received_by: '',
  recurring: false,
  note: '',
})

const incomeCategoryOptions = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investment' },
  { value: 'rental', label: 'Rental' },
  { value: 'gift', label: 'Gift' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' },
]

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

const summaryStats = computed(() => [
  {
    label: 'Income this month',
    value: formatCents(incomeStore.currentMonthTotal),
  },
  {
    label: 'Entries',
    value: String(incomeStore.items.length),
  },
])

function openAdd() {
  editingId.value = null
  form.value = {
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    source: '',
    category: '',
    received_by: authStore.memberId ?? '',
    recurring: false,
    note: '',
  }
  drawerOpen.value = true
}

function openEdit(income: Income) {
  editingId.value = income.id
  form.value = {
    date: income.date.slice(0, 10),
    amount: String(income.amount / 100),
    source: income.source,
    category: income.category,
    received_by: income.received_by,
    recurring: income.recurring,
    note: income.note ?? '',
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    const cents = Math.round(parseFloat(form.value.amount) * 100)
    const payload = {
      household_id: authStore.householdId!,
      date: form.value.date,
      amount: cents,
      source: form.value.source,
      category: form.value.category,
      received_by: form.value.received_by,
      recurring: form.value.recurring,
      recurring_rule: null,
      note: form.value.note || null,
      deleted: false,
    }
    if (editingId.value) {
      await incomeStore.update(editingId.value, payload)
    } else {
      await incomeStore.create(payload)
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
    await incomeStore.fetchFresh(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Income"
      subtitle="Track household income"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    >
      <template #actions>
        <SButton @click="openAdd">Add Income</SButton>
      </template>
    </PageHeader>

    <MoneyTabs />

    <ErrorBanner
      v-if="incomeStore.error"
      :message="incomeStore.error"
      class="page-enter"
      :style="{ '--stagger': 2 }"
      @dismiss="incomeStore.error = null"
    />

    <MonthSummary
      :stats="summaryStats"
      class="page-enter"
      :style="{ '--stagger': 2 }"
    />

    <div v-if="incomeStore.loading && !incomeStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="incomeStore.sorted.length" class="income-list">
      <div
        v-for="(item, idx) in incomeStore.sorted"
        :key="item.id"
        class="income-row page-enter"
        :style="{ '--stagger': 3 + idx }"
        @click="openEdit(item)"
      >
        <div class="income-row__left">
          <SBadge variant="success" size="sm">{{ item.category }}</SBadge>
          <span class="income-row__source">{{ item.source }}</span>
          <span class="income-row__date">{{ formatDate(item.date) }}</span>
        </div>
        <div class="income-row__right">
          <SAvatar :name="getMemberName(item.received_by)" :color="getMemberColor(item.received_by)" size="sm" />
          <SBadge v-if="item.recurring" variant="info" size="sm">Recurring</SBadge>
          <span class="income-row__amount">{{ formatCents(item.amount) }}</span>
        </div>
      </div>
    </div>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        title="No income recorded"
        subtitle="Add income entries to track your household earnings"
        icon="empty"
        action-label="Add Income"
        @action="openAdd"
      />
    </ContentCard>

    <FormDrawer
      :open="drawerOpen"
      :title="editingId ? 'Edit Income' : 'Add Income'"
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
          <SInput v-model="form.source" label="Source" placeholder="e.g., Company name" required />
        </FormField>
        <FormField>
          <SSelect
            v-model="form.category"
            label="Category"
            :options="incomeCategoryOptions"
            placeholder="Select category"
            required
          />
        </FormField>
      </FormSection>

      <FormSection title="Assignment">
        <FormField>
          <SSelect
            v-model="form.received_by"
            label="Received by"
            :options="memberOptions"
            placeholder="Select member"
            required
          />
        </FormField>
        <FormField row>
          <SToggle v-model="form.recurring" label="Recurring income" />
        </FormField>
      </FormSection>

      <FormSection title="Extra">
        <FormField>
          <STextarea v-model="form.note" label="Note" placeholder="Additional details…" :rows="3" />
        </FormField>
      </FormSection>
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
.income-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
  box-shadow: var(--shadow-card);
}

.income-row {
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

.income-row:last-child {
  border-bottom: none;
}

.income-row:hover {
  background: var(--color-bg-tertiary);
}

.income-row__left {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-width: 0;
}

.income-row__source {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.income-row__date {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.income-row__right {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  flex-shrink: 0;
}

.income-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-mono);
  color: var(--color-success);
  white-space: nowrap;
  min-width: 56px;
  text-align: right;
}

@media (max-width: 640px) {
  .income-row {
    flex-wrap: wrap;
    padding: var(--space-xs) var(--space-l);
  }

  .income-row__right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
