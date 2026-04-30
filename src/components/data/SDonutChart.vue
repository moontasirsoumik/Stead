<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    segments: DonutSegment[]
    size?: number
    strokeWidth?: number
    showLegend?: boolean
    centerLabel?: string
    centerValue?: string
    formatValue?: (v: number) => string
  }>(),
  {
    size: 140,
    strokeWidth: 24,
    showLegend: true,
  }
)

const mounted = ref(false)
const hoveredIndex = ref<number | null>(null)
const uid = Math.random().toString(36).slice(2, 8)

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
})

watch(() => props.segments, () => {
  mounted.value = false
  requestAnimationFrame(() => { mounted.value = true })
})

const total = computed(() => props.segments.reduce((s, seg) => s + seg.value, 0))
const isEmpty = computed(() => total.value === 0 || props.segments.length === 0)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const center = computed(() => props.size / 2)

interface ComputedArc {
  dashArray: string
  dashOffset: number
  midAngle: number
  percentage: number
  segment: DonutSegment
  index: number
}

const arcs = computed<ComputedArc[]>(() => {
  if (isEmpty.value) return []
  const result: ComputedArc[] = []
  let cumAngle = 0
  for (let i = 0; i < props.segments.length; i++) {
    const seg = props.segments[i]
    const frac = seg.value / total.value
    const segLen = frac * circumference.value
    const gap = props.segments.length > 1 ? 2 : 0
    const vis = Math.max(0, segLen - gap)
    const mid = cumAngle + (frac * 360) / 2
    result.push({
      dashArray: `${vis} ${circumference.value - vis}`,
      dashOffset: -(cumAngle / 360) * circumference.value,
      midAngle: mid,
      percentage: frac * 100,
      segment: seg,
      index: i,
    })
    cumAngle += frac * 360
  }
  return result
})

function fmt(v: number): string {
  if (props.formatValue) return props.formatValue(v)
  return (v / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Dynamic center: shows hovered segment info or default
const displayCenterValue = computed(() => {
  if (hoveredIndex.value !== null && arcs.value[hoveredIndex.value]) {
    return fmt(arcs.value[hoveredIndex.value].segment.value)
  }
  return props.centerValue ?? ''
})

const displayCenterLabel = computed(() => {
  if (hoveredIndex.value !== null && arcs.value[hoveredIndex.value]) {
    return arcs.value[hoveredIndex.value].segment.label
  }
  return props.centerLabel ?? ''
})

function hoverTranslate(arc: ComputedArc): string {
  if (hoveredIndex.value !== arc.index) return 'translate(0, 0)'
  const rad = (arc.midAngle - 90) * (Math.PI / 180)
  return `translate(${Math.cos(rad) * 4}px, ${Math.sin(rad) * 4}px)`
}
</script>

<template>
  <div class="donut" :class="{ 'donut--with-legend': showLegend && !isEmpty }">
    <div class="donut__chart-wrap">
      <svg
        :viewBox="`0 0 ${size} ${size}`"
        :width="size"
        :height="size"
        class="donut__svg"
        @mouseleave="hoveredIndex = null"
      >
        <defs>
          <!-- Subtle inner shadow for depth -->
          <filter :id="`donut-shadow-${uid}`" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.08)" />
          </filter>
          <!-- Glow for hovered arc -->
          <filter :id="`donut-glow-${uid}`" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <!-- Background track ring -->
        <circle
          :cx="center" :cy="center" :r="radius"
          fill="none" :stroke-width="strokeWidth + 2"
          class="donut__track"
        />
        <circle
          v-if="isEmpty"
          :cx="center" :cy="center" :r="radius"
          fill="none" :stroke-width="strokeWidth"
          class="donut__empty-ring"
        />
        <circle
          v-for="arc in arcs" :key="arc.index"
          :cx="center" :cy="center" :r="radius"
          fill="none" :stroke="arc.segment.color" :stroke-width="hoveredIndex === arc.index ? strokeWidth + 3 : strokeWidth"
          stroke-linecap="round"
          :stroke-dasharray="mounted ? arc.dashArray : `0 ${circumference}`"
          :stroke-dashoffset="arc.dashOffset"
          class="donut__arc"
          :class="{
            'donut__arc--hovered': hoveredIndex === arc.index,
            'donut__arc--dimmed': hoveredIndex !== null && hoveredIndex !== arc.index,
          }"
          :style="{
            transform: hoverTranslate(arc),
            transformOrigin: `${center}px ${center}px`,
            transitionDelay: mounted ? `${arc.index * 40}ms` : '0ms',
          }"
          :filter="hoveredIndex === arc.index ? `url(#donut-glow-${uid})` : undefined"
          @mouseenter="hoveredIndex = arc.index"
        />
        <!-- Center text — dynamic on hover -->
        <text
          v-if="displayCenterValue"
          :x="center"
          :y="displayCenterLabel ? center - 5 : center"
          text-anchor="middle" dominant-baseline="central"
          class="donut__center-value"
        >{{ displayCenterValue }}</text>
        <text
          v-if="displayCenterLabel"
          :x="center"
          :y="displayCenterValue ? center + 11 : center"
          text-anchor="middle" dominant-baseline="central"
          class="donut__center-label"
        >{{ displayCenterLabel }}</text>
      </svg>
    </div>

    <p v-if="isEmpty" class="donut__empty-text">No data to display</p>

    <!-- Compact inline legend -->
    <ul v-if="showLegend && !isEmpty" class="donut__legend">
      <li
        v-for="(arc, i) in arcs" :key="i"
        class="donut__legend-item"
        :class="{ 'donut__legend-item--active': hoveredIndex === i }"
        @mouseenter="hoveredIndex = i"
        @mouseleave="hoveredIndex = null"
      >
        <span class="donut__legend-dot" :style="{ background: arc.segment.color }" />
        <span class="donut__legend-label">{{ arc.segment.label }}</span>
        <span class="donut__legend-value">{{ fmt(arc.segment.value) }}</span>
        <span class="donut__legend-pct">{{ arc.percentage.toFixed(0) }}%</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.donut {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
}

