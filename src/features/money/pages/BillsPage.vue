<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
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
      :style="{ '--stagger': 1 }"
    >
      <template #actions>
        <SButton @click="openAdd">Add Bill</SButton>
      </template>
    </PageHeader>

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

    <div v-else-if="billsStore.items.length" class="bills-list">
      <ContentCard
        v-for="(bill, idx) in billsStore.items"
        :key="bill.id"
        padding="sm"
        hoverable
        class="bill-row page-enter"
        :style="{ '--stagger': 3 + idx }"
        @click="openEdit(bill)"
      >
        <div class="bill-row__content">
          <div class="bill-row__left">
            <StatusBadge :variant="statusVariant(bill.status)">
              {{ bill.status }}
            </StatusBadge>
            <div class="bill-row__details">
              <span class="bill-row__name">{{ bill.name }}</span>
              <span class="bill-row__meta-text">
                Due day {{ bill.due_day }} · {{ bill.frequency }}
              </span>
            </div>
          </div>
          <div class="bill-row__right">
            <span class="bill-row__amount">{{ formatCents(bill.amount) }}</span>
            <div class="bill-row__badges">
              <SBadge v-if="bill.auto_pay" variant="info" size="sm">Auto-pay</SBadge>
            </div>
            <div class="bill-row__actions">
              <SButton
                v-if="bill.status === 'upcoming' || bill.status === 'overdue'"
                variant="subtle"
                size="sm"
                @click.stop="markPaid(bill)"
              >
                Mark Paid
              </SButton>
              <SButton
                v-if="bill.status === 'upcoming'"
                variant="subtle"
                size="sm"
                @click.stop="skipBill(bill)"
              >
                Skip
              </SButton>
            </div>
          </div>
        </div>
      </ContentCard>
    </div>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        title="No bills set up"
        subtitle="Add your recurring bills to stay on top of payments"
        icon="empty"
        action-label="Add Bill"
        @action="openAdd"
      />
    </ContentCard>

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
.bills-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.bill-row {
  cursor: pointer;
}

.bill-row__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
}

.bill-row__left {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-width: 0;
}

.bill-row__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.bill-row__name {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
}

.bill-row__meta-text {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.bill-row__right {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  flex-shrink: 0;
}

.bill-row__amount {
  font: var(--text-body-1);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  white-space: nowrap;
}

.bill-row__badges {
  display: flex;
  gap: var(--space-xs);
}

.bill-row__actions {
  display: flex;
  gap: var(--space-xs);
}

@media (max-width: 640px) {
  .bill-row__content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-s);
  }

  .bill-row__right {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>
