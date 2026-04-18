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
  border-radius: var(--radius-pill);
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  white-space: nowrap;
}

.statusbadge__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

.statusbadge--default { background: var(--color-bg-tertiary); color: var(--color-fg-secondary); border: 1px solid var(--color-border-subtle); }
.statusbadge--default .statusbadge__dot { background: var(--color-fg-tertiary); }

.statusbadge--success { background: var(--color-success-bg); color: var(--color-success-fg); border: 1px solid var(--color-success); }
.statusbadge--success .statusbadge__dot { background: var(--color-success); }

.statusbadge--warning { background: var(--color-warning-bg); color: var(--color-warning-fg); border: 1px solid var(--color-warning); }
.statusbadge--warning .statusbadge__dot { background: var(--color-warning); }

.statusbadge--error { background: var(--color-error-bg); color: var(--color-error-fg); border: 1px solid var(--color-error); }
.statusbadge--error .statusbadge__dot { background: var(--color-error); }

.statusbadge--info { background: var(--color-info-bg); color: var(--color-info); border: 1px solid var(--color-info); }
.statusbadge--info .statusbadge__dot { background: var(--color-info); }

.statusbadge--brand { background: var(--color-brand-subtle); color: var(--color-brand-pressed); border: 1px solid var(--color-brand-primary); }
.statusbadge--brand .statusbadge__dot { background: var(--color-brand-primary); }
</style>
