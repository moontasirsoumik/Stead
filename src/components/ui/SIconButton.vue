<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    size?: 'sm' | 'md' | 'lg'
    variant?: 'subtle' | 'secondary'
    disabled?: boolean
  }>(),
  {
    size: 'md',
    variant: 'subtle',
    disabled: false,
  },
)

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :class="['siconbutton', `siconbutton--${size}`, `siconbutton--${variant}`]"
    type="button"
    :disabled="disabled"
    :aria-label="label"
    :title="label"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.siconbutton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-m);
  cursor: pointer;
  color: var(--color-fg-secondary);
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    transform var(--duration-ultra-fast) var(--easing-standard);
}

/* Sizes */
.siconbutton--sm { width: 28px; height: 28px; border-radius: var(--radius-s); }
.siconbutton--md { width: var(--height-input); height: var(--height-input); }
.siconbutton--lg { width: 44px; height: 44px; }

/* Subtle */
.siconbutton--subtle {
  background: transparent;
}

.siconbutton--subtle:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-fg-primary);
}

/* Secondary */
.siconbutton--secondary {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
}

.siconbutton--secondary:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-2);
}

.siconbutton:active:not(:disabled) {
  transform: scale(0.93);
}

.siconbutton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.siconbutton:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}
</style>
