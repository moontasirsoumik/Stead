<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <fieldset class="formsection">
    <div v-if="title" class="formsection__header">
      <legend class="formsection__title">{{ title }}</legend>
      <p v-if="description" class="formsection__desc">{{ description }}</p>
    </div>
    <div class="formsection__fields">
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.formsection {
  border: none;
  padding: 0;
  margin: 0;
}

.formsection__header {
  margin-bottom: var(--space-m);
}

.formsection__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
}

.formsection__desc {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  margin-top: var(--space-2xs);
}

.formsection__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}
</style>
