<script setup lang="ts">
export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand'

withDefaults(
  defineProps<{
    variant?: StatusVariant
    dot?: boolean
  }>(),
  {
    variant: 'default',
    dot: true,
  },
)
</script>

<template>
  <span :class="['statusbadge', `statusbadge--${variant}`]">
    <span v-if="dot" class="statusbadge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.statusbadge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-2xs) var(--space-s);
  border-radius: var(--radius-s);
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
}

.statusbadge__dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

.statusbadge--default { background: var(--color-bg-tertiary); color: var(--color-fg-secondary); }
.statusbadge--default .statusbadge__dot { background: var(--color-fg-tertiary); }

.statusbadge--success { background: var(--color-success-bg); color: var(--color-success-fg); }
.statusbadge--success .statusbadge__dot { background: var(--color-success); }

.statusbadge--warning { background: var(--color-warning-bg); color: var(--color-warning-fg); }
.statusbadge--warning .statusbadge__dot { background: var(--color-warning); }

.statusbadge--error { background: var(--color-error-bg); color: var(--color-error-fg); }
.statusbadge--error .statusbadge__dot { background: var(--color-error); }

.statusbadge--info { background: var(--color-info-bg); color: var(--color-info); }
.statusbadge--info .statusbadge__dot { background: var(--color-info); }

.statusbadge--brand { background: var(--color-brand-subtle); color: var(--color-brand-pressed); }
.statusbadge--brand .statusbadge__dot { background: var(--color-brand-primary); }
</style>
