<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

const props = defineProps<{
  tracker: Tracker
  entries: TrackerEntry[]
}>()

const timeframe = ref<'7d' | '30d' | '90d' | 'all'>('30d')
const showMovingAvg = ref(false)

const filteredEntries = computed(() => {
  const sorted = [...props.entries]
    .filter((e) => e.numeric_value !== null)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())

  if (timeframe.value === 'all') return sorted
  const days = timeframe.value === '7d' ? 7 : timeframe.value === '30d' ? 30 : 90
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return sorted.filter((e) => new Date(e.entry_date).getTime() >= cutoff)
})

const chartData = computed(() =>
  filteredEntries.value.map((e) => ({ date: e.entry_date, value: e.numeric_value! })),
)

const movingAvgData = computed(() => {
  if (!showMovingAvg.value || chartData.value.length < 7) return []
  const window = 7
  const result: { date: string; value: number }[] = []
  for (let i = window - 1; i < chartData.value.length; i++) {
    const slice = chartData.value.slice(i - window + 1, i + 1)
    const avg = slice.reduce((s, d) => s + d.value, 0) / window
    result.push({ date: chartData.value[i].date, value: avg })
  }
  return result
})

const svgWidth = 600
const svgHeight = 220
const padding = { top: 24, right: 16, bottom: 36, left: 48 }

const chartW = svgWidth - padding.left - padding.right
const chartH = svgHeight - padding.top - padding.bottom

const yDomain = computed(() => {
  const values = chartData.value.map((d) => d.value)
  if (values.length === 0) return { min: 0, max: 1 }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.12 || 1
  return { min: min - pad, max: max + pad }
})

function xScale(index: number): number {
  const count = chartData.value.length
  if (count <= 1) return padding.left + chartW / 2
  return padding.left + (index / (count - 1)) * chartW
}

function yScale(value: number): number {
  const { min, max } = yDomain.value
  const range = max - min || 1
  return padding.top + (1 - (value - min) / range) * chartH
}