/* Horizontal layout when legend is present */
.donut--with-legend {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--space-l);
}

.donut__chart-wrap {
  position: relative;
  flex-shrink: 0;
}

.donut__svg {
  display: block;
  overflow: visible;
}

/* Subtle background track behind all arcs */
.donut__track {
  stroke: var(--color-surface-container);
  opacity: 0.6;
}

.donut__empty-ring {
  stroke: var(--color-border-subtle);
  opacity: 0.4;
  stroke-dasharray: 4 3;
}

.donut__arc {
  transition:
    stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
    stroke-width 200ms var(--easing-standard),
    transform 200ms var(--easing-standard),
    opacity 150ms var(--easing-standard);
  cursor: pointer;
}

.donut__arc--hovered {
  filter: brightness(1.08) saturate(1.15);
}

.donut__arc--dimmed {
  opacity: 0.28;
}

.donut__center-value {
  font-size: 0.9375rem;
  font-weight: 700;
  font-family: var(--font-mono);
  fill: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
  transition: fill 150ms;
}

.donut__center-label {
  font-size: 0.5625rem;
  font-weight: 600;
  fill: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.donut__empty-text {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.donut__legend {
  display: flex;
  flex-direction: column;
  gap: 1px;
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  min-width: 0;
}

.donut__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px var(--space-s);
  border-radius: var(--radius-s);
  cursor: default;
  transition: background 120ms var(--easing-standard), transform 120ms var(--easing-standard);
}

.donut__legend-item:hover,
.donut__legend-item--active {
  background: var(--color-surface-container);
  transform: translateX(2px);
}

.donut__legend-dot {
  width: 9px;
  height: 9px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.12);
}

.donut__legend-label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.donut__legend-value {
  font: var(--text-caption);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-tight);
}

.donut__legend-pct {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  min-width: 2.5em;
  text-align: right;
}

@media (max-width: 480px) {
  .donut--with-legend {
    flex-direction: column;
    align-items: center;
  }
}
</style>
