<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.store'

const route = useRoute()
const appStore = useAppStore()

const householdItems = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/money/expenses', icon: 'account_balance_wallet', label: 'Money' },
  { to: '/tasks', icon: 'checklist', label: 'Tasks' },
  { to: '/pantry/shopping', icon: 'shopping_cart', label: 'Pantry' },
  { to: '/notes', icon: 'sticky_note_2', label: 'Notes' },
] as const

const personalItems = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/money/expenses', icon: 'account_balance_wallet', label: 'Money' },
  { to: '/tasks', icon: 'checklist', label: 'Tasks' },
  { to: '/habits', icon: 'fitness_center', label: 'Habits' },
  { to: '/wishlist', icon: 'favorite', label: 'Wishlist' },
] as const

const items = computed(() =>
  appStore.isPersonal ? personalItems : householdItems,
)

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
      <span class="mobilenav__pill">
        <span class="material-symbols-rounded">{{ item.icon }}</span>
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
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  height: calc(var(--height-mobile-nav) + env(safe-area-inset-bottom));
  padding: var(--space-s) var(--space-s) calc(var(--space-s) + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--color-surface-card) 88%, transparent);
  border-top: 1px solid var(--color-border-default);
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

@supports (backdrop-filter: blur(1px)) {
  .mobilenav {
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
  }
}

.mobilenav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-xs) 0;
  color: var(--color-fg-tertiary);
  text-decoration: none;
  transition:
    color var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
  -webkit-tap-highlight-color: transparent;
}

.mobilenav__item--active {
  color: var(--color-on-primary-container);
}

.mobilenav__pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 32px;
  border-radius: var(--radius-circle);
  transition:
    background-color var(--duration-normal) var(--easing-decelerate),
    transform var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.mobilenav__item--active .mobilenav__pill {
  background: var(--color-primary-container);
}

.mobilenav__item:active {
  opacity: 0.7;
}

.mobilenav__label {
  font: var(--text-label-sm);
  line-height: 1;
}

.mobilenav__item--active .mobilenav__label {
  font-weight: var(--font-weight-semibold);
}
</style>
