<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app.store'
import NavRail from './NavRail.vue'

const appStore = useAppStore()

const sidebarCollapsed = computed(() => !appStore.sidebarExpanded)
const mobileOpen = computed(() => appStore.mobileSidebarOpen)

const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 1024
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function toggleCollapse() {
  appStore.toggleSidebar()
}

function openMobile() {
  appStore.openMobileSidebar()
}

function closeMobile() {
  appStore.closeMobileSidebar()
}
</script>

<template>
  <div :class="['shell', { 'shell--collapsed': sidebarCollapsed }]">
    <Transition name="backdrop">
      <div v-if="mobileOpen" class="shell__backdrop" @click="closeMobile" />
    </Transition>

    <aside
      :class="[
        'shell__sidebar',
        { 'shell__sidebar--collapsed': sidebarCollapsed, 'shell__sidebar--mobile-open': mobileOpen },
      ]"
    >
      <NavRail
        :collapsed="sidebarCollapsed && !isMobile"
        :is-mobile="isMobile"
        @toggle-collapse="toggleCollapse"
        @navigate="closeMobile"
      />
    </aside>

    <div class="shell__main">
      <button class="shell__menu-trigger" aria-label="Open navigation" @click="openMobile">
        <span class="material-symbols-rounded">menu</span>
      </button>

      <main class="shell__content">
        <RouterView v-slot="{ Component, route }">
          <component :is="Component" :key="route.matched[1]?.path ?? route.path" />
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--color-bg-primary);
}

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

.shell__sidebar {
  position: relative;
  width: var(--width-sidebar-expanded);
  flex-shrink: 0;
  z-index: 200;
  overflow: visible;
  transition: width var(--duration-slow) var(--easing-smooth);
}

.shell__sidebar--collapsed {
  width: var(--width-sidebar-collapsed);
}

.shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

.shell__menu-trigger {
  display: none;
  position: fixed;
  top: var(--space-xl);
  left: var(--space-xl);
  z-index: 50;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-circle);
  background: var(--color-surface-container);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-8);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}

.shell__menu-trigger:hover {
  background: var(--color-surface-container-high);
  color: var(--color-fg-primary);
  box-shadow: var(--shadow-16);
}

.shell__menu-trigger:active {
  opacity: 0.7;
}

.shell__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3xl);
}

@media (max-width: 1024px) and (min-width: 641px) {
  .shell__sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--width-sidebar-expanded) !important;
    transform: translateX(-100%);
    transition: transform var(--duration-slow) var(--easing-smooth);
  }

  .shell__sidebar--mobile-open {
    transform: translateX(0);
  }

  .shell__menu-trigger {
    display: flex;
  }

  .shell__content {
    padding: var(--space-xl) var(--space-2xl);
    padding-top: calc(44px + var(--space-2xl) * 2);
  }
}

@media (max-width: 640px) {
  .shell__sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px !important;
    transform: translateX(-100%);
    transition: transform var(--duration-slow) var(--easing-smooth);
  }

  .shell__sidebar--mobile-open {
    transform: translateX(0);
  }

  .shell__menu-trigger {
    display: flex;
  }

  .shell__content {
    padding: var(--space-l);
    padding-top: calc(44px + var(--space-xl) * 2);
  }
}
</style>
