<script lang="ts">
// Module-level — shared across all PantryTabs instances so pill animates across remounts
let sharedPillPosition: { width: string; transform: string } | null = null
</script>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'shopping', label: 'Shopping', path: '/pantry/shopping' },
  { name: 'inventory', label: 'Inventory', path: '/pantry/inventory' },
]

const activeTab = computed(() => route.name as string)

const tabRefs = ref<HTMLElement[]>([])
const pillStyle = ref<Record<string, string>>({})

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
    if (sharedPillPosition) {
      pillStyle.value = { ...sharedPillPosition, transition: 'none' }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updatePill(true)
        })
      })
    } else {
      updatePill(false)
    }
  })
})

watch(activeTab, () => {
  nextTick(() => updatePill(true))
})
</script>

<template>
  <nav class="pantry-tabs" aria-label="Pantry sections">
    <div class="pantry-tabs__pill" :style="pillStyle" />
    <RouterLink
      v-for="(tab, i) in tabs"
      :key="tab.name"
      :ref="(el) => { if (el) tabRefs[i] = (el as any).$el ?? el }"
      :to="tab.path"
      :class="['pantry-tab', { 'pantry-tab--active': activeTab === tab.name }]"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.pantry-tabs {
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

.pantry-tabs::-webkit-scrollbar {
  display: none;
}

.pantry-tabs__pill {
  position: absolute;
  top: var(--space-xs);
  left: 0;
  height: calc(100% - var(--space-xs) * 2);
  background: var(--color-brand-primary);
  border-radius: var(--radius-s);
  z-index: 0;
}

.pantry-tab {
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

.pantry-tab:hover {
  color: var(--color-fg-primary);
}

.pantry-tab--active {
  color: var(--color-fg-on-brand);
}

.pantry-tab--active:hover {
  color: var(--color-fg-on-brand);
}
</style>
