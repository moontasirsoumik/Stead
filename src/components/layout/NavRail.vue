<script setup lang="ts">
import NavItem from './NavItem.vue'

defineProps<{
  expanded: boolean
}>()

defineEmits<{
  collapse: []
}>()

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/money/expenses', icon: 'money', label: 'Money' },
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/shopping', icon: 'shopping', label: 'Shopping' },
  { to: '/inventory', icon: 'inventory', label: 'Inventory' },
  { to: '/reminders', icon: 'reminders', label: 'Reminders' },
  { to: '/notes', icon: 'notes', label: 'Notes' },
  { to: '/maintenance', icon: 'maintenance', label: 'Maintenance' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
] as const
</script>

<template>
  <nav
    :class="['navrail', { 'navrail--expanded': expanded }]"
    aria-label="Main navigation"
  >
    <div class="navrail__items">
      <NavItem
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :icon="item.icon"
        :label="item.label"
        :collapsed="!expanded"
        @click="$emit('collapse')"
      />
    </div>
  </nav>
</template>

<style scoped>
.navrail {
  display: flex;
  flex-direction: column;
  width: var(--width-nav-collapsed);
  background: var(--color-surface-nav);
  border-right: 1px solid var(--color-border-subtle);
  padding: var(--space-s) 0;
  overflow: hidden;
  transition: width var(--duration-normal) var(--easing-decelerate);
}

.navrail--expanded {
  width: var(--width-nav-expanded);
}

.navrail__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: 0 var(--space-xs);
}

@media (max-width: 640px) {
  .navrail {
    display: none;
  }
}
</style>
