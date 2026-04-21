<script setup lang="ts">
defineProps<{
  dividers?: boolean
}>()
</script>

<template>
  <div :class="['datalist', { 'datalist--dividers': dividers }]" role="list">
    <slot />
  </div>
</template>

<style scoped>
.datalist {
  display: flex;
  flex-direction: column;
}

.datalist :deep(> *) {
  min-height: 40px;
}

.datalist--dividers :deep(> *:not(:last-child)) {
  border-bottom: 1px solid var(--color-border-subtle);
}

.datalist :deep(> *) {
  padding-inline: var(--space-s);
}
</style>
