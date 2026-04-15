<script setup lang="ts">
defineProps<{
  title: string
  count?: number
}>()
</script>

<template>
  <div class="sectionheader">
    <h2 class="sectionheader__title">{{ title }}</h2>
    <span v-if="count !== undefined" class="sectionheader__count">{{ count }}</span>
    <div v-if="$slots.actions" class="sectionheader__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.sectionheader {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding-bottom: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: var(--space-l);
}

.sectionheader__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
}

.sectionheader__count {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
  background: var(--color-bg-tertiary);
  padding: var(--space-2xs) var(--space-s);
  border-radius: var(--radius-s);
}

.sectionheader__actions {
  margin-left: auto;
  display: flex;
  gap: var(--space-s);
}
</style>
