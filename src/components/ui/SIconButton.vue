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
  border: 1px solid transparent;
  border-radius: var(--radius-circle);
  cursor: pointer;
  color: var(--color-fg-tertiary);
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard);
}

.siconbutton--sm { width: var(--height-control-sm); height: var(--height-control-sm); }
.siconbutton--md { width: var(--height-control-md); height: var(--height-control-md); }
.siconbutton--lg { width: var(--height-control-lg); height: var(--height-control-lg); }

.siconbutton--subtle {
  background: transparent;
}

.siconbutton--subtle:hover:not(:disabled) {
  background: var(--color-brand-selected);
  color: var(--color-brand-primary);
}

.siconbutton--secondary {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-default);
}

.siconbutton--secondary:hover:not(:disabled) {
  background: var(--color-surface-container-low);
  border-color: var(--color-outline-variant);
  box-shadow: var(--shadow-4);
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
  outline: 3px solid color-mix(in srgb, var(--color-brand-primary) 34%, transparent);
  outline-offset: 2px;
}
</style>
