<script setup lang="ts">
export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
    fullWidth?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    type: 'button',
    fullWidth: false,
  },
)

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :class="[
      'sbutton',
      `sbutton--${variant}`,
      `sbutton--${size}`,
      { 'sbutton--full': fullWidth, 'sbutton--loading': loading },
    ]"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading || undefined"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="sbutton__spinner" aria-hidden="true" />
    <span class="sbutton__content" :class="{ 'sbutton__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.sbutton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-s);
  border: 1px solid transparent;
  border-radius: var(--radius-circle);
  font: var(--text-label-lg);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  user-select: none;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}

.sbutton--sm {
  height: var(--height-control-sm);
  padding: 0 var(--space-m);
  font: var(--text-label-sm);
}

.sbutton--md {
  height: var(--height-control-md);
  padding: 0 var(--space-l);
}

.sbutton--lg {
  height: var(--height-control-lg);
  padding: 0 var(--space-xl);
}

.sbutton--full {
  width: 100%;
}

.sbutton--primary {
  background-color: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
}

.sbutton--primary:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
}

.sbutton--primary:active:not(:disabled) {
  background-color: var(--color-brand-pressed);
}

.sbutton--secondary {
  background-color: transparent;
  color: var(--color-fg-primary);
  border-color: var(--color-border-default);
}

.sbutton--secondary:hover:not(:disabled) {
  background-color: var(--color-surface-container-low);
  border-color: var(--color-outline-variant);
}

.sbutton--secondary:active:not(:disabled) {
  background-color: var(--color-surface-container-high);
}

.sbutton--subtle {
  background-color: transparent;
  color: var(--color-brand-primary);
}

.sbutton--subtle:hover:not(:disabled) {
  background-color: var(--color-brand-selected);
  color: var(--color-brand-hover);
}

.sbutton--subtle:active:not(:disabled) {
  background-color: var(--color-brand-subtle);
}

.sbutton--danger {
  background-color: var(--color-error);
  color: var(--color-fg-on-brand);
}

.sbutton--danger:hover:not(:disabled) {
  background-color: var(--color-error-fg);
}

.sbutton--danger:active:not(:disabled) {
  background-color: var(--color-error-fg);
}

.sbutton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sbutton:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.sbutton__content {
  display: inline-flex;
  align-items: center;
  gap: var(--space-s);
}

.sbutton__content--hidden {
  visibility: hidden;
}

.sbutton__spinner {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--radius-circle);
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
