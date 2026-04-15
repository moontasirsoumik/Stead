<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import DataList from '@/components/data/DataList.vue'
import InlineStat from '@/components/data/InlineStat.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useRemindersStore } from '@/stores/reminders.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatRelativeDate } from '@/utils/format'
import type { Reminder } from '@/models/reminder.model'
import type { ReminderStatus } from '@/models/enums'

const remindersStore = useRemindersStore()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const search = ref('')
const statusFilter = ref('')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingReminder = ref<Reminder | null>(null)

const formTitle = ref('')
const formType = ref('')
const formDueDate = ref('')
const formRepeatRule = ref('')
const formAssignedTo = ref('')
const formNote = ref('')

const confirmDeleteOpen = ref(false)
const deletingReminderId = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'snoozed', label: 'Snoozed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'done', label: 'Done' },
]

const memberFormOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...householdStore.activeMembers.map((m) => ({ value: m.id, label: m.name })),
])

function getMemberName(id: string | null): string | null {
  if (!id) return null
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? null
}

const filteredItems = computed(() => {
  let result = remindersStore.items
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((r) => r.title.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter((r) => r.status === statusFilter.value)
  }
  return result
})

const sortedItems = computed(() =>
  [...filteredItems.value].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  }),
)

function isOverdue(r: Reminder): boolean {
  if (r.status !== 'active' || !r.due_date) return false
  return new Date(r.due_date) < new Date(new Date().toDateString())
}

function statusVariant(r: Reminder) {
  if (isOverdue(r)) return 'error'
  const map: Record<ReminderStatus, 'default' | 'brand' | 'success' | 'warning'> = {
    active: 'default', snoozed: 'brand', done: 'success', dismissed: 'warning',
  }
  return map[r.status]
}

function statusLabel(r: Reminder) {
  if (isOverdue(r)) return 'Overdue'
  const map: Record<ReminderStatus, string> = { active: 'Active', snoozed: 'Snoozed', done: 'Done', dismissed: 'Dismissed' }
  return map[r.status]
}

function openCreateDrawer() {
  editingReminder.value = null
  formTitle.value = ''
  formType.value = ''
  formDueDate.value = ''
  formRepeatRule.value = ''
  formAssignedTo.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(reminder: Reminder) {
  editingReminder.value = reminder
  formTitle.value = reminder.title
  formType.value = reminder.type ?? ''
  formDueDate.value = reminder.due_date ? reminder.due_date.slice(0, 10) : ''
  formRepeatRule.value = reminder.repeat_rule ?? ''
  formAssignedTo.value = reminder.assigned_to ?? ''
  formNote.value = reminder.note ?? ''
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formTitle.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      title: formTitle.value.trim(),
      type: formType.value.trim() || null,
      due_date: formDueDate.value || null,
      repeat_rule: formRepeatRule.value.trim() || null,
      assigned_to: formAssignedTo.value || null,
      note: formNote.value.trim() || null,
    }
    if (editingReminder.value) {
      await remindersStore.update(editingReminder.value.id, payload)
    } else {
      await remindersStore.create({
        ...payload,
        linked_entity_type: null,
        linked_entity_id: null,
        status: 'active' as ReminderStatus,
        household_id: authStore.householdId!,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  deletingReminderId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingReminderId.value) {
    await remindersStore.remove(deletingReminderId.value)
  }
  confirmDeleteOpen.value = false
  deletingReminderId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await remindersStore.fetchReminders(authStore.householdId)
    if (!householdStore.members.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Reminders" subtitle="Never forget the important things" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Reminder</SButton>
      </template>
    </PageHeader>

    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <InlineStat label="Active" :value="remindersStore.activeReminders.length" />
      <InlineStat label="Overdue" :value="remindersStore.overdueReminders.length" :trend="remindersStore.overdueReminders.length > 0 ? 'down' : 'neutral'" />
      <InlineStat label="This Week" :value="remindersStore.upcomingReminders.length" />
    </div>

    <ErrorBanner v-if="remindersStore.error" :message="remindersStore.error" @retry="authStore.householdId && remindersStore.fetchReminders(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
    </FilterBar>

    <ContentCard v-if="remindersStore.loading && !remindersStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState v-if="!remindersStore.items.length" title="No reminders" subtitle="Set reminders for important dates and recurring events." icon="empty" action-label="Add reminder" @action="openCreateDrawer" />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 3 }">
      <DataList dividers>
        <div v-for="reminder in sortedItems" :key="reminder.id" :class="['reminder-row', { 'reminder-row--overdue': isOverdue(reminder) }]" role="listitem" @click="openEditDrawer(reminder)">
          <span class="reminder-row__title">{{ reminder.title }}</span>
          <div class="reminder-row__meta">
            <StatusBadge :variant="statusVariant(reminder)">{{ statusLabel(reminder) }}</StatusBadge>
            <SBadge v-if="reminder.type" size="sm">{{ reminder.type }}</SBadge>
          </div>
          <span v-if="reminder.due_date" class="reminder-row__due">{{ formatRelativeDate(reminder.due_date) }}</span>
          <div class="reminder-row__end">
            <SAvatar v-if="getMemberName(reminder.assigned_to)" :name="getMemberName(reminder.assigned_to)!" size="sm" />
            <div class="reminder-row__actions" @click.stop>
              <SButton v-if="reminder.status === 'active'" variant="subtle" size="sm" @click="remindersStore.markDone(reminder.id)">Done</SButton>
              <SButton v-if="reminder.status === 'active'" variant="subtle" size="sm" @click="remindersStore.snooze(reminder.id)">Snooze</SButton>
              <SButton v-if="reminder.status === 'active' || reminder.status === 'snoozed'" variant="subtle" size="sm" @click="remindersStore.dismiss(reminder.id)">Dismiss</SButton>
              <SButton variant="danger" size="sm" @click="confirmDelete(reminder.id)">Delete</SButton>
            </div>
          </div>
        </div>
      </DataList>
    </ContentCard>

    <FormDrawer :open="drawerOpen" :title="editingReminder ? 'Edit Reminder' : 'Add Reminder'" :submit-label="editingReminder ? 'Update' : 'Create'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formTitle" label="Title" required placeholder="What to remember" /></FormField>
        <FormField><SInput v-model="formType" label="Type" placeholder="e.g. Bill, Appointment, Chore" /></FormField>
        <FormField><SInput v-model="formDueDate" label="Due Date" type="date" /></FormField>
        <FormField><SInput v-model="formRepeatRule" label="Repeat Rule" placeholder="e.g. Every Monday, Monthly on 1st" /></FormField>
        <FormField><SSelect v-model="formAssignedTo" label="Assigned To" :options="memberFormOptions" placeholder="Select member" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra details…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Reminder" message="Remove this reminder permanently?" confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
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

.reminder-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: 36px;
  padding: var(--space-xs) var(--space-l);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.reminder-row:hover {
  background: var(--color-bg-secondary);
}

.reminder-row--overdue {
  border-left: 3px solid var(--color-error);
}

.reminder-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}

.reminder-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.reminder-row__due {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}

.reminder-row__end {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
}

.reminder-row__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.reminder-row:hover .reminder-row__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .stats-row > * { border-right: none; border-bottom: 1px solid var(--color-border-subtle); }
  .stats-row > *:last-child { border-bottom: none; }
  .reminder-row { flex-wrap: wrap; }
  .reminder-row__actions { opacity: 1; flex-wrap: wrap; }
}
</style>
