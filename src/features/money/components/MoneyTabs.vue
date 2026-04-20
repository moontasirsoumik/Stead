<script lang="ts">
// Module-level — shared across all MoneyTabs instances so pill animates across remounts
let sharedPillPosition: { width: string; transform: string } | null = null
let sharedScrollLeft = 0
</script>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'expenses', label: 'Expenses', path: '/money/expenses' },
  { name: 'income', label: 'Income', path: '/money/income' },
  { name: 'bills', label: 'Bills', path: '/money/bills' },
  { name: 'budgets', label: 'Budgets', path: '/money/budgets' },
  { name: 'savings', label: 'Savings', path: '/money/savings' },
  { name: 'balances', label: 'Settlements', path: '/money/balances' },
]

const activeTab = computed(() => route.name as string)

const tabRefs = ref<HTMLElement[]>([])
const navRef = ref<HTMLElement | null>(null)
const pillStyle = ref<Record<string, string>>({})

function saveScrollPosition() {
  if (navRef.value) sharedScrollLeft = navRef.value.scrollLeft
}

function restoreScrollPosition() {
  if (navRef.value) navRef.value.scrollLeft = sharedScrollLeft
}

function updatePill(animate: boolean) {
  const idx = tabs.findIndex((t) => t.name === activeTab.value)
  const el = tabRefs.value[idx]
  if (!el) return
  const w = `${el.offsetWidth}px`
  const tx = `translateX(${el.offsetLeft}px)`
  pillStyle.value = {
    width: w,
    transform: tx,
    transition: animate
      ? 'transform 300ms cubic-bezier(0.4, 0, 0, 1), width 300ms cubic-bezier(0.4, 0, 0, 1)'
      : 'none',
  }
  sharedPillPosition = { width: w, transform: tx }
}

onMounted(() => {
  nextTick(() => {
    restoreScrollPosition()
    if (sharedPillPosition) {
      // Start at the previous tab's pill position (no transition)
      pillStyle.value = { ...sharedPillPosition, transition: 'none' }
      // Then animate to the current tab
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePill(true)
        })
      })
    } else {
      // First ever mount — position instantly
      updatePill(false)
    }
  })
})

watch(activeTab, () => {
  nextTick(() => updatePill(true))
})
</script>

<template>
  <nav ref="navRef" class="money-tabs" aria-label="Money sections" @scroll="saveScrollPosition">
    <div class="money-tabs__pill" :style="pillStyle" />
    <RouterLink
      v-for="(tab, i) in tabs"
      :key="tab.name"
      :ref="(el) => { if (el) tabRefs[i] = (el as any).$el ?? el }"
      :to="tab.path"
      :class="['money-tab', { 'money-tab--active': activeTab === tab.name }]"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.money-tabs {
  display: flex;
  position: relative;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--color-surface-container-low);
  border-radius: var(--radius-m);
  overflow-x: auto;
  scrollbar-width: none;
  width: fit-content;
  max-width: 100%;
  margin-bottom: var(--space-l);
}

.money-tabs::-webkit-scrollbar {
  display: none;
}

.money-tabs__pill {
  position: absolute;
  top: var(--space-xs);
  left: 0;
  height: calc(100% - var(--space-xs) * 2);
  background: var(--color-brand-primary);
  border-radius: var(--radius-s);
  z-index: 0;
}

.money-tab {
  position: relative;
  z-index: 1;
  padding: var(--space-xs) var(--space-l);
  font: var(--text-label-lg);
  color: var(--color-fg-secondary);
  text-decoration: none;
  white-space: nowrap;
  border-radius: var(--radius-s);
  display: inline-flex;
  align-items: center;
  transition: color var(--duration-fast) var(--easing-standard);
}

.money-tab:hover {
  color: var(--color-fg-primary);
  background: var(--color-surface-nav-hover);
}

.money-tab--active {
  color: var(--color-fg-on-brand);
}

.money-tab--active:hover {
  color: var(--color-fg-on-brand);
}
</style>
