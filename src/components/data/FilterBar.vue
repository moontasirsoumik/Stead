<script setup lang="ts">
import SSearch from '@/components/ui/SSearch.vue'

const search = defineModel<string>('search', { default: '' })

defineProps<{
  showSearch?: boolean
}>()
</script>

<template>
  <div class="filterbar">
    <div v-if="showSearch" class="filterbar__search">
      <SSearch v-model="search" />
    </div>

    <div class="filterbar__filters">
      <slot />
    </div>

    <div v-if="$slots.actions" class="filterbar__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.filterbar {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-wrap: wrap;
  margin-bottom: var(--space-m);
}

.filterbar__search {
  min-width: 180px;
  max-width: 240px;
}

.filterbar__filters {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-wrap: wrap;
}

.filterbar__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

@media (max-width: 640px) {
  .filterbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filterbar__search {
    max-width: none;
  }

  .filterbar__actions {
    margin-left: 0;
  }
}
</style>
