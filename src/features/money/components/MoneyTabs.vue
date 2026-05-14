<script lang="ts">
// Module-level — preserve scroll position across remounts
let sharedScrollLeft = 0
</script>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'money-overview', label: 'Overview', path: '/money/overview' },
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
const scrollEdge = ref<'start' | 'middle' | 'end' | 'none'>('none')

function updateScrollEdge() {
  const el = navRef.value
  if (!el) return
  const maxScroll = el.scrollWidth - el.clientWidth
  if (maxScroll <= 2) { scrollEdge.value = 'none'; return }
  if (el.scrollLeft <= 2) scrollEdge.value = 'start'
  else if (el.scrollLeft >= maxScroll - 2) scrollEdge.value = 'end'
  else scrollEdge.value = 'middle'
}

function saveScrollPosition() {
  if (navRef.value) sharedScrollLeft = navRef.value.scrollLeft
  updateScrollEdge()
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
      ? 'transform var(--duration-slow) var(--easing-smooth), width var(--duration-slow) var(--easing-smooth)'
      : 'none',
  }
}

function scrollActiveIntoView() {
  const idx = tabs.findIndex((t) => t.name === activeTab.value)
  const el = tabRefs.value[idx]
  if (!el || !navRef.value) return
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

onMounted(() => {
  nextTick(() => {
    restoreScrollPosition()
    updatePill(false)
    requestAnimationFrame(() => {
      scrollActiveIntoView()
      updateScrollEdge()
    })
  })
})

watch(activeTab, () => {
  nextTick(() => {
    updatePill(true)
    scrollActiveIntoView()
  })
})
</script>

<template>
  <nav ref="navRef" :class="['money-tabs', `money-tabs--scroll-${scrollEdge}`]" aria-label="Finances sections" @scroll="saveScrollPosition">
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

@media (max-width: 640px) {
  .money-tabs {
    width: 100%;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
    scroll-padding-inline: var(--space-xs);
  }
  /* Fade masks based on scroll position */
  .money-tabs--scroll-start {
    -webkit-mask-image: linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%);
    mask-image: linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%);
  }
  .money-tabs--scroll-middle {
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%);
  }
  /* scroll-end and scroll-none: no mask needed */
  .money-tab {
    padding: var(--space-2xs) var(--space-s);
    font: var(--text-label-md);
    scroll-snap-align: center;
  }
}
</style>
