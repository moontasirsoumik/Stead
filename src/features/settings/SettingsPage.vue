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
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useInvitationStore } from '@/stores/invitation.store'
import type { Member } from '@/models/member.model'
import type { MemberRole } from '@/models/enums'
import type { InvitationStatus } from '@/models/invitation.model'
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
const invitationStore = useInvitationStore()

/* -- Tab navigation -- */
const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'formats', label: 'Formats' },
  { id: 'modules', label: 'Modules' },
  { id: 'household', label: 'Household' },
  { id: 'privacy', label: 'Privacy' },
]

const activeTab = ref('account')

/* -- Legal docs -- */
const expandedDoc = ref<string | null>(null)

function toggleDoc(id: string) {
  expandedDoc.value = expandedDoc.value === id ? null : id
}
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

const TIMEZONE_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (US)' },
  { value: 'America/Chicago', label: 'Central (US)' },
  { value: 'America/Denver', label: 'Mountain (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Kolkata', label: 'Kolkata' },
  { value: 'Asia/Dhaka', label: 'Dhaka' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
]

// Account tab state
const profileName = ref('')
const profileDob = ref('')
const profilePhone = ref('')
const profileTimezone = ref('')
const profileSaving = ref(false)
const profileSuccess = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')
const passwordSaving = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

const leavingHousehold = ref(false)
const showLeaveConfirm = ref(false)

// Invitation state
const showInviteForm = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<MemberRole>('member')
const inviteExpiry = ref(7)
const inviteCreating = ref(false)
const copiedCode = ref<string | null>(null)

const inviteExpiryStr = computed({
  get: () => String(inviteExpiry.value),
  set: (v: string) => { inviteExpiry.value = parseInt(v, 10) },
})

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      householdStore.loadHousehold(authStore.householdId),
      householdStore.loadMembers(authStore.householdId),
      invitationStore.loadInvitations(authStore.householdId),
    ])
    if (householdStore.household) {
      householdName.value = householdStore.household.name
    }
  }
  if (authStore.user) {
    const meta = authStore.user.user_metadata
    profileName.value = meta?.full_name ?? ''
    profileDob.value = meta?.date_of_birth ?? ''
    profilePhone.value = meta?.phone ?? ''
    profileTimezone.value = meta?.timezone ?? ''
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

/* -- Account functions -- */
async function saveProfile() {
  profileSaving.value = true
  profileSuccess.value = false
  try {
    const success = await authStore.updateProfile({
      full_name: profileName.value.trim() || undefined,
      date_of_birth: profileDob.value || null,
      phone: profilePhone.value.trim() || null,
      timezone: profileTimezone.value || null,
    })
    if (success) {
      if (authStore.memberId && profileName.value.trim()) {
        const currentMember = householdStore.members.find(m => m.id === authStore.memberId)
        if (currentMember && currentMember.name !== profileName.value.trim()) {
          await householdStore.updateMember(authStore.memberId, { name: profileName.value.trim() })
        }
      }
      profileSuccess.value = true
      setTimeout(() => { profileSuccess.value = false }, 3000)
    }
  } finally {
    profileSaving.value = false
  }
}

async function handleChangePassword() {
  passwordError.value = ''
  passwordSuccess.value = false

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match'
    return
  }

  passwordSaving.value = true
  try {
    const success = await authStore.changePassword(newPassword.value)
    if (success) {
      newPassword.value = ''
      confirmPassword.value = ''
      passwordSuccess.value = true
      setTimeout(() => { passwordSuccess.value = false }, 3000)
    } else {
      passwordError.value = authStore.error || 'Failed to change password'
    }
  } finally {
    passwordSaving.value = false
  }
}

async function leaveHousehold() {
  if (!authStore.memberId) return
  leavingHousehold.value = true
  try {
    await householdStore.removeMember(authStore.memberId)
    await authStore.signOut()
  } finally {
    leavingHousehold.value = false
    showLeaveConfirm.value = false
  }
}

/* -- Invitation functions -- */
async function createInvite() {
  inviteCreating.value = true
  try {
    await invitationStore.createInvitation({
      email: inviteEmail.value.trim() || null,
      role: inviteRole.value,
      expiry_days: inviteExpiry.value,
    })
    showInviteForm.value = false
    inviteEmail.value = ''
    inviteRole.value = 'member'
    inviteExpiry.value = 7
  } finally {
    inviteCreating.value = false
  }
}

