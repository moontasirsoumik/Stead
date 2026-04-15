<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/money/expenses', icon: 'money', label: 'Money' },
  { to: '/tasks', icon: 'tasks', label: 'Tasks' },
  { to: '/shopping', icon: 'shopping', label: 'Shopping' },
  { to: '/notes', icon: 'notes', label: 'Notes' },
] as const

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="mobilenav" aria-label="Mobile navigation">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="['mobilenav__item', { 'mobilenav__item--active': isActive(item.to) }]"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <span class="mobilenav__icon" aria-hidden="true">
        <!-- Reuse same SVG icons as NavItem -->
        <svg v-if="item.icon === 'dashboard'" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <rect x="11" y="2" width="7" height="4" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <rect x="2" y="11" width="7" height="4" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <rect x="11" y="8" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <svg v-else-if="item.icon === 'money'" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" />
          <path d="M10 5V15M7 8C7 6.9 8.34 6 10 6C11.66 6 13 6.9 13 8C13 9.1 11.66 10 10 10C8.34 10 7 10.9 7 12C7 13.1 8.34 14 10 14C11.66 14 13 13.1 13 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <svg v-else-if="item.icon === 'tasks'" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
          <path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="item.icon === 'shopping'" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 3H5L7 13H15L17 6H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="8" cy="16" r="1" fill="currentColor" />
          <circle cx="14" cy="16" r="1" fill="currentColor" />
        </svg>
        <svg v-else-if="item.icon === 'notes'" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 3H16V14L12 17H4V3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M12 14V17L16 14H12Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M7 7H13M7 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </span>
      <span class="mobilenav__label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.mobilenav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--height-mobile-nav);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-subtle);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.mobilenav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-m);
  color: var(--color-fg-tertiary);
  text-decoration: none;
  border-radius: var(--radius-m);
  position: relative;
  transition: color var(--duration-fast) var(--easing-standard);
}

.mobilenav__item--active {
  color: var(--color-brand-primary);
}

.mobilenav__item--active::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  background: var(--color-brand-primary);
  border-radius: 2px;
}

.mobilenav__icon {
  display: flex;
}

.mobilenav__icon > svg {
  width: 18px;
  height: 18px;
}

.mobilenav__label {
  font: var(--text-caption);
}

.mobilenav__item--active .mobilenav__label {
  font-weight: var(--font-weight-semibold);
}
</style>
