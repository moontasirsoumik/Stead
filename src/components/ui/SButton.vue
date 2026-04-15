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
  border-radius: var(--radius-m);
  font: var(--text-body-1-strong);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  user-select: none;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    transform var(--duration-ultra-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard);
}

/* ── Sizes ── */
.sbutton--sm {
  height: 28px;
  padding: 0 var(--space-m);
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-s);
}

.sbutton--md {
  height: var(--height-input);
  padding: 0 var(--space-l);
}

.sbutton--lg {
  height: 44px;
  padding: 0 var(--space-xl);
}

.sbutton--full {
  width: 100%;
}

/* ── Primary ── */
.sbutton--primary {
  background-color: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  box-shadow: var(--shadow-2);
}

.sbutton--primary:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
  box-shadow: var(--shadow-4);
}

.sbutton--primary:active:not(:disabled) {
  background-color: var(--color-brand-pressed);
  box-shadow: var(--shadow-2);
  transform: scale(0.98);
}

/* ── Secondary ── */
.sbutton--secondary {
  background-color: var(--color-bg-primary);
  color: var(--color-fg-primary);
  border-color: var(--color-border-default);
}

.sbutton--secondary:hover:not(:disabled) {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-2);
}

.sbutton--secondary:active:not(:disabled) {
  background-color: var(--color-bg-tertiary);
  transform: scale(0.98);
}

/* ── Subtle ── */
.sbutton--subtle {
  background-color: transparent;
  color: var(--color-fg-primary);
}

.sbutton--subtle:hover:not(:disabled) {
  background-color: var(--color-bg-tertiary);
}

.sbutton--subtle:active:not(:disabled) {
  background-color: var(--color-border-default);
  transform: scale(0.98);
}

/* ── Danger ── */
.sbutton--danger {
  background-color: var(--color-error);
  color: var(--color-fg-on-brand);
  box-shadow: var(--shadow-2);
}

.sbutton--danger:hover:not(:disabled) {
  background-color: var(--color-error-fg);
  box-shadow: var(--shadow-4);
}

.sbutton--danger:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: var(--shadow-2);
}

/* ── Disabled ── */
.sbutton:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* ── Focus ── */
.sbutton:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

/* ── Loading ── */
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
  width: 16px;
  height: 16px;
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
