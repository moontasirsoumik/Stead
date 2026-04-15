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
  transition:
    box-shadow var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.contentcard--pad-none { padding: 0; }
.contentcard--pad-sm { padding: var(--space-m); }
.contentcard--pad-md { padding: var(--space-l); }
.contentcard--pad-lg { padding: var(--space-xl); }

.contentcard--hoverable:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-1px);
}
</style>
