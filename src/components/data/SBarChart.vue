<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

export interface BarItem {
  label: string
  value: number
  color?: string
}

export interface BarGroup {
  label: string
  bars: { value: number; color: string; sublabel?: string }[]
}

const props = withDefaults(
  defineProps<{
    items?: BarItem[]
    groups?: BarGroup[]
    maxBars?: number
    horizontal?: boolean
    showValues?: boolean
    formatValue?: (v: number) => string
    height?: number
  }>(),
  {
    maxBars: 8,
    horizontal: true,
    showValues: true,
    height: 140,
  }
)

const mounted = ref(false)
const hoveredGroup = ref<number | null>(null)
const hoveredBar = ref<number | null>(null)

onMounted(() => { requestAnimationFrame(() => { mounted.value = true }) })
watch(() => [props.items, props.groups], () => {
  mounted.value = false
  requestAnimationFrame(() => { mounted.value = true })
})

const visibleItems = computed(() => (props.items ?? []).slice(0, props.maxBars))
const maxValue = computed(() => {
  if (props.groups?.length) {
    return Math.max(...props.groups.flatMap(g => g.bars.map(b => b.value)), 0)
  }
  return Math.max(...visibleItems.value.map(i => i.value), 0)
})
const isEmpty = computed(() => {
  if (props.groups?.length) return props.groups.every(g => g.bars.every(b => b.value === 0))
  return visibleItems.value.length === 0 || maxValue.value === 0
})

function fmt(v: number): string {
  if (props.formatValue) return props.formatValue(v)
  return (v / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function pct(value: number): number {
  return maxValue.value === 0 ? 0 : (value / maxValue.value) * 100
}
</script>

<template>
  <div class="bar" :class="{ 'bar--vertical': !horizontal }">
    <p v-if="isEmpty" class="bar__empty">No data to display</p>

    <!-- Horizontal bars (single items) -->
    <template v-if="!isEmpty && horizontal && !groups?.length">
      <div
        v-for="(item, i) in visibleItems" :key="i"
        class="bar__row"
        :class="{ 'bar__row--active': hoveredBar === i }"
        @mouseenter="hoveredBar = i"
        @mouseleave="hoveredBar = null"
      >
        <span class="bar__label" :title="item.label">{{ item.label }}</span>
        <div class="bar__track">
          <div
            class="bar__fill"
            :style="{
              width: mounted ? `${pct(item.value)}%` : '0%',
              background: item.color || 'var(--color-brand-primary)',
              transitionDelay: `${i * 35}ms`,
            }"
          />
        </div>
        <span v-if="showValues" class="bar__value">{{ fmt(item.value) }}</span>
      </div>
    </template>

    <!-- Vertical grouped bars -->
    <template v-if="!isEmpty && !horizontal && groups?.length">
      <div class="bar__grouped" :style="{ height: `${height}px` }">
        <div
          v-for="(group, gi) in groups" :key="gi"
          class="bar__group"
          :class="{ 'bar__group--active': hoveredGroup === gi }"
          @mouseenter="hoveredGroup = gi"
          @mouseleave="hoveredGroup = null"
        >
          <div class="bar__group-cols">
            <div
              v-for="(b, bi) in group.bars" :key="bi"
              class="bar__col-track"
            >
              <div
                class="bar__col-fill"
                :style="{
                  height: mounted ? `${pct(b.value)}%` : '0%',
                  background: b.color,
                  transitionDelay: `${gi * 60 + bi * 30}ms`,
                }"
              />
            </div>
          </div>
          <span class="bar__group-label">{{ group.label }}</span>
          <!-- Hover tooltip for group -->
          <div v-if="hoveredGroup === gi && group.bars.some(b => b.value > 0)" class="bar__group-tip">
            <div v-for="(b, bi) in group.bars" :key="bi" class="bar__tip-row">
              <span class="bar__tip-dot" :style="{ background: b.color }" />
              <span class="bar__tip-val">{{ fmt(b.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Vertical single bars (no groups) -->
    <template v-if="!isEmpty && !horizontal && !groups?.length">
      <div class="bar__cols" :style="{ height: `${height}px` }">
        <div
          v-for="(item, i) in visibleItems" :key="i"
          class="bar__col"
          :class="{ 'bar__col--active': hoveredBar === i }"
          @mouseenter="hoveredBar = i"
          @mouseleave="hoveredBar = null"
        >
          <span v-if="showValues && hoveredBar === i" class="bar__col-value">{{ fmt(item.value) }}</span>
          <div class="bar__col-single-track">
            <div
              class="bar__col-fill"
              :style="{
                height: mounted ? `${pct(item.value)}%` : '0%',
                background: item.color || 'var(--color-brand-primary)',
                transitionDelay: `${i * 40}ms`,
              }"
            />
          </div>
          <span class="bar__col-label" :title="item.label">{{ item.label }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bar { width: 100%; }

.bar__empty {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: center;
  padding: var(--space-l) 0;
}

/* ── Horizontal ── */
.bar__row {
  display: grid;
  grid-template-columns: minmax(50px, auto) 1fr auto;
  align-items: center;
  gap: var(--space-xs);
  min-height: 22px;
  padding: 1px 0;
}

.bar__row--active .bar__label { color: var(--color-fg-primary); }

.bar__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

.bar__track {
  height: 16px;
  background: var(--color-surface-raised);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.bar__fill {
  height: 100%;
  border-radius: var(--radius-s);
  min-width: 2px;
  transition: width 500ms var(--easing-chart);
}

.bar__row--active .bar__fill {
  filter: brightness(1.15) saturate(1.1);
}

.bar__value {
  font: var(--text-label-sm);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
  min-width: 3.5em;
  text-align: right;
}

/* ── Vertical grouped ── */
.bar__grouped {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
  position: relative;
}

.bar__group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  height: 100%;
  position: relative;
  cursor: default;
}

.bar__group-cols {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
}

.bar__col-track, .bar__col-single-track {
  flex: 1;
  height: 100%;
  background: var(--color-surface-raised);
  border-radius: var(--radius-s) var(--radius-s) 0 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.bar__col-fill {
  width: 100%;
  border-radius: var(--radius-s) var(--radius-s) 0 0;
  min-height: 1px;
  transition: height 500ms var(--easing-chart);
}

.bar__group--active .bar__col-fill {
  filter: brightness(1.12) saturate(1.05);
}

.bar__group-label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-align: center;
  white-space: nowrap;
}

/* Hover tooltip */
.bar__group-tip {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: var(--shadow-md);
}

.bar__tip-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar__tip-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

.bar__tip-val {
  font: var(--text-label-sm);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
}

/* ── Vertical single ── */
.bar__cols {
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
  width: 100%;
}

.bar__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  height: 100%;
  position: relative;
  cursor: default;
}

.bar__col--active .bar__col-fill {
  filter: brightness(1.12) saturate(1.05);
}

.bar__col-value {
  position: absolute;
  top: -18px;
  font: var(--text-label-sm);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  white-space: nowrap;
}

.bar__col-label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>
