<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps<{
  tabs: { id: string; label: string }[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabRefs = ref<HTMLElement[]>([])
const pillStyle = ref<Record<string, string>>({})

function updatePill(animate: boolean) {
  const idx = props.tabs.findIndex((t) => t.id === props.modelValue)
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
}

function selectTab(id: string) {
  emit('update:modelValue', id)
}

onMounted(() => {
  nextTick(() => updatePill(false))
})

watch(() => props.modelValue, () => {
  nextTick(() => updatePill(true))
})
</script>

<template>
  <nav class="settings-tabs" aria-label="Settings sections">
    <div class="settings-tabs__pill" :style="pillStyle" />
    <button
      v-for="(tab, i) in tabs"
      :key="tab.id"
      :ref="(el) => { if (el) tabRefs[i] = el as HTMLElement }"
      :class="['settings-tab', { 'settings-tab--active': modelValue === tab.id }]"
      type="button"
      @click="selectTab(tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<style scoped>
.settings-tabs {
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

.settings-tabs::-webkit-scrollbar {
  display: none;
}

.settings-tabs__pill {
  position: absolute;
  top: var(--space-xs);
  left: 0;
  height: calc(100% - var(--space-xs) * 2);
  background: var(--color-brand-primary);
  border-radius: var(--radius-s);
  z-index: 0;
}

.settings-tab {
  position: relative;
  z-index: 1;
  padding: var(--space-xs) var(--space-l);
  font: var(--text-label-lg);
  color: var(--color-fg-secondary);
  background: none;
  border: none;
  white-space: nowrap;
  border-radius: var(--radius-s);
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: color var(--duration-fast) var(--easing-standard);
}

.settings-tab:hover {
  color: var(--color-fg-primary);
  background: var(--color-surface-nav-hover);
}

.settings-tab--active {
  color: var(--color-fg-on-brand);
}

.settings-tab--active:hover {
  color: var(--color-fg-on-brand);
}
</style>
