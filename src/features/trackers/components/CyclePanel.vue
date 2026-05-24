<script setup lang="ts">
import { computed } from 'vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

const props = defineProps<{
  tracker: Tracker
  entries: TrackerEntry[]
}>()

const cycleAnalysis = computed(() => {
  const sorted = [...props.entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
  )
  if (sorted.length < 2) return null

  const starts: TrackerEntry[] = []
  let lastWasTrue = false
  for (const entry of sorted) {
    const isActive = entry.boolean_value === true
    if (isActive && !lastWasTrue) starts.push(entry)
    lastWasTrue = isActive
  }

  const cycleLengths: number[] = []
  for (let i = 1; i < starts.length; i++) {
    const diff = (new Date(starts[i].entry_date).getTime() - new Date(starts[i - 1].entry_date).getTime()) / (24 * 60 * 60 * 1000)
    if (diff > 15 && diff < 60) cycleLengths.push(Math.round(diff))
  }

  const periodLengths: number[] = []
  let currentPeriod = 0
  for (const entry of sorted) {
    if (entry.boolean_value === true) {
      currentPeriod++
    } else {
      if (currentPeriod > 0) periodLengths.push(currentPeriod)
      currentPeriod = 0
    }
  }
  if (currentPeriod > 0) periodLengths.push(currentPeriod)

  const avgCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((s, v) => s + v, 0) / cycleLengths.length)
    : 28

  const avgPeriodLength = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((s, v) => s + v, 0) / periodLengths.length)
    : 5

  const lastStart = starts[starts.length - 1]
  const lastStartDate = lastStart ? new Date(lastStart.entry_date) : null
  const today = new Date()
  const dayInCycle = lastStartDate
    ? Math.floor((today.getTime() - lastStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
    : null

  let phase: 'period' | 'follicular' | 'ovulation' | 'luteal' = 'follicular'
  if (dayInCycle !== null) {
    if (dayInCycle <= avgPeriodLength) phase = 'period'
    else if (dayInCycle <= avgCycleLength * 0.35) phase = 'follicular'
    else if (dayInCycle <= avgCycleLength * 0.45) phase = 'ovulation'
    else phase = 'luteal'
  }

  const nextPeriodDate = lastStartDate
    ? new Date(lastStartDate.getTime() + avgCycleLength * 24 * 60 * 60 * 1000)
    : null

  const daysUntilNext = nextPeriodDate
    ? Math.max(0, Math.ceil((nextPeriodDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
    : null

  return {
    avgCycleLength,
    avgPeriodLength,
    dayInCycle,
    phase,
    nextPeriodDate,
    daysUntilNext,
    cycleLengths,
    cycleCount: starts.length,
    lastStartDate,
  }
})

const ringProgress = computed(() => {
  if (!cycleAnalysis.value || !cycleAnalysis.value.dayInCycle) return 0
  return Math.min(cycleAnalysis.value.dayInCycle / cycleAnalysis.value.avgCycleLength, 1)
})

function describeArc(progress: number, radius: number = 34): string {
  const cx = 40, cy = 40
  const startAngle = -90
  const endAngle = startAngle + progress * 360
  if (progress >= 1) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`
  }
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArc = progress > 0.5 ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const phaseConfig = computed(() => {
  const phase = cycleAnalysis.value?.phase
  switch (phase) {
    case 'period': return { color: 'var(--color-error)', bg: 'var(--color-error-bg)', label: 'Period', icon: 'water_drop' }
    case 'follicular': return { color: 'var(--color-success)', bg: 'var(--color-success-bg)', label: 'Follicular', icon: 'spa' }
    case 'ovulation': return { color: 'var(--color-info)', bg: 'var(--color-info-bg)', label: 'Ovulation', icon: 'egg_alt' }
    case 'luteal': return { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', label: 'Luteal', icon: 'dark_mode' }
    default: return { color: 'var(--color-fg-muted)', bg: 'var(--color-bg-secondary)', label: '—', icon: 'circle' }
  }
})

const recentCycles = computed(() => {
  if (!cycleAnalysis.value || cycleAnalysis.value.cycleLengths.length === 0) return []
  const lengths = cycleAnalysis.value.cycleLengths.slice(-8)
  const avg = cycleAnalysis.value.avgCycleLength
  return lengths.map((len, i) => ({
    length: len,
    deviation: len - avg,
    index: i,
  }))
})

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatPrediction(days: number | null): string {
  if (days === null) return '—'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days}d`
}
</script>

<template>
  <div class="cp">
    <template v-if="!cycleAnalysis">
      <div class="cp__empty">
        <span class="cp__empty-icon material-symbols-rounded">cycle</span>
        <p class="cp__empty-msg">Not enough data for cycle analysis</p>
        <p class="cp__empty-sub">Log at least 2 cycles to see predictions</p>
      </div>
    </template>

    <template v-else>
      <!-- Primary: ring + phase + prediction in one compact row -->
      <div class="cp__primary">
        <div class="cp__ring-wrap">
          <svg class="cp__ring" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border-subtle)" stroke-width="5" />
            <path
              :d="describeArc(cycleAnalysis.avgPeriodLength / cycleAnalysis.avgCycleLength)"
              fill="none"
              :stroke="phaseConfig.color"
              stroke-opacity="0.12"
              stroke-width="5"
              stroke-linecap="round"
            />
            <path
              :d="describeArc(ringProgress)"
              fill="none"
              :stroke="phaseConfig.color"
              stroke-width="5"
              stroke-linecap="round"
              class="cp__arc"
            />
          </svg>
          <div class="cp__ring-center">
            <span class="cp__day">{{ cycleAnalysis.dayInCycle }}</span>
            <span class="cp__day-of">/{{ cycleAnalysis.avgCycleLength }}</span>
          </div>
        </div>

        <div class="cp__meta">
          <div class="cp__phase" :style="{ '--pc': phaseConfig.color, '--pb': phaseConfig.bg }">
            <span class="material-symbols-rounded cp__phase-icon">{{ phaseConfig.icon }}</span>
            <span class="cp__phase-label">{{ phaseConfig.label }}</span>
          </div>
          <div class="cp__next">
            <span class="cp__next-label">Next period</span>
            <span class="cp__next-value">{{ formatPrediction(cycleAnalysis.daysUntilNext) }}</span>
            <span v-if="cycleAnalysis.nextPeriodDate && (cycleAnalysis.daysUntilNext ?? 0) > 1" class="cp__next-date">{{ formatDate(cycleAnalysis.nextPeriodDate) }}</span>
          </div>
        </div>

        <div class="cp__stats">
          <div class="cp__stat">
            <span class="cp__stat-val">{{ cycleAnalysis.avgCycleLength }}</span>
            <span class="cp__stat-lbl">cycle</span>
          </div>
          <div class="cp__stat">
            <span class="cp__stat-val">{{ cycleAnalysis.avgPeriodLength }}</span>
            <span class="cp__stat-lbl">period</span>
          </div>
          <div class="cp__stat">
            <span class="cp__stat-val">{{ cycleAnalysis.cycleCount }}</span>
            <span class="cp__stat-lbl">tracked</span>
          </div>
        </div>
      </div>

      <!-- Cycle deviation chart -->
      <div v-if="recentCycles.length >= 2" class="cp__history">
        <div class="cp__hist-header">
          <span class="cp__hist-title">Cycle lengths</span>
          <span class="cp__hist-avg">avg {{ cycleAnalysis.avgCycleLength }}d</span>
        </div>
        <div class="cp__hist-chart">
          <div class="cp__hist-baseline" />
          <div
            v-for="cycle in recentCycles"
            :key="cycle.index"
            class="cp__hist-col"
          >
            <div
              class="cp__hist-bar"
              :class="{
                'cp__hist-bar--over': cycle.deviation > 0,
                'cp__hist-bar--under': cycle.deviation < 0,
                'cp__hist-bar--neutral': cycle.deviation === 0,
              }"
              :style="{ height: `${Math.max(Math.abs(cycle.deviation) * 3, 3)}px` }"
            />
            <span class="cp__hist-val">{{ cycle.length }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cp {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
}

.cp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-l) var(--space-m);
  gap: var(--space-2xs);
}
.cp__empty-icon { font-size: 28px; color: var(--color-fg-muted); opacity: 0.5; }
.cp__empty-msg { font: var(--text-body-2); color: var(--color-fg-secondary); margin: 0; }
.cp__empty-sub { font: var(--text-caption); color: var(--color-fg-muted); margin: 0; }

