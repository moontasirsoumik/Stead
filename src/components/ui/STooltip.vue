<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    text: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
  }>(),
  {
    position: 'top',
    delay: 300,
  },
)

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function show(delay: number) {
  timer = setTimeout(() => {
    visible.value = true
  }, delay)
}

function hide() {
  clearTimeout(timer)
  visible.value = false
}
</script>

<template>
  <div
    class="stooltip"
    @mouseenter="show(delay)"
    @mouseleave="hide"
    @focus="show(delay)"
    @blur="hide"
  >
    <slot />

    <Transition name="tooltip">
      <div
        v-if="visible"
        :class="['stooltip__tip', `stooltip__tip--${position}`]"
        role="tooltip"
      >
        {{ text }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.stooltip {
  position: relative;
  display: inline-flex;
}

.stooltip__tip {
  position: absolute;
  z-index: 1000;
  padding: var(--space-xs) var(--space-s);
  background: var(--color-fg-primary);
  color: var(--color-fg-on-brand);
  font: var(--text-caption);
  border-radius: var(--radius-s);
  white-space: nowrap;
  pointer-events: none;
}

/* Positions */
.stooltip__tip--top {
  bottom: calc(100% + var(--space-s));
  left: 50%;
  transform: translateX(-50%);
}

.stooltip__tip--bottom {
  top: calc(100% + var(--space-s));
  left: 50%;
  transform: translateX(-50%);
}

.stooltip__tip--left {
  right: calc(100% + var(--space-s));
  top: 50%;
  transform: translateY(-50%);
}

.stooltip__tip--right {
  left: calc(100% + var(--space-s));
  top: 50%;
  transform: translateY(-50%);
}

/* Transition */
.tooltip-enter-active {
  transition: opacity var(--duration-fast) var(--easing-decelerate);
}

.tooltip-leave-active {
  transition: opacity var(--duration-ultra-fast) var(--easing-accelerate);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
