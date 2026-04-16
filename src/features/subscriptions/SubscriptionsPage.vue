<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
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
    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <ContentCard class="stat-card stat-card--highlight">
        <span class="stat-value">{{ formatCents(subscriptionsStore.monthlyTotal) }}</span>
        <span class="stat-label">Monthly total</span>
      </ContentCard>
      <ContentCard class="stat-card">
        <span class="stat-value">{{ subscriptionsStore.activeSubscriptions.length }}</span>
        <span class="stat-label">Active subscriptions</span>
      </ContentCard>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
    </FilterBar>

    <ContentCard v-if="subscriptionsStore.loading && !subscriptionsStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <template v-else-if="!filteredItems.length">
      <ContentCard class="page-enter" :style="{ '--stagger': 3 }">
        <EmptyState v-if="!subscriptionsStore.items.length" title="No subscriptions tracked yet" subtitle="Add your first subscription to see your monthly costs at a glance." icon="empty" action-label="Add subscription" @action="openCreateDrawer" />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
      </ContentCard>
    </template>

    <template v-else>
      <div class="sub-list page-enter" :style="{ '--stagger': 3 }">
        <div
          v-for="sub in filteredItems"
          :key="sub.id"
          class="sub-card"
          :class="{ 'sub-card--inactive': sub.status !== 'active' }"
          @click="openEditDrawer(sub)"
        >
          <div class="sub-card__main">
            <div class="sub-card__info">
              <span class="sub-card__name">{{ sub.name }}</span>
              <div class="sub-card__meta">
                <SBadge :variant="statusVariant(sub.status)" size="sm">{{ sub.status }}</SBadge>
                <SBadge size="sm">{{ frequencyLabel(sub.frequency) }}</SBadge>
                <span v-if="sub.category" class="sub-card__category">{{ sub.category }}</span>
              </div>
            </div>
            <div class="sub-card__right">
              <span class="sub-card__amount">{{ formatCents(sub.amount) }}</span>
              <span v-if="sub.next_billing_date" class="sub-card__next-date">
                Next: {{ formatDate(sub.next_billing_date) }}
              </span>
            </div>
          </div>
          <div class="sub-card__actions" @click.stop>
            <SIconButton v-if="sub.status === 'active'" label="Pause" size="sm" @click="pauseSubscription(sub)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2V10M8 2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
            </SIconButton>
            <SIconButton v-if="sub.status === 'paused'" label="Resume" size="sm" @click="resumeSubscription(sub)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 2L10 6L3 10V2Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </SIconButton>
            <SIconButton v-if="sub.status !== 'cancelled'" label="Cancel" size="sm" @click="cancelSubscription(sub)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
            </SIconButton>
            <SIconButton label="Delete" size="sm" @click="confirmDelete(sub.id)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4 3V2H8V3M5 5V9M7 5V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" /></svg>
            </SIconButton>
          </div>
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
.stats-row {
  display: flex;
  gap: var(--space-m);
  margin-bottom: var(--space-l);
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-l);
}

.stat-value {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
}

.stat-label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-top: var(--space-2xs);
}

.sub-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  margin-bottom: var(--space-l);
}

.sub-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-l);
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-2), var(--shadow-card);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}

.sub-card:hover {
  background: var(--color-surface-card-hover);
  box-shadow: var(--shadow-8), var(--shadow-card);
  border-color: var(--color-outline-variant);
}

.sub-card--inactive {
  opacity: 0.55;
}

.sub-card__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  gap: var(--space-m);
}

.sub-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  min-width: 0;
}

.sub-card__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.sub-card__category {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.sub-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2xs);
  flex-shrink: 0;
}

.sub-card__amount {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
}

.sub-card__next-date {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.sub-card__actions {
  display: flex;
  gap: var(--space-2xs);
  margin-left: var(--space-m);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.sub-card:hover .sub-card__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .stats-row {
    flex-direction: column;
  }
  .sub-card__main {
    flex-direction: column;
    align-items: flex-start;
  }
  .sub-card__right {
    align-items: flex-start;
  }
  .sub-card__actions {
    opacity: 1;
  }
}
</style>
