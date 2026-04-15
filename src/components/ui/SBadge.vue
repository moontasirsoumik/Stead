<script setup lang="ts">
export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info'
export type BadgeSize = 'sm' | 'md'

withDefaults(
  defineProps<{
    variant?: BadgeVariant
    size?: BadgeSize
  }>(),
  {
    variant: 'default',
    size: 'md',
  },
)
</script>

<template>
  <span :class="['sbadge', `sbadge--${variant}`, `sbadge--${size}`]">
    <slot />
  </span>
</template>

<style scoped>
.sbadge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  white-space: nowrap;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-s);
}

/* Sizes */
.sbadge--sm {
  padding: var(--space-2xs) var(--space-xs);
  font: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.sbadge--md {
  padding: var(--space-2xs) var(--space-s);
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
}

/* Variants */
.sbadge--default {
  background: var(--color-bg-tertiary);
  color: var(--color-fg-secondary);
}

.sbadge--brand {
  background: var(--color-brand-subtle);
  color: var(--color-brand-pressed);
}

.sbadge--success {
  background: var(--color-success-bg);
  color: var(--color-success-fg);
}

.sbadge--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-fg);
}

.sbadge--error {
  background: var(--color-error-bg);
  color: var(--color-error-fg);
}

.sbadge--info {
  background: var(--color-info-bg);
  color: var(--color-info);
}
</style>
