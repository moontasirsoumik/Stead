<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter, useRoute } from 'vue-router'
import NavRail from './NavRail.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import SteadLogo from '@/components/ui/SteadLogo.vue'

const appStore = useAppStore()
const householdStore = useHouseholdStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const mobileOpen = computed(() => appStore.mobileSidebarOpen)

/* ── Scope transition ── */
const scopeTransitioning = ref(false)

// Routes exclusive to one scope
const householdOnly = ['/pantry', '/reminders', '/contacts', '/documents']
const personalOnly = ['/wishlist', '/journal']

function isRouteInScope(path: string, scope: 'household' | 'personal'): boolean {
  if (scope === 'personal') return !householdOnly.some(r => path.startsWith(r))
  return !personalOnly.some(r => path.startsWith(r))
}

function handleScopeToggle() {
  const nextScope = appStore.scope === 'household' ? 'personal' : 'household'
  const currentPath = route.path
  const routeAvailable = isRouteInScope(currentPath, nextScope)

  // Start transition
  scopeTransitioning.value = true

  // After the fade-out (half-point), switch scope + maybe redirect
  setTimeout(() => {
    appStore.toggleScope()
    if (!routeAvailable) {
      router.replace('/')
    }
  }, 180)

  // After the full transition, remove the overlay
  setTimeout(() => {
    scopeTransitioning.value = false
  }, 420)
}

const isMobile = ref(false)
const isTablet = ref(false)

function checkBreakpoint() {
  const w = window.innerWidth
  isMobile.value = w <= 768
  isTablet.value = w > 768 && w <= 1024
}

onMounted(() => {
  checkBreakpoint()
  window.addEventListener('resize', checkBreakpoint)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkBreakpoint)
})

function openMobile() {
  appStore.openMobileSidebar()
}

function closeMobile() {
  appStore.closeMobileSidebar()
}

const userName = computed(() => householdStore.currentMember?.name ?? 'User')
const themeToggleLabel = computed(() =>
  appStore.resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
)

const accountMenuOpen = ref(false)
const userEmail = computed(() => authStore.user?.email ?? '')

