import { computed, type Ref } from 'vue'
import type { TrackerEntry } from '@/models/tracker.model'

export interface CycleAnalysis {
  intervals: number[]
  medianCycle: number | null
  stdDeviation: number | null
  nextPredicted: string | null
  confidenceWindow: number | null
  lastOccurrence: string | null
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + Math.round(days))
  return d.toISOString().slice(0, 10)
}

export function useTrackerCycles(entries: Ref<TrackerEntry[]>) {
  const cycleAnalysis = computed<CycleAnalysis>(() => {
    const sorted = [...entries.value].sort(
      (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime(),
    )

    if (sorted.length < 2) {
      return {
        intervals: [],
        medianCycle: null,
        stdDeviation: null,
        nextPredicted: null,
        confidenceWindow: null,
        lastOccurrence: null,
      }
    }

    // Find cycle start entries — entries tagged with "start" or the first entry after a gap
    // Strategy: look for entries tagged "start", or if no tags, use all entries as cycle markers
    const cycleStarts = sorted.filter((e) => {
      const tags = e.tags?.toLowerCase().split(',').map((t) => t.trim()) ?? []
      return tags.includes('start') || tags.includes('cycle_start')
    })

    // If no explicit "start" tags, treat each entry as a cycle marker
    const markers = cycleStarts.length >= 2 ? cycleStarts : sorted

    if (markers.length < 2) {
      return {
        intervals: [],
        medianCycle: null,
        stdDeviation: null,
        nextPredicted: null,
        confidenceWindow: null,
        lastOccurrence: markers[0]?.entry_date ?? null,
      }
    }

    // Compute intervals between consecutive markers (in days)
    const intervals: number[] = []
    for (let i = 1; i < markers.length; i++) {
      const prev = new Date(markers[i - 1].entry_date).getTime()
      const curr = new Date(markers[i].entry_date).getTime()
      const daysDiff = (curr - prev) / (24 * 60 * 60 * 1000)
      // Only include reasonable intervals (> 1 day, < 365 days)
      if (daysDiff > 1 && daysDiff < 365) {
        intervals.push(daysDiff)
      }
    }

    if (intervals.length === 0) {
      return {
        intervals: [],
        medianCycle: null,
        stdDeviation: null,
        nextPredicted: null,
        confidenceWindow: null,
        lastOccurrence: markers[markers.length - 1].entry_date,
      }
    }

    const medianCycle = median(intervals)
    const stdDev = standardDeviation(intervals)
    const lastOccurrence = markers[markers.length - 1].entry_date
    const nextPredicted = addDays(lastOccurrence, medianCycle)
    const confidenceWindow = Math.round(stdDev)

    return {
      intervals,
      medianCycle: Math.round(medianCycle),
      stdDeviation: Math.round(stdDev * 10) / 10,
      nextPredicted,
      confidenceWindow,
      lastOccurrence,
    }
  })

  return { cycleAnalysis }
}
