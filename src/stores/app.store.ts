import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DataScope } from '@/models/enums'

export type ThemePreference = 'system' | 'light' | 'dark'
export type AccentColor = 'green' | 'teal' | 'blue' | 'purple' | 'rose' | 'amber' | 'slate'
export type FontSize = 'small' | 'default' | 'large' | 'extra_large'
export type DateFormat = 'mdy' | 'dmy' | 'ymd' | 'iso'
export type TimeFormat = '12h' | '24h'
export type WeekStart = 'sunday' | 'monday' | 'saturday'
export type Currency = 'usd' | 'eur' | 'gbp' | 'bdt' | 'inr' | 'cad' | 'aud' | 'jpy'
export type DashboardDensity = 'comfortable' | 'compact' | 'spacious'
export type DefaultTaskPriority = 'high' | 'medium' | 'low'
export type DefaultView = 'list' | 'grid' | 'board'

const STORAGE_PREFIX = 'stead-'

function persist(key: string, value: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_PREFIX + key, value)
}

function restore(key: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_PREFIX + key)
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeToDocument(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const themeMeta = document.querySelector('meta[name="theme-color"]')
  if (themeMeta) {
    themeMeta.setAttribute('content', theme === 'dark' ? '#000000' : '#FFFFFF')
  }
}

function applyAccentToDocument(accent: AccentColor) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.accent = accent
}

function applyFontSizeToDocument(size: FontSize) {
  if (typeof document === 'undefined') return
  const scale: Record<FontSize, string> = {
    small: '0.9',
    default: '1',
    large: '1.1',
    extra_large: '1.2',
  }
  document.documentElement.style.setProperty('--font-scale', scale[size])
}

let systemThemeQuery: MediaQueryList | null = null

