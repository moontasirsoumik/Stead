<script setup lang="ts">
/**
 * SteadLogo — Top-down view of the folded origami house diamond.
 * 9 paper pieces stacked flat, viewed from directly above.
 * All pieces fold onto the floor (100×80), creating a layered diamond.
 *
 * Props:
 *  - size: pixel size for the container (default 32)
 *  - animated: add a subtle hover lift (default false)
 */
defineProps<{
  size?: number
  animated?: boolean
  outline?: boolean
}>()
</script>

<template>
  <div
    :class="['stead-logo', { 'stead-logo--animated': animated }]"
    :style="{ width: size + 'px', height: size + 'px' }"
    aria-label="Stead logo"
    role="img"
  >
    <!-- Outline variant: stroke-only diamond + fold lines, uses currentColor -->
    <svg v-if="outline" viewBox="47 52 116 92" class="stead-logo__svg stead-logo__svg--outline">
      <!-- Outer diamond silhouette -->
      <polygon points="55,98 105,58 155,98 105,138" class="outline-shape" />
      <!-- Horizontal fold lines (roof creases) -->
      <line x1="55" y1="61" x2="155" y2="61" class="outline-fold" />
      <line x1="55" y1="135" x2="155" y2="135" class="outline-fold" />
      <!-- Vertical fold lines (wall creases) -->
      <line x1="55" y1="98" x2="105" y2="58" class="outline-fold" />
      <line x1="105" y1="58" x2="155" y2="98" class="outline-fold" />
      <line x1="55" y1="98" x2="105" y2="138" class="outline-fold" />
      <line x1="105" y1="138" x2="155" y2="98" class="outline-fold" />
      <!-- Center cross -->
      <line x1="55" y1="98" x2="155" y2="98" class="outline-fold" />
      <line x1="105" y1="58" x2="105" y2="138" class="outline-fold" />
    </svg>

    <!-- Full color variant -->
    <svg v-else viewBox="51 54 108 88" class="stead-logo__svg">
      <!-- Clip: restrict left/right walls so roof fold bars peek at top/bottom -->
      <defs>
        <clipPath id="wall-clip-v">
          <!-- Floor inner area: leaves 3px roof bar at top, 3px at bottom -->
          <rect x="0" y="61" width="210" height="74" />
        </clipPath>
      </defs>

      <!-- Floor: 100×80, centered at (55, 58) -->
      <rect x="55" y="58" width="100" height="80" class="logo-floor" />

      <!-- Roof front: 100×58, folds onto floor from bottom (hinges at floor bottom edge) -->
      <rect x="55" y="80" width="100" height="58" class="logo-roof-front" />

      <!-- Front wall: 100×55, folds onto floor from bottom -->
      <rect x="55" y="83" width="100" height="55" class="logo-wall-front" />

      <!-- Roof back: 100×58, folds onto floor from top (hinges at floor top edge) -->
      <rect x="55" y="58" width="100" height="58" class="logo-roof-back" />

      <!-- Back wall: 100×55, folds onto floor from top -->
      <rect x="55" y="58" width="100" height="55" class="logo-wall-back" />

      <!-- Left wall: 55×80, clipped to expose roof bars -->
      <rect x="55" y="58" width="55" height="80" class="logo-wall-left" clip-path="url(#wall-clip-v)" />

      <!-- Tri left: triangle, folds back onto left wall -->
      <polygon points="110,58 55,98 110,138" class="logo-tri-left" clip-path="url(#wall-clip-v)" />

      <!-- Right wall: 55×80, clipped to expose roof bars -->
      <rect x="100" y="58" width="55" height="80" class="logo-wall-right" clip-path="url(#wall-clip-v)" />

      <!-- Tri right: triangle, folds back onto right wall -->
      <polygon points="100,58 155,98 100,138" class="logo-tri-right" clip-path="url(#wall-clip-v)" />
    </svg>
  </div>
</template>

<style scoped>
.stead-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stead-logo__svg {
  width: 100%;
  height: 100%;
}

/* ── Colorful palette (matches hero animation) ── */
.logo-floor       { fill: var(--logo-floor, #DDD5C8); }
.logo-wall-front  { fill: var(--logo-front, #2A9D8F); }
.logo-wall-back   { fill: var(--logo-back, #264653); }
.logo-wall-left   { fill: var(--logo-left, #E07A5F); }
.logo-wall-right  { fill: var(--logo-right, #3D85C6); }
.logo-roof-front  { fill: var(--logo-roof-b, #9B5DE5); }
.logo-roof-back   { fill: var(--logo-roof-a, #E9C46A); }
.logo-tri-left    { fill: var(--logo-tri-l, #F2CC8F); }
.logo-tri-right   { fill: var(--logo-tri-r, #81B29A); }

/* Subtle paper texture overlay */
.stead-logo__svg rect,
.stead-logo__svg polygon {
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 0.5;
}

/* ── Animated hover ── */
.stead-logo--animated {
  transition: transform 0.3s cubic-bezier(0.22, 0.68, 0.35, 1.1);
}

.stead-logo--animated:hover {
  transform: scale(1.08) rotate(-2deg);
}

/* ── Outline variant ── */
.stead-logo__svg--outline .outline-shape {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linejoin: round;
}

.stead-logo__svg--outline .outline-fold {
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: 0.4;
}
</style>
