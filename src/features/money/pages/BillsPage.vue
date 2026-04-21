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
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import MonthSummary from '@/features/money/components/MonthSummary.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import { useBillsStore } from '@/stores/bills.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents } from '@/utils/format'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import type { Bill } from '@/models/bill.model'
import type { BillStatus } from '@/models/enums'

const billsStore = useBillsStore()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = ref({
  name: '',
  amount: '',
  category: '',
  due_day: '',
  frequency: 'monthly' as string,
  auto_pay: false,
  paid_by: '',
  note: '',
})

const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}))

const frequencyOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
  { value: 'custom', label: 'Custom' },
]

const memberOptions = computed(() =>
  householdStore.activeMembers.map((m) => ({
    value: m.id,
    label: m.name,
  })),
)

function statusVariant(status: BillStatus): 'default' | 'success' | 'error' | 'warning' {
  const map: Record<BillStatus, 'default' | 'success' | 'error' | 'warning'> = {
    upcoming: 'default',
    paid: 'success',
    overdue: 'error',
    skipped: 'warning',
  }
  return map[status]
}

const summaryStats = computed(() => [
  {
    label: 'Upcoming',
    value: String(billsStore.upcomingBills.length),
  },
  {
    label: 'Overdue',
    value: String(billsStore.overdueCount),
  },
  {
    label: 'Monthly total',
    value: formatCents(billsStore.monthlyTotal),
  },
])

function openAdd() {
  editingId.value = null
  form.value = {
    name: '',
    amount: '',
    category: '',
    due_day: '',
    frequency: 'monthly',
    auto_pay: false,
    paid_by: authStore.memberId ?? '',
    note: '',
  }
  drawerOpen.value = true
}

function openEdit(bill: Bill) {
  editingId.value = bill.id
  form.value = {
    name: bill.name,
    amount: String(bill.amount / 100),
    category: bill.category,
    due_day: String(bill.due_day),
    frequency: bill.frequency,
    auto_pay: bill.auto_pay,
    paid_by: bill.paid_by ?? '',
    note: bill.note ?? '',
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    const cents = Math.round(parseFloat(form.value.amount) * 100)
    const payload = {
      household_id: authStore.householdId!,
      name: form.value.name,
      amount: cents,
      category: form.value.category,
      due_day: parseInt(form.value.due_day, 10),
      frequency: form.value.frequency as Bill['frequency'],
      auto_pay: form.value.auto_pay,
      paid_by: form.value.paid_by || null,
      status: 'upcoming' as BillStatus,
      last_paid_date: null,
      note: form.value.note || null,
      deleted: false,
    }
    if (editingId.value) {
      const { status: _s, last_paid_date: _l, ...rest } = payload
      await billsStore.update(editingId.value, rest)
    } else {
      await billsStore.create(payload)
    }
    drawerOpen.value = false
  } finally {
    saving.value = false
  }
}

async function markPaid(bill: Bill) {
  await billsStore.update(bill.id, {
    status: 'paid',
    last_paid_date: new Date().toISOString().slice(0, 10),
  })
}

async function skipBill(bill: Bill) {
  await billsStore.update(bill.id, { status: 'skipped' })
}

