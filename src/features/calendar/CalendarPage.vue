<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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

// ── View modes ──
type CalendarView = 'month' | 'week' | '3day' | 'day' | 'agenda'
const activeView = ref<CalendarView>('month')
const viewOptions: { key: CalendarView; label: string; icon: string }[] = [
  { key: 'month', label: 'Month', icon: 'calendar_month' },
  { key: 'week', label: 'Week', icon: 'view_week' },
  { key: '3day', label: '3 Days', icon: 'view_column_2' },
  { key: 'day', label: 'Day', icon: 'calendar_view_day' },
  { key: 'agenda', label: 'Agenda', icon: 'view_agenda' },
]

// ── Navigation state ──
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1) // 1-indexed
const currentDate = ref(todayDateStr()) // anchor date for non-month views
const selectedDate = ref<string | null>(null)

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

// ── Multi-view helpers ──
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Start of the week (Mon or Sun based on settings) containing a given date */
function weekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const offset = appStore.weekStart === 'sunday' ? 0 : appStore.weekStart === 'saturday' ? 6 : 1
  const dow = (d.getDay() - offset + 7) % 7
  d.setDate(d.getDate() - dow)
  return dateToStr(d)
}

/** Label shown in nav bar depending on active view */
const navLabel = computed(() => {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (activeView.value === 'month') {
    return new Date(currentYear.value, currentMonth.value - 1).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    })
  }
  if (activeView.value === 'agenda') {
    return new Date(currentDate.value + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    })
  }
  const spans: Record<string, number> = { day: 0, '3day': 2, week: 6 }
  const span = spans[activeView.value] ?? 0
  const start = activeView.value === 'week' ? weekStart(currentDate.value) : currentDate.value
  const end = addDays(start, span)
  const startD = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  if (startD.getMonth() === endD.getMonth()) {
    return `${startD.toLocaleDateString('en-US', { month: 'long' })} ${startD.getDate()}–${endD.getDate()}, ${startD.getFullYear()}`
  }
  return `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
})

// The days array for week/3-day/day views
const viewDays = computed<string[]>(() => {
  if (activeView.value === 'day') return [currentDate.value]
  if (activeView.value === '3day') {
    return Array.from({ length: 3 }, (_, i) => addDays(currentDate.value, i))
  }
  if (activeView.value === 'week') {
    const start = weekStart(currentDate.value)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }
  return []
})

// Items used in multi-column day views
const viewDayItems = computed<Record<string, CalendarItem[]>>(() => {
  const result: Record<string, CalendarItem[]> = {}
  for (const d of viewDays.value) {
    const [y, m] = d.split('-').map(Number)
    result[d] = calendarStore.getItemsForMonth(y, m).filter((item) => item.date === d)
  }
  return result
})

// Hour slots for week/day/3day views
const hourSlots = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 56 // px per hour slot

function timeToMinutes(time: string | null): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function itemTop(item: CalendarItem): number {
  return (timeToMinutes(item.time) / 60) * HOUR_HEIGHT
}

function itemHeight(item: CalendarItem): number {
  const startMins = timeToMinutes(item.time)
  // Default 1 hour if no end time
  return HOUR_HEIGHT
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

// Current time indicator
const currentTimeMinutes = ref(new Date().getHours() * 60 + new Date().getMinutes())
function currentTimePct() {
  return (currentTimeMinutes.value / (24 * 60)) * (24 * HOUR_HEIGHT)
}

// Agenda view: next 60 days grouped by date
const agendaDays = computed(() => {
  const start = currentDate.value
  const end = addDays(start, 59)
  const items = calendarStore.getItemsForDateRange(start, end)
  const grouped: { date: string; items: CalendarItem[] }[] = []
  const map = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const existing = map.get(item.date) ?? []
    existing.push(item)
    map.set(item.date, existing)
  }
  // Include all days in range even if empty? No — agenda only shows days with events
  for (const [d, its] of map) grouped.push({ date: d, items: its })
  grouped.sort((a, b) => a.date.localeCompare(b.date))
  return grouped
})

function agendaDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

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
  currentDate.value = todayStr.value
  selectedDate.value = todayStr.value
}

function selectDate(dateStr: string) {
  selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

/** Navigate previous/next for all views */
function navigatePrev() {
  if (activeView.value === 'month') { prevMonth(); return }
  if (activeView.value === 'day') { currentDate.value = addDays(currentDate.value, -1); return }
  if (activeView.value === '3day') { currentDate.value = addDays(currentDate.value, -3); return }
  if (activeView.value === 'week') { currentDate.value = addDays(weekStart(currentDate.value), -7); return }
  if (activeView.value === 'agenda') { currentDate.value = addDays(currentDate.value, -30); return }
}

function navigateNext() {
  if (activeView.value === 'month') { nextMonth(); return }
  if (activeView.value === 'day') { currentDate.value = addDays(currentDate.value, 1); return }
  if (activeView.value === '3day') { currentDate.value = addDays(currentDate.value, 3); return }
  if (activeView.value === 'week') { currentDate.value = addDays(weekStart(currentDate.value), 7); return }
  if (activeView.value === 'agenda') { currentDate.value = addDays(currentDate.value, 30); return }
}

// ── Tab pill animation (matches MoneyTabs) ──
const tabNavRef = ref<HTMLElement | null>(null)
const tabRefs = ref<HTMLElement[]>([])
const pillStyle = ref<Record<string, string>>({})

function updatePill(animate: boolean) {
  const idx = viewOptions.findIndex((v) => v.key === activeView.value)
  const el = tabRefs.value[idx]
  if (!el) return
  pillStyle.value = {
    width: `${el.offsetWidth}px`,
    transform: `translateX(${el.offsetLeft}px)`,
    transition: animate
      ? 'transform 300ms cubic-bezier(0.4, 0, 0, 1), width 300ms cubic-bezier(0.4, 0, 0, 1)'
      : 'none',
  }
}

function switchView(view: CalendarView) {
  activeView.value = view
  selectedDate.value = null
  nextTick(() => {
    updatePill(true)
    if (view !== 'month' && view !== 'agenda') scrollToCurrentTime()
  })
}

// ── Time grid scroll ──
const scrollRef = ref<HTMLElement | null>(null)

function scrollToCurrentTime() {
  nextTick(() => {
    if (!scrollRef.value) return
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
    const px = (nowMins / 60) * HOUR_HEIGHT - 120
    scrollRef.value.scrollTop = Math.max(0, px)
  })
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

onMounted(() => {
  loadData()
  nextTick(() => updatePill(false))
})

// Re-fetch if scope changes
watch(() => appStore.isPersonal, loadData)
</script>

<template>
  <PageContainer>
    <!-- Header -->
    <PageHeader title="Calendar" subtitle="Your schedule at a glance">
      <template #actions>
        <div class="cal-nav cal-nav--desktop">
          <button class="cal-nav__btn" aria-label="Previous" @click="navigatePrev">
            <span class="material-symbols-rounded">chevron_left</span>
          </button>
          <button class="cal-nav__today" @click="goToToday">
            <span class="material-symbols-rounded cal-nav__today-icon">today</span>
            Today
          </button>
          <button class="cal-nav__btn" aria-label="Next" @click="navigateNext">
            <span class="material-symbols-rounded">chevron_right</span>
          </button>
          <span class="cal-nav__label">{{ navLabel }}</span>
        </div>
        <SButton @click="openCreateDrawer">Add Event</SButton>
      </template>
    </PageHeader>

    <!-- View switcher tabs -->
    <nav ref="tabNavRef" class="cal-view-tabs" aria-label="Calendar views">
      <div class="cal-view-tabs__pill" :style="pillStyle" />
      <button
        v-for="(view, i) in viewOptions"
        :key="view.key"
        :ref="(el) => { if (el) tabRefs[i] = (el as HTMLElement) }"
        :class="['cal-view-tab', { 'cal-view-tab--active': activeView === view.key }]"
        @click="switchView(view.key)"
      >
        {{ view.label }}
      </button>
    </nav>

    <!-- Mobile nav -->
    <div class="cal-nav cal-nav--mobile">
      <span class="cal-nav__label">{{ navLabel }}</span>
      <div class="cal-nav__controls">
        <button class="cal-nav__btn" aria-label="Previous" @click="navigatePrev">
          <span class="material-symbols-rounded">chevron_left</span>
        </button>
        <button class="cal-nav__today" @click="goToToday">
          <span class="material-symbols-rounded cal-nav__today-icon">today</span>
          Today
        </button>
        <button class="cal-nav__btn" aria-label="Next" @click="navigateNext">
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      </div>
    </div>

    <!-- Error -->
    <ErrorBanner v-if="calendarStore.error" :message="calendarStore.error" class="page-enter" :style="{ '--stagger': 0 }" @retry="loadData" />

    <!-- Loading -->
    <LoadingSkeleton v-if="calendarStore.loading && !monthItems.length" :lines="8" class="page-enter" :style="{ '--stagger': 0 }" />

    <!-- ═══ MONTH VIEW ═══ -->
    <div v-else-if="activeView === 'month'" class="month page-enter" :style="{ '--stagger': 1 }">
      <div class="month__grid">
        <!-- Day-of-week headers -->
        <div v-for="(name, i) in dayNames" :key="'h-' + i" class="month__dow">
          <span class="month__dow-full">{{ name }}</span>
          <span class="month__dow-short">{{ name.charAt(0) }}</span>
        </div>

        <!-- Date cells -->
        <button
          v-for="cell in calendarCells"
          :key="cell.date"
          :class="['month__cell', {
            'month__cell--outside': !cell.inMonth,
            'month__cell--today': cell.isToday,
            'month__cell--selected': selectedDate === cell.date,
          }]"
          :aria-label="`${cell.day}, ${cell.items.length} items`"
          @click="selectDate(cell.date)"
        >
          <span :class="['month__day', { 'month__day--today': cell.isToday }]">{{ cell.day }}</span>

          <!-- Desktop: text chips -->
          <div v-if="cell.items.length" class="month__chips">
            <span
              v-for="item in cell.items.slice(0, 3)"
              :key="item.id"
              class="month__chip"
              :style="{ '--chip-color': getSourceColor(item.source), '--chip-bg': getSourceBg(item.source) }"
              :title="item.title"
            >{{ item.title }}</span>
          </div>

          <!-- Mobile: dot indicators -->
          <div v-if="cell.items.length" class="month__dots">
            <span
              v-for="item in cell.items.slice(0, 5)"
              :key="item.id + '-d'"
              class="month__dot"
              :style="{ background: getSourceColor(item.source) }"
            />
          </div>

          <span v-if="cell.items.length > 3" class="month__more">+{{ cell.items.length - 3 }}</span>
        </button>
      </div>
    </div>

    <!-- Day Detail Panel (month view) -->
    <Transition name="panel-slide">
      <div v-if="selectedDate && activeView === 'month'" class="day-panel page-enter" :style="{ '--stagger': 2 }">
        <div class="day-panel__header">
          <h3 class="day-panel__title">
            {{ new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
          </h3>
          <span class="day-panel__count">{{ selectedDateItems.length }} item{{ selectedDateItems.length !== 1 ? 's' : '' }}</span>
        </div>

        <div v-if="selectedDateItems.length === 0" class="day-panel__empty">
          <EmptyState title="Nothing scheduled" subtitle="This day is wide open — add an event to fill it" icon="empty" action-label="Add Event" @action="openCreateDrawer" />
        </div>

        <ul v-else class="day-panel__list">
          <li
            v-for="(item, idx) in selectedDateItems"
            :key="item.id"
            :class="['day-item', { 'day-item--clickable': item.source === 'event' && !isSharedFromOther(item), 'day-item--shared': isSharedFromOther(item) }]"
            :style="{ '--stagger': idx }"
            class="page-enter"
            @click="item.source === 'event' && !isSharedFromOther(item) ? openEditDrawer(item) : undefined"
          >
            <span class="day-item__indicator" :style="{ background: getSourceColor(item.source) }" />
            <div class="day-item__body">
              <span class="day-item__title">{{ item.title }}</span>
              <div class="day-item__meta">
                <span v-if="item.time" class="day-item__time">{{ formatTime(item.time) }}</span>
                <span v-else class="day-item__time day-item__time--allday">All day</span>
                <span v-if="item.category" class="day-item__category">{{ item.category }}</span>
                <span v-if="getMemberName(item.assigned_to)" class="day-item__assignee">{{ getMemberName(item.assigned_to) }}</span>
                <span v-if="isSharedFromOther(item)" class="day-item__shared-by">
                  <SBadge variant="default" size="sm">
                    <span class="material-symbols-rounded day-item__shared-icon">share</span>
                    {{ getMemberName(item.owner_id) }}
                  </SBadge>
                </span>
              </div>
            </div>
            <SBadge class="day-item__badge" :variant="getSourceBadgeVariant(item.source)" size="sm">
              <span class="material-symbols-rounded day-item__source-icon">{{ getSourceIcon(item.source) }}</span>
              {{ item.source }}
            </SBadge>
            <div v-if="!isSharedFromOther(item)" class="day-item__actions">
              <button
                :class="['day-item__action', item.source === 'event' || item.source === 'bill' ? 'day-item__action--delete' : 'day-item__action--primary']"
                :aria-label="getActionLabel(item.source)" :title="getActionLabel(item.source)"
                @click.stop="handleDelete(item)"
              >
                <span class="material-symbols-rounded">{{ getActionIcon(item.source) }}</span>
              </button>
              <button
                v-if="item.source === 'task' || item.source === 'reminder'"
                class="day-item__action day-item__action--dismiss"
                :aria-label="item.source === 'task' ? 'Skip' : 'Dismiss'"
                @click.stop="handleDismiss(item)"
              >
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- ═══ WEEK / 3-DAY / DAY VIEW ═══ -->
    <div
      v-if="(activeView === 'week' || activeView === '3day' || activeView === 'day') && !calendarStore.loading"
      class="tg page-enter"
      :style="{ '--stagger': 1 }"
    >
      <!-- Column headers -->
      <div class="tg__header">
        <div class="tg__gutter-cap" />
        <div class="tg__day-heads" :style="{ 'grid-template-columns': `repeat(${viewDays.length}, 1fr)` }">
          <div
            v-for="d in viewDays"
            :key="'th-' + d"
            :class="['tg__dh', { 'tg__dh--today': d === todayStr }]"
          >
            <span class="tg__dh-dow">{{ new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) }}</span>
            <span :class="['tg__dh-num', { 'tg__dh-num--today': d === todayStr }]">{{ new Date(d + 'T00:00:00').getDate() }}</span>
          </div>
        </div>
      </div>

      <!-- All-day row -->
      <div class="tg__allday">
        <div class="tg__gutter-cap tg__gutter-cap--allday">all-day</div>
        <div class="tg__allday-cols" :style="{ 'grid-template-columns': `repeat(${viewDays.length}, 1fr)` }">
          <div v-for="d in viewDays" :key="'ad-' + d" class="tg__allday-col">
            <span
              v-for="item in (viewDayItems[d] ?? []).filter((i) => i.all_day)"
              :key="item.id"
              class="tg__ad-chip"
              :style="{ '--chip-color': getSourceColor(item.source), '--chip-bg': getSourceBg(item.source) }"
              :title="item.title"
              @click="item.source === 'event' ? openEditDrawer(item) : undefined"
            >{{ item.title }}</span>
          </div>
        </div>
      </div>

      <!-- Scrollable time body -->
      <div ref="scrollRef" class="tg__body">
        <div class="tg__canvas" :style="{ height: 24 * HOUR_HEIGHT + 'px' }">
          <!-- Hour gutter -->
          <div class="tg__gutter">
            <div v-for="h in hourSlots" :key="'lbl-' + h" class="tg__hour-lbl" :style="{ top: h * HOUR_HEIGHT + 'px' }">
              <span v-if="h > 0">{{ formatHour(h) }}</span>
            </div>
          </div>

          <!-- Tracks area -->
          <div class="tg__tracks">
            <!-- Hour gridlines (full-width) -->
            <div v-for="h in hourSlots" :key="'hl-' + h" class="tg__hline" :style="{ top: h * HOUR_HEIGHT + 'px' }" />
            <!-- Half-hour gridlines -->
            <div v-for="h in hourSlots" :key="'hh-' + h" class="tg__hline tg__hline--half" :style="{ top: (h * HOUR_HEIGHT + HOUR_HEIGHT / 2) + 'px' }" />

            <!-- Column grid (CSS grid-based) -->
            <div class="tg__cols" :style="{ 'grid-template-columns': `repeat(${viewDays.length}, 1fr)` }">
              <div
                v-for="d in viewDays"
                :key="'col-' + d"
                :class="['tg__col', { 'tg__col--today': d === todayStr }]"
              >
                <!-- Now indicator (inside today column) -->
                <div v-if="d === todayStr" class="tg__now" :style="{ top: currentTimePct() + 'px' }">
                  <span class="tg__now-dot" />
                </div>

                <!-- Timed events -->
                <div
                  v-for="item in (viewDayItems[d] ?? []).filter((i) => !i.all_day)"
                  :key="item.id"
                  class="tg__event"
                  :style="{ top: itemTop(item) + 'px', height: itemHeight(item) + 'px', '--ev-color': getSourceColor(item.source), '--ev-bg': getSourceBg(item.source) }"
                  :title="item.title"
                  @click="item.source === 'event' ? openEditDrawer(item) : undefined"
                >
                  <span class="tg__ev-title">{{ item.title }}</span>
                  <span v-if="item.time" class="tg__ev-time">{{ formatTime(item.time) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ AGENDA VIEW ═══ -->
    <div
      v-if="activeView === 'agenda' && !calendarStore.loading"
      class="agenda page-enter"
      :style="{ '--stagger': 1 }"
    >
      <div v-if="agendaDays.length === 0" class="agenda__empty">
        <EmptyState title="Nothing coming up" subtitle="Your next 60 days are wide open" icon="empty" action-label="Add Event" @action="openCreateDrawer" />
      </div>

      <div v-for="(group, gIdx) in agendaDays" :key="group.date" class="ag-group page-enter" :style="{ '--stagger': gIdx }">
        <div :class="['ag-group__header', { 'ag-group__header--today': group.date === todayStr }]">
          <span v-if="group.date === todayStr" class="ag-group__today-badge">Today</span>
          <span class="ag-group__date-text">
            {{ new Date(group.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) }}<span class="ag-group__sep">,</span>
            {{ new Date(group.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
          </span>
        </div>
        <div class="ag-group__items">
          <div
            v-for="item in group.items"
            :key="item.id"
            :class="['ag-item', { 'ag-item--clickable': item.source === 'event' && !isSharedFromOther(item) }]"
            @click="item.source === 'event' && !isSharedFromOther(item) ? openEditDrawer(item) : undefined"
          >
            <span class="ag-item__accent" :style="{ background: getSourceColor(item.source) }" />
            <div class="ag-item__body">
              <span class="ag-item__title">{{ item.title }}</span>
              <div class="ag-item__meta">
                <span class="material-symbols-rounded ag-item__icon">{{ getSourceIcon(item.source) }}</span>
                <span v-if="item.time" class="ag-item__time">{{ formatTime(item.time) }}</span>
                <span v-else class="ag-item__time ag-item__time--allday">All day</span>
                <span v-if="item.category" class="ag-item__cat">{{ item.category }}</span>
                <span v-if="getMemberName(item.assigned_to)" class="ag-item__who">{{ getMemberName(item.assigned_to) }}</span>
              </div>
            </div>
            <div class="ag-item__actions">
              <button
                :class="['ag-item__action', item.source === 'event' || item.source === 'bill' ? 'ag-item__action--delete' : 'ag-item__action--primary']"
                :aria-label="getActionLabel(item.source)"
                @click.stop="handleDelete(item)"
              >
                <span class="material-symbols-rounded">{{ getActionIcon(item.source) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

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
/* ═══════════════════════════════════════════════
   Calendar Page — Refined Utility Design
   Flat, precise, warm off-white. No shadows.
   ═══════════════════════════════════════════════ */

/* ── Navigation Controls ── */
.cal-nav {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.cal-nav--mobile { display: none; }

.cal-nav__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-primary);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard),
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
  height: 34px;
  padding: 0 var(--space-m);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-primary);
  font: var(--text-label-sm);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard),
              border-color var(--duration-fast) var(--easing-standard),
              color var(--duration-fast) var(--easing-standard);
}

.cal-nav__today:hover {
  background: var(--color-brand-container);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
}

.cal-nav__today-icon { font-size: 16px; }

.cal-nav__label {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  margin-left: var(--space-s);
  min-width: 140px;
}

/* ── View Switcher Tabs (pill — matches MoneyTabs) ── */
.cal-view-tabs {
  display: flex;
  position: relative;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--color-surface-container-low);
  border-radius: var(--radius-m);
  overflow-x: auto;
  scrollbar-width: none;
  width: fit-content;
  max-width: 100%;
  margin-bottom: var(--space-l);
}

.cal-view-tabs::-webkit-scrollbar { display: none; }

.cal-view-tabs__pill {
  position: absolute;
  top: var(--space-xs);
  left: 0;
  height: calc(100% - var(--space-xs) * 2);
  background: var(--color-brand-primary);
  border-radius: var(--radius-s);
  z-index: 0;
}

.cal-view-tab {
  position: relative;
  z-index: 1;
  padding: var(--space-xs) var(--space-l);
  font: var(--text-label-lg);
  color: var(--color-fg-secondary);
  background: transparent;
  border: none;
  white-space: nowrap;
  border-radius: var(--radius-s);
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: color var(--duration-fast) var(--easing-standard);
}

.cal-view-tab:hover { color: var(--color-fg-primary); background: var(--color-surface-nav-hover); }
.cal-view-tab--active { color: var(--color-fg-on-brand); }
.cal-view-tab--active:hover { color: var(--color-fg-on-brand); background: transparent; }

/* ═══ MONTH VIEW ═══ */
.month {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
  overflow: hidden;
}

.month__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.month__dow {
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

.month__dow-short { display: none; }

.month__cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-height: 96px;
  padding: var(--space-2xs) var(--space-xs);
  border: none;
  border-right: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-primary);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.month__cell:nth-child(7n + 14) { border-right: none; }
.month__cell:hover { background: var(--color-bg-tertiary); }
.month__cell--outside { background: var(--color-surface-container-low); color: var(--color-fg-disabled); }
.month__cell--outside:hover { background: var(--color-bg-secondary); }
.month__cell--selected { background: var(--color-brand-selected); box-shadow: inset 0 0 0 2px var(--color-brand-primary); }
.month__cell--today { background: var(--color-bg-primary); }

.month__day {
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
}

.month__day--today {
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-bold);
}

.month__cell--outside .month__day { color: var(--color-fg-disabled); }

/* Desktop: text chips */
.month__chips {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  flex: 1;
}

.month__chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 5px;
  border-radius: var(--radius-s);
  font-size: 11px;
  line-height: 16px;
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: var(--chip-bg);
  border-left: 3px solid var(--chip-color);
}

/* Mobile: dot indicators */
.month__dots {
  display: none;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.month__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

.month__more {
  font-size: 10px;
  line-height: 14px;
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  padding-left: 4px;
}

/* ═══ DAY DETAIL PANEL ═══ */
.day-panel {
  margin-top: var(--space-l);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
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

.day-panel__empty { padding: var(--space-xl) var(--space-l); }
.day-panel__list { list-style: none; margin: 0; padding: 0; }

/* ── Day Item (shared by panel + agenda) ── */
.day-item {
  display: grid;
  grid-template-columns: 3px 1fr auto 64px;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  min-height: 48px;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.day-item:last-child { border-bottom: none; }
.day-item--clickable { cursor: pointer; }
.day-item--clickable:hover { background: var(--color-bg-tertiary); }

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

.day-item__source-icon { font-size: 14px; }

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

.day-item__time--allday { color: var(--color-fg-tertiary); }

.day-item__category {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-transform: capitalize;
}

.day-item__category::before { content: '·'; margin-right: var(--space-2xs); }

.day-item__assignee { font: var(--text-caption); color: var(--color-fg-tertiary); }
.day-item__assignee::before { content: '·'; margin-right: var(--space-2xs); }

.day-item--shared {
  opacity: 0.85;
  border-left: 2px dashed var(--color-border-strong);
  padding-left: var(--space-s);
}

.day-item__shared-by { display: inline-flex; align-items: center; }
.day-item__shared-by::before { content: '·'; margin-right: var(--space-2xs); color: var(--color-fg-tertiary); }
.day-item__shared-icon { font-size: 12px; margin-right: 2px; }
.day-item__badge { flex-shrink: 0; }

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
  transition: color var(--duration-fast) var(--easing-standard),
              background-color var(--duration-fast) var(--easing-standard);
}

.day-item__action .material-symbols-rounded { font-size: 18px; }
.day-item__action--primary:hover { color: var(--color-success); background: var(--color-success-bg); }
.day-item__action--delete:hover { color: var(--color-error); background: var(--color-error-bg); }
.day-item__action--dismiss:hover { color: var(--color-warning); background: var(--color-warning-bg); }

/* ═══ TIME GRID (Week / 3-Day / Day) ═══ */
.tg {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Header row ── */
.tg__header {
  display: flex;
  border-bottom: 1px solid var(--color-border-default);
  background: var(--color-surface-container-low);
  flex-shrink: 0;
}

.tg__gutter-cap {
  width: 52px;
  min-width: 52px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border-subtle);
}

.tg__gutter-cap--allday {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--space-xs);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tg__day-heads {
  display: grid;
  flex: 1;
  min-width: 0;
}

.tg__dh {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-s) var(--space-2xs);
  gap: 2px;
  border-right: 1px solid var(--color-border-subtle);
  min-width: 0;
}

.tg__dh:last-child { border-right: none; }

.tg__dh-dow {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tg__dh--today .tg__dh-dow {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-bold);
}

.tg__dh-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-circle);
  font: var(--text-body-1);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
}

.tg__dh-num--today {
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-bold);
}

/* ── All-day row ── */
.tg__allday {
  display: flex;
  border-bottom: 1px solid var(--color-border-default);
  background: var(--color-bg-primary);
  min-height: 32px;
  max-height: 80px;
  overflow-y: auto;
  flex-shrink: 0;
}

.tg__allday-cols {
  display: grid;
  flex: 1;
  min-width: 0;
}

.tg__allday-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2xs) 2px;
  border-right: 1px solid var(--color-border-subtle);
  min-width: 0;
  overflow: hidden;
}

.tg__allday-col:last-child { border-right: none; }

.tg__ad-chip {
  display: block;
  font-size: 11px;
  line-height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-s);
  border-left: 3px solid var(--chip-color);
  background: var(--chip-bg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  flex-shrink: 0;
  transition: filter var(--duration-fast) var(--easing-standard);
}

.tg__ad-chip:hover { filter: brightness(0.95); }

/* ── Scrollable time body ── */
.tg__body {
  flex: 1;
  overflow-y: auto;
  max-height: 640px;
}

.tg__canvas {
  position: relative;
  min-width: 100%;
}

/* Hour gutter */
.tg__gutter {
  position: absolute;
  top: 0;
  left: 0;
  width: 52px;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
}

.tg__hour-lbl {
  position: absolute;
  right: var(--space-xs);
  transform: translateY(-50%);
  font: var(--text-caption);
  font-size: 10px;
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

/* Tracks area (right of gutter) */
.tg__tracks {
  position: absolute;
  top: 0;
  left: 52px;
  right: 0;
  bottom: 0;
}

/* Hour gridlines */
.tg__hline {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border-subtle);
  pointer-events: none;
}

.tg__hline--half {
  background: var(--color-border-subtle);
  opacity: 0.45;
}

/* Column grid */
.tg__cols {
  position: absolute;
  inset: 0;
  display: grid;
}

.tg__col {
  position: relative;
  border-right: 1px solid var(--color-border-subtle);
  min-width: 0;
}

.tg__col:last-child { border-right: none; }

.tg__col--today {
  background: var(--color-brand-selected);
  opacity: 0.85;
}

/* Now indicator */
.tg__now {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-error);
  z-index: 5;
  pointer-events: none;
}

.tg__now-dot {
  position: absolute;
  left: -4px;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-error);
}

/* Timed events */
.tg__event {
  position: absolute;
  left: 2px;
  right: 3px;
  border-radius: var(--radius-s);
  border-left: 3px solid var(--ev-color);
  background: var(--ev-bg);
  padding: 2px 6px;
  overflow: hidden;
  cursor: pointer;
  z-index: 2;
  transition: filter var(--duration-fast) var(--easing-standard);
}

.tg__event:hover { filter: brightness(0.93); }

.tg__ev-title {
  display: block;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.tg__ev-time {
  display: block;
  font-size: 10px;
  color: var(--color-fg-secondary);
  line-height: 1.3;
}

/* ═══ AGENDA VIEW ═══ */
.agenda {
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
  overflow: hidden;
}

.agenda__empty { padding: var(--space-2xl) var(--space-xl); }

.ag-group {
  border-bottom: 1px solid var(--color-border-subtle);
}

.ag-group:last-child { border-bottom: none; }

/* Horizontal date header */
.ag-group__header {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
}

.ag-group__header--today {
  background: var(--color-brand-selected);
}

.ag-group__today-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px var(--space-s);
  border-radius: var(--radius-circle);
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.02em;
  line-height: 18px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.ag-group__date-text {
  font: var(--text-label-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.ag-group__header--today .ag-group__date-text {
  color: var(--color-brand-primary);
}

.ag-group__sep {
  color: var(--color-fg-tertiary);
}

.ag-group__items {
  display: flex;
  flex-direction: column;
}

/* Agenda item */
.ag-item {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  min-height: 48px;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.ag-item:last-child { border-bottom: none; }
.ag-item--clickable { cursor: pointer; }
.ag-item--clickable:hover { background: var(--color-bg-tertiary); }

.ag-item__accent {
  width: 3px;
  align-self: stretch;
  border-radius: var(--radius-s);
  flex-shrink: 0;
}

.ag-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ag-item__title {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ag-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.ag-item__icon {
  font-size: 14px;
  color: var(--color-fg-tertiary);
}

.ag-item__time {
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-secondary);
}

.ag-item__time--allday { color: var(--color-fg-tertiary); }

.ag-item__cat {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-transform: capitalize;
}

.ag-item__cat::before { content: '·'; margin-right: var(--space-2xs); }

.ag-item__who {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.ag-item__who::before { content: '·'; margin-right: var(--space-2xs); }

.ag-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.ag-item__action {
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
  transition: color var(--duration-fast) var(--easing-standard),
              background-color var(--duration-fast) var(--easing-standard);
}

.ag-item__action .material-symbols-rounded { font-size: 18px; }
.ag-item__action--primary:hover { color: var(--color-success); background: var(--color-success-bg); }
.ag-item__action--delete:hover { color: var(--color-error); background: var(--color-error-bg); }

/* ═══ LEGEND ═══ */
.cal-legend {
  display: flex;
  align-items: center;
  gap: var(--space-l);
  margin-top: var(--space-m);
  padding: var(--space-s) 0;
}

.cal-legend__item { display: flex; align-items: center; gap: var(--space-xs); }
.cal-legend__dot { width: 8px; height: 8px; border-radius: var(--radius-circle); flex-shrink: 0; }
.cal-legend__label { font: var(--text-caption); color: var(--color-fg-secondary); }

/* ═══ TRANSITIONS ═══ */
.panel-slide-enter-active {
  transition: opacity var(--duration-normal) var(--easing-standard),
              transform var(--duration-normal) var(--easing-standard);
}

.panel-slide-leave-active {
  transition: opacity var(--duration-fast) var(--easing-standard),
              transform var(--duration-fast) var(--easing-standard);
}

.panel-slide-enter-from { opacity: 0; transform: translateY(8px); }
.panel-slide-leave-to { opacity: 0; transform: translateY(-4px); }

/* ═══ RESPONSIVE: TABLET ═══ */
@media (max-width: 768px) {
  .cal-nav__label { min-width: auto; }

  .month__cell {
    min-height: 76px;
    padding: 2px;
  }

  .month__day {
    width: 24px;
    height: 24px;
    font: var(--text-caption);
    font-weight: var(--font-weight-medium);
  }

  .month__day--today { font-weight: var(--font-weight-bold); }

  .month__chip {
    font-size: 10px;
    line-height: 14px;
    padding: 0 3px;
    border-left-width: 2px;
  }

  .tg__dh-num { width: 24px; height: 24px; font: var(--text-body-2); }
  .tg__dh-dow { font-size: 10px; }
}

/* ═══ RESPONSIVE: MOBILE ═══ */
@media (max-width: 640px) {
  .cal-nav--desktop { display: none; }

  .cal-nav--mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-s);
    margin-bottom: var(--space-m);
  }

  .cal-nav--mobile .cal-nav__label {
    margin-left: 0;
    font: var(--text-body-1);
    font-weight: var(--font-weight-semibold);
  }

  .cal-nav__controls {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
  }

  /* Month view: show dots, hide chips */
  .month__dow-full { display: none; }
  .month__dow-short { display: inline; }
  .month__dow { padding: var(--space-xs) var(--space-2xs); }

  .month__cell {
    min-height: 56px;
    padding: 2px 1px;
  }

  .month__day { width: 22px; height: 22px; }
  .month__chips { display: none; }
  .month__dots { display: flex; padding-left: 4px; }
  .month__more { display: none; }

  /* Day panel mobile */
  .day-panel__header { padding: var(--space-s) var(--space-m); }
  .day-item { padding: var(--space-s) var(--space-m); }
  .day-item__badge { display: none; }

  /* Time grid mobile */
  .tg__body { max-height: 500px; }
  .tg__gutter { width: 40px; }
  .tg__gutter-cap { width: 40px; min-width: 40px; }
  .tg__tracks { left: 40px; }
  .tg__hour-lbl { font-size: 9px; }
  .tg__ev-title { font-size: 10px; }
  .tg__dh-dow { font-size: 9px; }
  .tg__dh-num { width: 22px; height: 22px; font-size: 12px; }

  /* Agenda mobile */
  .ag-group__header { padding: var(--space-xs) var(--space-s); }
  .ag-group__today-badge { font-size: 10px; line-height: 16px; }
  .ag-item { padding: var(--space-s) var(--space-s); }

  /* Legend */
  .cal-legend { flex-wrap: wrap; gap: var(--space-s) var(--space-m); }
}
</style>
