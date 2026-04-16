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
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SCheckbox from '@/components/ui/SCheckbox.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useTasksStore } from '@/stores/tasks.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatRelativeDate } from '@/utils/format'
import type { Task } from '@/models/task.model'
import type { TaskStatus, TaskPriority, TaskType } from '@/models/enums'

const tasksStore = useTasksStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const householdStore = useHouseholdStore()
const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const assigneeFilter = ref('')
const typeFilter = ref<TaskType | 'all'>('all')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingTask = ref<Task | null>(null)

const formTitle = ref('')
const formDescription = ref('')
const formAssignee = ref('')
const formRoom = ref('')
const formCategory = ref('')
const formDueDate = ref('')
const formPriority = ref<TaskPriority>('medium')
const formNote = ref('')
const formTaskType = ref<TaskType>('regular')
const formEstimatedCost = ref('')
const formVendor = ref('')
const formContact = ref('')

const expandedTaskId = ref<string | null>(null)
const newSubtaskTitle = ref('')

const confirmDeleteOpen = ref(false)
const deletingTaskId = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'skipped', label: 'Skipped' },
]

const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const priorityFormOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'regular', label: 'Tasks' },
  { value: 'maintenance', label: 'Maintenance' },
]

const typeFormOptions = [
  { value: 'regular', label: 'Regular Task' },
  { value: 'maintenance', label: 'Maintenance' },
]

const memberOptions = computed(() => [
  { value: '', label: 'Anyone' },
  ...householdStore.activeMembers.map((m) => ({ value: m.id, label: m.name })),
])

const memberFormOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...householdStore.activeMembers.map((m) => ({ value: m.id, label: m.name })),
])

function getMemberName(id: string | null): string | null {
  if (!id) return null
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? null
}