onMounted(async () => {
  if (authStore.householdId) {
    if (!householdStore.activeMembers.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
    await billsStore.fetchFresh(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Bills"
      subtitle="Manage recurring bills"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    >
      <template #actions>
        <SButton @click="openAdd">Add Bill</SButton>
      </template>
    </PageHeader>

    <MoneyTabs />

    <div class="money-mobile-actions">
      <SButton @click="openAdd">Add Bill</SButton>
    </div>

    <ErrorBanner
      v-if="billsStore.error"
      :message="billsStore.error"
      class="page-enter"
      :style="{ '--stagger': 2 }"
      @dismiss="billsStore.error = null"
    />

    <MonthSummary
      :stats="summaryStats"
      class="page-enter"
      :style="{ '--stagger': 2 }"
    />

    <div v-if="billsStore.loading && !billsStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="billsStore.items.length" class="bills-table">
      <div class="bills-table__header">
        <span class="bills-table__th">Name</span>
        <span class="bills-table__th bills-table__th--center">Status</span>
        <span class="bills-table__th bills-table__th--center">Schedule</span>
        <span class="bills-table__th bills-table__th--center">Auto-pay</span>
        <span class="bills-table__th bills-table__th--right">Amount</span>
      </div>
      <div
        v-for="(bill, idx) in billsStore.items"
        :key="bill.id"
        class="bill-row page-enter"
        :style="{ '--stagger': 3 + idx }"
        @click="openEdit(bill)"
      >
        <div class="bill-row__name">
          <span class="bill-row__title">{{ bill.name }}</span>
          <span class="bill-row__meta">Day {{ bill.due_day }}</span>
        </div>
        <div class="bill-row__chips">
          <div class="bill-row__status">
            <SBadge :variant="statusVariant(bill.status)" size="sm">{{ bill.status }}</SBadge>
          </div>
          <div class="bill-row__freq">
            <SBadge variant="default" size="sm">{{ bill.frequency }}</SBadge>
          </div>
          <div class="bill-row__autopay">
            <SBadge v-if="bill.auto_pay" variant="info" size="sm">Auto-pay</SBadge>
          </div>
        </div>
        <div class="bill-row__amount">{{ formatCents(bill.amount) }}</div>
      </div>
    </div>

    <div v-else class="empty-section page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        title="No bills set up"
        subtitle="Add your recurring bills to stay on top of payments"
        icon="empty"
        action-label="Add Bill"
        @action="openAdd"
      />
    </div>

    <FormDrawer
      :open="drawerOpen"
      :title="editingId ? 'Edit Bill' : 'Add Bill'"
      :submit-label="editingId ? 'Update' : 'Add'"
      :loading="saving"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection title="Details">
        <FormField>
          <SInput v-model="form.name" label="Bill name" placeholder="e.g., Electric bill" required />
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
          <SInput v-model="form.due_day" label="Due day (1-31)" type="number" placeholder="15" required />
        </FormField>
        <FormField>
          <SSelect
            v-model="form.frequency"
            label="Frequency"
            :options="frequencyOptions"
            required
          />
        </FormField>
      </FormSection>

      <FormSection title="Assignment">
        <FormField>
          <SSelect
            v-model="form.paid_by"
            label="Paid by"
            :options="memberOptions"
            placeholder="Select member"
          />
        </FormField>
        <FormField row>
          <SToggle v-model="form.auto_pay" label="Auto-pay enabled" />
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
.bills-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.bills-table__header {
  display: grid;
  grid-template-columns: 1fr 100px 100px 100px 110px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

.bills-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.bills-table__th--center { text-align: center; }
.bills-table__th--right { text-align: right; }

.bill-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px 100px 110px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.bill-row:last-child { border-bottom: none; }
.bill-row:hover { background: var(--color-bg-tertiary); }

.bill-row__name {
  display: flex;
  align-items: baseline;
  gap: var(--space-s);
  min-width: 0;
}

.bill-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bill-row__meta {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.bill-row__status,
.bill-row__freq,
.bill-row__autopay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bill-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  white-space: nowrap;
  text-align: right;
}

.bill-row__chips {
  display: contents;
}

.money-mobile-actions {
  display: none;
}

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }
  .money-mobile-actions { display: flex; margin-bottom: var(--space-m); }
  .bills-table__header { display: none; }
  .bill-row {
    grid-template-columns: 1fr 5.5rem;
    grid-template-rows: auto auto;
    padding: var(--space-s) var(--space-l);
    row-gap: var(--space-2xs);
    column-gap: var(--space-m);
  }
  .bill-row__name { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .bill-row__amount { grid-column: 2; grid-row: 1 / -1; align-self: center; text-align: right; }
  .bill-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    grid-column: 1;
    grid-row: 2;
    align-items: center;
  }
}
</style>
