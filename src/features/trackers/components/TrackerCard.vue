<script setup lang="ts">
import { computed } from 'vue'
import SparklineSvg from './SparklineSvg.vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

const props = defineProps<{
  tracker: Tracker
  entries: TrackerEntry[]
}>()

defineEmits<{
  click: []
  quickLog: [e: Event]
}>()

const sortedEntries = computed(() =>
  [...props.entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
  ),
)

const latestEntry = computed(() => sortedEntries.value[0] ?? null)

const latestValue = computed((): string => {
  if (!latestEntry.value) return '—'
  const entry = latestEntry.value
  if (props.tracker.value_type === 'boolean') return entry.boolean_value ? '✓' : '✗'
  if (props.tracker.value_type === 'category') return entry.text_value ?? '—'
  if (entry.numeric_value !== null) {
    const val = props.tracker.value_type === 'duration'
      ? formatDuration(entry.numeric_value)
      : formatNumber(entry.numeric_value)
    return props.tracker.unit ? `${val} ${props.tracker.unit}` : val
  }
  return '—'
})

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatNumber(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1)
}

const sparklineData = computed((): number[] => {
  return [...props.entries]
    .filter((e) => e.numeric_value !== null)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
    .slice(-14)
    .map((e) => e.numeric_value!)
})

const trend = computed((): 'up' | 'down' | 'flat' | null => {
  const data = sparklineData.value
  if (data.length < 3) return null
  const recent = data.slice(-5)
  const mid = Math.floor(recent.length / 2)
  const avg1 = recent.slice(0, mid).reduce((s, v) => s + v, 0) / mid
  const avg2 = recent.slice(mid).reduce((s, v) => s + v, 0) / (recent.length - mid)
  const diff = avg2 - avg1
  const threshold = Math.abs(avg1) * 0.05 || 0.1
  if (diff > threshold) return 'up'
  if (diff < -threshold) return 'down'
  return 'flat'
})

const colorValue = computed((): string => {
  if (!props.tracker.color) return 'var(--color-brand-primary)'
  const map: Record<string, string> = {
    red: '#C94A4A', orange: '#D4783A', amber: '#B8860B',
    green: '#3B7A52', teal: '#2D8B7A', blue: '#3A6C9E',
    purple: '#7C5CBF', rose: '#C9547A', slate: '#64748B',
  }
  return map[props.tracker.color] ?? 'var(--color-brand-primary)'
})

