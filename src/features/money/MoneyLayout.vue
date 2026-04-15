<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'expenses', label: 'Expenses', path: '/money/expenses' },
  { name: 'income', label: 'Income', path: '/money/income' },
  { name: 'bills', label: 'Bills', path: '/money/bills' },
  { name: 'budgets', label: 'Budgets', path: '/money/budgets' },
  { name: 'savings', label: 'Savings', path: '/money/savings' },
]

const activeTab = computed(() => route.name as string)
</script>

<template>
  <div class="money-layout">
    <nav class="money-tabs page-enter" :style="{ '--stagger': 0 }">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        :class="['money-tab', { 'money-tab--active': activeTab === tab.name }]"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>
    <div class="money-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.money-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.money-tabs {
  display: flex;
  gap: var(--space-2xs);
  border-bottom: 1px solid var(--color-border-subtle);
  overflow-x: auto;
  scrollbar-width: none;
}

.money-tabs::-webkit-scrollbar {
  display: none;
}

.money-tab {
  position: relative;
  padding: var(--space-s) var(--space-m);
  font: var(--text-body-1);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-secondary);
  text-decoration: none;
  white-space: nowrap;
  border-radius: var(--radius-m) var(--radius-m) 0 0;
  transition:
    color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.money-tab:hover {
  color: var(--color-fg-primary);
  background: var(--color-bg-tertiary);
}

.money-tab--active {
  color: var(--color-brand-primary);
}

.money-tab--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: var(--space-s);
  right: var(--space-s);
  height: 2px;
  background: var(--color-brand-primary);
  border-radius: 1px 1px 0 0;
}

.money-content {
  min-height: 0;
}
</style>