async function revokeInvite(id: string) {
  await invitationStore.revokeInvitation(id)
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  copiedCode.value = code
  setTimeout(() => { copiedCode.value = null }, 2000)
}

function invitationStatusVariant(status: InvitationStatus): 'brand' | 'success' | 'default' {
  const map: Record<InvitationStatus, 'brand' | 'success' | 'default'> = {
    pending: 'brand',
    accepted: 'success',
    revoked: 'default',
    expired: 'default',
  }
  return map[status]
}

/* -- Computed models -- */
const compactModeModel = computed({ get: () => app.compactMode, set: (v: boolean) => app.setCompactMode(v) })
const animationsModel = computed({ get: () => app.animationsEnabled, set: (v: boolean) => app.setAnimationsEnabled(v) })
const highContrastModel = computed({ get: () => app.highContrast, set: (v: boolean) => app.setHighContrast(v) })
const dashDensityStr = computed({ get: () => app.dashboardDensity, set: (v: string) => app.setDashboardDensity(v as DashboardDensity) })
const greetingModel = computed({ get: () => app.showDashboardGreeting, set: (v: boolean) => app.setShowDashboardGreeting(v) })

type WidgetKey = 'money' | 'tasks' | 'pantry' | 'reminders' | 'notes' | 'habits' | 'meals' | 'subscriptions' | 'wishlist'
const WIDGET_LIST: { key: WidgetKey; label: string; icon: string }[] = [
  { key: 'money', label: 'Finances', icon: 'payments' },
  { key: 'tasks', label: 'Tasks', icon: 'task_alt' },
  { key: 'pantry', label: 'Pantry', icon: 'kitchen' },
  { key: 'reminders', label: 'Reminders', icon: 'alarm' },
  { key: 'notes', label: 'Notes', icon: 'sticky_note_2' },
  { key: 'habits', label: 'Habits', icon: 'self_improvement' },
  { key: 'meals', label: 'Meals', icon: 'restaurant' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'card_membership' },
  { key: 'wishlist', label: 'Wishlist', icon: 'redeem' },
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
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'bdt', label: 'BDT (Tk)' },
  { value: 'inr', label: 'INR' },
  { value: 'cad', label: 'CAD (C$)' },
  { value: 'aud', label: 'AUD (A$)' },
  { value: 'jpy', label: 'JPY' },
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

    <!-- ----------- TAB: ACCOUNT ----------- -->
    <template v-if="activeTab === 'account'">
      <!-- Profile Section -->
      <div class="settings-section page-enter" :style="{ '--stagger': 2 }">
        <div class="card-header">
          <SectionHeader title="Profile" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">Display name</span></div>
            <div class="row__control"><SInput v-model="profileName" placeholder="Your name" /></div>
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Email</span>
              <span class="row__hint">{{ authStore.user?.email ?? 'Not set' }}</span>
            </div>
            <SBadge variant="default" size="sm">Verified</SBadge>
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Date of birth</span></div>
            <div class="row__control"><SInput v-model="profileDob" type="date" /></div>
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Phone</span></div>
            <div class="row__control"><SInput v-model="profilePhone" placeholder="Optional" type="tel" /></div>
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Timezone</span></div>
            <div class="row__control"><SSelect v-model="profileTimezone" :options="TIMEZONE_OPTIONS" /></div>
          </div>
          <div class="row row--action">
            <div v-if="profileSuccess" class="success-msg">
              <span class="material-symbols-rounded" style="font-size: 16px;">check_circle</span>
              Profile updated
            </div>
            <SButton size="sm" :loading="profileSaving" @click="saveProfile">Save profile</SButton>
          </div>
        </div>
      </div>

      <!-- Security Section -->
      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Security" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label"><span class="row__name">New password</span></div>
            <div class="row__control"><SInput v-model="newPassword" type="password" placeholder="Min 6 characters" /></div>
          </div>
          <div class="row">
            <div class="row__label"><span class="row__name">Confirm password</span></div>
            <div class="row__control"><SInput v-model="confirmPassword" type="password" placeholder="Re-enter password" /></div>
          </div>
          <div v-if="passwordError" class="row">
            <p class="error-msg">{{ passwordError }}</p>
          </div>
          <div class="row row--action">
            <div v-if="passwordSuccess" class="success-msg">
              <span class="material-symbols-rounded" style="font-size: 16px;">check_circle</span>
              Password changed
            </div>
            <SButton size="sm" :loading="passwordSaving" @click="handleChangePassword">Change password</SButton>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="settings-section settings-section--danger page-enter" :style="{ '--stagger': 4 }">
        <div class="card-header">
          <SectionHeader title="Danger Zone" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label">
              <span class="row__name">Leave household</span>
              <span class="row__hint">Remove yourself from this household. This cannot be undone.</span>
            </div>
            <SButton size="sm" variant="subtle" class="danger-btn" @click="showLeaveConfirm = true">Leave</SButton>
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Sign out everywhere</span>
              <span class="row__hint">End all sessions on all devices</span>
            </div>
            <SButton size="sm" variant="subtle" @click="authStore.signOut()">Sign out</SButton>
          </div>
        </div>
      </div>

      <!-- Leave confirm dialog -->
      <ConfirmDialog
        :open="showLeaveConfirm"
        title="Leave household?"
        message="You will be removed from this household and all your assignments will be unlinked. You can rejoin later with a new invitation."
        confirm-label="Leave household"
        variant="danger"
        @confirm="leaveHousehold"
        @cancel="showLeaveConfirm = false"
      />
    </template>

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
          <p class="widget-hint">Tap to toggle widgets on your dashboard</p>
          <div class="widget-chips">
            <button
              v-for="w in WIDGET_LIST"
              :key="w.key"
              :class="['widget-chip', { 'widget-chip--active': widgetModel(w.key).value }]"
              @click="widgetModel(w.key).value = !widgetModel(w.key).value"
            >
              <span class="material-symbols-rounded widget-chip__icon">{{ w.icon }}</span>
              <span class="widget-chip__label">{{ w.label }}</span>
            </button>
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
          <SectionHeader title="Finances & Budget" />
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

      <!-- Invitations section -->
      <div class="settings-section page-enter" :style="{ '--stagger': 4 }">
        <div class="card-header">
          <SectionHeader title="Invitations" />
          <SButton size="sm" @click="showInviteForm = !showInviteForm">
            {{ showInviteForm ? 'Cancel' : 'Generate invite' }}
          </SButton>
        </div>
        <div class="card-body">
          <!-- Inline invite form -->
          <div v-if="showInviteForm" class="invite-form">
            <div class="row">
              <div class="row__label"><span class="row__name">Email</span><span class="row__hint">Optional — leave blank for an open invite</span></div>
              <div class="row__control"><SInput v-model="inviteEmail" type="email" placeholder="invitee@example.com" /></div>
            </div>
            <div class="row">
              <div class="row__label"><span class="row__name">Role</span></div>
              <div class="row__control"><SSelect v-model="inviteRole" :options="ROLE_OPTIONS" /></div>
            </div>
            <div class="row">
              <div class="row__label"><span class="row__name">Expires in</span></div>
              <div class="row__control"><SSelect v-model="inviteExpiryStr" :options="EXPIRY_OPTIONS" /></div>
            </div>
            <div class="row row--action">
              <SButton size="sm" :loading="inviteCreating" @click="createInvite">Create invite</SButton>
            </div>
          </div>

          <!-- Invitation list -->
          <div v-if="invitationStore.invitations.length > 0" class="invitations">
            <div
              v-for="inv in invitationStore.invitations"
              :key="inv.id"
              class="invite-row"
            >
              <div class="invite-row__main">
                <button class="invite-code" :title="copiedCode === inv.invite_code ? 'Copied!' : 'Click to copy'" @click="copyCode(inv.invite_code)">
                  <span class="invite-code__text">{{ inv.invite_code }}</span>
                  <span class="material-symbols-rounded invite-code__icon">{{ copiedCode === inv.invite_code ? 'check' : 'content_copy' }}</span>
                </button>
                <span v-if="inv.email" class="invite-email">{{ inv.email }}</span>
              </div>
              <div class="invite-row__meta">
                <SBadge :variant="invitationStatusVariant(inv.status)" size="sm">{{ inv.status }}</SBadge>
                <SBadge :variant="inv.role === 'admin' ? 'brand' : 'default'" size="sm">{{ inv.role }}</SBadge>
                <span class="invite-expires">{{ new Date(inv.expires_at).toLocaleDateString() }}</span>
              </div>
              <div class="invite-row__actions">
                <SButton v-if="inv.status === 'pending'" size="sm" variant="subtle" @click="revokeInvite(inv.id)">Revoke</SButton>
              </div>
            </div>
          </div>

          <EmptyState
            v-else-if="!showInviteForm"
            title="No invitations yet"
            subtitle="Generate one to invite people to your household."
            action-label="Generate invite"
            @action="showInviteForm = true"
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

      <!-- Your Rights -->
      <div class="settings-section page-enter" :style="{ '--stagger': 3 }">
        <div class="card-header">
          <SectionHeader title="Your Data Rights" />
        </div>
        <div class="card-body">
          <div class="row">
            <div class="row__label">
              <span class="row__name">Right to access</span>
              <span class="row__hint">You may request a copy of all personal data we hold about you at any time. Use the Export function above or contact us directly.</span>
            </div>
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Right to deletion</span>
              <span class="row__hint">You may request permanent deletion of your account and all associated data. This action is irreversible and will be completed within 30 days.</span>
            </div>
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Right to portability</span>
              <span class="row__hint">You may export your data in a standard machine-readable format (JSON) and transfer it to another service.</span>
            </div>
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Right to rectification</span>
              <span class="row__hint">You may correct any inaccurate personal data at any time through your Account settings or by contacting us.</span>
            </div>
          </div>
          <div class="row">
            <div class="row__label">
              <span class="row__name">Right to object</span>
              <span class="row__hint">You may opt out of analytics data collection at any time using the toggle above. We will never sell your data.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Legal Documents -->
      <div class="settings-section page-enter" :style="{ '--stagger': 4 }">
        <div class="card-header">
          <SectionHeader title="Legal" />
        </div>
        <div class="card-body legal-docs">
          <!-- Privacy Policy -->
          <button class="legal-toggle" :class="{ 'legal-toggle--open': expandedDoc === 'privacy' }" @click="toggleDoc('privacy')">
            <div class="legal-toggle__text">
              <span class="legal-toggle__title">Privacy Policy</span>
              <span class="legal-toggle__hint">How we collect, use, and protect your data</span>
            </div>
            <span class="material-symbols-rounded legal-toggle__icon">expand_more</span>
          </button>
          <Transition name="legal-expand">
            <div v-if="expandedDoc === 'privacy'" class="legal-body">
              <p class="legal-updated">Last updated: April 21, 2026</p>

              <h4 class="legal-h">1. Introduction</h4>
              <p>Stead ("we", "us", "our") operates the Stead household management application (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using Stead, you consent to the practices described in this policy.</p>

              <h4 class="legal-h">2. Information We Collect</h4>
              <p><strong>Account Information.</strong> When you create an account, we collect your email address and password (stored as a cryptographic hash — we never store plaintext passwords). You may optionally provide your name, date of birth, phone number, and timezone.</p>
              <p><strong>Household Data.</strong> All content you create within Stead — including tasks, expenses, journal entries, calendar events, notes, contacts, documents, and other household information — is stored in our database and associated with your household.</p>
              <p><strong>Device and Usage Data.</strong> If you opt in to usage analytics, we collect anonymous, aggregated data about how the Service is used (e.g., feature usage frequency, page views). This data cannot be used to identify you personally. We do not collect IP addresses, device fingerprints, or location data for analytics purposes.</p>
              <p><strong>Local Cache.</strong> If you enable local caching, a copy of your household data is stored in your browser's IndexedDB storage on your device. This data never leaves your device and is solely used to enable offline access and improve performance.</p>

              <h4 class="legal-h">3. How We Use Your Information</h4>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, operate, and maintain the Service</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Enforce household-level access controls and data isolation</li>
                <li>Improve and optimize the Service (only with anonymous analytics data, when you have opted in)</li>
                <li>Communicate with you regarding account security, service updates, or support</li>
              </ul>
              <p>We do <strong>not</strong> use your data for advertising, profiling, automated decision-making, or any purpose unrelated to operating the Service.</p>

              <h4 class="legal-h">4. Data Storage and Security</h4>
              <p>Your data is stored on Supabase-managed PostgreSQL databases with infrastructure hosted by Amazon Web Services (AWS). All data is encrypted in transit using TLS 1.2 or higher. At rest, data is encrypted using AES-256 encryption.</p>
              <p>Row Level Security (RLS) is enforced at the database level, ensuring that every query is scoped to your household. No user can access data belonging to another household, even in the event of an application-level vulnerability.</p>
              <p>Authentication is handled via industry-standard JSON Web Tokens (JWT) issued by Supabase Auth. Passwords are hashed using bcrypt with a minimum cost factor of 10.</p>

              <h4 class="legal-h">5. Data Sharing and Disclosure</h4>
              <p>We do <strong>not</strong> sell, rent, license, or trade your personal information to any third party for any reason.</p>
              <p>We may share data only in the following limited circumstances:</p>
              <ul>
                <li><strong>Infrastructure Providers.</strong> Supabase (database hosting) and Cloudflare (content delivery and DDoS protection) process your data as part of service delivery. These providers are bound by their own privacy policies and data processing agreements.</li>
                <li><strong>Legal Requirements.</strong> We may disclose information if required to do so by law, court order, or governmental regulation, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
                <li><strong>Household Members.</strong> Data you mark as "household" scope is visible to all members of your household. Data you mark as "personal" scope is visible only to you, unless you explicitly share it with specific members.</li>
              </ul>

              <h4 class="legal-h">6. Data Retention</h4>
              <p>We retain your data for as long as your account is active. If you delete your account, all associated personal data and household data (where you are the sole owner) will be permanently deleted within 30 days. Shared household data will be retained for remaining household members.</p>
              <p>Anonymized analytics data (if previously collected with your consent) may be retained indefinitely as it cannot be traced back to any individual.</p>

              <h4 class="legal-h">7. Cookies and Tracking</h4>
              <p>Stead does <strong>not</strong> use cookies for tracking or advertising. We use a single authentication token stored in your browser's local storage solely to maintain your login session. No third-party tracking scripts, pixels, or beacons are loaded by the Service.</p>

              <h4 class="legal-h">8. Children's Privacy</h4>
              <p>Stead is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will delete it.</p>

              <h4 class="legal-h">9. International Data Transfers</h4>
              <p>Your data may be processed in countries outside your country of residence, including the United States, where our infrastructure providers operate. We ensure that any such transfer is protected by appropriate safeguards, including standard contractual clauses where applicable.</p>

              <h4 class="legal-h">10. Changes to This Policy</h4>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy within the Service and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
            </div>
          </Transition>

          <!-- Terms of Service -->
          <button class="legal-toggle" :class="{ 'legal-toggle--open': expandedDoc === 'terms' }" @click="toggleDoc('terms')">
            <div class="legal-toggle__text">
              <span class="legal-toggle__title">Terms of Service</span>
              <span class="legal-toggle__hint">Rules governing use of the Stead application</span>
            </div>
            <span class="material-symbols-rounded legal-toggle__icon">expand_more</span>
          </button>
          <Transition name="legal-expand">
            <div v-if="expandedDoc === 'terms'" class="legal-body">
              <p class="legal-updated">Last updated: April 21, 2026</p>

              <h4 class="legal-h">1. Acceptance of Terms</h4>
              <p>By accessing or using Stead ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must not use the Service. These Terms constitute a legally binding agreement between you and Stead.</p>

              <h4 class="legal-h">2. Description of Service</h4>
              <p>Stead is a household management application that allows users to organize tasks, expenses, calendars, journals, and other household-related information. The Service is provided as a web application accessible via modern web browsers.</p>

              <h4 class="legal-h">3. Accounts and Households</h4>
              <p>To use the Service, you must create an account with a valid email address and password. You are responsible for maintaining the confidentiality of your credentials and for all activities conducted under your account.</p>
              <p>Each account is associated with one household. Household administrators may invite other users to join. You are responsible for ensuring that all members of your household comply with these Terms.</p>

              <h4 class="legal-h">4. Acceptable Use</h4>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
                <li>Attempt to gain unauthorized access to any part of the Service, other user accounts, or associated systems</li>
                <li>Transmit malware, viruses, or any other malicious code</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
                <li>Use automated scripts, bots, or scrapers to access the Service</li>
                <li>Impersonate another person or misrepresent your affiliation with any entity</li>
              </ul>

              <h4 class="legal-h">5. Intellectual Property</h4>
              <p>The Service, including its design, code, logos, and documentation, is owned by Stead and protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose.</p>
              <p>You retain full ownership of all content you create within the Service. We do not claim any intellectual property rights over your household data.</p>

              <h4 class="legal-h">6. Data and Privacy</h4>
              <p>Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.</p>

              <h4 class="legal-h">7. Service Availability</h4>
              <p>We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may suspend or discontinue the Service (or any part thereof) at any time for maintenance, updates, or other operational reasons. We will make reasonable efforts to provide advance notice of planned downtime.</p>

              <h4 class="legal-h">8. Limitation of Liability</h4>
              <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, STEAD AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, REGARDLESS OF THE THEORY OF LIABILITY.</p>
              <p>Our total aggregate liability for any claims arising from or related to the Service shall not exceed the amount you have paid us (if any) in the twelve (12) months preceding the claim.</p>

              <h4 class="legal-h">9. Disclaimer of Warranties</h4>
              <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>

              <h4 class="legal-h">10. Indemnification</h4>
              <p>You agree to indemnify, defend, and hold harmless Stead and its operators from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your violation of these Terms or misuse of the Service.</p>

              <h4 class="legal-h">11. Termination</h4>
              <p>We may suspend or terminate your access to the Service at any time if you violate these Terms, with or without prior notice. Upon termination, your right to use the Service ceases immediately. You may delete your account at any time through your Account settings.</p>

              <h4 class="legal-h">12. Governing Law</h4>
              <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Stead operates, without regard to conflict-of-law principles. Any disputes arising from these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.</p>

              <h4 class="legal-h">13. Changes to Terms</h4>
              <p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the Service. Your continued use after such changes constitutes acceptance of the updated Terms.</p>
            </div>
          </Transition>

          <!-- Data Processing -->
          <button class="legal-toggle" :class="{ 'legal-toggle--open': expandedDoc === 'dpa' }" @click="toggleDoc('dpa')">
            <div class="legal-toggle__text">
              <span class="legal-toggle__title">Data Processing Agreement</span>
              <span class="legal-toggle__hint">How your data is processed and by whom</span>
            </div>
            <span class="material-symbols-rounded legal-toggle__icon">expand_more</span>
          </button>
          <Transition name="legal-expand">
            <div v-if="expandedDoc === 'dpa'" class="legal-body">
              <p class="legal-updated">Last updated: April 21, 2026</p>

              <h4 class="legal-h">1. Scope</h4>
              <p>This Data Processing Agreement ("DPA") applies to all personal data processed by Stead on your behalf. Stead acts as the data processor; you (the user) are the data controller for the personal data you input into the Service.</p>

              <h4 class="legal-h">2. Categories of Data</h4>
              <ul>
                <li><strong>Identity Data:</strong> email address, name, date of birth (optional), phone (optional)</li>
                <li><strong>Household Data:</strong> tasks, expenses, income records, calendar events, journal entries, notes, contacts, documents, meal plans, habits, inventory, subscriptions, wishlists, and all associated metadata</li>
                <li><strong>Technical Data:</strong> authentication tokens, session identifiers, timestamps</li>
                <li><strong>Analytics Data (opt-in only):</strong> anonymous feature usage metrics with no personal identifiers</li>
              </ul>

              <h4 class="legal-h">3. Sub-processors</h4>
              <p>The following sub-processors are used to deliver the Service:</p>
              <ul>
                <li><strong>Supabase, Inc.</strong> — Database hosting, authentication, and API services (AWS us-east-1)</li>
                <li><strong>Cloudflare, Inc.</strong> — Content delivery, DNS, and DDoS protection (global edge network)</li>
              </ul>
              <p>We will notify you before adding new sub-processors. Each sub-processor is bound by contractual obligations to protect your data consistent with this DPA.</p>

              <h4 class="legal-h">4. Security Measures</h4>
              <ul>
                <li>TLS 1.2+ encryption for all data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Row Level Security (RLS) enforced at the database level — full tenant isolation</li>
                <li>Bcrypt password hashing with minimum cost factor of 10</li>
                <li>JWT-based authentication with short-lived access tokens and secure refresh tokens</li>
                <li>No plaintext credentials stored anywhere in the system</li>
                <li>Regular dependency audits and security patches</li>
              </ul>

              <h4 class="legal-h">5. Data Breach Notification</h4>
              <p>In the event of a personal data breach, we will notify affected users without undue delay and no later than 72 hours after becoming aware of the breach. The notification will include the nature of the breach, the categories and approximate number of affected records, likely consequences, and measures taken to mitigate the breach.</p>

              <h4 class="legal-h">6. Data Deletion</h4>
              <p>Upon account deletion or at your request, we will permanently delete all personal data associated with your account within 30 days. This includes all household data where you are the sole member. Backups containing your data will be purged within 90 days of the deletion request.</p>

              <h4 class="legal-h">7. Audit Rights</h4>
              <p>You have the right to request information about our data processing practices and security measures. We will respond to reasonable audit requests within 30 days.</p>
            </div>
          </Transition>

          <!-- Security Overview -->
          <button class="legal-toggle" :class="{ 'legal-toggle--open': expandedDoc === 'security' }" @click="toggleDoc('security')">
            <div class="legal-toggle__text">
              <span class="legal-toggle__title">Security Overview</span>
              <span class="legal-toggle__hint">Technical security measures protecting your data</span>
            </div>
            <span class="material-symbols-rounded legal-toggle__icon">expand_more</span>
          </button>
          <Transition name="legal-expand">
            <div v-if="expandedDoc === 'security'" class="legal-body">
              <p class="legal-updated">Last updated: April 21, 2026</p>

              <h4 class="legal-h">Authentication</h4>
              <p>All authentication is handled by Supabase Auth, which implements industry-standard security practices. Passwords are hashed using bcrypt. Sessions are managed via short-lived JWT access tokens (1 hour) paired with secure, HTTP-only refresh tokens. Multi-factor authentication support is available through Supabase Auth.</p>

              <h4 class="legal-h">Data Isolation</h4>
              <p>Every database table is protected by Row Level Security (RLS) policies that scope all queries to the authenticated user's household. This means:</p>
              <ul>
                <li>A user can only read, create, update, or delete data belonging to their own household</li>
                <li>Even in the event of an application-level bug, the database will reject any query that attempts to access another household's data</li>
                <li>Personal-scope data is further restricted to the individual owner</li>
              </ul>

              <h4 class="legal-h">Encryption</h4>
              <ul>
                <li><strong>In transit:</strong> All communication between your browser and our servers is encrypted using TLS 1.2 or higher. HSTS headers are enforced.</li>
                <li><strong>At rest:</strong> Database storage is encrypted using AES-256. Backups are encrypted with the same standard.</li>
              </ul>

              <h4 class="legal-h">Infrastructure</h4>
              <ul>
                <li>Database hosted on Supabase (AWS infrastructure) with automated backups</li>
                <li>Static assets served via Cloudflare Pages with global CDN, DDoS protection, and WAF</li>
                <li>No server-side application code — the frontend communicates directly with the database API, reducing attack surface</li>
              </ul>

              <h4 class="legal-h">Local Data</h4>
              <p>When local caching is enabled, data is stored in IndexedDB within your browser. This data:</p>
              <ul>
                <li>Never leaves your device</li>
                <li>Is subject to your browser's own security sandbox</li>
                <li>Can be cleared at any time using the "Clear cache" button above</li>
                <li>Is automatically invalidated when you sign out</li>
              </ul>

              <h4 class="legal-h">Responsible Disclosure</h4>
              <p>If you discover a security vulnerability, please report it to us responsibly. We commit to acknowledging receipt within 48 hours and providing an initial assessment within 7 business days.</p>
            </div>
          </Transition>
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
  width: 220px;
}

