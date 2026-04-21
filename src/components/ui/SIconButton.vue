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
  color: var(--color-fg-tertiary);
  background: transparent;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}

.siconbutton--sm { width: var(--height-control-sm); height: var(--height-control-sm); }
.siconbutton--md { width: var(--height-control-md); height: var(--height-control-md); }
.siconbutton--lg { width: var(--height-control-lg); height: var(--height-control-lg); }

.siconbutton--subtle {
  background: transparent;
}

.siconbutton--subtle:hover:not(:disabled) {
  background: var(--color-surface-container);
  color: var(--color-fg-primary);
}

.siconbutton--secondary {
  background: transparent;
  border: 1px solid var(--color-border-default);
}

.siconbutton--secondary:hover:not(:disabled) {
  background: var(--color-surface-container-low);
  border-color: var(--color-outline-variant);
  color: var(--color-fg-primary);
}

.siconbutton:active:not(:disabled) {
  opacity: 0.7;
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
