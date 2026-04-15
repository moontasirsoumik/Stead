<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SectionHeader from '@/components/data/SectionHeader.vue'
import DataList from '@/components/data/DataList.vue'
import InlineStat from '@/components/data/InlineStat.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useMaintenanceStore } from '@/stores/maintenance.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents, formatRelativeDate } from '@/utils/format'
import type { MaintenanceItem } from '@/models/maintenance.model'
import type { MaintenanceStatus } from '@/models/enums'
import type { BadgeVariant } from '@/components/ui/SBadge.vue'

const maintenanceStore = useMaintenanceStore()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const search = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingItem = ref<MaintenanceItem | null>(null)

const formItem = ref('')
const formType = ref('')
const formNextDueDate = ref('')
const formRecurringRule = ref('')
const formEstimatedCostDollars = ref('')
const formAssignedTo = ref('')
const formVendor = ref('')
const formContact = ref('')
const formNote = ref('')

const confirmDeleteOpen = ref(false)
const deletingItemId = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'done', label: 'Done' },
  { value: 'skipped', label: 'Skipped' },
]

const typeOptions = computed(() => {
  const types = new Set(maintenanceStore.items.map((i) => i.type).filter(Boolean) as string[])
  return [
    { value: '', label: 'All types' },
    ...[...types].sort().map((t) => ({ value: t, label: t })),
  ]
})

const memberOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...householdStore.activeMembers.map((m) => ({ value: m.id, label: m.name })),
])

function getMemberName(id: string | null): string | null {
  if (!id) return null
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? null
}

function statusVariant(s: MaintenanceStatus): BadgeVariant {
  const map: Record<MaintenanceStatus, BadgeVariant> = {
    upcoming: 'default',
    overdue: 'error',
    done: 'success',
    skipped: 'warning',
  }
  return map[s]
}

const statusLabels: Record<MaintenanceStatus, string> = {
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  done: 'Done',
  skipped: 'Skipped',
}

const filteredItems = computed(() => {
  let result = maintenanceStore.items
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((i) =>
      i.item.toLowerCase().includes(q)
      || (i.vendor && i.vendor.toLowerCase().includes(q))
      || (i.type && i.type.toLowerCase().includes(q)),
    )
  }
  if (statusFilter.value) {
    result = result.filter((i) => i.status === statusFilter.value)
  }
  if (typeFilter.value) {
    result = result.filter((i) => i.type === typeFilter.value)
  }
  return [...result].sort((a, b) => {
    if (!a.next_due_date) return 1
    if (!b.next_due_date) return -1
    return a.next_due_date.localeCompare(b.next_due_date)
  })
})

const statusGroups = computed(() => {
  const order: MaintenanceStatus[] = ['overdue', 'upcoming', 'done', 'skipped']
  const groups: { status: MaintenanceStatus; label: string; items: MaintenanceItem[] }[] = []
  for (const s of order) {
    const groupItems = filteredItems.value.filter((i) => i.status === s)
    if (groupItems.length) {
      groups.push({ status: s, label: statusLabels[s], items: groupItems })
    }
  }
  return groups
})

