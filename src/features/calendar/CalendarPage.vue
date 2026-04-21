<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SInput from '@/components/ui/SInput.vue'
import STimePicker from '@/components/ui/STimePicker.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SCheckbox from '@/components/ui/SCheckbox.vue'
import SVisibilityPicker from '@/components/ui/SVisibilityPicker.vue'
import SMemberPicker from '@/components/ui/SMemberPicker.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import { useCalendarStore, type CalendarItem } from '@/stores/calendar.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useRemindersStore } from '@/stores/reminders.store'
import { useBillsStore } from '@/stores/bills.store'
import { entitySharesDataService } from '@/services/data/entity-shares.data'
import type { Visibility } from '@/models/enums'

const calendarStore = useCalendarStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const householdStore = useHouseholdStore()
const tasksStore = useTasksStore()
const remindersStore = useRemindersStore()
const billsStore = useBillsStore()

// ── Navigation state ──
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1) // 1-indexed
const selectedDate = ref<string | null>(null)

// ── Drawer state ──
const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingEventId = ref<string | null>(null)

// ── Form fields ──
const formTitle = ref('')
const formDescription = ref('')
const formStartDate = ref('')
const formStartTime = ref('')
const formEndDate = ref('')
const formEndTime = ref('')
const formAllDay = ref(false)
const formCategory = ref('')
const formAssignedTo = ref('')
const formNote = ref('')
const formVisibility = ref<Visibility>('private')
const formSharedWith = ref<string[]>([])

// ── Computed data ──
const monthItems = computed(() =>
  calendarStore.getItemsForMonth(currentYear.value, currentMonth.value),
)

const selectedDateItems = computed<CalendarItem[]>(() => {
  if (!selectedDate.value) return []
  return monthItems.value.filter((item) => item.date === selectedDate.value)
})

const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const allDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayNames = computed(() => {
  const offset = appStore.weekStart === 'sunday' ? 0 : appStore.weekStart === 'saturday' ? 6 : 1
  return Array.from({ length: 7 }, (_, i) => allDayNames[(i + offset) % 7])
})

const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

interface CalendarCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  items: CalendarItem[]
}

