<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="pageheader">
    <div class="pageheader__text">
      <h1 class="pageheader__title">{{ title }}</h1>
      <p v-if="subtitle" class="pageheader__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="pageheader__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.pageheader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-l);
  margin-bottom: var(--space-xl);
}

.pageheader__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.pageheader__title {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.pageheader__subtitle {
  font: var(--text-body-1);
  color: var(--color-fg-secondary);
}

.pageheader__actions {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .pageheader {
    flex-direction: column;
    gap: var(--space-m);
  }

  .pageheader__title {
    font: var(--text-title-3);
  }

  .pageheader__actions {
    width: 100%;
  }
}
</style>