/* === Primary row === */
.cp__primary {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: var(--space-l);
  align-items: center;
}

/* Ring */
.cp__ring-wrap {
  position: relative;
  width: 80px;
  height: 80px;
}
.cp__ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.cp__day {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-fg-primary);
  line-height: 1;
  letter-spacing: -0.02em;
}
.cp__day-of {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-muted);
  line-height: 1;
}
.cp__arc {
  animation: arc-in 0.6s var(--easing-expressive) both;
}
@keyframes arc-in {
  from { stroke-dasharray: 220; stroke-dashoffset: 220; }
  to { stroke-dasharray: 220; stroke-dashoffset: 0; }
}

/* Meta: phase + prediction */
.cp__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}
.cp__phase {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--pc);
  background: var(--pb);
  padding: 3px 10px;
  border-radius: 20px;
  width: fit-content;
}
.cp__phase-icon { font-size: 13px; }
.cp__next {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  flex-wrap: wrap;
}
.cp__next-label {
  font-size: 12px;
  color: var(--color-fg-tertiary);
}
.cp__next-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-fg-primary);
}
.cp__next-date {
  font-size: 11px;
  color: var(--color-fg-muted);
}

/* Stats */
.cp__stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: var(--space-m);
  border-left: 1px solid var(--color-border-subtle);
}
.cp__stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.cp__stat-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-fg-primary);
  font-variant-numeric: tabular-nums;
}
.cp__stat-lbl {
  font-size: 11px;
  color: var(--color-fg-muted);
}

