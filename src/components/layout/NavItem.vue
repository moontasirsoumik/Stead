<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  to: string
  icon: string
  label: string
  collapsed?: boolean
}>()

defineEmits<{
  click: []
}>()

const route = useRoute()

function isActive(): boolean {
  if (props.to === '/') return route.path === '/'
  return route.path.startsWith(props.to)
}

const materialIcon = computed(() => {
  const map: Record<string, string> = {
    dashboard: 'dashboard',
    money: 'account_balance_wallet',
    tasks: 'checklist',
    shopping: 'shopping_cart',
    inventory: 'inventory_2',
    reminders: 'schedule',
    notes: 'sticky_note_2',
    maintenance: 'handyman',
    settings: 'settings',
  }
  return map[props.icon] ?? props.icon
})
</script>

<template>
  <RouterLink
    :to="to"
    :class="['navitem', { 'navitem--active': isActive() }]"
    :aria-current="isActive() ? 'page' : undefined"
    :title="collapsed ? label : undefined"
    @click="$emit('click')"
  >
    <span class="navitem__icon material-symbols-rounded" aria-hidden="true">{{ materialIcon }}</span>
    <span class="navitem__label">{{ label }}</span>
  </RouterLink>
</template>

<style scoped>
.navitem {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  height: 44px;
  padding: 0 var(--space-m);
  border-radius: var(--radius-l);
  color: var(--color-nav-fg);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.navitem:hover {
  background: var(--color-surface-nav-hover);
  color: var(--color-nav-fg-hover);
}

.navitem--active {
  background: var(--color-surface-nav-active);
  color: var(--color-nav-fg-active);
}

.navitem--active:hover {
  background: var(--color-surface-nav-active);
}

.navitem:active {
  opacity: 0.8;
}

.navitem__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  font-size: 22px;
}

.navitem__label {
  font: var(--text-label-lg);
}

.navitem--active .navitem__label {
  font-weight: var(--font-weight-semibold);
}
</style>
