<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app.store'
import NavItem from './NavItem.vue'

const props = defineProps<{
  collapsed?: boolean
  isMobile?: boolean
}>()

defineEmits<{
  'toggle-collapse': []
  navigate: []
}>()

const appStore = useAppStore()

const expanded = ref(false)
function toggleExpand() {
  expanded.value = !expanded.value
}



// Household nav
const householdOverview = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
  { to: '/money/expenses', icon: 'money', label: 'Finances' },
] as const

const householdManage = [
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/pantry/shopping', icon: 'shopping', label: 'Pantry' },
  { to: '/reminders', icon: 'reminders', label: 'Reminders' },
] as const

const householdPlan = [
  { to: '/meals', icon: 'restaurant', label: 'Meals' },
] as const

const householdThink = [
  { to: '/notes', icon: 'notes', label: 'Notes' },
] as const

const householdReference = [
  { to: '/contacts', icon: 'contacts', label: 'Contacts' },
  { to: '/documents', icon: 'description', label: 'Documents' },
] as const

// Personal nav
const personalOverview = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/calendar', icon: 'calendar_month', label: 'Calendar' },
  { to: '/money/expenses', icon: 'money', label: 'Finances' },
] as const

const personalManage = [
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/habits', icon: 'fitness_center', label: 'Habits' },
] as const

const personalThink = [
  { to: '/notes', icon: 'notes', label: 'Notes' },
  { to: '/journal', icon: 'book', label: 'Journal' },
] as const

const personalStuff = [
  { to: '/wishlist', icon: 'favorite', label: 'Wishlist' },
  { to: '/subscriptions', icon: 'subscriptions', label: 'Subscriptions' },
] as const

// Dynamic computed nav
const overviewItems = computed(() =>
  appStore.isPersonal ? personalOverview : householdOverview,
)
const manageItems = computed(() =>
  appStore.isPersonal ? personalManage : householdManage,
)
const thinkItems = computed(() =>
  appStore.isPersonal ? personalThink : householdThink,
)
const extraItems = computed(() =>
  appStore.isPersonal ? personalStuff : [...householdPlan, ...householdReference],
)
</script>

<template>
  <div :class="['rail', { 'rail--personal': appStore.isPersonal, 'rail--expanded': expanded || props.isMobile }]">
    <!-- Brand -->
    <RouterLink to="/" class="rail__brand" title="Stead Home" @click="$emit('navigate')">
      <span class="rail__monogram">S</span>
      <span class="rail__brand-label">Stead</span>
    </RouterLink>

    <!-- Main nav -->
    <nav class="rail__nav" aria-label="Main navigation">
      <div class="rail__group">
        <span class="rail__group-label">Overview</span>
        <div class="rail__section">
          <NavItem
            v-for="item in overviewItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
            @click="$emit('navigate')"
          />
        </div>
      </div>

      <div class="rail__group">
        <span class="rail__group-label">Manage</span>
        <div class="rail__section">
          <NavItem
            v-for="item in manageItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
            @click="$emit('navigate')"
          />
        </div>
      </div>

      <div class="rail__group">
        <span class="rail__group-label">{{ appStore.isPersonal ? 'Reflect' : 'Notes' }}</span>
        <div class="rail__section">
          <NavItem
            v-for="item in thinkItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
            @click="$emit('navigate')"
          />
        </div>
      </div>

      <div v-if="extraItems.length" class="rail__group">
        <span class="rail__group-label">{{ appStore.isPersonal ? 'Stuff' : 'Reference' }}</span>
        <div class="rail__section">
          <NavItem
            v-for="item in extraItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
            @click="$emit('navigate')"
          />
        </div>
      </div>
    </nav>

    <!-- Footer: expand button + settings -->
    <div class="rail__footer">
      <button v-if="!props.isMobile" class="rail__expand-btn" :title="expanded ? 'Collapse sidebar' : 'Expand sidebar'" @click="toggleExpand">
        <span class="rail__expand-icon material-symbols-rounded">{{ expanded ? 'first_page' : 'last_page' }}</span>
        <span class="rail__expand-label">{{ expanded ? 'Collapse' : 'Expand' }}</span>
      </button>
      <NavItem to="/settings" icon="settings" label="Settings" @click="$emit('navigate')" />
    </div>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 56px;
  height: 100%;
  background: var(--color-surface-nav);
  border-radius: var(--radius-xl);
  padding: 10px 0;
  overflow: hidden;
  transition: width var(--duration-normal) var(--easing-standard);
}

/* ── Expanded state ── */
.rail--expanded {
  width: 200px;
}

/* ── Brand ── */
.rail__brand {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  height: 36px;
  flex-shrink: 0;
  text-decoration: none;
  padding: 0 12px;
  align-self: stretch;
  margin: 0 0 6px;
  overflow: hidden;
}

.rail__monogram {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  height: 32px;
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  font-weight: var(--font-weight-bold);
  font-size: 14px;
  border-radius: var(--radius-s);
}

.rail__brand-label {
  font: var(--text-body-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-nav-fg);
  white-space: nowrap;
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition: opacity var(--duration-fast) var(--easing-standard),
    width var(--duration-normal) var(--easing-standard);
}

.rail--expanded .rail__brand-label {
  width: auto;
  opacity: 1;
}

/* ── Nav ── */
.rail__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  padding: 0 6px;
  align-self: stretch;
}

.rail__nav::-webkit-scrollbar {
  display: none;
}

/* ── Group (section with label) ── */
.rail__group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rail__group-label {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-nav-fg);
  opacity: 0;
  height: 0;
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
  transition: all var(--duration-fast) var(--easing-standard);
}

.rail--expanded .rail__group-label {
  opacity: 0.4;
  height: auto;
  padding: 8px 12px 2px;
  text-align: left;
}

/* ── Section ── */
.rail__section {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1px;
}

/* ── NavItem overrides for expanded state ── */
.rail--expanded :deep(.navitem) {
  gap: var(--space-s);
}

.rail--expanded :deep(.navitem__label) {
  display: block;
}

/* ── Expand button ── */
.rail__expand-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  padding-left: 6px;
  border-radius: var(--radius-m);
  border: none;
  background: transparent;
  color: var(--color-nav-fg);
  cursor: pointer;
  flex-shrink: 0;
  opacity: 1;
  gap: var(--space-s);
  overflow: hidden;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}

.rail__expand-btn:hover {
  background: var(--color-surface-nav-hover);
  color: var(--color-nav-fg-hover);
  opacity: 1;
}

.rail__expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  height: 32px;
  font-size: 24px;
}

.rail__expand-label {
  display: none;
  font: var(--text-body-2);
  white-space: nowrap;
}

.rail--expanded .rail__expand-label {
  display: block;
}

/* ── Footer ── */
.rail__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  margin-top: auto;
  padding: 4px 6px 0;
  align-self: stretch;
}
</style>
