<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    color?: string
    height?: number
    showArea?: boolean
    animate?: boolean
    formatValue?: (v: number) => string
  }>(),
  {
    color: 'var(--color-brand-primary)',
    height: 48,
    showArea: true,
    animate: true,
  }
)

const mounted = ref(false)
const pathRef = ref<SVGPathElement | null>(null)
const pathLength = ref(0)
const containerRef = ref<HTMLDivElement | null>(null)
const hoveredIdx = ref<number | null>(null)

onMounted(() => {
  computePathLength()
  requestAnimationFrame(() => { mounted.value = true })
})

watch(() => props.values, () => {
  mounted.value = false
  requestAnimationFrame(() => {
    computePathLength()
    requestAnimationFrame(() => { mounted.value = true })
  })
})

function computePathLength() {
  if (pathRef.value) pathLength.value = pathRef.value.getTotalLength()
}

const isEmpty = computed(() => props.values.length < 2)

const viewBoxWidth = 200
const pad = 2

const points = computed(() => {
  if (isEmpty.value) return []
  const vals = props.values
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const h = props.height - pad * 2
  const w = viewBoxWidth - pad * 2
  const step = w / (vals.length - 1)
  return vals.map((v, i) => ({
    x: pad + i * step,
    y: pad + h - ((v - min) / range) * h,
  }))
})

function smooth(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const out: string[] = [`M ${pts[0].x},${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const t = 0.3
    out.push(`C ${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`)
  }
  return out.join(' ')
}

const linePath = computed(() => smooth(points.value))
const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  const last = points.value[points.value.length - 1]
  const first = points.value[0]
  return `${linePath.value} L ${last.x},${props.height} L ${first.x},${props.height} Z`
})

const gradientId = computed(() => `spark-${Math.random().toString(36).slice(2, 9)}`)

function fmtVal(v: number): string {
  if (props.formatValue) return props.formatValue(v)
  return (v / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function onMouseMove(e: MouseEvent) {
  if (!containerRef.value || points.value.length === 0) return
  const rect = containerRef.value.getBoundingClientRect()
  const pctX = (e.clientX - rect.left) / rect.width
  const idx = Math.round(pctX * (props.values.length - 1))
  hoveredIdx.value = Math.max(0, Math.min(idx, props.values.length - 1))
}

function onMouseLeave() { hoveredIdx.value = null }

const hoveredPoint = computed(() => {
  if (hoveredIdx.value === null || !points.value[hoveredIdx.value]) return null
  return points.value[hoveredIdx.value]
})
</script>

<template>
  <div
    ref="containerRef"
    class="sparkline"
    :style="{ height: `${height}px` }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <svg
      v-if="!isEmpty"
      :viewBox="`0 0 ${viewBoxWidth} ${height}`"
      preserveAspectRatio="none"
      class="sparkline__svg"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
          <stop offset="60%" :stop-color="color" stop-opacity="0.08" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <path
        v-if="showArea"
        :d="areaPath"
        :fill="`url(#${gradientId})`"
        class="sparkline__area"
        :class="{ 'sparkline__area--visible': mounted || !animate }"
      />

      <path
        ref="pathRef"
        :d="linePath"
        fill="none" :stroke="color" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"
        class="sparkline__line"
        :style="animate && pathLength ? {
          strokeDasharray: `${pathLength}`,
          strokeDashoffset: mounted ? '0' : `${pathLength}`,
        } : {}"
      />

      <!-- Hover crosshair + dot -->
      <template v-if="hoveredPoint && hoveredIdx !== null">
        <line
          :x1="hoveredPoint.x" y1="0"
          :x2="hoveredPoint.x" :y2="height"
          stroke="var(--color-fg-tertiary)" stroke-width="1"
          stroke-dasharray="3 3" opacity="0.4"
          vector-effect="non-scaling-stroke"
        />
        <circle
          :cx="hoveredPoint.x" :cy="hoveredPoint.y"
          r="4" :fill="color" stroke="var(--color-bg-primary)"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
      </template>
    </svg>

    <!-- Hover value tooltip -->
    <div
      v-if="hoveredIdx !== null && hoveredPoint"
      class="sparkline__tip"
      :style="{ left: `${(hoveredPoint.x / viewBoxWidth) * 100}%` }"
    >
      {{ fmtVal(values[hoveredIdx]) }}
    </div>

    <div v-if="isEmpty" class="sparkline__empty" />
  </div>
</template>

<style scoped>
.sparkline {
  width: 100%;
  position: relative;
  overflow: visible;
  cursor: crosshair;
}

.sparkline__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.sparkline__line {
  transition: stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
  vector-effect: non-scaling-stroke;
}

.sparkline__area {
  opacity: 0;
  transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sparkline__area--visible {
  opacity: 1;
}

.sparkline__tip {
  position: absolute;
  top: -24px;
  transform: translateX(-50%);
  font: var(--text-label-sm);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  padding: 2px 8px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03);
  font-weight: 600;
}

.sparkline__empty {
  width: 100%;
  height: 100%;
  background: var(--color-border-subtle);
  border-radius: var(--radius-s);
  opacity: 0.3;
}
</style>
