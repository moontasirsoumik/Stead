<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  data: number[]
  width?: number
  height?: number
  color?: string
}>(), {
  width: 80,
  height: 28,
  color: 'var(--color-brand-primary)',
})

function catmullRomToBezier(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`
  }

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

const points = computed(() => {
  if (props.data.length < 2) return []
  const values = props.data
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2

  const w = props.width - pad * 2
  const h = props.height - pad * 2
  const step = w / (values.length - 1)

  return values.map((v, i) => ({
    x: pad + i * step,
    y: pad + h - ((v - min) / range) * h,
  }))
})

const linePath = computed(() => catmullRomToBezier(points.value))

const fillPath = computed(() => {
  if (points.value.length < 2) return ''
  const pad = 2
  const bottomY = props.height - pad
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${linePath.value} L${last.x},${bottomY} L${first.x},${bottomY} Z`
})

const lastPoint = computed(() => {
  if (points.value.length < 2) return null
  return points.value[points.value.length - 1]
})
</script>

<template>
  <svg
    class="sparkline"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient :id="`spark-grad-${$.uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.2" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path
      v-if="fillPath"
      :d="fillPath"
      :fill="`url(#spark-grad-${$.uid})`"
      class="sparkline__fill"
    />
    <path
      v-if="linePath"
      :d="linePath"
      :stroke="color"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="sparkline__line"
    />
    <circle
      v-if="lastPoint"
      :cx="lastPoint.x"
      :cy="lastPoint.y"
      r="2"
      :fill="color"
      class="sparkline__dot"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  overflow: visible;
  flex-shrink: 0;
}

.sparkline__line {
  animation: spark-draw 0.5s var(--easing-standard) both;
}

.sparkline__fill {
  animation: spark-fade 0.4s var(--easing-standard) 0.2s both;
}

.sparkline__dot {
  animation: spark-dot 0.2s var(--easing-standard) 0.4s both;
}

@keyframes spark-draw {
  from {
    stroke-dasharray: 300;
    stroke-dashoffset: 300;
  }
  to {
    stroke-dasharray: 300;
    stroke-dashoffset: 0;
  }
}

@keyframes spark-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spark-dot {
  from { r: 0; opacity: 0; }
  to { r: 2; opacity: 1; }
}
</style>
