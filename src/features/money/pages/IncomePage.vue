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
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents, formatDate } from '@/utils/format'
import type { Income } from '@/models/income.model'
import { useMobileExpand } from '@/composables/useMobileExpand'

const incomeStore = useIncomeStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const householdStore = useHouseholdStore()
const { mobileExpandedId, handleRowClick } = useMobileExpand()
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

const scopedSorted = computed(() =>
  incomeStore.sorted.filter((i) => i.scope === appStore.scope),
)

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
      scope: appStore.scope,
      owner_id: appStore.scope === 'personal' ? authStore.memberId : null,
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

    <div class="money-mobile-actions">
      <SButton @click="openAdd">Add Income</SButton>
    </div>

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

    <div v-if="incomeStore.loading && !incomeStore.items.length" class="page-enter" :style="{ '--stagger': 4 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="scopedSorted.length" class="income-table">
      <div class="income-table__header">
        <span class="income-table__th">Source</span>
        <span class="income-table__th income-table__th--center">Category</span>
        <span class="income-table__th income-table__th--center">Date</span>
        <span class="income-table__th income-table__th--center">Received by</span>
        <span class="income-table__th income-table__th--center">Recurring</span>
        <span class="income-table__th income-table__th--right">Amount</span>
      </div>
      <div v-for="(item, idx) in scopedSorted" :key="item.id" class="income-entry page-enter" :style="{ '--stagger': 3 + idx }">
        <div class="income-row" :class="{ 'income-row--m-expanded': mobileExpandedId === item.id }" @click="handleRowClick(item.id, () => openEdit(item))">
          <div class="income-row__source">{{ item.source }}</div>
          <div class="income-row__chips">
            <div v-if="item.category" class="income-row__category">
              <SBadge variant="success" size="sm">{{ item.category }}</SBadge>
            </div>
            <div class="income-row__date">{{ formatDate(item.date) }}</div>
            <div class="income-row__recurring">
              <SBadge v-if="item.recurring" variant="info" size="sm">Recurring</SBadge>
            </div>
          </div>
          <div class="income-row__payer">
            <SAvatar :name="getMemberName(item.received_by)" :color="getMemberColor(item.received_by)" size="sm" />
          </div>
          <div class="income-row__amount">{{ formatCents(item.amount) }}</div>
          <span class="income-row__chevron material-symbols-rounded">expand_more</span>
        </div>
        <div class="m-detail" :class="{ 'm-detail--open': mobileExpandedId === item.id }">
          <div class="m-detail__inner">
            <div class="m-detail__body">
              <SBadge v-if="item.category" variant="success" size="sm">{{ item.category }}</SBadge>
              <span class="m-detail__chip">{{ formatDate(item.date) }}</span>
              <SBadge v-if="item.recurring" variant="info" size="sm">Recurring</SBadge>
              <span v-if="getMemberName(item.received_by)" class="m-detail__who">
                <SAvatar :name="getMemberName(item.received_by)" :color="getMemberColor(item.received_by)" size="sm" />
                <span>{{ getMemberName(item.received_by) }}</span>
              </span>
              <button class="m-detail__edit" @click.stop="openEdit(item)">
                <span class="material-symbols-rounded">edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-section page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        title="No income recorded"
        subtitle="Add income entries to track your household earnings"
        icon="empty"
        action-label="Add Income"
        @action="openAdd"
      />
    </div>

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
/* ── Income Table ── */
.income-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.income-table__header {
  display: grid;
  grid-template-columns: 1fr 100px 100px 60px 90px 110px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
  gap: var(--space-m);
}

.income-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.income-table__th--center { text-align: center; }
.income-table__th--right { text-align: right; }

.income-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px 60px 90px 110px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard);
}
.income-row:hover { background: var(--color-bg-tertiary); }
.income-row:active { transform: scale(0.98); transition: transform var(--duration-fast) var(--easing-standard); }

.income-row__source {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.income-row__category,
.income-row__payer,
.income-row__recurring {
  display: flex;
  align-items: center;
  justify-content: center;
}

.income-row__date {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  text-align: center;
}

.income-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--color-success);
  white-space: nowrap;
  text-align: right;
}

.income-row__chips {
  display: contents;
}

.money-mobile-actions {
  display: none;
}

.income-entry {
  border-bottom: 1px solid var(--color-border-subtle);
}
.income-entry:last-child { border-bottom: none; }

.income-row__chevron { display: none; }
.m-detail { display: none; }

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }
  .money-mobile-actions { display: flex; margin-bottom: var(--space-m); }
  .income-table__header { display: none; }

  .income-row {
    grid-template-columns: 1fr 5.5rem 20px;
    grid-template-rows: auto;
    padding: var(--space-s) var(--space-m);
    column-gap: var(--space-s);
  }
  .income-row__source { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .income-row__amount { grid-column: 2; grid-row: 1; align-self: center; text-align: right; }
  .income-row__chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-column: 3;
    grid-row: 1;
    color: var(--color-fg-disabled);
    font-size: 18px;
    transition: transform var(--duration-fast) var(--easing-out);
  }
  .income-row--m-expanded .income-row__chevron {
    transform: rotate(180deg);
  }
  .income-row__chips { display: none; }
  .income-row__payer { display: none; }

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
</style>