/* Auto-size SSelect/SToggle inside rows (matches .row__control width) */
.row > .sselect {
  flex-shrink: 0;
  width: 220px;
}
.row > .stoggle {
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

/* -- Widget chips -- */
.widget-hint {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-bottom: var(--space-m);
}

.widget-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s);
}

.widget-chip {
  display: inline-flex;
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
    color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
  user-select: none;
}

.widget-chip:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-tertiary);
  box-shadow: var(--shadow-xs);
}

.widget-chip:active {
  transform: scale(0.96);
}

.widget-chip--active {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-selected);
  color: var(--color-brand-primary);
  box-shadow: 0 0 0 1px var(--color-brand-primary) inset;
}

.widget-chip--active:hover {
  background: var(--color-brand-selected);
  border-color: var(--color-brand-hover);
}

.widget-chip__icon {
  font-size: 18px;
  line-height: 1;
}

.widget-chip__label {
  line-height: 1;
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

/* -- Account tab -- */
.row--action {
  justify-content: flex-end;
  padding-top: var(--space-m);
}

.success-msg {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font: var(--text-body-2);
  color: var(--color-fg-success, #2d7a3a);
}

.error-msg {
  font: var(--text-body-2);
  color: var(--color-fg-danger, #c4314b);
}

/* -- Danger zone -- */
.settings-section--danger {
  border-color: var(--color-border-danger, rgba(200, 60, 60, 0.3));
}

.danger-btn {
  color: var(--color-fg-danger, #c4314b) !important;
}

/* -- Invitation form -- */
.invite-form {
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: var(--space-s);
  padding-bottom: var(--space-s);
}

/* -- Invitation list -- */
.invitations {
  display: flex;
  flex-direction: column;
}

.invite-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) 0;
}

.invite-row + .invite-row {
  border-top: 1px solid var(--color-border-subtle);
}

.invite-row__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.invite-code {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 2px var(--space-s);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-s);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  letter-spacing: 0.5px;
  color: var(--color-fg-primary);
  cursor: pointer;
  width: fit-content;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.invite-code:hover {
  background: var(--color-surface-input-hover);
}

.invite-code__icon {
  font-size: 14px;
  color: var(--color-fg-tertiary);
}

.invite-email {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.invite-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.invite-expires {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.invite-row__actions {
  flex-shrink: 0;
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
    flex-wrap: wrap;
    gap: var(--space-s);
  }

  .row__control {
    width: 100%;
  }

  .row > .sselect {
    width: 100%;
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

/* -- Legal documents -- */
.legal-docs {
  padding-bottom: var(--space-xs);
}

.legal-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  width: 100%;
  padding: var(--space-m) 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: inherit;
  transition: background var(--duration-fast) var(--easing-standard);
}

.legal-toggle + .legal-toggle {
  border-top: 1px solid var(--color-border-subtle);
}

.legal-toggle__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.legal-toggle__title {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.legal-toggle__hint {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.legal-toggle__icon {
  font-size: 20px;
  color: var(--color-fg-tertiary);
  transition: transform var(--duration-fast) var(--easing-standard);
  flex-shrink: 0;
}

.legal-toggle--open .legal-toggle__icon {
  transform: rotate(180deg);
}

.legal-body {
  padding: 0 0 var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
}

.legal-body p,
.legal-body ul {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  line-height: 1.65;
  margin: 0 0 var(--space-s);
}

.legal-body ul {
  padding-left: var(--space-l);
}

.legal-body li {
  margin-bottom: var(--space-2xs);
}

.legal-body strong {
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.legal-h {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  margin: var(--space-m) 0 var(--space-xs);
}

.legal-h:first-child {
  margin-top: 0;
}

.legal-updated {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-bottom: var(--space-m);
  font-style: italic;
}

.legal-expand-enter-active {
  transition: all var(--duration-normal) var(--easing-decelerate);
  overflow: hidden;
}

.legal-expand-leave-active {
  transition: all var(--duration-fast) var(--easing-accelerate);
  overflow: hidden;
}

.legal-expand-enter-from,
.legal-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.legal-expand-enter-to,
.legal-expand-leave-from {
  opacity: 1;
}
</style>
