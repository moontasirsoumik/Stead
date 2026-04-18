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
    :title="label"
    @click="$emit('click')"
  >
    <span class="navitem__pill" aria-hidden="true">
      <span class="navitem__icon material-symbols-rounded">{{ materialIcon }}</span>
    </span>
    <span class="navitem__label">{{ label }}</span>
  </RouterLink>
</template>

<style scoped>
.navitem {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  padding-left: 6px;
  border-radius: var(--radius-m);
  color: var(--color-nav-fg);
  text-decoration: none;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  transition: color var(--duration-fast) var(--easing-standard);
}

.navitem__pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  height: 32px;
  border-radius: var(--radius-m);
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.navitem:hover .navitem__pill {
  background: var(--color-surface-nav-hover);
}

.navitem:hover {
  color: var(--color-nav-fg-hover);
}

.navitem--active .navitem__pill {
  background: var(--color-primary-container);
}

.navitem--active {
  color: var(--color-on-primary-container);
}

.navitem--active:hover .navitem__pill {
  background: var(--color-primary-container);
}

.navitem:active {
  opacity: 0.8;
}

.navitem__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 20px;
}

.navitem__label {
  display: none;
  font: var(--text-body-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
