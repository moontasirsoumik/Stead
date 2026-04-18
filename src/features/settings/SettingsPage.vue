<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SectionHeader from '@/components/data/SectionHeader.vue'
import SettingsTabs from '@/features/settings/SettingsTabs.vue'
import SButton from '@/components/ui/SButton.vue'
import SInput from '@/components/ui/SInput.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SToggle from '@/components/ui/SToggle.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { Member } from '@/models/member.model'
import type { MemberRole } from '@/models/enums'
import type {
  AccentColor,
  FontSize,
  DashboardDensity,
  DateFormat,
  TimeFormat,
  WeekStart,
  Currency,
  DefaultTaskPriority,
  DefaultView,
} from '@/stores/app.store'

const householdStore = useHouseholdStore()
const authStore = useAuthStore()
const app = useAppStore()

/* -- Tab navigation -- */
const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'formats', label: 'Formats' },
  { id: 'modules', label: 'Modules' },
  { id: 'household', label: 'Household' },
  { id: 'privacy', label: 'Privacy' },
]

const activeTab = ref('appearance')

/* -- Household -- */
const householdName = ref('')
const editingName = ref(false)
const savingName = ref(false)
const drawerOpen = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const drawerLoading = ref(false)
const editingMemberId = ref<string | null>(null)
const formName = ref('')
const formRole = ref<MemberRole>('member')
const formColor = ref('#0F6CBD')

const MEMBER_COLORS = [
  '#1B5299', '#0D6B0D', '#9B2335', '#8B6914',
  '#6B4D96', '#026C6F', '#9A3D0C', '#3D56B2',
]

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      householdStore.loadHousehold(authStore.householdId),
      householdStore.loadMembers(authStore.householdId),
    ])
    if (householdStore.household) {
      householdName.value = householdStore.household.name
    }
  }
  await nextTick()
})

watch(
  () => householdStore.household?.name,
  (name) => {
    if (name && !editingName.value) householdName.value = name
  },
)

async function saveHouseholdName() {
  if (!householdName.value.trim()) return
  savingName.value = true
  try {
    await householdStore.updateHousehold({ name: householdName.value.trim() })
    editingName.value = false
  } finally {
    savingName.value = false
  }
}

function cancelEditName() {
  householdName.value = householdStore.household?.name ?? ''
  editingName.value = false
}

function openAddDrawer() {
  drawerMode.value = 'add'
  editingMemberId.value = null
  formName.value = ''
  formRole.value = 'member'
  formColor.value = MEMBER_COLORS[householdStore.members.length % MEMBER_COLORS.length]
  drawerOpen.value = true
}

function openEditDrawer(member: Member) {
  drawerMode.value = 'edit'
  editingMemberId.value = member.id
  formName.value = member.name
  formRole.value = member.role
  formColor.value = member.color
  drawerOpen.value = true
}