// Cyclic tracker logic
const cycleInfo = computed(() => {
  if (!props.tracker.is_cyclic) return null
  const sorted = [...props.entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
  )
  // Find cycle starts: first TRUE after FALSE entries (period onset)
  const starts: typeof sorted = []
  let lastWasTrue = false
  for (const entry of sorted) {
    const isActive = entry.boolean_value === true
    if (isActive && !lastWasTrue) {
      starts.push(entry)
    }
    lastWasTrue = isActive
  }
  if (starts.length < 1) return null

  const lastStart = starts[starts.length - 1]
  const lastStartDate = new Date(lastStart.entry_date)
  const today = new Date()
  const dayInCycle = Math.floor((today.getTime() - lastStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1

  // Estimate average cycle length from multiple starts
  let avgLength = 28 // default
  if (starts.length >= 2) {
    const lengths: number[] = []
    for (let i = 1; i < starts.length; i++) {
      const diff = (new Date(starts[i].entry_date).getTime() - new Date(starts[i - 1].entry_date).getTime()) / (24 * 60 * 60 * 1000)
      if (diff > 10 && diff < 60) lengths.push(diff)
    }
    if (lengths.length > 0) avgLength = Math.round(lengths.reduce((s, v) => s + v, 0) / lengths.length)
  }

  const nextDate = new Date(lastStartDate.getTime() + avgLength * 24 * 60 * 60 * 1000)
  const progress = Math.min(dayInCycle / avgLength, 1)

  return { dayInCycle, avgLength, nextDate, progress }
})

function formatNextDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// SVG arc for cycle ring
function describeArc(progress: number): string {
  const cx = 24, cy = 24, r = 20
  const startAngle = -90
  const endAngle = startAngle + progress * 360
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = progress > 0.5 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
</script>

<template>
  <div class="tracker-card" @click="$emit('click')">
    <!-- Accent dot -->
    <span class="tracker-card__dot" :style="{ background: colorValue }" />

    <div class="tracker-card__content">
      <!-- Top row: icon + name + quick log -->
      <div class="tracker-card__top">
        <div class="tracker-card__identity">
          <span v-if="tracker.icon" class="tracker-card__icon material-symbols-rounded">{{ tracker.icon }}</span>
          <span class="tracker-card__name">{{ tracker.name }}</span>
        </div>
        <button class="tracker-card__action" title="Quick log" @click.stop="$emit('quickLog', $event)">
          <span class="material-symbols-rounded">add</span>
        </button>
      </div>

      <!-- Cyclic: cycle ring visualization -->
      <div v-if="cycleInfo" class="tracker-card__cycle">
        <svg class="tracker-card__ring" width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" :stroke="colorValue" stroke-opacity="0.12" stroke-width="3" />
          <path :d="describeArc(cycleInfo.progress)" fill="none" :stroke="colorValue" stroke-width="3" stroke-linecap="round" />
        </svg>
        <div class="tracker-card__cycle-info">
          <span class="tracker-card__cycle-day">Day {{ cycleInfo.dayInCycle }}<span class="tracker-card__cycle-total"> / ~{{ cycleInfo.avgLength }}</span></span>
          <span class="tracker-card__cycle-next">Next: {{ formatNextDate(cycleInfo.nextDate) }}</span>
        </div>
      </div>

      <!-- Standard: value + sparkline -->
      <div v-else class="tracker-card__main">
        <div class="tracker-card__value-block">
          <span class="tracker-card__value">{{ latestValue }}</span>
          <span v-if="trend" :class="['tracker-card__trend', `tracker-card__trend--${trend}`]">
            <span class="material-symbols-rounded">{{ trend === 'up' ? 'north_east' : trend === 'down' ? 'south_east' : 'east' }}</span>
          </span>
        </div>
        <SparklineSvg
          v-if="sparklineData.length >= 2"
          :data="sparklineData"
          :color="colorValue"
          :width="72"
          :height="24"
        />
      </div>

      <!-- Entry count badge -->
      <span class="tracker-card__meta">{{ entries.length }} entries</span>
    </div>
  </div>
</template>

<style scoped>
.tracker-card {
  position: relative;
  display: flex;
  align-items: stretch;
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-m) var(--space-l);
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition:
    background var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-normal) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
  overflow: hidden;
}

.tracker-card:hover {
  background: var(--color-surface-card-hover);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}

.tracker-card:active {
  transform: scale(0.98);
  transition-duration: var(--duration-fast);
}

.tracker-card__dot {
  position: absolute;
  top: var(--space-m);
  left: var(--space-s);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tracker-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-left: var(--space-s);
}

.tracker-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.tracker-card__identity {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
}

.tracker-card__icon {
  font-size: 16px;
  color: var(--color-fg-secondary);
  flex-shrink: 0;
}

.tracker-card__name {
  font: var(--text-label-md);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tracker-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-fg-tertiary);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.tracker-card__action .material-symbols-rounded {
  font-size: 18px;
}

.tracker-card__action:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-brand-primary);
}

/* Standard value block */
.tracker-card__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.tracker-card__value-block {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  min-width: 0;
}

.tracker-card__value {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tracker-card__trend {
  display: flex;
  align-items: center;
}

.tracker-card__trend .material-symbols-rounded {
  font-size: 14px;
}

.tracker-card__trend--up { color: var(--color-success); }
.tracker-card__trend--down { color: var(--color-error); }
.tracker-card__trend--flat { color: var(--color-fg-muted); }

/* Cycle visualization */
.tracker-card__cycle {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}

.tracker-card__ring {
  flex-shrink: 0;
}

.tracker-card__cycle-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.tracker-card__cycle-day {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
}

.tracker-card__cycle-total {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
}

.tracker-card__cycle-next {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

/* Meta */
.tracker-card__meta {
  font: var(--text-caption);
  color: var(--color-fg-muted);
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .tracker-card {
    padding: var(--space-s) var(--space-m);
  }
}
</style>
