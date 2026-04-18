<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'
import NavRail from './NavRail.vue'
import SAvatar from '@/components/ui/SAvatar.vue'

const appStore = useAppStore()
const householdStore = useHouseholdStore()
const authStore = useAuthStore()
const router = useRouter()

const mobileOpen = computed(() => appStore.mobileSidebarOpen)

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
const scopeLabel = computed(() =>
  appStore.scope === 'personal' ? 'Personal' : 'Household',
)
const scopeIcon = computed(() =>
  appStore.scope === 'personal' ? 'person' : 'home',
)
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
        <button class="shell__scope-chip" @click="appStore.toggleScope()">
          <span class="material-symbols-rounded shell__scope-chip-icon">{{ scopeIcon }}</span>
          <span class="shell__scope-chip-label">{{ scopeLabel }}</span>
        </button>
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
  height: 48px;
  padding: 0 16px;
  flex-shrink: 0;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-default);
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
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  min-width: 0;
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
.shell__scope-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-circle);
  border: 1px solid var(--color-border-subtle);
  background: transparent;
  color: var(--color-fg-secondary);
  cursor: pointer;
  font: var(--text-label-sm);
  font-weight: var(--font-weight-medium);
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.shell__scope-chip:hover {
  background: var(--color-surface-container);
  border-color: var(--color-border-default);
  color: var(--color-fg-primary);
}

.shell__scope-chip-icon {
  font-size: 16px;
}

.shell__scope-chip-label {
  line-height: 1;
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
  background: var(--color-surface-container);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  padding: var(--space-s);
  animation: menu-enter var(--duration-fast) var(--easing-standard);
}

@keyframes menu-enter {
  from { opacity: 0; transform: translateY(-4px); }
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
  left: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  z-index: 200;
  transform: translateX(-100%);
  transition: transform var(--duration-slow) var(--easing-smooth);
  background: var(--color-surface-nav);
}

.shell__mobile-sidebar--open {
  transform: translateX(0);
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .shell__content {
    padding: 12px;
  }
}
</style>