async function submitDrawer() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    if (drawerMode.value === 'add' && authStore.householdId) {
      await householdStore.addMember({
        household_id: authStore.householdId,
        user_id: null,
        name: formName.value.trim(),
        role: formRole.value,
        color: formColor.value,
        active: true,
      })
    } else if (drawerMode.value === 'edit' && editingMemberId.value) {
      await householdStore.updateMember(editingMemberId.value, {
        name: formName.value.trim(),
        role: formRole.value,
        color: formColor.value,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

async function deactivateMember(member: Member) {
  await householdStore.removeMember(member.id)
}

/* -- Computed models -- */
const compactModeModel = computed({ get: () => app.compactMode, set: (v: boolean) => app.setCompactMode(v) })
const animationsModel = computed({ get: () => app.animationsEnabled, set: (v: boolean) => app.setAnimationsEnabled(v) })
const highContrastModel = computed({ get: () => app.highContrast, set: (v: boolean) => app.setHighContrast(v) })
const dashDensityStr = computed({ get: () => app.dashboardDensity, set: (v: string) => app.setDashboardDensity(v as DashboardDensity) })
const greetingModel = computed({ get: () => app.showDashboardGreeting, set: (v: boolean) => app.setShowDashboardGreeting(v) })

type WidgetKey = 'money' | 'tasks' | 'pantry' | 'reminders' | 'notes' | 'habits' | 'meals' | 'subscriptions' | 'wishlist'
const WIDGET_LIST: { key: WidgetKey; label: string }[] = [
  { key: 'money', label: 'Money' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'pantry', label: 'Pantry' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'notes', label: 'Notes' },
  { key: 'habits', label: 'Habits' },
  { key: 'meals', label: 'Meals' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'wishlist', label: 'Wishlist' },
]

function widgetModel(key: WidgetKey) {
  return computed({
    get: () => app.dashboardWidgets[key],
    set: (v: boolean) => app.setDashboardWidget(key, v),
  })
}

const dateFormatStr = computed({ get: () => app.dateFormat, set: (v: string) => app.setDateFormat(v as DateFormat) })
const timeFormatStr = computed({ get: () => app.timeFormat, set: (v: string) => app.setTimeFormat(v as TimeFormat) })
const weekStartStr = computed({ get: () => app.weekStart, set: (v: string) => app.setWeekStart(v as WeekStart) })

const datePreview = computed(() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const y = d.getFullYear()
  const map: Record<DateFormat, string> = {
    mdy: `${m}/${day}/${y}`,
    dmy: `${day}/${m}/${y}`,
    ymd: `${y}-${m}-${day}`,
    iso: `${y}-${m}-${day}T00:00:00`,
  }
  return map[app.dateFormat]
})

const timePreview = computed(() => {
  const d = new Date()
  if (app.timeFormat === '24h') return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const h = d.getHours() % 12 || 12
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`
})

const currencyStr = computed({ get: () => app.currency, set: (v: string) => app.setCurrency(v as Currency) })
const showCentsModel = computed({ get: () => app.showCents, set: (v: boolean) => app.setShowCents(v) })
const budgetPeriodStr = computed({ get: () => app.defaultBudgetPeriod, set: (v: string) => app.setDefaultBudgetPeriod(v as 'weekly' | 'monthly' | 'yearly') })
const monthlyCompModel = computed({ get: () => app.showMonthlyComparison, set: (v: boolean) => app.setShowMonthlyComparison(v) })

const CURRENCY_OPTIONS = [
  { value: 'usd', label: 'USD � $' },
  { value: 'eur', label: 'EUR � �' },
  { value: 'gbp', label: 'GBP � �' },
  { value: 'bdt', label: 'BDT � ?' },
  { value: 'inr', label: 'INR � ?' },
  { value: 'cad', label: 'CAD � C$' },
  { value: 'aud', label: 'AUD � A$' },
  { value: 'jpy', label: 'JPY � �' },
]

const taskPriorityStr = computed({ get: () => app.defaultTaskPriority, set: (v: string) => app.setDefaultTaskPriority(v as DefaultTaskPriority) })
const taskViewStr = computed({ get: () => app.defaultTaskView, set: (v: string) => app.setDefaultTaskView(v as DefaultView) })
const showCompletedModel = computed({ get: () => app.showCompletedTasks, set: (v: boolean) => app.setShowCompletedTasks(v) })
const archiveDaysStr = computed({ get: () => String(app.autoArchiveDays), set: (v: string) => app.setAutoArchiveDays(parseInt(v, 10)) })
const confirmDeleteModel = computed({ get: () => app.confirmBeforeDelete, set: (v: boolean) => app.setConfirmBeforeDelete(v) })
const autoRestockModel = computed({ get: () => app.autoAddRestock, set: (v: boolean) => app.setAutoAddRestock(v) })
const grocerySortStr = computed({ get: () => app.defaultGrocerySort, set: (v: string) => app.setDefaultGrocerySort(v as 'name' | 'category' | 'status') })
const stockIndicatorsModel = computed({ get: () => app.showStockIndicators, set: (v: boolean) => app.setShowStockIndicators(v) })
const servingsStr = computed({ get: () => String(app.defaultServings), set: (v: string) => app.setDefaultServings(parseInt(v, 10)) })
const mealCalModel = computed({ get: () => app.showMealCalendar, set: (v: boolean) => app.setShowMealCalendar(v) })
const snoozeStr = computed({ get: () => String(app.defaultSnoozeMinutes), set: (v: string) => app.setDefaultSnoozeMinutes(parseInt(v, 10)) })
const reminderSoundModel = computed({ get: () => app.reminderSound, set: (v: boolean) => app.setReminderSound(v) })
const noteViewStr = computed({ get: () => app.defaultNoteView, set: (v: string) => app.setDefaultNoteView(v as DefaultView) })
const journalPromptModel = computed({ get: () => app.journalPromptEnabled, set: (v: boolean) => app.setJournalPromptEnabled(v) })
const cacheModel = computed({ get: () => app.cacheEnabled, set: (v: boolean) => app.setCacheEnabled(v) })
const analyticsModel = computed({ get: () => app.analyticsOptIn, set: (v: boolean) => app.setAnalyticsOptIn(v) })

const clearingCache = ref(false)

async function clearCache() {
  clearingCache.value = true
  try {
    if ('caches' in window) {
      const keys = await window.caches.keys()
      await Promise.all(keys.map((k) => window.caches.delete(k)))
    }
    const dbs = await window.indexedDB.databases()
    for (const db of dbs) {
      if (db.name) window.indexedDB.deleteDatabase(db.name)
    }
  } finally {
    clearingCache.value = false
  }
}

function exportData() {
  const data = { ...window.localStorage }
  const blob = new window.Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = `stead-settings-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  window.URL.revokeObjectURL(url)
}

const ACCENT_COLORS: { id: AccentColor; hex: string; label: string }[] = [
  { id: 'green', hex: '#49662E', label: 'Forest' },
  { id: 'teal', hex: '#2E6B5E', label: 'Teal' },
  { id: 'blue', hex: '#1A56DB', label: 'Ocean' },
  { id: 'purple', hex: '#7C3AED', label: 'Violet' },
  { id: 'rose', hex: '#E11D48', label: 'Rose' },
  { id: 'amber', hex: '#D97706', label: 'Amber' },
  { id: 'slate', hex: '#475569', label: 'Slate' },
]

const FONT_SIZES: { id: FontSize; label: string }[] = [
  { id: 'small', label: 'S' },
  { id: 'default', label: 'M' },
  { id: 'large', label: 'L' },
  { id: 'extra_large', label: 'XL' },
]
</script>

<template>
  <PageContainer>
    <PageHeader title="Settings" subtitle="Customize your experience" class="page-enter" :style="{ '--stagger': 0 }" />

    <SettingsTabs v-model="activeTab" :tabs="TABS" class="page-enter" :style="{ '--stagger': 1 }" />

    <!-- ----------- TAB: APPEARANCE ----------- -->
    <template v-if="activeTab === 'appearance'">
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Theme & Colors" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Theme</span></div>
            <div class="theme-group">
              <button
                v-for="t in (['light', 'dark', 'system'] as const)"
                :key="t"
                :class="['theme-opt', { 'theme-opt--active': app.themePreference === t }]"
                @click="app.setThemePreference(t)"
              >
                <span class="material-symbols-rounded theme-opt__icon">
                  {{ t === 'light' ? 'light_mode' : t === 'dark' ? 'dark_mode' : 'brightness_auto' }}
                </span>
                <span class="theme-opt__label">{{ t === 'system' ? 'Auto' : t.charAt(0).toUpperCase() + t.slice(1) }}</span>
              </button>
            </div>
          </div>

          <div class="row">
            <div class="row__label"><span class="row__name">Accent color</span></div>
            <div class="accent-row">
              <button
                v-for="c in ACCENT_COLORS"
                :key="c.id"
                :class="['accent-dot', { 'accent-dot--active': app.accentColor === c.id }]"
                :style="{ '--dot-color': c.hex }"
                :title="c.label"
                @click="app.setAccentColor(c.id)"
              >
                <svg v-if="app.accentColor === c.id" width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.5L6.5 11.5L12.5 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Display" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Text size</span></div>
            <div class="seg">
              <button
                v-for="fs in FONT_SIZES"
                :key="fs.id"
                :class="['seg__btn', { 'seg__btn--active': app.fontSize === fs.id }]"
                @click="app.setFontSize(fs.id)"
              >{{ fs.label }}</button>
            </div>
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Compact mode</span>
              <span class="row__hint">Denser spacing throughout</span>
            </div>
            <SToggle v-model="compactModeModel" />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Animations</span>
              <span class="row__hint">Motion and transitions</span>
            </div>
            <SToggle v-model="animationsModel" />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">High contrast</span>
              <span class="row__hint">Stronger borders and text</span>
            </div>
            <SToggle v-model="highContrastModel" />
          </div>
        </div>
      </div>
    </template>

    <!-- ----------- TAB: DASHBOARD ----------- -->
    <template v-if="activeTab === 'dashboard'">
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Layout" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Density</span></div>
            <SSelect
              v-model="dashDensityStr"
              :options="[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
                { value: 'spacious', label: 'Spacious' },
              ]"
            />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Show greeting</span>
              <span class="row__hint">Welcome message on home</span>
            </div>
            <SToggle v-model="greetingModel" />
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Widgets" />
        </div>
        <div class="card-body">
          <div
            v-for="w in WIDGET_LIST"
            :key="w.key"
            class="row"
          >
            <div class="row__label">
              <span class="row__name">{{ w.label }}</span>
            </div>
            <SToggle v-model="widgetModel(w.key).value" />
          </div>
        </div>
      </div>
    </template>

    <!-- ----------- TAB: FORMATS ----------- -->
    <template v-if="activeTab === 'formats'">
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Date & Time" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label">
              <span class="row__name">Date format</span>
              <span class="row__hint">{{ datePreview }}</span>
            </div>
            <SSelect
              v-model="dateFormatStr"
              :options="[
                { value: 'mdy', label: 'MM/DD/YYYY' },
                { value: 'dmy', label: 'DD/MM/YYYY' },
                { value: 'ymd', label: 'YYYY-MM-DD' },
                { value: 'iso', label: 'ISO 8601' },
              ]"
            />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Time format</span>
              <span class="row__hint">{{ timePreview }}</span>
            </div>
            <SSelect
              v-model="timeFormatStr"
              :options="[
                { value: '12h', label: '12-hour' },
                { value: '24h', label: '24-hour' },
              ]"
            />
          </div>

          <div class="row">
            <div class="row__label"><span class="row__name">Week starts on</span></div>
            <SSelect
              v-model="weekStartStr"
              :options="[
                { value: 'sunday', label: 'Sunday' },
                { value: 'monday', label: 'Monday' },
                { value: 'saturday', label: 'Saturday' },
              ]"
            />
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Money & Budget" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Currency</span></div>
            <SSelect v-model="currencyStr" :options="CURRENCY_OPTIONS" />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Show cents</span>
              <span class="row__hint">Decimal places in amounts</span>
            </div>
            <SToggle v-model="showCentsModel" />
          </div>

          <div class="row">
            <div class="row__label"><span class="row__name">Default budget period</span></div>
            <SSelect
              v-model="budgetPeriodStr"
              :options="[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]"
            />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Monthly comparison</span>
              <span class="row__hint">Month-over-month trends</span>
            </div>
            <SToggle v-model="monthlyCompModel" />
          </div>
        </div>
      </div>
    </template>

    <!-- ----------- TAB: MODULES ----------- -->
    <template v-if="activeTab === 'modules'">
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Tasks & Chores" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Default priority</span></div>
            <SSelect
              v-model="taskPriorityStr"
              :options="[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Default view</span></div>
            <SSelect
              v-model="taskViewStr"
              :options="[
                { value: 'list', label: 'List' },
                { value: 'grid', label: 'Grid' },
                { value: 'board', label: 'Board' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Show completed</span>
              <span class="row__hint">Keep done tasks visible</span>
            </div>
            <SToggle v-model="showCompletedModel" />
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Auto-archive after</span></div>
            <SSelect
              v-model="archiveDaysStr"
              :options="[
                { value: '3', label: '3 days' },
                { value: '7', label: '7 days' },
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
                { value: '0', label: 'Never' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Confirm before delete</span></div>
            <SToggle v-model="confirmDeleteModel" />
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Pantry & Shopping" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label">
              <span class="row__name">Auto-restock</span>
              <span class="row__hint">Add low-stock items to list</span>
            </div>
            <SToggle v-model="autoRestockModel" />
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Default sort</span></div>
            <SSelect
              v-model="grocerySortStr"
              :options="[
                { value: 'name', label: 'Name' },
                { value: 'category', label: 'Category' },
                { value: 'status', label: 'Status' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Stock indicators</span>
              <span class="row__hint">Colored stock-level badges</span>
            </div>
            <SToggle v-model="stockIndicatorsModel" />
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 4 }">
        <div class="card-header">
          <SectionHeader title="Meals" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Default servings</span></div>
            <SSelect
              v-model="servingsStr"
              :options="[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
                { value: '6', label: '6' },
                { value: '7', label: '7' },
                { value: '8', label: '8' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Meal calendar</span>
              <span class="row__hint">Calendar view for planning</span>
            </div>
            <SToggle v-model="mealCalModel" />
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 5 }">
        <div class="card-header">
          <SectionHeader title="Reminders" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Snooze duration</span></div>
            <SSelect
              v-model="snoozeStr"
              :options="[
                { value: '5', label: '5 min' },
                { value: '10', label: '10 min' },
                { value: '15', label: '15 min' },
                { value: '30', label: '30 min' },
                { value: '60', label: '1 hour' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Sound</span>
              <span class="row__hint">Play sound on due reminders</span>
            </div>
            <SToggle v-model="reminderSoundModel" />
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 6 }">
        <div class="card-header">
          <SectionHeader title="Notes & Journal" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Note layout</span></div>
            <SSelect
              v-model="noteViewStr"
              :options="[
                { value: 'list', label: 'List' },
                { value: 'grid', label: 'Grid' },
              ]"
            />
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Journal prompt</span>
              <span class="row__hint">Daily writing prompt</span>
            </div>
            <SToggle v-model="journalPromptModel" />
          </div>
        </div>
      </div>
    </template>

    <!-- ----------- TAB: HOUSEHOLD ----------- -->
    <template v-if="activeTab === 'household'">
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Details" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Household name</span></div>
            <div v-if="householdStore.household" class="row__control">
              <template v-if="editingName">
                <div class="inline-edit">
                  <SInput v-model="householdName" placeholder="Household name" @keyup.enter="saveHouseholdName" />
                  <SButton size="sm" :loading="savingName" @click="saveHouseholdName">Save</SButton>
                  <SButton size="sm" variant="subtle" @click="cancelEditName">Cancel</SButton>
                </div>
              </template>
              <template v-else>
                <div class="inline-value">
                  <span class="inline-value__text">{{ householdStore.household.name }}</span>
                  <SIconButton label="Edit" size="sm" @click="editingName = true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </SIconButton>
                </div>
              </template>
            </div>
            <span v-else class="row__muted">Not loaded</span>
          </div>
        </div>
      </div>

      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Members" />
          <SButton size="sm" @click="openAddDrawer">Add member</SButton>
        </div>
        <div class="card-body">
          <div v-if="householdStore.members.length > 0" class="members">
            <div
              v-for="member in householdStore.members"
              :key="member.id"
              :class="['member', { 'member--inactive': !member.active }]"
            >
              <SAvatar :name="member.name" :color="member.color" size="md" />
              <div class="member__info">
                <span class="member__name">{{ member.name }}</span>
                <SBadge :variant="member.role === 'admin' ? 'brand' : 'default'" size="sm">{{ member.role }}</SBadge>
              </div>
              <div class="member__actions">
                <SIconButton label="Edit" size="sm" @click="openEditDrawer(member)">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </SIconButton>
                <SIconButton v-if="member.active" label="Deactivate" size="sm" @click="deactivateMember(member)">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
                    <path d="M4 8H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </SIconButton>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            title="No members yet"
            subtitle="Add people to your household."
            action-label="Add Member"
            @action="openAddDrawer"
          />
        </div>
      </div>
    </template>

    <!-- ----------- TAB: PRIVACY ----------- -->
    <template v-if="activeTab === 'privacy'">
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Data & Cache" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label">
              <span class="row__name">Local cache</span>
              <span class="row__hint">Offline access and speed</span>
            </div>
            <SToggle v-model="cacheModel" />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Usage analytics</span>
              <span class="row__hint">Anonymous improvement data</span>
            </div>
            <SToggle v-model="analyticsModel" />
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Clear local data</span>
              <span class="row__hint">Remove cached data from this device</span>
            </div>
            <SButton size="sm" variant="subtle" :loading="clearingCache" @click="clearCache">Clear cache</SButton>
          </div>

          <div class="row">
            <div class="row__label">
              <span class="row__name">Export settings</span>
              <span class="row__hint">Download as JSON</span>
            </div>
            <SButton size="sm" variant="subtle" @click="exportData">Export</SButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Member Form Drawer -->
    <FormDrawer
      :open="drawerOpen"
      :title="drawerMode === 'add' ? 'Add Member' : 'Edit Member'"
      :submit-label="drawerMode === 'add' ? 'Add' : 'Save'"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="submitDrawer"
    >
      <FormSection>
        <FormField>
          <SInput v-model="formName" label="Name" placeholder="Member name" :required="true" />
        </FormField>
        <FormField>
          <SSelect v-model="formRole" label="Role" :options="ROLE_OPTIONS" />
        </FormField>
        <FormField>
          <label class="color-label">Color</label>
          <div class="color-swatches">
            <button
              v-for="color in MEMBER_COLORS"
              :key="color"
              :class="['color-swatch', { 'color-swatch--selected': formColor === color }]"
              :style="{ backgroundColor: color }"
              type="button"
              :aria-label="color"
              @click="formColor = color"
            />
          </div>
        </FormField>
      </FormSection>
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
/* -- Settings section -- */
.settings-section {
  margin-bottom: var(--space-l);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  padding: var(--space-m) var(--space-l) 0;
}

.card-body {
  padding: var(--space-xs) var(--space-l) var(--space-m);
}

/* -- Setting row -- */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
  padding: var(--space-m) 0;
  min-height: 44px;
}

