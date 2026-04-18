<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SToggle from '@/components/ui/SToggle.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatCents, formatDate } from '@/utils/format'
import type { Subscription } from '@/models/subscription.model'

const subscriptionsStore = useSubscriptionsStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const search = ref('')
const statusFilter = ref('')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingItem = ref<Subscription | null>(null)

const formName = ref('')
const formAmount = ref('')
const formFrequency = ref<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
const formCategory = ref('')
const formNextBillingDate = ref('')
const formAutoRenew = ref(true)
const formUrl = ref('')
const formNote = ref('')

const confirmDeleteOpen = ref(false)
const deletingItemId = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
]

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const filteredItems = computed(() => {
  let result = subscriptionsStore.items
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((s) => s.name.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter((s) => s.status === statusFilter.value)
  }
  return result
})

function statusVariant(status: string): 'success' | 'warning' | 'default' {
  if (status === 'active') return 'success'
  if (status === 'paused') return 'warning'
  return 'default'
}

function frequencyLabel(freq: string): string {
  return freq.charAt(0).toUpperCase() + freq.slice(1)
}

function openCreateDrawer() {
  editingItem.value = null
  formName.value = ''
  formAmount.value = ''
  formFrequency.value = 'monthly'
  formCategory.value = ''
  formNextBillingDate.value = ''
  formAutoRenew.value = true
  formUrl.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(sub: Subscription) {
  editingItem.value = sub
  formName.value = sub.name
  formAmount.value = sub.amount ? String(sub.amount / 100) : ''
  formFrequency.value = sub.frequency
  formCategory.value = sub.category
  formNextBillingDate.value = sub.next_billing_date ?? ''
  formAutoRenew.value = sub.auto_renew
  formUrl.value = sub.url
  formNote.value = sub.note
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      amount: formAmount.value ? Math.round(Number(formAmount.value) * 100) : 0,
      frequency: formFrequency.value,
      category: formCategory.value.trim(),
      next_billing_date: formNextBillingDate.value || null,
      auto_renew: formAutoRenew.value,
      url: formUrl.value.trim(),
      note: formNote.value.trim(),
    }
    if (editingItem.value) {
      await subscriptionsStore.update(editingItem.value.id, payload)
    } else {
      await subscriptionsStore.create({
        ...payload,
        status: 'active',
        household_id: authStore.householdId!,
        owner_id: authStore.memberId!,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

async function pauseSubscription(sub: Subscription) {
  await subscriptionsStore.update(sub.id, { status: 'paused' })
}

async function resumeSubscription(sub: Subscription) {
  await subscriptionsStore.update(sub.id, { status: 'active' })
}

async function cancelSubscription(sub: Subscription) {
  await subscriptionsStore.update(sub.id, { status: 'cancelled' })
}

function confirmDelete(id: string) {
  deletingItemId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingItemId.value) {
    await subscriptionsStore.remove(deletingItemId.value)
  }
  confirmDeleteOpen.value = false
  deletingItemId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await subscriptionsStore.fetchSubscriptions(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Subscriptions" subtitle="Track your recurring costs" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Subscription</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="subscriptionsStore.error" :message="subscriptionsStore.error" @retry="authStore.householdId && subscriptionsStore.fetchSubscriptions(authStore.householdId)" />

    <!-- Monthly total -->
    <div class="stats-bar page-enter" :style="{ '--stagger': 1 }">
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Monthly total</span>
        <span class="stats-bar__value">{{ formatCents(subscriptionsStore.monthlyTotal) }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Active subscriptions</span>
        <span class="stats-bar__value">{{ subscriptionsStore.activeSubscriptions.length }}</span>
      </div>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
    </FilterBar>

    <div v-if="subscriptionsStore.loading && !subscriptionsStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else-if="!filteredItems.length">
      <div class="empty-section page-enter" :style="{ '--stagger': 3 }">
        <EmptyState v-if="!subscriptionsStore.items.length" title="No subscriptions tracked yet" subtitle="Add your first subscription to see your monthly costs at a glance." icon="empty" action-label="Add subscription" @action="openCreateDrawer" />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
      </div>
    </template>

    <template v-else>
      <div class="sub-table page-enter" :style="{ '--stagger': 3 }">
        <div class="sub-table__header">
          <span class="sub-table__th">Name</span>
          <span class="sub-table__th sub-table__th--center">Status</span>
          <span class="sub-table__th sub-table__th--center">Frequency</span>
          <span class="sub-table__th sub-table__th--center">Category</span>
          <span class="sub-table__th sub-table__th--right">Amount</span>
          <span class="sub-table__th sub-table__th--right">Next billing</span>
        </div>
        <div
          v-for="sub in filteredItems"
          :key="sub.id"
          class="sub-row"
          :class="{ 'sub-row--inactive': sub.status !== 'active' }"
          @click="openEditDrawer(sub)"
        >
          <div class="sub-row__name">{{ sub.name }}</div>
          <div class="sub-row__chips">
            <div class="sub-row__status">
              <SBadge :variant="statusVariant(sub.status)" size="sm">{{ sub.status }}</SBadge>
            </div>
            <div class="sub-row__freq">
              <SBadge size="sm">{{ frequencyLabel(sub.frequency) }}</SBadge>
            </div>
            <div class="sub-row__category">
              <span v-if="sub.category" class="sub-row__cat-text">{{ sub.category }}</span>
            </div>
            <div class="sub-row__next">{{ sub.next_billing_date ? formatDate(sub.next_billing_date) : '—' }}</div>
          </div>
          <div class="sub-row__amount">{{ formatCents(sub.amount) }}</div>
        </div>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingItem ? 'Edit Subscription' : 'Add Subscription'" :submit-label="editingItem ? 'Update' : 'Add'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="e.g. Netflix, Spotify" /></FormField>
        <FormField><SInput v-model="formAmount" label="Amount ($)" type="number" placeholder="0.00" /></FormField>
        <FormField><SSelect v-model="formFrequency" :options="frequencyOptions" label="Frequency" /></FormField>
        <FormField><SInput v-model="formCategory" label="Category" placeholder="e.g. Entertainment, Utilities" /></FormField>
        <FormField><SInput v-model="formNextBillingDate" label="Next billing date" type="date" /></FormField>
        <FormField row><SToggle v-model="formAutoRenew" label="Auto-renew" /></FormField>
        <FormField><SInput v-model="formUrl" label="URL" placeholder="https://…" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Subscription" message="This subscription will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
.stats-bar {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-l);
  overflow: hidden;
}
.stats-bar__cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  border-right: 1px solid var(--color-border-default);
}
.stats-bar__cell:last-child { border-right: none; }
.stats-bar__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}
.stats-bar__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
}

.sub-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.sub-table__header {
  display: grid;
  grid-template-columns: 1fr 80px 90px 100px 100px 100px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

.sub-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.sub-table__th--center { text-align: center; }
.sub-table__th--right { text-align: right; }

.sub-row {
  display: grid;
  grid-template-columns: 1fr 80px 90px 100px 100px 100px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.sub-row:last-child { border-bottom: none; }
.sub-row:hover { background: var(--color-bg-tertiary); }
.sub-row--inactive { opacity: 0.6; }

.sub-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-row__status,
.sub-row__freq {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-row__category {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sub-row__cat-text {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.sub-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  text-align: right;
}

.sub-row__next {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: right;
}

.sub-row__chips {
  display: contents;
}

@media (max-width: 640px) {
  .sub-table__header { display: none; }
  .sub-row {
    grid-template-columns: 1fr 5.5rem;
    grid-template-rows: auto auto;
    padding: var(--space-s) var(--space-l);
    row-gap: var(--space-2xs);
    column-gap: var(--space-m);
  }
  .sub-row__name { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .sub-row__amount { grid-column: 2; grid-row: 1 / -1; align-self: center; text-align: right; }
  .sub-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    grid-column: 1;
    grid-row: 2;
    align-items: center;
  }
  .sub-row__next { font: var(--text-caption); color: var(--color-fg-tertiary); }
}
</style>
