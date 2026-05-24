<script setup lang="ts">
import { ref, computed } from 'vue'
import SSelect from '@/components/ui/SSelect.vue'
import SBadge from '@/components/ui/SBadge.vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'
import { useTrackerCycles, type CycleAnalysis } from '../composables/useTrackerCycles'
import { useTrackerCorrelations, type CorrelationResult, type AnomalyEntry } from '../composables/useTrackerCorrelations'

const props = defineProps<{
  tracker: Tracker
  entries: TrackerEntry[]
  allEntries: TrackerEntry[]
  allTrackers: Tracker[]
}>()

const entriesRef = computed(() => props.entries)
const allEntriesRef = computed(() => props.allEntries)
const allTrackersRef = computed(() => props.allTrackers.map((t) => ({ id: t.id, name: t.name })))

const { cycleAnalysis } = useTrackerCycles(entriesRef)
const { computeCorrelation, anomalies, dayOfWeekAnalysis } = useTrackerCorrelations(
  entriesRef,
  allEntriesRef,
  allTrackersRef,
)

const selectedCorrelationTracker = ref('')
const correlationResult = ref<CorrelationResult | null>(null)

const correlationOptions = computed(() => [
  { value: '', label: 'Select a tracker...' },
  ...props.allTrackers
    .filter((t) => t.id !== props.tracker.id && t.value_type !== 'boolean' && t.value_type !== 'category')
    .map((t) => ({ value: t.id, label: t.name })),
])

function handleCorrelationSelect(trackerId: string) {
  selectedCorrelationTracker.value = trackerId
  if (trackerId) {
    correlationResult.value = computeCorrelation(trackerId)
  } else {
    correlationResult.value = null
  }
}

function formatPrediction(analysis: CycleAnalysis): string {
  if (!analysis.nextPredicted) return ''
  const d = new Date(analysis.nextPredicted)
  const formatted = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  const confidence = analysis.confidenceWindow ? ` (±${analysis.confidenceWindow} days)` : ''
  return `${formatted}${confidence}`
}

function getCorrelationColor(r: CorrelationResult): string {
  if (r.strength === 'strong') return r.direction === 'positive' ? 'var(--color-green)' : 'var(--color-red)'
  if (r.strength === 'moderate') return 'var(--color-amber)'
  return 'var(--color-fg-tertiary)'
}

const maxDayValue = computed(() => {
  return Math.max(...dayOfWeekAnalysis.value.map((d) => d.avgValue), 1)
})
</script>

