<script setup lang="ts">
/**
 * SteadHeroAnimation — Landing page origami sequence.
 *
 * Full sequence:
 *   1. 3D house (isometric, 1.2s pause)
 *   2. Unfold house → flat paper net
 *   3. Flat-fold net → diamond (pre-Z seeded via direct DOM)
 *   4. Tilt to top-down 2D logo
 *   5. Scale down logo + slide in "Stead" brand name
 *   6. Emit 'done' → parent reveals tagline
 */
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  done: []
}>()

const props = defineProps<{
  mobile?: boolean
}>()

const houseEl = ref<HTMLDivElement>()
const animEl = ref<HTMLDivElement>()
const shrunk = ref(false)
const showBrand = ref(false)
const centerY = ref(0)

const W = 100, D = 80, WH = 55, RL = 58, RA = 45
const gH = Math.round(RL * Math.sin(RA * Math.PI / 180))

const c = {
  floor: '#DDD5C8', front: '#2A9D8F', back: '#264653',
  left: '#E07A5F', right: '#3D85C6', roofA: '#E9C46A',
  roofB: '#9B5DE5', triL: '#F2CC8F', triR: '#81B29A',
}

function setDelays(delays: Record<string, string>) {
  const house = houseEl.value
  if (!house) return
  for (const cls of ['wall-front','wall-back','wall-left','wall-right',
    'roof-back','roof-front','tri-left','tri-right']) {
    const el = house.querySelector('.' + cls) as HTMLElement | null
    if (el) el.style.transitionDelay = delays[cls] || '0s'
  }
}

onMounted(() => {
  const house = houseEl.value
  if (!house) return

  // Suppress transitions on mount so house appears instantly in 3D
  const faces = house.querySelectorAll<HTMLElement>('.face')
  faces.forEach(f => f.style.transitionDuration = '0s')
  // Force layout so the 0s duration takes effect before we re-enable
  house.offsetHeight
  requestAnimationFrame(() => {
    faces.forEach(f => f.style.transitionDuration = '')
  })

  // Calculate vertical offset to center animation in the auth-door panel
  const anim = animEl.value
  if (anim) {
    const door = anim.closest('.auth-door') as HTMLElement | null
    if (door) {
      const doorRect = door.getBoundingClientRect()
      const animRect = anim.getBoundingClientRect()
      const doorCenterY = doorRect.top + doorRect.height / 2
      const animCenterY = animRect.top + animRect.height / 2
      centerY.value = doorCenterY - animCenterY
    }
  }

  // House starts with phase-3d in template — no animation into 3D

  // 1→2: unfold 3D house → flat (simultaneous pairs)
  setTimeout(() => {
    setDelays({
      'roof-back': '0s', 'roof-front': '0s',
      'tri-left': '0s', 'tri-right': '0s',
      'wall-left': '0.15s', 'wall-right': '0.15s',
      'wall-front': '0.3s', 'wall-back': '0.3s',
    })
    house.classList.remove('phase-3d')
  }, 1200)

  // 2→3: flat → folded diamond (simultaneous — both sides fold together)
  setTimeout(() => {
    setDelays({
      'roof-front': '0s',   'roof-back': '0s',
      'wall-front': '0.4s', 'wall-back': '0.4s',
      'wall-left': '0.8s',  'wall-right': '0.8s',
      'tri-left': '1.2s',   'tri-right': '1.2s',
    })
    const faces = house.querySelectorAll<HTMLElement>('.face')
    faces.forEach(f => f.style.transitionDuration = '0s')
    house.classList.add('pre-fold-z')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        faces.forEach(f => f.style.transitionDuration = '')
        house.classList.remove('pre-fold-z')
        house.classList.add('phase-2d')
      })
    })
  }, 2800)

  // 3→4: tilt to top-down 2D
  setTimeout(() => {
    house.classList.add('tilt-2d')
  }, 5200)

  if (props.mobile) {
    // Mobile: after tilt settles (5200ms + 1.2s = 6400ms), fly diamond to header
    // Uses Web Animations API for flicker-free, exact start→end interpolation
    setTimeout(() => {
      const el = animEl.value
      const door = el?.closest('.auth-door') as HTMLElement | null
      if (!el || !door) return

      const doorRect = door.getBoundingClientRect()
      const animRect = el.getBoundingClientRect()

      // Target: center of 32px logo area in future 56px header bar
      const targetX = doorRect.left + 32
      const targetY = doorRect.top + 28
      const currentX = animRect.left + animRect.width / 2
      const currentY = animRect.top + animRect.height / 2
      const dx = targetX - currentX
      const dy = targetY - currentY
      const s = 0.28

      // Disable CSS transition — WAAPI controls the animation
      el.style.transition = 'none'

      // Start transform matches the current CSS: translate(0, centerY) scale(1)
      // End transform: flyY must be dy + centerY because the CSS translate Y starts
      // at centerY, so the net visual displacement = (dy + centerY) - centerY = dy
      const fly = el.animate([
        { transform: `translate(0px, ${centerY.value}px) scale(1)` },
        { transform: `translate(${dx}px, ${dy + centerY.value}px) scale(${s})` },
      ], {
        duration: 1100,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        fill: 'forwards',
      })

      fly.onfinish = () => emit('done')
    }, 6500)
  } else {
    // Desktop: shrink + reposition diamond (single GPU transform, 1.1s)
    setTimeout(() => { shrunk.value = true }, 6400)

    // "Stead" slides in from diamond edge mid-shrink
    setTimeout(() => { showBrand.value = true }, 6900)

    // Emit done after animation settles
    setTimeout(() => { emit('done') }, 8400)
  }
})
</script>

