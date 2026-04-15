<script setup lang="ts">
import { useRoute } from 'vue-router'

const props = defineProps<{
  to: string
  icon: string
  label: string
  collapsed: boolean
}>()

defineEmits<{
  click: []
}>()

const route = useRoute()

function isActive(): boolean {
  if (props.to === '/') return route.path === '/'
  return route.path.startsWith(props.to)
}
</script>

<template>
  <RouterLink
    :to="to"
    :class="['navitem', { 'navitem--active': isActive(), 'navitem--collapsed': collapsed }]"
    :aria-current="isActive() ? 'page' : undefined"
    @click="$emit('click')"
  >
    <span class="navitem__icon" aria-hidden="true">
      <!-- Dashboard -->
      <svg v-if="icon === 'dashboard'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" />
        <rect x="11" y="2" width="7" height="4" rx="1.5" stroke="currentColor" stroke-width="1.5" />
        <rect x="2" y="11" width="7" height="4" rx="1.5" stroke="currentColor" stroke-width="1.5" />
        <rect x="11" y="8" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <!-- Money -->
      <svg v-else-if="icon === 'money'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 5V15M7 8C7 6.9 8.34 6 10 6C11.66 6 13 6.9 13 8C13 9.1 11.66 10 10 10C8.34 10 7 10.9 7 12C7 13.1 8.34 14 10 14C11.66 14 13 13.1 13 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <!-- Tasks -->
      <svg v-else-if="icon === 'tasks'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
        <path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <!-- Shopping -->
      <svg v-else-if="icon === 'shopping'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 3H5L7 13H15L17 6H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="8" cy="16" r="1" fill="currentColor" />
        <circle cx="14" cy="16" r="1" fill="currentColor" />
      </svg>
      <!-- Inventory -->
      <svg v-else-if="icon === 'inventory'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 7L10 3L17 7V13L10 17L3 13V7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M10 17V10M10 10L3 7M10 10L17 7" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <!-- Reminders -->
      <svg v-else-if="icon === 'reminders'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 6V10L13 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <!-- Notes -->
      <svg v-else-if="icon === 'notes'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 3H16V14L12 17H4V3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M12 14V17L16 14H12Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M7 7H13M7 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <!-- Maintenance -->
      <svg v-else-if="icon === 'maintenance'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M11.5 2.5L9 5L11.5 7.5L14 5L11.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M3 17L11 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="3.5" cy="16.5" r="1.5" fill="currentColor" />
      </svg>
      <!-- Settings -->
      <svg v-else-if="icon === 'settings'" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </span>

    <Transition name="label">
      <span v-if="!collapsed" class="navitem__label">{{ label }}</span>
    </Transition>
  </RouterLink>
</template>

<style scoped>
.navitem {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: 0 var(--space-l);
  height: 32px;
  border-radius: var(--radius-m);
  color: var(--color-fg-secondary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.navitem--collapsed {
  justify-content: center;
  padding: 0;
}

.navitem:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-fg-primary);
}

.navitem--active {
  background: var(--color-brand-selected);
  color: var(--color-brand-primary);
}

.navitem--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--color-brand-primary);
  border-radius: 0 2px 2px 0;
}

.navitem--active:hover {
  background: var(--color-brand-subtle);
}

.navitem__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.navitem__icon > svg {
  width: 16px;
  height: 16px;
}

.navitem__label {
  font: var(--text-body-1);
  font-weight: var(--font-weight-regular);
}

.navitem--active .navitem__label {
  font-weight: var(--font-weight-semibold);
}

/* Label transition */
.label-enter-active {
  transition: opacity var(--duration-fast) var(--easing-decelerate);
}

.label-leave-active {
  transition: opacity var(--duration-ultra-fast) var(--easing-accelerate);
}

.label-enter-from,
.label-leave-to {
  opacity: 0;
}
</style>