const calendarCells = computed<CalendarCell[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // Compute start day of week based on weekStart setting
  const weekStartOffset = appStore.weekStart === 'sunday' ? 0 : appStore.weekStart === 'saturday' ? 6 : 1
  let startDow = (firstDay.getDay() - weekStartOffset + 7) % 7

  const cells: CalendarCell[] = []
  const pad = (n: number) => String(n).padStart(2, '0')

  // Build a lookup map for items by date
  const itemsByDate = new Map<string, CalendarItem[]>()
  for (const item of monthItems.value) {
    const existing = itemsByDate.get(item.date) ?? []
    existing.push(item)
    itemsByDate.set(item.date, existing)
  }

  // Previous month padding
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrev = new Date(prevYear, prevMonth, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const dateStr = `${prevYear}-${pad(prevMonth)}-${pad(d)}`
    cells.push({
      date: dateStr,
      day: d,
      inMonth: false,
      isToday: dateStr === todayStr.value,
      items: itemsByDate.get(dateStr) ?? [],
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`
    cells.push({
      date: dateStr,
      day: d,
      inMonth: true,
      isToday: dateStr === todayStr.value,
      items: itemsByDate.get(dateStr) ?? [],
    })
  }

  // Next month padding to fill grid (6 rows = 42 cells)
  const totalNeeded = cells.length <= 35 ? 35 : 42
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  let nextDay = 1
  while (cells.length < totalNeeded) {
    const dateStr = `${nextYear}-${pad(nextMonth)}-${pad(nextDay)}`
    cells.push({
      date: dateStr,
      day: nextDay,
      inMonth: false,
      isToday: dateStr === todayStr.value,
      items: itemsByDate.get(dateStr) ?? [],
    })
    nextDay++
  }

  return cells
})

const memberOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...householdStore.activeMembers.map((m) => ({ value: m.id, label: m.name })),
])

const categoryOptions = [
  { value: '', label: 'No category' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'social', label: 'Social' },
  { value: 'travel', label: 'Travel' },
  { value: 'health', label: 'Health' },
  { value: 'school', label: 'School' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
]

// ── Methods ──
function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDate.value = null
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDate.value = null
}

function goToToday() {
  const d = new Date()
  currentYear.value = d.getFullYear()
  currentMonth.value = d.getMonth() + 1
  selectedDate.value = todayStr.value
}

function selectDate(dateStr: string) {
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

function getSourceColor(source: CalendarItem['source']): string {
  switch (source) {
    case 'event':
      return 'var(--color-brand-primary)'
    case 'task':
      return 'var(--color-warning)'
    case 'reminder':
      return 'var(--color-info)'
    case 'bill':
      return 'var(--color-error)'
  }
}

function getSourceIcon(source: CalendarItem['source']): string {
  switch (source) {
    case 'event':
      return 'event'
    case 'task':
      return 'task_alt'
    case 'reminder':
      return 'notifications'
    case 'bill':
      return 'payments'
  }
}

function getSourceBadgeVariant(source: CalendarItem['source']): 'brand' | 'warning' | 'info' | 'error' {
  switch (source) {
    case 'event':
      return 'brand'
    case 'task':
      return 'warning'
    case 'reminder':
      return 'info'
    case 'bill':
      return 'error'
  }
}

function getSourceBg(source: CalendarItem['source']): string {
  switch (source) {
    case 'event':
      return 'var(--color-brand-container)'
    case 'task':
      return 'var(--color-warning-bg)'
    case 'reminder':
      return 'var(--color-info-bg)'
    case 'bill':
      return 'var(--color-error-bg)'
  }
}

function getMemberName(id: string | null): string | null {
  if (!id) return null
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? null
}

function isSharedFromOther(item: CalendarItem): boolean {
  return item.source === 'event'
    && item.scope === 'personal'
    && !!item.owner_id
    && item.owner_id !== authStore.memberId
}

function formatTime(time: string | null): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

// ── Drawer ──
function openCreateDrawer() {
  editingEventId.value = null
  formTitle.value = ''
  formDescription.value = ''
  formStartDate.value = selectedDate.value ?? ''
  formStartTime.value = ''
  formEndDate.value = ''
  formEndTime.value = ''
  formAllDay.value = false
  formCategory.value = ''
  formAssignedTo.value = ''
  formNote.value = ''
  formVisibility.value = 'private'
  formSharedWith.value = []
  drawerOpen.value = true
}

function openEditDrawer(item: CalendarItem) {
  if (item.source !== 'event') return
  // Block editing shared events from others
  if (item.scope === 'personal' && item.owner_id && item.owner_id !== authStore.memberId) return
  const event = calendarStore.items.find((e) => e.id === item.original_id)
  if (!event) return

  editingEventId.value = event.id
  formTitle.value = event.title
  formDescription.value = event.description ?? ''
  formStartDate.value = event.start_date
  formStartTime.value = event.start_time ?? ''
  formEndDate.value = event.end_date ?? ''
  formEndTime.value = event.end_time ?? ''
  formAllDay.value = event.all_day
  formCategory.value = event.category ?? ''
  formAssignedTo.value = event.assigned_to ?? ''
  formNote.value = event.note ?? ''
  formVisibility.value = (event.visibility ?? 'private') as Visibility
  formSharedWith.value = []
  // Load existing shares if shared
  if (event.visibility === 'shared' && authStore.householdId) {
    entitySharesDataService.getByEntity('calendar_event', event.id).then((shares) => {
      formSharedWith.value = shares.map((s) => s.shared_with)
    })
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formTitle.value.trim() || !authStore.householdId) return

  drawerLoading.value = true
  try {
    const payload = {
      household_id: authStore.householdId,
      title: formTitle.value.trim(),
      description: formDescription.value.trim() || null,
      start_date: formStartDate.value,
      start_time: formAllDay.value ? null : formStartTime.value || null,
      end_date: formEndDate.value || null,
      end_time: formAllDay.value ? null : formEndTime.value || null,
      all_day: formAllDay.value,
      category: formCategory.value || null,
      assigned_to: formAssignedTo.value || null,
      scope: appStore.isPersonal ? ('personal' as const) : ('household' as const),
      owner_id: appStore.isPersonal ? (authStore.memberId ?? null) : null,
      recurring_rule: null,
      color: null,
      note: formNote.value.trim() || null,
      visibility: appStore.isPersonal ? formVisibility.value : ('private' as const),
      deleted: false,
    }

    if (editingEventId.value) {
      await calendarStore.update(editingEventId.value, payload)
      // Update shares if personal + shared
      if (appStore.isPersonal && formVisibility.value === 'shared' && authStore.householdId) {
        await entitySharesDataService.setShares(
          authStore.householdId, 'calendar_event', editingEventId.value, formSharedWith.value,
        )
      } else if (appStore.isPersonal && editingEventId.value) {
        await entitySharesDataService.deleteByEntity('calendar_event', editingEventId.value)
      }
    } else {
      const created = await calendarStore.create(payload)
      // Set shares for new event
      if (appStore.isPersonal && formVisibility.value === 'shared' && created && authStore.householdId) {
        await entitySharesDataService.setShares(
          authStore.householdId, 'calendar_event', created.id, formSharedWith.value,
        )
      }
    }

    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

async function handleDelete(item: CalendarItem) {
  if (item.source === 'event') {
    await calendarStore.remove(item.original_id)
  } else if (item.source === 'task') {
    await tasksStore.updateStatus(item.original_id, 'done')
  } else if (item.source === 'reminder') {
    await remindersStore.markDone(item.original_id)
  } else if (item.source === 'bill') {
    await billsStore.remove(item.original_id)
  }
}

async function handleDismiss(item: CalendarItem) {
  if (item.source === 'task') {
    await tasksStore.updateStatus(item.original_id, 'skipped')
  } else if (item.source === 'reminder') {
    await remindersStore.dismiss(item.original_id)
  }
}

function getActionIcon(source: CalendarItem['source']): string {
  switch (source) {
    case 'event': return 'delete'
    case 'task': return 'check_circle'
    case 'reminder': return 'check_circle'
    case 'bill': return 'delete'
  }
}

function getActionLabel(source: CalendarItem['source']): string {
  switch (source) {
    case 'event': return 'Delete'
    case 'task': return 'Complete'
    case 'reminder': return 'Mark done'
    case 'bill': return 'Delete'
  }
}

async function loadData() {
  if (authStore.householdId) {
    await Promise.all([
      calendarStore.fetchEvents(authStore.householdId),
      tasksStore.fetchTasks(authStore.householdId),
      remindersStore.fetchReminders(authStore.householdId),
      billsStore.fetchFresh(authStore.householdId),
      householdStore.members.length
        ? Promise.resolve()
        : householdStore.loadMembers(authStore.householdId),
    ])
  }
}

onMounted(loadData)

// Re-fetch if scope changes
watch(() => appStore.isPersonal, loadData)
</script>

<template>
  <PageContainer>
    <!-- Header -->
    <PageHeader title="Calendar" subtitle="Your schedule at a glance">
      <template #actions>
        <div class="cal-nav">
          <button class="cal-nav__btn" aria-label="Previous month" @click="prevMonth">
            <span class="material-symbols-rounded">chevron_left</span>
          </button>
          <button class="cal-nav__today" @click="goToToday">
            <span class="material-symbols-rounded cal-nav__today-icon">today</span>
            Today
          </button>
          <button class="cal-nav__btn" aria-label="Next month" @click="nextMonth">
            <span class="material-symbols-rounded">chevron_right</span>
          </button>
          <span class="cal-nav__label">{{ monthLabel }}</span>
        </div>
        <SButton size="sm" @click="openCreateDrawer">
          <span class="material-symbols-rounded" style="font-size: 18px; margin-right: 4px;">add</span>
          Add Event
        </SButton>
      </template>
    </PageHeader>

    <!-- Error -->
    <ErrorBanner
      v-if="calendarStore.error"
      :message="calendarStore.error"
      class="page-enter"
      :style="{ '--stagger': 0 }"
      @retry="loadData"
    />

    <!-- Loading -->
    <LoadingSkeleton
      v-if="calendarStore.loading && !monthItems.length"
      :lines="8"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    />

    <!-- Calendar Grid -->
    <div v-else class="cal-container page-enter" :style="{ '--stagger': 1 }">
      <div class="cal-grid">
        <!-- Day-of-week headers -->
        <div
          v-for="(name, i) in dayNames"
          :key="'h-' + i"
          class="cal-grid__header"
        >
          <span class="cal-grid__header-full">{{ name }}</span>
          <span class="cal-grid__header-short">{{ name.charAt(0) }}</span>
        </div>

        <!-- Date cells -->
        <button
          v-for="cell in calendarCells"
          :key="cell.date"
          :class="[
            'cal-cell',
            {
              'cal-cell--outside': !cell.inMonth,
              'cal-cell--today': cell.isToday,
              'cal-cell--selected': selectedDate === cell.date,
            },
          ]"
          :aria-label="`${cell.day}, ${cell.items.length} items`"
          @click="selectDate(cell.date)"
        >
          <span
            :class="[
              'cal-cell__day',
              { 'cal-cell__day--today': cell.isToday },
            ]"
          >
            {{ cell.day }}
          </span>

          <div v-if="cell.items.length" class="cal-cell__items">
            <span
              v-for="item in cell.items.slice(0, 3)"
              :key="item.id"
              class="cal-cell__item"
              :style="{
                borderLeftColor: getSourceColor(item.source),
                backgroundColor: getSourceBg(item.source),
              }"
              :title="item.title"
            >
              {{ item.title }}
            </span>
          </div>
          <span v-if="cell.items.length > 3" class="cal-cell__more">
            +{{ cell.items.length - 3 }} more
          </span>
        </button>
      </div>
    </div>

    <!-- Day Detail Panel -->
    <Transition name="panel-slide">
      <div
        v-if="selectedDate"
        class="day-panel page-enter"
        :style="{ '--stagger': 2 }"
      >
        <div class="day-panel__header">
          <h3 class="day-panel__title">
            {{
              new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
            }}
          </h3>
          <span class="day-panel__count">
            {{ selectedDateItems.length }} item{{ selectedDateItems.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div v-if="selectedDateItems.length === 0" class="day-panel__empty">
          <EmptyState
            title="Nothing scheduled"
            subtitle="This day is wide open — add an event to fill it"
            icon="empty"
            action-label="Add Event"
            @action="openCreateDrawer"
          />
        </div>

        <ul v-else class="day-panel__list">
          <li
            v-for="(item, idx) in selectedDateItems"
            :key="item.id"
            :class="[
              'day-item',
              { 'day-item--clickable': item.source === 'event' && !isSharedFromOther(item) },
              { 'day-item--shared': isSharedFromOther(item) },
            ]"
            :style="{ '--stagger': idx }"
            class="page-enter"
            @click="item.source === 'event' && !isSharedFromOther(item) ? openEditDrawer(item) : undefined"
          >
            <span
              class="day-item__indicator"
              :style="{ background: getSourceColor(item.source) }"
            />

            <div class="day-item__body">
              <span class="day-item__title">{{ item.title }}</span>
              <div class="day-item__meta">
                <span v-if="item.time" class="day-item__time">
                  {{ formatTime(item.time) }}
                </span>
                <span v-else class="day-item__time day-item__time--allday">All day</span>
                <span v-if="item.category" class="day-item__category">{{ item.category }}</span>
                <span v-if="getMemberName(item.assigned_to)" class="day-item__assignee">
                  {{ getMemberName(item.assigned_to) }}
                </span>
                <span v-if="isSharedFromOther(item)" class="day-item__shared-by">
                  <span class="material-symbols-rounded day-item__shared-icon">share</span>
                  {{ getMemberName(item.owner_id) }}
                </span>
              </div>
            </div>

            <SBadge class="day-item__badge" :variant="getSourceBadgeVariant(item.source)" size="sm">
              <span class="material-symbols-rounded day-item__source-icon">
                {{ getSourceIcon(item.source) }}
              </span>
              {{ item.source }}
            </SBadge>

            <div v-if="!isSharedFromOther(item)" class="day-item__actions">
              <button
                :class="[
                  'day-item__action',
                  item.source === 'event' || item.source === 'bill'
                    ? 'day-item__action--delete'
                    : 'day-item__action--primary',
                ]"
                :aria-label="getActionLabel(item.source)"
                :title="getActionLabel(item.source)"
                @click.stop="handleDelete(item)"
              >
                <span class="material-symbols-rounded">{{ getActionIcon(item.source) }}</span>
              </button>
              <button
                v-if="item.source === 'task' || item.source === 'reminder'"
                class="day-item__action day-item__action--dismiss"
                :aria-label="item.source === 'task' ? 'Skip' : 'Dismiss'"
                :title="item.source === 'task' ? 'Skip' : 'Dismiss'"
                @click.stop="handleDismiss(item)"
              >
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- Legend -->
    <div class="cal-legend page-enter" :style="{ '--stagger': 3 }">
      <div class="cal-legend__item">
        <span class="cal-legend__dot" style="background: var(--color-brand-primary);" />
        <span class="cal-legend__label">Events</span>
      </div>
      <div class="cal-legend__item">
        <span class="cal-legend__dot" style="background: var(--color-warning);" />
        <span class="cal-legend__label">Tasks</span>
      </div>
      <div class="cal-legend__item">
        <span class="cal-legend__dot" style="background: var(--color-info);" />
        <span class="cal-legend__label">Reminders</span>
      </div>
      <div class="cal-legend__item">
        <span class="cal-legend__dot" style="background: var(--color-error);" />
        <span class="cal-legend__label">Bills</span>
      </div>
    </div>

    <!-- Form Drawer -->
    <FormDrawer
      :open="drawerOpen"
      :title="editingEventId ? 'Edit Event' : 'New Event'"
      :submit-label="editingEventId ? 'Update' : 'Create'"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection title="Event Details">
        <FormField>
          <SInput
            v-model="formTitle"
            label="Title"
            placeholder="What's happening?"
            required
          />
        </FormField>

        <FormField>
          <STextarea
            v-model="formDescription"
            label="Description"
            placeholder="Add details..."
            :rows="3"
          />
        </FormField>

        <FormField>
          <SCheckbox v-model="formAllDay" label="All day event" />
        </FormField>

        <FormField row>
          <SInput
            v-model="formStartDate"
            label="Start Date"
            type="date"
            required
          />
          <STimePicker
            v-if="!formAllDay"
            v-model="formStartTime"
            label="Start Time"
          />
        </FormField>

        <FormField row>
          <SInput
            v-model="formEndDate"
            label="End Date"
            type="date"
          />
          <STimePicker
            v-if="!formAllDay"
            v-model="formEndTime"
            label="End Time"
          />
        </FormField>
      </FormSection>

      <FormSection title="Organization">
        <FormField>
          <SSelect
            v-model="formCategory"
            label="Category"
            :options="categoryOptions"
            placeholder="Select category"
          />
        </FormField>

        <FormField>
          <SSelect
            v-model="formAssignedTo"
            label="Assigned To"
            :options="memberOptions"
            placeholder="Select member"
          />
        </FormField>

        <FormField>
          <STextarea
            v-model="formNote"
            label="Note"
            placeholder="Any additional notes..."
            :rows="2"
          />
        </FormField>
      </FormSection>

      <!-- Visibility — only shown in personal scope -->
      <FormSection v-if="appStore.isPersonal" title="Privacy">
        <FormField>
          <SVisibilityPicker v-model="formVisibility" label="Who can see this?" />
        </FormField>
        <FormField v-if="formVisibility === 'shared'">
          <SMemberPicker
            v-model="formSharedWith"
            :members="householdStore.activeMembers"
            :current-member-id="authStore.memberId ?? undefined"
            label="Share with"
          />
        </FormField>
      </FormSection>
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
/* ── Navigation Controls ── */
.cal-nav {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.cal-nav__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-primary);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.cal-nav__btn:hover {
  background: var(--color-brand-container);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}

.cal-nav__today {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  height: 36px;
  padding: 0 var(--space-m);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-primary);
  font: var(--text-label-sm);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.cal-nav__today:hover {
  background: var(--color-brand-container);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}

.cal-nav__today-icon {
  font-size: 16px;
}

.cal-nav__label {
  font: var(--text-body-2-strong);
  color: var(--color-fg-primary);
  margin-left: var(--space-s);
  min-width: 140px;
}

/* ── Calendar Container ── */
.cal-container {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* ── Calendar Grid ── */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal-grid__header {
  padding: var(--space-s) var(--space-xs);
  text-align: center;
  font: var(--text-label-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
}

.cal-grid__header-short {
  display: none;
}

/* ── Day Cell ── */
.cal-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-height: 100px;
  padding: var(--space-2xs);
  border: none;
  border-right: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-primary);
  cursor: pointer;
  text-align: left;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.cal-cell:nth-child(7n + 7 + 7) {
  border-right: none;
}

.cal-cell:hover {
  background: var(--color-bg-tertiary);
}

.cal-cell--outside {
  background: var(--color-surface-container-low);
  opacity: 0.5;
}

.cal-cell--outside:hover {
  opacity: 0.7;
  background: var(--color-bg-tertiary);
}

.cal-cell--selected {
  background: var(--color-brand-container);
  box-shadow: inset 0 0 0 2px var(--color-brand-primary);
}

.cal-cell--today {
  background: var(--color-bg-primary);
}

.cal-cell__day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  align-self: flex-start;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.cal-cell__day--today {
  background: var(--color-brand-primary);
  color: var(--color-bg-primary);
  font-weight: var(--font-weight-bold);
}

.cal-cell--outside .cal-cell__day {
  color: var(--color-fg-tertiary);
}

.cal-cell__items {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  flex: 1;
}

.cal-cell__item {
  display: block;
  padding: 1px 4px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  line-height: 16px;
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 3px solid transparent;
}

.cal-cell__more {
  font-size: 10px;
  line-height: 14px;
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  padding-left: 4px;
}

/* ── Day Detail Panel ── */
.day-panel {
  margin-top: var(--space-l);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.day-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-m) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
}

.day-panel__title {
  font: var(--text-body-1);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.day-panel__count {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.day-panel__empty {
  padding: var(--space-xl) var(--space-l);
}

.day-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ── Day Item ── */
.day-item {
  display: grid;
  grid-template-columns: 3px 1fr auto 64px;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  min-height: 48px;
  transition:
    background-color var(--duration-fast) var(--easing-standard);
}

.day-item:last-child {
  border-bottom: none;
}

.day-item--clickable {
  cursor: pointer;
}

.day-item--clickable:hover {
  background: var(--color-bg-tertiary);
}

.day-item__indicator {
  width: 3px;
  align-self: stretch;
  border-radius: var(--radius-s);
}

.day-item__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.day-item__title {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-item__source-icon {
  font-size: 14px;
}

.day-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.day-item__time {
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-secondary);
}

.day-item__time--allday {
  color: var(--color-fg-tertiary);
}

.day-item__category {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-transform: capitalize;
}

.day-item__category::before {
  content: '·';
  margin-right: var(--space-2xs);
}

.day-item__assignee {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.day-item--shared {
  opacity: 0.85;
  border-left: 2px dashed var(--color-border-strong);
  padding-left: var(--space-s);
}

.day-item__shared-by {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-brand-primary);
}

.day-item__shared-by::before {
  content: '·';
  margin-right: var(--space-2xs);
  color: var(--color-fg-tertiary);
}

.day-item__shared-icon {
  font-size: 12px;
}

.day-item__assignee::before {
  content: '·';
  margin-right: var(--space-2xs);
}

.day-item__badge {
  flex-shrink: 0;
}

.day-item__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.day-item__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-m);
  background: transparent;
  color: var(--color-fg-tertiary);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.day-item__action .material-symbols-rounded {
  font-size: 18px;
}

.day-item__action--primary:hover {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.day-item__action--delete:hover {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.day-item__action--dismiss:hover {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

/* ── Legend ── */
.cal-legend {
  display: flex;
  align-items: center;
  gap: var(--space-l);
  margin-top: var(--space-m);
  padding: var(--space-s) 0;
}

.cal-legend__item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.cal-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

.cal-legend__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

/* ── Panel Transition ── */
.panel-slide-enter-active {
  transition:
    opacity var(--duration-normal) var(--easing-standard),
    transform var(--duration-normal) var(--easing-standard);
}

.panel-slide-leave-active {
  transition:
    opacity var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.panel-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Responsive: Tablet ── */
@media (max-width: 768px) {
  .cal-nav__label {
    min-width: auto;
  }

  .cal-cell {
    min-height: 80px;
    padding: 2px;
  }

  .cal-cell__day {
    width: 24px;
    height: 24px;
    font: var(--text-caption);
    font-weight: var(--font-weight-medium);
  }

  .cal-cell__day--today {
    font-weight: var(--font-weight-bold);
  }

  .cal-cell__item {
    font-size: 10px;
    line-height: 14px;
    padding: 0 3px;
    border-left-width: 2px;
  }
}

/* ── Responsive: Mobile ── */
@media (max-width: 640px) {
  .cal-nav {
    flex-wrap: wrap;
    gap: var(--space-2xs);
  }

  .cal-nav__label {
    order: -1;
    width: 100%;
    text-align: center;
    margin-left: 0;
    font: var(--text-body-1);
    font-weight: var(--font-weight-semibold);
  }

  .cal-grid__header-full {
    display: none;
  }

  .cal-grid__header-short {
    display: inline;
  }

  .cal-grid__header {
    padding: var(--space-xs) var(--space-2xs);
  }

  .cal-cell {
    min-height: 60px;
    padding: 2px 1px;
  }

  .cal-cell__day {
    width: 22px;
    height: 22px;
  }

  .cal-cell__item {
    font-size: 9px;
    line-height: 12px;
    padding: 0 2px;
    border-left-width: 2px;
  }

  .cal-cell__more {
    font-size: 9px;
  }

  .day-panel__header {
    padding: var(--space-s) var(--space-m);
  }

  .day-item {
    padding: var(--space-s) var(--space-m);
  }

  .day-item__badge {
    display: none;
  }

  .cal-legend {
    flex-wrap: wrap;
    gap: var(--space-s) var(--space-m);
  }
}
</style>