<template>
  <div :class="['hero-container']">
    <!-- Scene: absolute, starts centered in door, then moves to final position -->
    <div
      ref="animEl"
      :class="['hero-anim', { 'hero-anim--shrunk': shrunk }]"
      :style="{ '--center-y': centerY + 'px' }"
    >
      <div class="hero-scene">
        <div
          ref="houseEl"
          class="hero-house phase-3d"
          :style="{ '--roof-angle': RA + 'deg' }"
        >
          <!-- Floor (piece 1) — the origin -->
          <div
            class="floor"
            :style="{
              width: W + 'px',
              height: D + 'px',
              backgroundColor: c.floor,
            }"
          >
            <!-- Front wall (piece 6) -->
            <div
              class="face wall-front"
              :style="{ width: W + 'px', height: WH + 'px', backgroundColor: c.front }"
            >
              <div
                class="face roof-front"
                :style="{ width: W + 'px', height: RL + 'px', backgroundColor: c.roofB }"
              />
            </div>

            <!-- Back wall (piece 4) -->
            <div
              class="face wall-back"
              :style="{ width: W + 'px', height: WH + 'px', backgroundColor: c.back }"
            >
              <div
                class="face roof-back"
                :style="{ width: W + 'px', height: RL + 'px', backgroundColor: c.roofA }"
              />
            </div>

            <!-- Left wall (piece 2) -->
            <div
              class="face wall-left"
              :style="{ width: WH + 'px', height: D + 'px', backgroundColor: c.left }"
            >
              <div
                class="face tri-left"
                :style="{
                  width: gH + 'px',
                  height: D + 'px',
                  backgroundColor: c.triL,
                  clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
                }"
              />
            </div>

            <!-- Right wall (piece 3) -->
            <div
              class="face wall-right"
              :style="{ width: WH + 'px', height: D + 'px', backgroundColor: c.right }"
            >
              <div
                class="face tri-right"
                :style="{
                  width: gH + 'px',
                  height: D + 'px',
                  backgroundColor: c.triR,
                  clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                }"
              />
            </div>
          </div><!-- end floor -->
        </div><!-- end hero-house -->
      </div><!-- end hero-scene -->
    </div><!-- end hero-anim -->

    <!-- Brand text: slides in from the diamond's right edge -->
    <span :class="['hero-brand', { 'hero-brand--visible': showBrand }]">Stead</span>
  </div>
</template>

<style scoped>
/*
 * Single-shot animation: no crossfade, no static swap.
 *
 * transform-origin: 0% 50% (left center) on .hero-scene
 * scale(0.5) from left center: everything shrinks toward x=0.
 * Diamond left edge in the 280px scene = 35px (the dead padding).
 * After scale: 35 * 0.5 = 17.5px. translateX(-18px) flushes it to x≈0.
 * Diamond right edge: (35+210) * 0.5 - 18 = 104.5px.
 * Brand text at left: 104.5 + 12 = ~117px.
 *
 * Vertically: scene center = 110px. After scale from center-y:
 *   visual top = 55px, visual bottom = 165px, visual height = 110px.
 *   Container collapses from 220px → 110px, scene stays centered.
 */

.hero-container {
  position: relative;
  width: 280px;
  height: 110px;
  /* overflow visible so 3D animation shows above/below during animation */
}

/* ── Animation wrapper: absolute, starts vertically centered in door panel ── */
.hero-anim {
  position: absolute;
  top: -55px;  /* centers 220px scene in 110px container: (110-220)/2 */
  left: 0;
  width: 280px;
  height: 220px;
  /* IMPORTANT: function list must match --flying for flicker-free interpolation */
  transform: translate(0px, var(--center-y, 0px)) scale(1);
  will-change: transform;
  transition: transform 1.1s cubic-bezier(0.22, 0.68, 0.35, 1.05);
}

.hero-anim--shrunk {
  /* Move back to natural position (inside brand-hero at top of door-inner) */
  transform: translate(0px, 0px) scale(1);
}

/* ── 3D scene: shrinks toward left center ── */
.hero-scene {
  width: 280px;
  height: 220px;
  perspective: 900px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(1) translateX(0);
  will-change: transform;
  transition: transform 1.1s cubic-bezier(0.22, 0.68, 0.35, 1.05);
}

