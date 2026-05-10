<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hoverable?: boolean
  }>(),
  {
    padding: 'md',
    hoverable: false,
  },
)
</script>

<template>
  <div :class="['contentcard', `contentcard--pad-${padding}`, { 'contentcard--hoverable': hoverable }]">
    <slot />
  </div>
</template>

<style scoped>
.contentcard {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-card);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.contentcard--pad-none { padding: 0; }
.contentcard--pad-sm { padding: var(--space-l); }
.contentcard--pad-md { padding: var(--space-xl); }
.contentcard--pad-lg { padding: var(--space-2xl); }

.contentcard--hoverable:hover {
  background: var(--color-surface-card-hover);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-default);
}
</style>
