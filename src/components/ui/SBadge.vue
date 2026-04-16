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
  border-radius: var(--radius-circle);
  border: 1px solid transparent;
}

.sbadge--sm {
  padding: 0 var(--space-s);
  height: 24px;
  font: var(--text-label-sm);
}

.sbadge--md {
  padding: 0 var(--space-m);
  height: 28px;
  font: var(--text-label-sm);
}

.sbadge--default {
  background: var(--color-surface-container-high);
  color: var(--color-fg-secondary);
  border-color: var(--color-border-default);
}

.sbadge--brand {
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
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