const filteredItems = computed(() => {
  let result = tasksStore.items.filter((t) => t.scope === appStore.scope)
  if (typeFilter.value !== 'all') {
    result = result.filter((t) => t.task_type === typeFilter.value)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((t) => t.title.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter((t) => t.status === statusFilter.value)
  }
  if (priorityFilter.value) {
    result = result.filter((t) => t.priority === priorityFilter.value)
  }
  if (assigneeFilter.value) {
    result = result.filter((t) => t.assignee === assigneeFilter.value)
  }
  return result
})

const statusGroups = computed(() => {
  const order: TaskStatus[] = ['not_started', 'in_progress', 'done', 'skipped']
  const groups: { status: TaskStatus; label: string; tasks: Task[] }[] = []
  for (const s of order) {
    const tasks = filteredItems.value.filter((t) => t.status === s)
    if (tasks.length) {
      const labels: Record<string, string> = {
        not_started: 'Not Started',
        in_progress: 'In Progress',
        done: 'Done',
        skipped: 'Skipped',
        overdue: 'Overdue',
      }
      groups.push({ status: s, label: labels[s] ?? s, tasks })
    }
  }
  return groups
})

function priorityVariant(p: TaskPriority) {
  const map: Record<TaskPriority, 'error' | 'warning' | 'default'> = { high: 'error', medium: 'warning', low: 'default' }
  return map[p]
}

function statusVariant(s: TaskStatus) {
  const map: Record<TaskStatus, 'default' | 'brand' | 'success' | 'error' | 'warning'> = {
    not_started: 'default', in_progress: 'brand', done: 'success', overdue: 'error', skipped: 'warning',
  }
  return map[s]
}

function subtaskProgress(taskId: string): string {
  const subs = tasksStore.subtasks.get(taskId)
  if (!subs || subs.length === 0) return ''
  const done = subs.filter((s) => s.done).length
  return `${done}/${subs.length}`
}

function toggleExpand(taskId: string) {
  if (expandedTaskId.value === taskId) {
    expandedTaskId.value = null
  } else {
    expandedTaskId.value = taskId
    tasksStore.fetchSubtasks(taskId)
  }
}

async function quickStatus(taskId: string, status: TaskStatus) {
  await tasksStore.updateStatus(taskId, status)
}

function openCreateDrawer() {
  editingTask.value = null
  formTitle.value = ''
  formDescription.value = ''
  formAssignee.value = ''
  formRoom.value = ''
  formCategory.value = ''
  formDueDate.value = ''
  formPriority.value = 'medium'
  formNote.value = ''
  formTaskType.value = typeFilter.value !== 'all' ? typeFilter.value : 'regular'
  formEstimatedCost.value = ''
  formVendor.value = ''
  formContact.value = ''
  drawerOpen.value = true
}

function openEditDrawer(task: Task) {
  editingTask.value = task
  formTitle.value = task.title
  formDescription.value = task.description ?? ''
  formAssignee.value = task.assignee ?? ''
  formRoom.value = task.room ?? ''
  formCategory.value = task.category ?? ''
  formDueDate.value = task.due_date ? task.due_date.slice(0, 10) : ''
  formPriority.value = task.priority
  formNote.value = task.note ?? ''
  formTaskType.value = task.task_type
  formEstimatedCost.value = task.estimated_cost != null ? String(task.estimated_cost / 100) : ''
  formVendor.value = task.vendor ?? ''
  formContact.value = task.contact ?? ''
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formTitle.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || null,
      task_type: formTaskType.value,
      assignee: formAssignee.value || null,
      room: formRoom.value.trim() || null,
      category: formCategory.value.trim() || null,
      due_date: formDueDate.value || null,
      priority: formPriority.value,
      note: formNote.value.trim() || null,
      estimated_cost: formEstimatedCost.value ? Math.round(Number(formEstimatedCost.value) * 100) : null,
      vendor: formVendor.value.trim() || null,
      contact: formContact.value.trim() || null,
    }
    if (editingTask.value) {
      await tasksStore.updateTask(editingTask.value.id, payload)
    } else {
      await tasksStore.createTask({
        ...payload,
        household_id: authStore.householdId!,
        status: 'not_started' as TaskStatus,
        completed_at: null,
        recurring_rule: null,
        created_by: authStore.memberId ?? null,
        last_done_date: null,
        deleted: false,
        scope: appStore.scope,
        owner_id: appStore.scope === 'personal' ? authStore.memberId : null,      rotation_enabled: false,
      rotation_members: '',
      rotation_index: 0,      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

async function handleAddSubtask(taskId: string) {
  if (!newSubtaskTitle.value.trim()) return
  await tasksStore.addSubtask(taskId, {
    task_id: taskId,
    title: newSubtaskTitle.value.trim(),
    done: false,
    order: (tasksStore.subtasks.get(taskId)?.length ?? 0) + 1,
    household_id: authStore.householdId!,
    deleted: false,
  })
  newSubtaskTitle.value = ''
}

function confirmDelete(id: string) {
  deletingTaskId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingTaskId.value) {
    await tasksStore.removeTask(deletingTaskId.value)
  }
  confirmDeleteOpen.value = false
  deletingTaskId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await tasksStore.fetchTasks(authStore.householdId)
    if (!householdStore.members.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Tasks" subtitle="Household to-dos, chores & maintenance" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Task</SButton>
      </template>
    </PageHeader>

    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <InlineStat label="Total" :value="tasksStore.items.length" />
      <InlineStat label="Due Today" :value="tasksStore.dueToday.length" />
      <InlineStat label="Overdue" :value="tasksStore.overdueTasks.length" :trend="tasksStore.overdueTasks.length > 0 ? 'down' : 'neutral'" />
      <InlineStat label="Maintenance" :value="tasksStore.maintenanceTasks.length" />
    </div>

    <ErrorBanner v-if="tasksStore.error" :message="tasksStore.error" @retry="authStore.householdId && tasksStore.fetchTasks(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="typeFilter" :options="typeOptions" placeholder="Type" />
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
      <SSelect v-model="priorityFilter" :options="priorityOptions" placeholder="Priority" />
      <SSelect v-model="assigneeFilter" :options="memberOptions" placeholder="Assignee" />
    </FilterBar>

    <ContentCard v-if="tasksStore.loading && !tasksStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState v-if="!tasksStore.items.length" title="All clear!" subtitle="No tasks right now. Add one to keep the household running smoothly." icon="success" action-label="Add task" @action="openCreateDrawer" />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <template v-else>
      <div v-for="(group, gi) in statusGroups" :key="group.status" class="page-enter" :style="{ '--stagger': 3 + gi }">
        <SectionHeader :title="group.label" :count="group.tasks.length" />
        <ContentCard>
          <DataList dividers>
            <div v-for="task in group.tasks" :key="task.id" class="task-row-wrapper" role="listitem">
              <div class="task-row" @click="toggleExpand(task.id)">
                <span class="task-row__title">{{ task.title }}</span>
                <div class="task-row__meta">
                  <SBadge v-if="task.task_type === 'maintenance'" variant="default" size="sm">maintenance</SBadge>
                  <SBadge :variant="priorityVariant(task.priority)" size="sm">{{ task.priority }}</SBadge>
                  <StatusBadge :variant="statusVariant(task.status)">{{ task.status.replace('_', ' ') }}</StatusBadge>
                  <span v-if="task.due_date" class="task-row__due">{{ formatRelativeDate(task.due_date) }}</span>
                  <span v-if="subtaskProgress(task.id)" class="task-row__subtasks">{{ subtaskProgress(task.id) }}</span>
                </div>
                <div class="task-row__end">
                  <SAvatar v-if="getMemberName(task.assignee)" :name="getMemberName(task.assignee)!" size="sm" />
                  <div class="task-row__actions" @click.stop>
                    <SButton v-if="task.status === 'not_started'" variant="subtle" size="sm" @click="quickStatus(task.id, 'in_progress')">Start</SButton>
                    <SButton v-if="task.status !== 'done'" variant="subtle" size="sm" @click="quickStatus(task.id, 'done')">Complete</SButton>
                    <SButton v-if="task.status !== 'skipped' && task.status !== 'done'" variant="subtle" size="sm" @click="quickStatus(task.id, 'skipped')">Skip</SButton>
                  </div>
                </div>
              </div>

              <div v-if="expandedTaskId === task.id" class="task-expanded" @click.stop>
                <div v-if="task.description" class="task-expanded__desc">{{ task.description }}</div>
                <div v-if="task.task_type === 'maintenance'" class="task-expanded__maintenance">
                  <span v-if="task.vendor" class="task-expanded__detail"><strong>Vendor:</strong> {{ task.vendor }}</span>
                  <span v-if="task.contact" class="task-expanded__detail"><strong>Contact:</strong> {{ task.contact }}</span>
                  <span v-if="task.estimated_cost != null" class="task-expanded__detail"><strong>Est. Cost:</strong> ${{ (task.estimated_cost / 100).toFixed(2) }}</span>
                  <span v-if="task.last_done_date" class="task-expanded__detail"><strong>Last Done:</strong> {{ formatRelativeDate(task.last_done_date) }}</span>
                </div>
                <div class="task-expanded__subtasks">
                  <p class="task-expanded__label">Subtasks</p>
                  <div v-for="sub in (tasksStore.subtasks.get(task.id) ?? [])" :key="sub.id" class="subtask-row">
                    <SCheckbox :model-value="sub.done" :label="sub.title" @update:model-value="tasksStore.toggleSubtask(sub.id, task.id)" />
                    <SIconButton label="Delete subtask" size="sm" @click="tasksStore.removeSubtask(sub.id, task.id)">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
                    </SIconButton>
                  </div>
                  <div class="subtask-add">
                    <SInput v-model="newSubtaskTitle" placeholder="Add a subtask…" @keydown.enter="handleAddSubtask(task.id)" />
                    <SButton variant="subtle" size="sm" @click="handleAddSubtask(task.id)">Add</SButton>
                  </div>
                </div>
                <div class="task-expanded__footer">
                  <SButton variant="subtle" size="sm" @click="openEditDrawer(task)">Edit</SButton>
                  <SButton variant="danger" size="sm" @click="confirmDelete(task.id)">Delete</SButton>
                </div>
              </div>
            </div>
          </DataList>
        </ContentCard>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingTask ? 'Edit Task' : 'Add Task'" :submit-label="editingTask ? 'Update' : 'Create'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SSelect v-model="formTaskType" label="Type" :options="typeFormOptions" /></FormField>
        <FormField><SInput v-model="formTitle" label="Title" required placeholder="What needs doing?" /></FormField>
        <FormField><STextarea v-model="formDescription" label="Description" :rows="3" placeholder="Optional details…" /></FormField>
        <FormField><SSelect v-model="formAssignee" label="Assignee" :options="memberFormOptions" placeholder="Select member" /></FormField>
        <FormField><SInput v-model="formRoom" label="Room" placeholder="e.g. Kitchen, Bathroom" /></FormField>
        <FormField><SInput v-model="formCategory" label="Category" placeholder="e.g. Cleaning, Repair" /></FormField>
        <FormField><SInput v-model="formDueDate" label="Due Date" type="date" /></FormField>
        <FormField><SSelect v-model="formPriority" label="Priority" :options="priorityFormOptions" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
      <FormSection v-if="formTaskType === 'maintenance'" title="Maintenance Details">
        <FormField><SInput v-model="formEstimatedCost" label="Estimated Cost ($)" type="number" placeholder="0.00" /></FormField>
        <FormField><SInput v-model="formVendor" label="Vendor / Service" placeholder="e.g. Bob's Plumbing" /></FormField>
        <FormField><SInput v-model="formContact" label="Contact" placeholder="Phone or email" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Task" message="Are you sure? This task and its subtasks will be removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
.stats-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
  box-shadow: var(--shadow-2), var(--shadow-card);
  margin-bottom: var(--space-l);
  overflow: hidden;
}

.stats-row > * {
  flex: 1;
  border-right: 1px solid var(--color-border-subtle);
}

.stats-row > *:last-child {
  border-right: none;
}

.task-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: var(--height-row-min);
  padding: var(--space-xs) var(--space-l);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.task-row:hover {
  background: var(--color-bg-tertiary);
}

.task-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}

.task-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.task-row__due {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.task-row__subtasks {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  background: var(--color-bg-tertiary);
  padding: 0 var(--space-xs);
  border-radius: var(--radius-s);
}

.task-row__end {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
  margin-left: auto;
}

.task-row__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.task-row:hover .task-row__actions {
  opacity: 1;
}

.task-expanded {
  padding: var(--space-s) var(--space-l) var(--space-m);
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-subtle);
}

.task-expanded__desc {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  margin-bottom: var(--space-s);
}

.task-expanded__maintenance {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s) var(--space-l);
  margin-bottom: var(--space-s);
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

.task-expanded__detail strong {
  color: var(--color-fg-primary);
}

.task-expanded__label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  margin-bottom: var(--space-xs);
}

.task-expanded__subtasks {
  margin-bottom: var(--space-s);
}

.subtask-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  padding: 0;
}

.subtask-add {
  display: flex;
  gap: var(--space-xs);
  align-items: flex-end;
  margin-top: var(--space-xs);
}

.task-expanded__footer {
  display: flex;
  gap: var(--space-xs);
  padding-top: var(--space-s);
  border-top: 1px solid var(--color-border-subtle);
}

@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .stats-row > * { border-right: none; border-bottom: 1px solid var(--color-border-subtle); }
  .stats-row > *:last-child { border-bottom: none; }
  .task-row { flex-wrap: wrap; }
  .task-row__actions { opacity: 1; }
}
</style>
