<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.store'
import NavItem from './NavItem.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import { useHouseholdStore } from '@/stores/household.store'

defineProps<{
  collapsed: boolean
  isMobile?: boolean
}>()

defineEmits<{
  'toggle-collapse': []
  navigate: []
}>()

const householdStore = useHouseholdStore()
const appStore = useAppStore()

const userName = computed(() => householdStore.currentMember?.name ?? 'User')
const householdName = computed(() => householdStore.household?.name ?? 'My Home')
const themeToggleLabel = computed(() =>
  appStore.resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
)

const overviewItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/money/expenses', icon: 'money', label: 'Money' },
] as const

const manageItems = [
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/shopping', icon: 'shopping', label: 'Shopping' },
  { to: '/inventory', icon: 'inventory', label: 'Inventory' },
  { to: '/reminders', icon: 'reminders', label: 'Reminders' },
] as const

const thinkItems = [
  { to: '/notes', icon: 'notes', label: 'Notes' },
  { to: '/maintenance', icon: 'maintenance', label: 'Maintenance' },
] as const
</script>

<template>
  <div :class="['sidebar', { 'sidebar--collapsed': collapsed }]">
    <!-- Header -->
    <div class="sidebar__header">
      <RouterLink to="/" class="sidebar__brand" @click="$emit('navigate')">
        <span class="sidebar__monogram" aria-hidden="true">S</span>
        <span class="sidebar__wordmark">Stead</span>
      </RouterLink>
    </div>

    <!-- Nav -->
    <nav class="sidebar__nav" aria-label="Main navigation">
      <div class="sidebar__section">
        <NavItem
          v-for="item in overviewItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :collapsed="collapsed"
          @click="$emit('navigate')"
        />
      </div>

      <div class="sidebar__divider" />

      <div class="sidebar__section">
        <NavItem
          v-for="item in manageItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :collapsed="collapsed"
          @click="$emit('navigate')"
        />
      </div>

      <div class="sidebar__divider" />

      <div class="sidebar__section">
        <NavItem
          v-for="item in thinkItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :collapsed="collapsed"
          @click="$emit('navigate')"
        />
      </div>
    </nav>

    <!-- Footer -->
    <div class="sidebar__footer">
      <NavItem to="/settings" icon="settings" label="Settings" :collapsed="collapsed" @click="$emit('navigate')" />

      <button
        class="sidebar__action-btn"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        @click="appStore.toggleTheme()"
      >
        <span class="sidebar__action-icon material-symbols-rounded">
          {{ appStore.resolvedTheme === 'light' ? 'dark_mode' : 'light_mode' }}
        </span>
        <span class="sidebar__action-label">
          {{ appStore.resolvedTheme === 'light' ? 'Dark mode' : 'Light mode' }}
        </span>
      </button>

      <button
        v-if="!isMobile"
        class="sidebar__action-btn"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="$emit('toggle-collapse')"
      >
        <span class="sidebar__action-icon material-symbols-rounded">
          {{ collapsed ? 'left_panel_open' : 'left_panel_close' }}
        </span>
        <span class="sidebar__action-label">Collapse</span>
      </button>

      <div class="sidebar__user">
        <SAvatar :name="userName" size="sm" />
        <div class="sidebar__user-info">
          <span class="sidebar__user-name">{{ userName }}</span>
          <span class="sidebar__user-household">{{ householdName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  position: absolute;
  inset: var(--space-m);
  background: var(--color-surface-nav);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-4);
  overflow: hidden;
}

/* ── Header ── */
.sidebar__header {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 var(--space-m);
  flex-shrink: 0;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  text-decoration: none;
  overflow: hidden;
}

.sidebar__monogram {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-weight: var(--font-weight-bold);
  font-size: 14px;
  border-radius: var(--radius-m);
  flex-shrink: 0;
}

.sidebar__wordmark {
  font: var(--text-title-3);
  font-weight: var(--font-weight-bold);
  color: var(--color-nav-fg-active);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
}

/* ── Nav ── */
.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-s);
  overflow-y: auto;
  scrollbar-width: none;
}

.sidebar__nav::-webkit-scrollbar {
  display: none;
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__divider {
  height: 1px;
  background: var(--color-nav-border);
  margin: var(--space-s) var(--space-m);
  flex-shrink: 0;
}

/* ── Footer ── */
.sidebar__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-s);
  border-top: 1px solid var(--color-nav-border);
}

.sidebar__action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  height: 44px;
  padding: 0 var(--space-m);
  border-radius: var(--radius-l);
  color: var(--color-nav-fg);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.sidebar__action-btn:hover {
  background: var(--color-surface-nav-hover);
  color: var(--color-nav-fg-hover);
}

.sidebar__action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  font-size: 22px;
}

.sidebar__action-label {
  font: var(--text-label-lg);
}

/* ── User ── */
.sidebar__user {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  height: 48px;
  padding: 0 var(--space-m);
  margin-top: var(--space-xs);
  overflow: hidden;
}

.sidebar__user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar__user-name {
  font: var(--text-label-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-nav-fg-active);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__user-household {
  font: var(--text-caption);
  color: var(--color-nav-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
