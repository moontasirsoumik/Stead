import { computed, type Ref } from 'vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

export interface TrackerStats {
  count: number
  latest: number | string | boolean | null
  latestDate: string | null
  average: number | null
  min: number | null
  max: number | null
  sum: number | null
  trend: 'up' | 'down' | 'flat' | null
  trendSlope: number | null
  currentStreak: number
  longestStreak: number
  goalProgress: number | null
  movingAvg7: number | null
  movingAvg30: number | null
  rateOfChange: number | null
}

function getNumericValues(entries: TrackerEntry[]): { date: number; value: number }[] {
  return entries
    .filter((e) => e.numeric_value !== null)
    .map((e) => ({
      date: new Date(e.entry_date).getTime(),
      value: e.numeric_value!,
    }))
    .sort((a, b) => a.date - b.date)
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

function computeStreaks(entries: TrackerEntry[]): { current: number; longest: number } {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
  )

  let current = 0
  let longest = 0
  let streak = 0

  for (const entry of sorted) {
    const val = entry.boolean_value === true || (entry.numeric_value !== null && entry.numeric_value > 0)
    if (val) {
      streak++
      if (streak > longest) longest = streak
    } else {
      streak = 0
    }
  }
  current = streak

  return { current, longest }
}

function movingAverage(values: number[], window: number): number | null {
  if (values.length < window) return null
  const slice = values.slice(-window)
  return slice.reduce((s, v) => s + v, 0) / slice.length
}

export function useTrackerAnalytics(
  tracker: Ref<Tracker | null>,
  entries: Ref<TrackerEntry[]>,
) {
  const stats = computed<TrackerStats>(() => {
    const t = tracker.value
    const sorted = [...entries.value].sort(
      (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
    )

    if (!t || sorted.length === 0) {
      return {
        count: 0,
        latest: null,
        latestDate: null,
        average: null,
        min: null,
        max: null,
        sum: null,
        trend: null,
        trendSlope: null,
        currentStreak: 0,
        longestStreak: 0,
        goalProgress: null,
        movingAvg7: null,
        movingAvg30: null,
        rateOfChange: null,
      }
    }

    const count = sorted.length
    const lastEntry = sorted[sorted.length - 1]

    // Determine latest value based on type
    let latest: number | string | boolean | null = null
    if (t.value_type === 'boolean') {
      latest = lastEntry.boolean_value
    } else if (t.value_type === 'category') {
      latest = lastEntry.text_value
    } else {
      latest = lastEntry.numeric_value
    }

    // Numeric stats
    const numericData = getNumericValues(sorted)
    const numericValues = numericData.map((d) => d.value)

    let average: number | null = null
    let min: number | null = null
    let max: number | null = null
    let sum: number | null = null

    if (numericValues.length > 0) {
      sum = numericValues.reduce((s, v) => s + v, 0)
      average = sum / numericValues.length
      min = Math.min(...numericValues)
      max = Math.max(...numericValues)
    }

    // Trend (linear regression on last 30 entries)
    let trend: 'up' | 'down' | 'flat' | null = null
    let trendSlope: number | null = null

    if (numericData.length >= 3) {
      const recent = numericData.slice(-30)
      const points = recent.map((d, i) => ({ x: i, y: d.value }))
      const reg = linearRegression(points)
      trendSlope = reg.slope

      const threshold = (average ?? 1) * 0.01 // 1% of average as threshold
      if (reg.slope > threshold) trend = 'up'
      else if (reg.slope < -threshold) trend = 'down'
      else trend = 'flat'
    }

    // Streaks (for boolean/counter types)
    const { current: currentStreak, longest: longestStreak } = computeStreaks(sorted)

    // Goal progress
    let goalProgress: number | null = null
    if (t.target_value !== null && latest !== null && typeof latest === 'number') {
      if (t.target_direction === 'increase') {
        goalProgress = Math.min(100, (latest / t.target_value) * 100)
      } else if (t.target_direction === 'decrease') {
        // For decrease, progress is how far we've come from first entry toward target
        const first = numericValues[0]
        if (first !== undefined && first !== t.target_value) {
          const range = first - t.target_value
          const progress = first - latest
          goalProgress = Math.min(100, Math.max(0, (progress / range) * 100))
        }
      } else if (t.target_direction === 'maintain') {
        // Closeness to target
        const deviation = Math.abs(latest - t.target_value)
        const maxDeviation = Math.abs(t.target_value) * 0.2 || 1
        goalProgress = Math.max(0, 100 - (deviation / maxDeviation) * 100)
      }
    }

    // Moving averages
    const movingAvg7 = movingAverage(numericValues, 7)
    const movingAvg30 = movingAverage(numericValues, 30)

    // Rate of change (per week)
    let rateOfChange: number | null = null
    if (numericData.length >= 2) {
      const recent7 = numericData.filter(
        (d) => d.date >= Date.now() - 7 * 24 * 60 * 60 * 1000,
      )
      if (recent7.length >= 2) {
        const first = recent7[0]
        const last = recent7[recent7.length - 1]
        const daysDiff = (last.date - first.date) / (24 * 60 * 60 * 1000)
        if (daysDiff > 0) {
          rateOfChange = ((last.value - first.value) / daysDiff) * 7
        }
      }
    }

    return {
      count,
      latest,
      latestDate: lastEntry.entry_date,
      average,
      min,
      max,
      sum,
      trend,
      trendSlope,
      currentStreak,
      longestStreak,
      goalProgress,
      movingAvg7,
      movingAvg30,
      rateOfChange,
    }
  })

  return { stats }
}