.hero-anim--shrunk .hero-scene {
  /*
   * Origin = center = (140, 110).
   * Diamond (floor rect) center in scene = (140, 110), left edge at x=90.
   * After scale(0.5): center stays at origin.
   * Need floor left at container x=0: visual_x = origin + 0.5*(90-origin) + tx = 0
   *   140 - 25 + tx = 0 → tx = -115, CSS pre-scale: -115/0.5 = -230.
   * Y stays centered (no vertical shift needed since scene is already centered).
   */
  transform: scale(0.5) translateX(-230px);
}

/* ── Brand text: absolute, slides in from diamond right edge ── */
.hero-brand {
  position: absolute;
  left: 62px;  /* diamond right (50px) + 12px gap */
  top: 55px;   /* matches diamond visual center in collapsed container */
  transform: translateY(-50%) translateX(-16px);
  opacity: 0;
  will-change: transform, opacity;
  font-size: 34px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.03em;
  white-space: nowrap;
  line-height: 1;
  transition:
    transform 1s cubic-bezier(0.22, 0.68, 0.35, 1.05),
    opacity 0.6s ease;
}

.hero-brand--visible {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* ── House container ── */
.hero-house {
  transform-style: preserve-3d;
  position: relative;
  transform: rotateX(58deg) rotateZ(-32deg);
  transition: transform 1.2s cubic-bezier(0.22, 0.68, 0.35, 1.1);
}

.hero-house.tilt-2d {
  transform: rotateX(0deg) rotateZ(0deg);
}



/* ── Floor ── */
.floor {
  position: relative;
  transform-style: preserve-3d;
  background-image: linear-gradient(170deg, rgba(255,255,255,0.1) 0%, transparent 40%, rgba(0,0,0,0.03) 100%);
}

/* ── Face base ── */
.face {
  position: absolute;
  transform-style: preserve-3d;
  backface-visibility: visible;
  background-image: linear-gradient(170deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.04) 100%);
  background-blend-mode: overlay;
  transition: transform 0.75s cubic-bezier(0.34, 1.2, 0.64, 1);
}

/* ── Hinge origins ── */
.wall-front { left: 0; top: 100%; transform-origin: left top; }
.wall-back  { left: 0; bottom: 100%; transform-origin: left bottom; }
.wall-left  { right: 100%; top: 0; transform-origin: right top; }
.wall-right { left: 100%; top: 0; transform-origin: left top; }
.roof-back  { left: 0; bottom: 100%; transform-origin: left bottom; }
.roof-front { left: 0; top: 100%; transform-origin: left top; }
.tri-left   { right: 100%; top: 0; transform-origin: right top; }
.tri-right  { left: 100%; top: 0; transform-origin: left top; }

/* Floor crease lines */
.floor::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 0.5px dashed rgba(0,0,0,0.12);
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.5s;
}

.hero-house.phase-3d .floor::after { opacity: 0; }
.hero-house.phase-2d .floor::after { opacity: 0; }

/* ═══ Phase: 3D house ═══ */
.hero-house.phase-3d .wall-front { transform: rotateX(90deg); }
.hero-house.phase-3d .wall-back  { transform: rotateX(-90deg); }
.hero-house.phase-3d .wall-left  { transform: rotateY(90deg); }
.hero-house.phase-3d .wall-right { transform: rotateY(-90deg); }
.hero-house.phase-3d .roof-back  { transform: rotateX(calc(-1 * var(--roof-angle))); }
.hero-house.phase-3d .roof-front { transform: rotateX(var(--roof-angle)); }

/* ═══ Pre-fold Z offsets ═══ */
.hero-house.pre-fold-z .roof-front { transform: translateZ(0.5px) rotateX(0deg); }
.hero-house.pre-fold-z .wall-front { transform: translateZ(1px) rotateX(0deg); }
.hero-house.pre-fold-z .roof-back  { transform: translateZ(0.5px) rotateX(0deg); }
.hero-house.pre-fold-z .wall-back  { transform: translateZ(2px) rotateX(0deg); }
.hero-house.pre-fold-z .wall-left  { transform: translateZ(3px) rotateY(0deg); }
.hero-house.pre-fold-z .tri-left   { transform: translateZ(-0.5px) rotateY(0deg); }
.hero-house.pre-fold-z .wall-right { transform: translateZ(4px) rotateY(0deg); }
.hero-house.pre-fold-z .tri-right  { transform: translateZ(-0.5px) rotateY(0deg); }

/* ═══ Phase: 2D flat fold ═══ */
.hero-house.phase-2d .roof-front { transform: translateZ(0.5px) rotateX(180deg); }
.hero-house.phase-2d .wall-front { transform: translateZ(1px) rotateX(180deg); }
.hero-house.phase-2d .roof-back  { transform: translateZ(0.5px) rotateX(-180deg); }
.hero-house.phase-2d .wall-back  { transform: translateZ(2px) rotateX(-180deg); }
.hero-house.phase-2d .wall-left  { transform: translateZ(3px) rotateY(180deg); }
.hero-house.phase-2d .tri-left   { transform: translateZ(-0.5px) rotateY(-180deg); }
.hero-house.phase-2d .wall-right { transform: translateZ(4px) rotateY(-180deg); }
.hero-house.phase-2d .tri-right  { transform: translateZ(-0.5px) rotateY(180deg); }
</style>