async function handleSignOut() {
  accountMenuOpen.value = false
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div :class="['shell', { 'shell--mobile': isMobile }]">
    <!-- Mobile backdrop -->
    <Transition name="backdrop">
      <div v-if="mobileOpen" class="shell__backdrop" @click="closeMobile" />
    </Transition>

    <!-- Top bar (full width, always on top) -->
    <header class="shell__topbar">
      <div class="shell__topbar-left">
        <button v-if="isMobile" class="shell__menu-btn" aria-label="Open menu" @click="openMobile">
          <span class="material-symbols-rounded">menu</span>
        </button>
        <RouterLink to="/" class="shell__brand">
          <SteadLogo :size="20" />
          <span class="shell__brand-label">Stead</span>
        </RouterLink>
        <span class="shell__topbar-divider" />
        <div class="shell__scope-pill">
          <button
            :class="['shell__scope-btn', 'shell__scope-btn--household', { 'shell__scope-btn--active': appStore.scope === 'household' }]"
            @click="appStore.scope !== 'household' && handleScopeToggle()"
          >
            <span class="material-symbols-rounded shell__scope-btn-icon">home</span>
            <span class="shell__scope-btn-label-wrap">
              <span class="shell__scope-btn-label">Household</span>
            </span>
          </button>
          <button
            :class="['shell__scope-btn', 'shell__scope-btn--personal', { 'shell__scope-btn--active': appStore.scope === 'personal' }]"
            @click="appStore.scope !== 'personal' && handleScopeToggle()"
          >
            <span class="material-symbols-rounded shell__scope-btn-icon">person</span>
            <span class="shell__scope-btn-label-wrap">
              <span class="shell__scope-btn-label">Personal</span>
            </span>
          </button>
        </div>
      </div>
      <div class="shell__topbar-right">
        <button
          class="shell__topbar-icon-btn"
          :aria-label="themeToggleLabel"
          :title="themeToggleLabel"
          @click="appStore.toggleTheme()"
        >
          <span class="material-symbols-rounded">
            {{ appStore.resolvedTheme === 'light' ? 'dark_mode' : 'light_mode' }}
          </span>
        </button>
        <div class="shell__topbar-avatar" :title="userName" @click="accountMenuOpen = !accountMenuOpen">
          <SAvatar :name="userName" size="sm" />
        </div>
        <div v-if="accountMenuOpen" class="account-menu-backdrop" @click="accountMenuOpen = false" />
        <div v-if="accountMenuOpen" class="account-menu">
          <div class="account-menu__header">
            <SAvatar :name="userName" size="md" />
            <div class="account-menu__info">
              <span class="account-menu__name">{{ userName }}</span>
              <span class="account-menu__email">{{ userEmail }}</span>
            </div>
          </div>
          <div class="account-menu__divider" />
          <RouterLink to="/settings" class="account-menu__item" @click="accountMenuOpen = false">
            <span class="material-symbols-rounded">settings</span>
            Settings
          </RouterLink>
          <button class="account-menu__item" @click="handleSignOut">
            <span class="material-symbols-rounded">logout</span>
            Sign out
          </button>
        </div>
      </div>
    </header>

    <!-- Body: sidebar + content -->
    <div class="shell__body">
      <!-- Icon Rail (desktop/tablet) -->
      <aside v-if="!isMobile" class="shell__rail">
        <NavRail @navigate="closeMobile" />
      </aside>

      <!-- Content -->
      <main class="shell__content">
        <!-- Scope transition overlay -->
        <Transition name="scope-fade">
          <div v-if="scopeTransitioning" class="shell__scope-overlay" />
        </Transition>
        <RouterView v-slot="{ Component, route }">
          <component :is="Component" :key="route.matched[1]?.path ?? route.path" />
        </RouterView>
      </main>
    </div>

    <!-- Mobile sidebar overlay -->
    <aside v-if="isMobile" :class="['shell__mobile-sidebar', { 'shell__mobile-sidebar--open': mobileOpen }]">
      <NavRail :is-mobile="true" @navigate="closeMobile" />
    </aside>
  </div>
</template>

<style scoped>
/* ── Shell layout ── */
.shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-bg-primary);
}

/* ── Backdrop ── */
.shell__backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  z-index: 150;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity var(--duration-normal) var(--easing-standard);
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* ── Top bar (full width) ── */
.shell__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-bg-primary) 85%, transparent);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--color-border-subtle);
  z-index: 20;
}

.shell__topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shell__topbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

/* ── Body: sidebar + content ── */
.shell__body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── Icon rail ── */
.shell__rail {
  flex-shrink: 0;
  padding: 8px 0 8px 8px;
  z-index: 10;
}

/* ── Content ── */
.shell__content {
  position: relative;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding: 24px;
  min-width: 0;
}

/* ── Scope transition overlay ── */
.shell__scope-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: var(--color-bg-primary);
  pointer-events: none;
}

.scope-fade-enter-active {
  transition: opacity 180ms var(--easing-out);
}

.scope-fade-leave-active {
  transition: opacity 240ms var(--easing-standard);
}

.scope-fade-enter-from {
  opacity: 1;
}

.scope-fade-enter-to {
  opacity: 1;
}

.scope-fade-leave-from {
  opacity: 1;
}

.scope-fade-leave-to {
  opacity: 0;
}

/* ── Menu button (mobile) ── */
.shell__menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-m);
  border: none;
  background: transparent;
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.shell__menu-btn:hover {
  background: var(--color-surface-container);
  color: var(--color-fg-primary);
}

.shell__menu-btn .material-symbols-rounded {
  font-size: 22px;
}

/* ── Scope chip ── */
/* ── Brand in top bar ── */
.shell__brand {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  flex-shrink: 0;
}

.shell__brand-label {
  font: var(--text-body-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
  line-height: 1;
}

.shell__topbar-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border-subtle);
  flex-shrink: 0;
}

/* ── Scope pill toggle ── */
.shell__scope-pill {
  display: inline-flex;
  align-items: center;
  height: 32px;
  border-radius: var(--radius-circle);
  background: var(--color-surface-container);
  border: 1px solid var(--color-border-subtle);
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}

