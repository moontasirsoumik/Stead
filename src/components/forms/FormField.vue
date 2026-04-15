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
  align-items: center;
  gap: var(--space-m);
}

.formfield--row > :deep(*:first-child) {
  flex: 1;
}
</style>