// Catmull-Rom to Cubic Bezier conversion for smooth curves
function catmullRomPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`

  let d = `M${points[0].x},${points[0].y}`
  const tension = 0.3

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

const mainPoints = computed(() =>
  chartData.value.map((d, i) => ({ x: xScale(i), y: yScale(d.value) })),
)

const linePath = computed(() => catmullRomPath(mainPoints.value))

const fillPath = computed(() => {
  if (mainPoints.value.length < 2) return ''
  const first = mainPoints.value[0]
  const last = mainPoints.value[mainPoints.value.length - 1]
  const bottom = padding.top + chartH
  return `${linePath.value} L${last.x},${bottom} L${first.x},${bottom} Z`
})

const maLinePath = computed(() => {
  if (movingAvgData.value.length < 2) return ''
  const offset = chartData.value.length - movingAvgData.value.length
  const pts = movingAvgData.value.map((d, i) => ({ x: xScale(i + offset), y: yScale(d.value) }))
  return catmullRomPath(pts)
})

const yTicks = computed(() => {
  const { min, max } = yDomain.value
  const count = 5
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => {
    const value = min + i * step
    return { value, y: yScale(value), label: formatTickValue(value) }
  })
})

function formatTickValue(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
  return v % 1 === 0 ? v.toString() : v.toFixed(1)
}

const xLabels = computed(() => {
  const data = chartData.value
  if (data.length === 0) return []
  const maxLabels = 5
  const step = Math.max(1, Math.floor(data.length / (maxLabels - 1)))
  const indices: number[] = []
  for (let i = 0; i < data.length; i += step) indices.push(i)
  if (indices[indices.length - 1] !== data.length - 1) indices.push(data.length - 1)
  return indices.map((i) => ({
    x: xScale(i),
    label: formatShortDate(data[i].date),
  }))
})

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const colorVar = computed(() => {
  if (!props.tracker.color) return '#4A5578'
  const map: Record<string, string> = {
    red: '#C94A4A', orange: '#D4783A', amber: '#B8860B',
    green: '#3B7A52', teal: '#2D8B7A', blue: '#3A6C9E',
    purple: '#7C5CBF', rose: '#C9547A', slate: '#64748B',
  }
  return map[props.tracker.color] ?? '#4A5578'
})
</script>

<template>
  <div class="chart-container">
    <!-- Header -->
    <div class="chart-header">
      <div class="chart-pills">
        <button
          v-for="tf in (['7d', '30d', '90d', 'all'] as const)"
          :key="tf"
          :class="['chart-pill', { 'chart-pill--active': timeframe === tf }]"
          @click="timeframe = tf"
        >
          {{ tf === 'all' ? 'All' : tf }}
        </button>
      </div>
      <label v-if="chartData.length >= 7" class="chart-toggle">
        <input v-model="showMovingAvg" type="checkbox" class="chart-toggle__input" />
        <span class="chart-toggle__label">7d avg</span>
      </label>
    </div>

    <!-- Empty state -->
    <div v-if="chartData.length < 2" class="chart-empty">
      <span class="chart-empty__icon material-symbols-rounded">show_chart</span>
      <p class="chart-empty__text">Need at least 2 entries to chart</p>
    </div>

    <!-- Chart SVG -->
    <svg
      v-else
      class="chart-svg"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="colorVar" stop-opacity="0.15" />
          <stop offset="100%" :stop-color="colorVar" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line
        v-for="tick in yTicks"
        :key="tick.value"
        :x1="padding.left"
        :x2="svgWidth - padding.right"
        :y1="tick.y"
        :y2="tick.y"
        class="chart-grid-line"
      />

      <!-- Y-axis labels -->
      <text
        v-for="tick in yTicks"
        :key="'yl-' + tick.value"
        :x="padding.left - 10"
        :y="tick.y + 4"
        class="chart-axis-label chart-axis-label--y"
      >{{ tick.label }}</text>

      <!-- X-axis labels -->
      <text
        v-for="xl in xLabels"
        :key="xl.label"
        :x="xl.x"
        :y="svgHeight - 8"
        class="chart-axis-label chart-axis-label--x"
      >{{ xl.label }}</text>

      <!-- Area fill -->
      <path
        :d="fillPath"
        fill="url(#chart-area-grad)"
        class="chart-area"
      />

      <!-- Main line -->
      <path
        :d="linePath"
        fill="none"
        :stroke="colorVar"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
      />

      <!-- Moving average -->
      <path
        v-if="showMovingAvg && maLinePath"
        :d="maLinePath"
        fill="none"
        stroke="var(--color-fg-muted)"
        stroke-width="1.5"
        stroke-dasharray="4 3"
        stroke-linecap="round"
        class="chart-line-ma"
      />

      <!-- Data points -->
      <circle
        v-for="(pt, i) in mainPoints"
        :key="i"
        :cx="pt.x"
        :cy="pt.y"
        r="3"
        :fill="colorVar"
        stroke="var(--color-bg-elevated)"
        stroke-width="1.5"
        class="chart-dot"
      />
    </svg>
  </div>
</template>

<style scoped>
.chart-container {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
}

/* Header with pills */
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
  margin-bottom: var(--space-l);
}

.chart-pills {
  display: flex;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-s);
  padding: 2px;
  gap: 2px;
}

.chart-pill {
  padding: var(--space-xs) var(--space-m);
  border: none;
  border-radius: calc(var(--radius-s) - 2px);
  background: transparent;
  font: var(--text-label-sm);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.chart-pill:hover {
  color: var(--color-fg-primary);
}

.chart-pill--active {
  background: var(--color-bg-elevated);
  color: var(--color-fg-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Toggle */
.chart-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

.chart-toggle__input {
  width: 14px;
  height: 14px;
  accent-color: var(--color-brand-primary);
}

.chart-toggle__label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

/* Empty state */
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2xl) var(--space-l);
  gap: var(--space-s);
}

.chart-empty__icon {
  font-size: 28px;
  color: var(--color-fg-muted);
  opacity: 0.5;
}

.chart-empty__text {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
  margin: 0;
}

/* SVG */
.chart-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 260px;
}

.chart-grid-line {
  stroke: var(--color-border-subtle);
  stroke-width: 1;
  stroke-dasharray: 2 4;
}

.chart-axis-label {
  font-size: 10px;
  fill: var(--color-fg-muted);
}

.chart-axis-label--y {
  text-anchor: end;
}

.chart-axis-label--x {
  text-anchor: middle;
}

.chart-area {
  animation: chart-fade 0.5s var(--easing-standard) 0.2s both;
}

.chart-line {
  animation: chart-draw 0.7s var(--easing-out) both;
}

.chart-line-ma {
  animation: chart-draw 0.7s var(--easing-out) 0.3s both;
}

.chart-dot {
  opacity: 0;
  animation: chart-dot-in 0.2s var(--easing-standard) both;
}

.chart-dot:nth-child(n) {
  animation-delay: calc(0.5s + var(--i, 0) * 30ms);
}

@keyframes chart-draw {
  from {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
  }
  to {
    stroke-dasharray: 2000;
    stroke-dashoffset: 0;
  }
}

@keyframes chart-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes chart-dot-in {
  from {
    opacity: 0;
    r: 0;
  }
  to {
    opacity: 1;
    r: 3;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .chart-container {
    padding: var(--space-m);
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-s);
  }
}
</style>