.row + .row {
  border-top: 1px solid var(--color-border-subtle);
}

.row__label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.row__name {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.row__hint {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.row__muted {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
}

.row__control {
  flex-shrink: 0;
}

/* -- Theme picker -- */
.theme-group {
  display: flex;
  gap: var(--space-xs);
}

.theme-opt {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-m);
  border: 1.5px solid var(--color-border-default);
  border-radius: var(--radius-circle);
  background: transparent;
  cursor: pointer;
  color: var(--color-fg-secondary);
  font: var(--text-label-md);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.theme-opt:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-tertiary);
}

.theme-opt--active {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-selected);
  color: var(--color-brand-primary);
}

.theme-opt__icon {
  font-size: 16px;
}

.theme-opt__label {
  line-height: 1;
}

/* -- Accent color dots -- */
.accent-row {
  display: flex;
  gap: var(--space-s);
}

.accent-dot {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-circle);
  border: 2px solid transparent;
  background: var(--dot-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.accent-dot:hover {
  transform: scale(1.12);
  border-color: var(--color-border-strong);
}

.accent-dot--active {
  border-color: var(--color-fg-primary);
  outline: 2px solid var(--color-bg-primary);
  outline-offset: 0;
  transform: scale(1.08);
}

/* -- Segmented control -- */
.seg {
  display: flex;
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.seg__btn {
  padding: var(--space-xs) var(--space-l);
  background: none;
  border: none;
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.seg__btn:hover {
  background: var(--color-surface-input-hover);
}

.seg__btn--active {
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
}

.seg__btn--active:hover {
  background: var(--color-brand-hover);
}

/* -- Inline edit / value -- */
.inline-edit {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.inline-value {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.inline-value__text {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

/* -- Members list -- */
.members {
  display: flex;
  flex-direction: column;
}

.member {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) 0;
}

.member + .member {
  border-top: 1px solid var(--color-border-subtle);
}

.member--inactive {
  opacity: 0.45;
}

.member__info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-width: 0;
}

.member__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.member__actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.member:hover .member__actions {
  opacity: 1;
}

/* -- Color swatches (drawer) -- */
.color-label {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
  display: block;
  margin-bottom: var(--space-xs);
}

.color-swatches {
  display: flex;
  gap: var(--space-s);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-circle);
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--easing-standard);
}

.color-swatch:hover {
  border-color: var(--color-border-strong);
}

.color-swatch--selected {
  border-color: var(--color-fg-primary);
  outline: 2px solid var(--color-bg-primary);
  outline-offset: 0;
}

/* -- Responsive -- */
@media (max-width: 640px) {
  .card-header {
    padding: var(--space-m) var(--space-l) 0;
  }

  .card-body {
    padding: var(--space-xs) var(--space-l) var(--space-m);
  }

  .row {
    gap: var(--space-l);
  }

  .theme-group {
    flex-wrap: wrap;
  }

  .accent-row {
    flex-wrap: wrap;
  }

  .member__actions {
    opacity: 1;
  }
}
</style>