/* === History chart === */
.cp__history {
  margin-top: var(--space-m);
  padding-top: var(--space-m);
  border-top: 1px solid var(--color-border-subtle);
}
.cp__hist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}
.cp__hist-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-fg-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cp__hist-avg {
  font-size: 11px;
  color: var(--color-fg-muted);
  font-variant-numeric: tabular-nums;
}
.cp__hist-chart {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 48px;
  padding: 0 2px;
}
.cp__hist-baseline {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--color-border-default);
  opacity: 0.6;
}
.cp__hist-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: center;
  position: relative;
}
.cp__hist-bar {
  width: 100%;
  max-width: 16px;
  border-radius: 2px;
  transition: height 0.4s var(--easing-expressive);
}
.cp__hist-bar--over { background: var(--color-warning); opacity: 0.55; }
.cp__hist-bar--under { background: var(--color-info); opacity: 0.55; }
.cp__hist-bar--neutral { background: var(--color-fg-muted); opacity: 0.25; }
.cp__hist-val {
  font-size: 9px;
  font-weight: 600;
  color: var(--color-fg-tertiary);
  font-variant-numeric: tabular-nums;
  position: absolute;
  bottom: 2px;
}

/* === Mobile === */
@media (max-width: 640px) {
  .cp { padding: var(--space-m); }
  .cp__primary {
    grid-template-columns: 72px 1fr;
    gap: var(--space-m);
  }
  .cp__ring-wrap { width: 72px; height: 72px; }
  .cp__ring { width: 72px; height: 72px; }
  .cp__day { font-size: 18px; }
  .cp__stats {
    grid-column: 1 / -1;
    flex-direction: row;
    gap: var(--space-l);
    padding-left: 0;
    padding-top: var(--space-s);
    border-left: none;
    border-top: 1px solid var(--color-border-subtle);
    justify-content: space-around;
  }
}
</style>
