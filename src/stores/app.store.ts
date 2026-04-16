import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DataScope } from '@/models/enums'

export type ThemePreference = 'system' | 'light' | 'dark'

const SIDEBAR_STORAGE_KEY = 'stead-sidebar-expanded'
const THEME_STORAGE_KEY = 'stead-theme-preference'
const SCOPE_STORAGE_KEY = 'stead-scope'

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

let systemThemeQuery: MediaQueryList | null = null

export const useAppStore = defineStore('app', () => {
  const sidebarExpanded = ref(true)
  const mobileSidebarOpen = ref(false)
  const themePreference = ref<ThemePreference>('system')
  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const scope = ref<DataScope>('household')

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

    const storedSidebar = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (storedSidebar === 'true' || storedSidebar === 'false') {
      sidebarExpanded.value = storedSidebar === 'true'
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark') {
      themePreference.value = storedTheme
    }

    const storedScope = window.localStorage.getItem(SCOPE_STORAGE_KEY)
    if (storedScope === 'household' || storedScope === 'personal') {
      scope.value = storedScope
    }

    applyThemeToDocument(resolvedTheme.value)
    document.documentElement.dataset.scope = scope.value

    systemThemeQuery?.removeEventListener('change', handleSystemThemeChange)
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeQuery.addEventListener('change', handleSystemThemeChange)
  }

  function setSidebarExpanded(value: boolean) {
    sidebarExpanded.value = value
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
    }
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

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, value)
    }

    applyThemeToDocument(resolvedTheme.value)
  }

  function toggleTheme() {
    setThemePreference(resolvedTheme.value === 'dark' ? 'light' : 'dark')
  }

  function setScope(value: DataScope) {
    scope.value = value
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SCOPE_STORAGE_KEY, value)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.scope = value
    }
  }

  function toggleScope() {
    setScope(scope.value === 'household' ? 'personal' : 'household')
  }

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
  }
})