<template>
  <div class="analytics-panel">
    <!-- Cycle Prediction -->
    <div v-if="tracker.is_cyclic" class="analytics-section">
      <h3 class="analytics-section__title">
        <span class="material-symbols-rounded">cycle</span>
        Cycle Prediction
      </h3>
      <div v-if="cycleAnalysis.medianCycle" class="cycle-card">
        <div class="cycle-card__stat">
          <span class="cycle-card__label">Average cycle</span>
          <span class="cycle-card__value">{{ cycleAnalysis.medianCycle }} days</span>
        </div>
        <div class="cycle-card__stat">
          <span class="cycle-card__label">Next expected</span>
          <span class="cycle-card__value cycle-card__value--accent">{{ formatPrediction(cycleAnalysis) }}</span>
        </div>
        <div v-if="cycleAnalysis.lastOccurrence" class="cycle-card__stat">
          <span class="cycle-card__label">Last occurrence</span>
          <span class="cycle-card__value">{{ new Date(cycleAnalysis.lastOccurrence).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}</span>
        </div>
      </div>
      <p v-else class="analytics-section__empty">
        Log more entries with a "start" tag to enable cycle prediction.
      </p>
    </div>

    <!-- Correlations -->
    <div class="analytics-section">
      <h3 class="analytics-section__title">
        <span class="material-symbols-rounded">compare_arrows</span>
        Correlations
      </h3>
      <div class="correlation-picker">
        <SSelect
          :model-value="selectedCorrelationTracker"
          :options="correlationOptions"
          label="Compare with"
          @update:model-value="handleCorrelationSelect"
        />
      </div>
      <div v-if="correlationResult" class="correlation-result">
        <div class="correlation-result__r" :style="{ color: getCorrelationColor(correlationResult) }">
          r = {{ correlationResult.pearsonR }}
        </div>
        <div class="correlation-result__desc">
          <SBadge :variant="correlationResult.strength === 'none' ? 'default' : 'brand'" size="sm">
            {{ correlationResult.strength }} {{ correlationResult.direction }}
          </SBadge>
          <span class="correlation-result__samples">{{ correlationResult.sampleSize }} overlapping days</span>
        </div>
      </div>
      <p v-else-if="selectedCorrelationTracker" class="analytics-section__empty">
        Not enough overlapping data to compute correlation.
      </p>
    </div>

    <!-- Anomalies -->
    <div v-if="anomalies.length" class="analytics-section">
      <h3 class="analytics-section__title">
        <span class="material-symbols-rounded">warning</span>
        Anomalies
      </h3>
      <div class="anomaly-list">
        <div v-for="a in anomalies.slice(0, 5)" :key="a.entryId" class="anomaly-item">
          <span class="anomaly-item__date">{{ new Date(a.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}</span>
          <span class="anomaly-item__value">{{ a.value }}</span>
          <SBadge :variant="a.deviation === 'high' ? 'warning' : 'default'" size="sm">
            {{ a.deviation === 'high' ? '↑' : '↓' }} {{ Math.abs(a.zScore).toFixed(1) }}σ
          </SBadge>
        </div>
      </div>
    </div>

    <!-- Day-of-week breakdown -->
    <div v-if="dayOfWeekAnalysis.length" class="analytics-section">
      <h3 class="analytics-section__title">
        <span class="material-symbols-rounded">calendar_view_week</span>
        Day-of-Week Pattern
      </h3>
      <div class="dow-chart">
        <div v-for="day in dayOfWeekAnalysis" :key="day.day" class="dow-bar">
          <div class="dow-bar__fill" :style="{ height: `${(day.avgValue / maxDayValue) * 100}%` }" />
          <span class="dow-bar__label">{{ day.day.slice(0, 3) }}</span>
          <span class="dow-bar__value">{{ day.avgValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.analytics-section {
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
}

.analytics-section__title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
  margin: 0 0 var(--space-m) 0;
}
.analytics-section__title .material-symbols-rounded {
  font-size: 20px;
  color: var(--color-fg-secondary);
}

.analytics-section__empty {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
  margin: 0;
}

/* Cycle card */
.cycle-card {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-l);
}
.cycle-card__stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}
.cycle-card__label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}
.cycle-card__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
}
.cycle-card__value--accent {
  color: var(--color-accent);
}

/* Correlation */
.correlation-picker {
  margin-bottom: var(--space-m);
}
.correlation-result {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}
.correlation-result__r {
  font: var(--text-headline-s);
  font-weight: 600;
}
.correlation-result__desc {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}
.correlation-result__samples {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

/* Anomalies */
.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
.anomaly-item {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-xs) 0;
}
.anomaly-item__date {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  min-width: 70px;
}
.anomaly-item__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
}

/* Day-of-week chart */
.dow-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--space-s);
  height: 100px;
  padding-top: var(--space-m);
}
.dow-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  height: 100%;
  position: relative;
}
.dow-bar__fill {
  width: 100%;
  max-width: 32px;
  background: var(--color-accent-subtle);
  border-radius: var(--radius-s) var(--radius-s) 0 0;
  margin-top: auto;
  transition: height var(--duration-normal) var(--easing-standard);
}
.dow-bar__label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}
.dow-bar__value {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  position: absolute;
  top: 0;
}
</style>