.shell__scope-btn {
  display: inline-flex;
  align-items: center;
  gap: 0;
  height: 26px;
  padding: 0 6px;
  border-radius: var(--radius-circle);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-fg-tertiary);
  cursor: pointer;
  font: var(--text-label-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition:
    background-color var(--duration-slow) var(--easing-expressive),
    border-color var(--duration-slow) var(--easing-expressive),
    color var(--duration-slow) var(--easing-expressive),
    padding var(--duration-slow) var(--easing-expressive),
    gap var(--duration-slow) var(--easing-expressive);
}

.shell__scope-btn--active {
  padding: 0 10px 0 7px;
  gap: 5px;
}

.shell__scope-btn--household.shell__scope-btn--active {
  background: var(--color-scope-household-bg);
  border-color: var(--color-scope-household);
  color: var(--color-scope-household-fg);
}

.shell__scope-btn--personal.shell__scope-btn--active {
  background: var(--color-scope-personal-bg);
  border-color: var(--color-scope-personal);
  color: var(--color-scope-personal-fg);
}

.shell__scope-btn:not(.shell__scope-btn--active):hover {
  background: var(--color-surface-card-hover);
  color: var(--color-fg-secondary);
}

.shell__scope-btn-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* Grid-column trick for smooth width animation */
.shell__scope-btn-label-wrap {
  display: grid;
  grid-template-columns: 0fr;
  overflow: hidden;
  transition: grid-template-columns var(--duration-slow) var(--easing-expressive);
}

.shell__scope-btn--active .shell__scope-btn-label-wrap {
  grid-template-columns: 1fr;
}

.shell__scope-btn-label {
  min-width: 0;
  line-height: 1;
  opacity: 0;
  transition: opacity var(--duration-normal) var(--easing-standard);
}

.shell__scope-btn--active .shell__scope-btn-label {
  opacity: 1;
  transition: opacity var(--duration-slow) var(--easing-expressive) 80ms;
}

/* ── Top bar icon button ── */
.shell__topbar-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-m);
  border: none;
  background: transparent;
  color: var(--color-fg-tertiary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.shell__topbar-icon-btn:hover {
  background: var(--color-surface-container);
  color: var(--color-fg-primary);
}

.shell__topbar-icon-btn .material-symbols-rounded {
  font-size: 20px;
}

/* ── Top bar avatar ── */
.shell__topbar-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  cursor: pointer;
  border-radius: var(--radius-circle);
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.shell__topbar-avatar:hover {
  background: var(--color-surface-container);
}

/* ── Account dropdown ── */
.account-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.account-menu {
  position: absolute;
  top: 44px;
  right: 0;
  width: 260px;
  background: var(--color-surface-dialog);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-16);
  z-index: 100;
  padding: var(--space-s);
  animation: menu-enter var(--duration-normal) var(--easing-out);
}

@keyframes menu-enter {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.account-menu__header {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s);
}

.account-menu__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.account-menu__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.account-menu__email {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-menu__divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: var(--space-xs) 0;
}

.account-menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  width: 100%;
  padding: var(--space-s);
  border-radius: var(--radius-m);
  border: none;
  background: transparent;
  color: var(--color-fg-secondary);
  font: var(--text-body-2);
  cursor: pointer;
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.account-menu__item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-fg-primary);
}

.account-menu__item .material-symbols-rounded {
  font-size: 18px;
}

/* ── Mobile sidebar overlay ── */
.shell__mobile-sidebar {
  position: fixed;
  left: var(--space-s);
  top: var(--space-s);
  bottom: var(--space-s);
  width: 200px;
  z-index: 200;
  transform: translateX(calc(-100% - var(--space-s)));
  transition: transform var(--duration-slow) var(--easing-smooth);
  background: var(--color-surface-nav);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.shell__mobile-sidebar :deep(.rail) {
  border-radius: 0;
}

.shell__mobile-sidebar--open {
  transform: translateX(0);
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .shell__topbar {
    height: 56px;
    padding: 0 16px;
  }

  .shell__content {
    padding: 16px;
  }
}
</style>
