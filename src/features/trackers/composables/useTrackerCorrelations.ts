import { computed, type Ref } from 'vue'
import type { TrackerEntry } from '@/models/tracker.model'

export interface CorrelationResult {
  trackerId: string
  trackerName: string
  pearsonR: number
  strength: 'strong' | 'moderate' | 'weak' | 'none'
  direction: 'positive' | 'negative' | 'none'
  sampleSize: number
}

export interface AnomalyEntry {
  entryId: string
  entryDate: string
  value: number
  zScore: number
  deviation: 'high' | 'low'
}

export interface DayOfWeekAnalysis {
  day: string
  avgValue: number
  count: number
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 3) return 0

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }

  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (denom === 0) return 0

  return (n * sumXY - sumX * sumY) / denom
}

function getStrength(r: number): 'strong' | 'moderate' | 'weak' | 'none' {
  const abs = Math.abs(r)
  if (abs >= 0.7) return 'strong'
  if (abs >= 0.4) return 'moderate'
  if (abs >= 0.2) return 'weak'
  return 'none'
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function useTrackerCorrelations(
  entries: Ref<TrackerEntry[]>,
  allEntries: Ref<TrackerEntry[]>,
  allTrackers: Ref<{ id: string; name: string }[]>,
) {
  /**
   * Compute correlation between the current tracker and another tracker
   */
  function computeCorrelation(otherTrackerId: string): CorrelationResult | null {
    const otherTracker = allTrackers.value.find((t) => t.id === otherTrackerId)
    if (!otherTracker) return null

    // Build date->value maps for both trackers
    const currentMap = new Map<string, number>()
    for (const e of entries.value) {
      if (e.numeric_value !== null) {
        currentMap.set(e.entry_date, e.numeric_value)
      }
    }

    const otherMap = new Map<string, number>()
    for (const e of allEntries.value) {
      if (e.tracker_id === otherTrackerId && e.numeric_value !== null) {
        otherMap.set(e.entry_date, e.numeric_value)
      }
    }

    // Find overlapping dates
    const commonDates = [...currentMap.keys()].filter((d) => otherMap.has(d))
    if (commonDates.length < 3) return null

    const x = commonDates.map((d) => currentMap.get(d)!)
    const y = commonDates.map((d) => otherMap.get(d)!)

    const r = pearsonCorrelation(x, y)

    return {
      trackerId: otherTrackerId,
      trackerName: otherTracker.name,
      pearsonR: Math.round(r * 1000) / 1000,
      strength: getStrength(r),
      direction: r > 0.1 ? 'positive' : r < -0.1 ? 'negative' : 'none',
      sampleSize: commonDates.length,
    }
  }

  /**
   * Detect anomalies: entries with z-score > 2
   */
  const anomalies = computed<AnomalyEntry[]>(() => {
    const numericEntries = entries.value.filter((e) => e.numeric_value !== null)
    if (numericEntries.length < 5) return []

    const values = numericEntries.map((e) => e.numeric_value!)
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1),
    )

    if (stdDev === 0) return []

    return numericEntries
      .map((e) => {
        const zScore = (e.numeric_value! - mean) / stdDev
        if (Math.abs(zScore) > 2) {
          return {
            entryId: e.id,
            entryDate: e.entry_date,
            value: e.numeric_value!,
            zScore: Math.round(zScore * 100) / 100,
            deviation: zScore > 0 ? 'high' as const : 'low' as const,
          }
        }
        return null
      })
      .filter((a): a is AnomalyEntry => a !== null)
  })

  /**
   * Day-of-week pattern analysis
   */
  const dayOfWeekAnalysis = computed<DayOfWeekAnalysis[]>(() => {
    const numericEntries = entries.value.filter((e) => e.numeric_value !== null)
    if (numericEntries.length < 7) return []

    const dayBuckets: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({
      sum: 0,
      count: 0,
    }))

    for (const e of numericEntries) {
      const day = new Date(e.entry_date).getDay()
      dayBuckets[day].sum += e.numeric_value!
      dayBuckets[day].count++
    }

    return dayBuckets
      .map((bucket, i) => ({
        day: DAY_NAMES[i],
        avgValue: bucket.count > 0 ? Math.round((bucket.sum / bucket.count) * 100) / 100 : 0,
        count: bucket.count,
      }))
      .filter((d) => d.count > 0)
  })

  return { computeCorrelation, anomalies, dayOfWeekAnalysis }
}