function openCreateDrawer() {
  editingItem.value = null
  formItem.value = ''
  formType.value = ''
  formNextDueDate.value = ''
  formRecurringRule.value = ''
  formEstimatedCostDollars.value = ''
  formAssignedTo.value = ''
  formVendor.value = ''
  formContact.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(item: MaintenanceItem) {
  editingItem.value = item
  formItem.value = item.item
  formType.value = item.type ?? ''
  formNextDueDate.value = item.next_due_date ? item.next_due_date.slice(0, 10) : ''
  formRecurringRule.value = item.recurring_rule ?? ''
  formEstimatedCostDollars.value = item.estimated_cost != null ? (item.estimated_cost / 100).toFixed(2) : ''
  formAssignedTo.value = item.assigned_to ?? ''
  formVendor.value = item.vendor ?? ''
  formContact.value = item.contact ?? ''
  formNote.value = item.note ?? ''
  drawerOpen.value = true
}

function parseCents(dollars: string): number | null {
  if (!dollars.trim()) return null
  const n = parseFloat(dollars)
  if (isNaN(n)) return null
  return Math.round(n * 100)
}

async function handleSubmit() {
  if (!formItem.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      item: formItem.value.trim(),
      type: formType.value.trim() || null,
      next_due_date: formNextDueDate.value || null,
      recurring_rule: formRecurringRule.value.trim() || null,
      estimated_cost: parseCents(formEstimatedCostDollars.value),
      assigned_to: formAssignedTo.value || null,
      vendor: formVendor.value.trim() || null,
      contact: formContact.value.trim() || null,
      note: formNote.value.trim() || null,
    }
    if (editingItem.value) {
      await maintenanceStore.updateItem(editingItem.value.id, payload)
    } else {
      await maintenanceStore.createItem({
        ...payload,
        household_id: authStore.householdId!,
        status: 'upcoming' as MaintenanceStatus,
        last_done_date: null,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  deletingItemId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingItemId.value) {
    await maintenanceStore.removeItem(deletingItemId.value)
  }
  confirmDeleteOpen.value = false
  deletingItemId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await maintenanceStore.fetchItems(authStore.householdId)
    if (!householdStore.members.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Maintenance" subtitle="Home maintenance tracking" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Record</SButton>
      </template>
    </PageHeader>

    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <InlineStat label="Total" :value="maintenanceStore.items.length" />
      <InlineStat label="Overdue" :value="maintenanceStore.overdueItems.length" :trend="maintenanceStore.overdueItems.length > 0 ? 'down' : 'neutral'" />
      <InlineStat label="Upcoming" :value="maintenanceStore.upcomingItems.length" />
    </div>

    <ErrorBanner v-if="maintenanceStore.error" :message="maintenanceStore.error" @retry="authStore.householdId && maintenanceStore.fetchItems(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
      <SSelect v-model="typeFilter" :options="typeOptions" placeholder="Type" />
    </FilterBar>

    <ContentCard v-if="maintenanceStore.loading && !maintenanceStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState v-if="!maintenanceStore.items.length" title="No maintenance records" subtitle="Track home repairs, appliance upkeep, and maintenance schedules here." icon="empty" action-label="Add record" @action="openCreateDrawer" />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <template v-else>
      <div v-for="(group, gi) in statusGroups" :key="group.status" class="page-enter" :style="{ '--stagger': 3 + gi }">
        <SectionHeader :title="group.label" :count="group.items.length" />
        <ContentCard>
          <DataList dividers>
            <div v-for="item in group.items" :key="item.id" class="maint-row" role="listitem">
              <span class="maint-row__title">{{ item.item }}</span>
              <div class="maint-row__meta">
                <SBadge v-if="item.type" variant="info" size="sm">{{ item.type }}</SBadge>
                <SBadge :variant="statusVariant(item.status)" size="sm">{{ statusLabels[item.status] }}</SBadge>
                <span v-if="item.next_due_date" class="maint-row__due">{{ formatRelativeDate(item.next_due_date) }}</span>
                <span v-if="item.estimated_cost != null" class="maint-row__cost">{{ formatCents(item.estimated_cost) }}</span>
              </div>
              <div class="maint-row__end">
                <span v-if="item.vendor" class="maint-row__vendor">{{ item.vendor }}</span>
                <SAvatar v-if="getMemberName(item.assigned_to)" :name="getMemberName(item.assigned_to)!" size="sm" />
                <div class="maint-row__actions">
                  <SButton v-if="item.status !== 'done'" variant="subtle" size="sm" @click="maintenanceStore.markDone(item.id)">Done</SButton>
                  <SButton v-if="item.status !== 'skipped' && item.status !== 'done'" variant="subtle" size="sm" @click="maintenanceStore.skip(item.id)">Skip</SButton>
                  <SButton variant="subtle" size="sm" @click="openEditDrawer(item)">Edit</SButton>
                  <SButton variant="danger" size="sm" @click="confirmDelete(item.id)">Delete</SButton>
                </div>
              </div>
            </div>
          </DataList>
        </ContentCard>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingItem ? 'Edit Record' : 'Add Record'" :submit-label="editingItem ? 'Update' : 'Create'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formItem" label="Item" required placeholder="e.g. HVAC filter replacement" /></FormField>
        <FormField><SInput v-model="formType" label="Type" placeholder="e.g. Plumbing, HVAC, Electrical" /></FormField>
        <FormField><SInput v-model="formNextDueDate" label="Next Due Date" type="date" /></FormField>
        <FormField><SInput v-model="formRecurringRule" label="Recurring Rule" placeholder="e.g. Every 3 months" /></FormField>
        <FormField><SInput v-model="formEstimatedCostDollars" label="Estimated Cost ($)" type="number" step="0.01" min="0" placeholder="0.00" /></FormField>
        <FormField><SSelect v-model="formAssignedTo" label="Assigned To" :options="memberOptions" placeholder="Select member" /></FormField>
        <FormField><SInput v-model="formVendor" label="Vendor" placeholder="e.g. ABC Plumbing" /></FormField>
        <FormField><SInput v-model="formContact" label="Contact" placeholder="e.g. 555-1234" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="3" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Record" message="Are you sure? This maintenance record will be removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
.stats-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-card);
  margin-bottom: var(--space-m);
  overflow: hidden;
}

.stats-row > * {
  flex: 1;
  border-right: 1px solid var(--color-border-subtle);
}

.stats-row > *:last-child {
  border-right: none;
}

.maint-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: 36px;
  padding: var(--space-xs) var(--space-l);
  transition: background var(--duration-fast) var(--easing-standard);
}

.maint-row:hover {
  background: var(--color-bg-secondary);
}

.maint-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}

.maint-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.maint-row__due {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.maint-row__cost {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.maint-row__end {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
  margin-left: auto;
}

.maint-row__vendor {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.maint-row__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.maint-row:hover .maint-row__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .stats-row > * { border-right: none; border-bottom: 1px solid var(--color-border-subtle); }
  .stats-row > *:last-child { border-bottom: none; }
  .maint-row { flex-wrap: wrap; }
  .maint-row__actions { opacity: 1; }
}
</style>