export const useAppStore = defineStore('app', () => {
  /* ── Layout ── */
  const sidebarExpanded = ref(true)
  const mobileSidebarOpen = ref(false)
  const scope = ref<DataScope>('household')

  /* ── Appearance ── */
  const themePreference = ref<ThemePreference>('system')
  const accentColor = ref<AccentColor>('green')
  const fontSize = ref<FontSize>('default')
  const compactMode = ref(false)
  const animationsEnabled = ref(true)
  const highContrast = ref(false)

  /* ── Dashboard ── */
  const dashboardDensity = ref<DashboardDensity>('comfortable')
  const showDashboardGreeting = ref(true)
  const dashboardWidgets = ref({
    money: true,
    tasks: true,
    pantry: true,
    reminders: true,
    notes: true,
    habits: true,
    meals: true,
    subscriptions: true,
    wishlist: true,
  })

  /* ── Date & Time ── */
  const dateFormat = ref<DateFormat>('mdy')
  const timeFormat = ref<TimeFormat>('12h')
  const weekStart = ref<WeekStart>('sunday')

  /* ── Money & Budget ── */
  const currency = ref<Currency>('usd')
  const showCents = ref(true)
  const defaultBudgetPeriod = ref<'weekly' | 'monthly' | 'yearly'>('monthly')
  const showMonthlyComparison = ref(true)

  /* ── Tasks & Chores ── */
  const defaultTaskPriority = ref<DefaultTaskPriority>('medium')
  const defaultTaskView = ref<DefaultView>('list')
  const showCompletedTasks = ref(true)
  const autoArchiveDays = ref(7)
  const confirmBeforeDelete = ref(true)

  /* ── Pantry & Shopping ── */
  const autoAddRestock = ref(true)
  const defaultGrocerySort = ref<'name' | 'category' | 'status'>('category')
  const showStockIndicators = ref(true)

  /* ── Meals ── */
  const defaultServings = ref(2)
  const showMealCalendar = ref(true)

  /* ── Reminders ── */
  const defaultSnoozeMinutes = ref(30)
  const reminderSound = ref(true)

  /* ── Notes & Journal ── */
  const defaultNoteView = ref<DefaultView>('grid')
  const journalPromptEnabled = ref(false)

  /* ── Privacy & Data ── */
  const cacheEnabled = ref(true)
  const analyticsOptIn = ref(false)

  /* ── Connectivity ── */
  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (themePreference.value === 'system') return getSystemTheme()
    return themePreference.value
  })

  function handleSystemThemeChange() {
    if (themePreference.value === 'system') {
      applyThemeToDocument(getSystemTheme())
    }
  }

  function initializePreferences() {
    if (typeof window === 'undefined') return

    const storedSidebar = restore('sidebar-expanded')
    if (storedSidebar === 'true' || storedSidebar === 'false') {
      sidebarExpanded.value = storedSidebar === 'true'
    }

    const storedTheme = restore('theme-preference')
    if (storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark') {
      themePreference.value = storedTheme
    }

    const storedScope = restore('scope')
    if (storedScope === 'household' || storedScope === 'personal') {
      scope.value = storedScope
    }

    /* Restore all preferences */
    const storedAccent = restore('accent-color')
    if (storedAccent) accentColor.value = storedAccent as AccentColor

    const storedFontSize = restore('font-size')
    if (storedFontSize) fontSize.value = storedFontSize as FontSize

    const storedCompact = restore('compact-mode')
    if (storedCompact) compactMode.value = storedCompact === 'true'

    const storedAnimations = restore('animations-enabled')
    if (storedAnimations) animationsEnabled.value = storedAnimations !== 'false'

    const storedHighContrast = restore('high-contrast')
    if (storedHighContrast) highContrast.value = storedHighContrast === 'true'

    const storedDashDensity = restore('dashboard-density')
    if (storedDashDensity) dashboardDensity.value = storedDashDensity as DashboardDensity

    const storedGreeting = restore('dashboard-greeting')
    if (storedGreeting) showDashboardGreeting.value = storedGreeting !== 'false'

    const storedWidgets = restore('dashboard-widgets')
    if (storedWidgets) {
      try { Object.assign(dashboardWidgets.value, JSON.parse(storedWidgets)) } catch { /* ignore */ }
    }

    const storedDateFmt = restore('date-format')
    if (storedDateFmt) dateFormat.value = storedDateFmt as DateFormat

    const storedTimeFmt = restore('time-format')
    if (storedTimeFmt) timeFormat.value = storedTimeFmt as TimeFormat

    const storedWeekStart = restore('week-start')
    if (storedWeekStart) weekStart.value = storedWeekStart as WeekStart

    const storedCurrency = restore('currency')
    if (storedCurrency) currency.value = storedCurrency as Currency

    const storedShowCents = restore('show-cents')
    if (storedShowCents) showCents.value = storedShowCents !== 'false'

    const storedBudgetPeriod = restore('budget-period')
    if (storedBudgetPeriod) defaultBudgetPeriod.value = storedBudgetPeriod as 'weekly' | 'monthly' | 'yearly'

    const storedMonthlyComp = restore('monthly-comparison')
    if (storedMonthlyComp) showMonthlyComparison.value = storedMonthlyComp !== 'false'

    const storedTaskPriority = restore('default-task-priority')
    if (storedTaskPriority) defaultTaskPriority.value = storedTaskPriority as DefaultTaskPriority

    const storedTaskView = restore('default-task-view')
    if (storedTaskView) defaultTaskView.value = storedTaskView as DefaultView

    const storedShowCompleted = restore('show-completed-tasks')
    if (storedShowCompleted) showCompletedTasks.value = storedShowCompleted !== 'false'

    const storedArchiveDays = restore('auto-archive-days')
    if (storedArchiveDays) autoArchiveDays.value = parseInt(storedArchiveDays, 10) || 7

    const storedConfirmDelete = restore('confirm-before-delete')
    if (storedConfirmDelete) confirmBeforeDelete.value = storedConfirmDelete !== 'false'

    const storedAutoRestock = restore('auto-add-restock')
    if (storedAutoRestock) autoAddRestock.value = storedAutoRestock !== 'false'

    const storedGrocerySort = restore('grocery-sort')
    if (storedGrocerySort) defaultGrocerySort.value = storedGrocerySort as 'name' | 'category' | 'status'

    const storedStockIndicators = restore('stock-indicators')
    if (storedStockIndicators) showStockIndicators.value = storedStockIndicators !== 'false'

    const storedServings = restore('default-servings')
    if (storedServings) defaultServings.value = parseInt(storedServings, 10) || 2

    const storedMealCal = restore('meal-calendar')
    if (storedMealCal) showMealCalendar.value = storedMealCal !== 'false'

    const storedSnooze = restore('default-snooze')
    if (storedSnooze) defaultSnoozeMinutes.value = parseInt(storedSnooze, 10) || 30

    const storedSound = restore('reminder-sound')
    if (storedSound) reminderSound.value = storedSound !== 'false'

    const storedNoteView = restore('default-note-view')
    if (storedNoteView) defaultNoteView.value = storedNoteView as DefaultView

    const storedJournalPrompt = restore('journal-prompt')
    if (storedJournalPrompt) journalPromptEnabled.value = storedJournalPrompt === 'true'

    const storedCache = restore('cache-enabled')
    if (storedCache) cacheEnabled.value = storedCache !== 'false'

    const storedAnalytics = restore('analytics-opt-in')
    if (storedAnalytics) analyticsOptIn.value = storedAnalytics === 'true'

    /* Apply to document */
    applyThemeToDocument(resolvedTheme.value)
    applyAccentToDocument(accentColor.value)
    applyFontSizeToDocument(fontSize.value)
    document.documentElement.dataset.scope = scope.value

    if (compactMode.value) document.documentElement.classList.add('compact')
    else document.documentElement.classList.remove('compact')

    if (highContrast.value) document.documentElement.classList.add('high-contrast')
    else document.documentElement.classList.remove('high-contrast')

    if (!animationsEnabled.value) document.documentElement.classList.add('no-animations')
    else document.documentElement.classList.remove('no-animations')

    systemThemeQuery?.removeEventListener('change', handleSystemThemeChange)
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeQuery.addEventListener('change', handleSystemThemeChange)
  }

  function setSidebarExpanded(value: boolean) {
    sidebarExpanded.value = value
    persist('sidebar-expanded', String(value))
  }

  function toggleSidebar() {
    setSidebarExpanded(!sidebarExpanded.value)
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function openMobileSidebar() {
    mobileSidebarOpen.value = true
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  function setThemePreference(value: ThemePreference) {
    themePreference.value = value

    persist('theme-preference', value)
    applyThemeToDocument(resolvedTheme.value)
  }

  function toggleTheme() {
    setThemePreference(resolvedTheme.value === 'dark' ? 'light' : 'dark')
  }

  function setAccentColor(value: AccentColor) {
    accentColor.value = value
    persist('accent-color', value)
    applyAccentToDocument(value)
  }

  function setFontSize(value: FontSize) {
    fontSize.value = value
    persist('font-size', value)
    applyFontSizeToDocument(value)
  }

  function setCompactMode(value: boolean) {
    compactMode.value = value
    persist('compact-mode', String(value))
    if (typeof document !== 'undefined') {
      if (value) document.documentElement.classList.add('compact')
      else document.documentElement.classList.remove('compact')
    }
  }

  function setAnimationsEnabled(value: boolean) {
    animationsEnabled.value = value
    persist('animations-enabled', String(value))
    if (typeof document !== 'undefined') {
      if (!value) document.documentElement.classList.add('no-animations')
      else document.documentElement.classList.remove('no-animations')
    }
  }

  function setHighContrast(value: boolean) {
    highContrast.value = value
    persist('high-contrast', String(value))
    if (typeof document !== 'undefined') {
      if (value) document.documentElement.classList.add('high-contrast')
      else document.documentElement.classList.remove('high-contrast')
    }
  }

  function setScope(value: DataScope) {
    scope.value = value
    persist('scope', value)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.scope = value
    }
  }

  function toggleScope() {
    setScope(scope.value === 'household' ? 'personal' : 'household')
  }

  /* ── Generic preference setter ── */
  function setPref<K extends string>(key: K, value: string, target: { value: unknown }) {
    target.value = key === 'auto-archive-days' || key === 'default-snooze' || key === 'default-servings'
      ? parseInt(value, 10)
      : value === 'true' ? true : value === 'false' ? false : value
    persist(key, value)
  }

  function setDashboardDensity(v: DashboardDensity) { dashboardDensity.value = v; persist('dashboard-density', v) }
  function setShowDashboardGreeting(v: boolean) { showDashboardGreeting.value = v; persist('dashboard-greeting', String(v)) }
  function setDashboardWidget(key: keyof typeof dashboardWidgets.value, v: boolean) {
    dashboardWidgets.value[key] = v
    persist('dashboard-widgets', JSON.stringify(dashboardWidgets.value))
  }
  function setDateFormat(v: DateFormat) { dateFormat.value = v; persist('date-format', v) }
  function setTimeFormat(v: TimeFormat) { timeFormat.value = v; persist('time-format', v) }
  function setWeekStart(v: WeekStart) { weekStart.value = v; persist('week-start', v) }
  function setCurrency(v: Currency) { currency.value = v; persist('currency', v) }
  function setShowCents(v: boolean) { showCents.value = v; persist('show-cents', String(v)) }
  function setDefaultBudgetPeriod(v: 'weekly' | 'monthly' | 'yearly') { defaultBudgetPeriod.value = v; persist('budget-period', v) }
  function setShowMonthlyComparison(v: boolean) { showMonthlyComparison.value = v; persist('monthly-comparison', String(v)) }
  function setDefaultTaskPriority(v: DefaultTaskPriority) { defaultTaskPriority.value = v; persist('default-task-priority', v) }
  function setDefaultTaskView(v: DefaultView) { defaultTaskView.value = v; persist('default-task-view', v) }
  function setShowCompletedTasks(v: boolean) { showCompletedTasks.value = v; persist('show-completed-tasks', String(v)) }
  function setAutoArchiveDays(v: number) { autoArchiveDays.value = v; persist('auto-archive-days', String(v)) }
  function setConfirmBeforeDelete(v: boolean) { confirmBeforeDelete.value = v; persist('confirm-before-delete', String(v)) }
  function setAutoAddRestock(v: boolean) { autoAddRestock.value = v; persist('auto-add-restock', String(v)) }
  function setDefaultGrocerySort(v: 'name' | 'category' | 'status') { defaultGrocerySort.value = v; persist('grocery-sort', v) }
  function setShowStockIndicators(v: boolean) { showStockIndicators.value = v; persist('stock-indicators', String(v)) }
  function setDefaultServings(v: number) { defaultServings.value = v; persist('default-servings', String(v)) }
  function setShowMealCalendar(v: boolean) { showMealCalendar.value = v; persist('meal-calendar', String(v)) }
  function setDefaultSnoozeMinutes(v: number) { defaultSnoozeMinutes.value = v; persist('default-snooze', String(v)) }
  function setReminderSound(v: boolean) { reminderSound.value = v; persist('reminder-sound', String(v)) }
  function setDefaultNoteView(v: DefaultView) { defaultNoteView.value = v; persist('default-note-view', v) }
  function setJournalPromptEnabled(v: boolean) { journalPromptEnabled.value = v; persist('journal-prompt', String(v)) }
  function setCacheEnabled(v: boolean) { cacheEnabled.value = v; persist('cache-enabled', String(v)) }
  function setAnalyticsOptIn(v: boolean) { analyticsOptIn.value = v; persist('analytics-opt-in', String(v)) }

  const isPersonal = computed(() => scope.value === 'personal')

  /* ── Directional navigation transitions ── */
  const NAV_ORDER: Record<string, number> = {
    '/': 0,
    '/money': 1,
    '/tasks': 2,
    '/shopping': 3,
    '/inventory': 4,
    '/reminders': 5,
    '/notes': 6,
    '/maintenance': 7,
    '/settings': 8,
  }

  const navDirection = ref<'down' | 'up'>('down')

  function getRouteGroup(path: string): string {
    if (path === '/') return '/'
    const seg = '/' + path.split('/')[1]
    return seg
  }

  function updateNavDirection(fromPath: string, toPath: string) {
    const fromGroup = getRouteGroup(fromPath)
    const toGroup = getRouteGroup(toPath)
    const fromIdx = NAV_ORDER[fromGroup] ?? 0
    const toIdx = NAV_ORDER[toGroup] ?? 0
    navDirection.value = toIdx >= fromIdx ? 'down' : 'up'
  }

  return {
    sidebarExpanded,
    mobileSidebarOpen,
    themePreference,
    resolvedTheme,
    isOnline,
    navDirection,
    initializePreferences,
    setSidebarExpanded,
    toggleSidebar,
    toggleMobileSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    setThemePreference,
    toggleTheme,
    scope,
    isPersonal,
    setScope,
    toggleScope,
    updateNavDirection,
    /* Appearance */
    accentColor, setAccentColor,
    fontSize, setFontSize,
    compactMode, setCompactMode,
    animationsEnabled, setAnimationsEnabled,
    highContrast, setHighContrast,
    /* Dashboard */
    dashboardDensity, setDashboardDensity,
    showDashboardGreeting, setShowDashboardGreeting,
    dashboardWidgets, setDashboardWidget,
    /* Date & Time */
    dateFormat, setDateFormat,
    timeFormat, setTimeFormat,
    weekStart, setWeekStart,
    /* Money */
    currency, setCurrency,
    showCents, setShowCents,
    defaultBudgetPeriod, setDefaultBudgetPeriod,
    showMonthlyComparison, setShowMonthlyComparison,
    /* Tasks */
    defaultTaskPriority, setDefaultTaskPriority,
    defaultTaskView, setDefaultTaskView,
    showCompletedTasks, setShowCompletedTasks,
    autoArchiveDays, setAutoArchiveDays,
    confirmBeforeDelete, setConfirmBeforeDelete,
    /* Pantry */
    autoAddRestock, setAutoAddRestock,
    defaultGrocerySort, setDefaultGrocerySort,
    showStockIndicators, setShowStockIndicators,
    /* Meals */
    defaultServings, setDefaultServings,
    showMealCalendar, setShowMealCalendar,
    /* Reminders */
    defaultSnoozeMinutes, setDefaultSnoozeMinutes,
    reminderSound, setReminderSound,
    /* Notes & Journal */
    defaultNoteView, setDefaultNoteView,
    journalPromptEnabled, setJournalPromptEnabled,
    /* Privacy */
    cacheEnabled, setCacheEnabled,
    analyticsOptIn, setAnalyticsOptIn,
    setPref,
  }
})
