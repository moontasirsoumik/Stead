<script setup lang="ts">
defineProps<{
  row?: boolean
}>()
</script>

<template>
  <div :class="['formfield', { 'formfield--row': row }]">
    <slot />
  </div>
</template>

<style scoped>
.formfield {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.formfield--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-m);
}

.formfield--row > :deep(*) {
  flex: 1 1 140px;
  min-width: 0;
}
</style>
