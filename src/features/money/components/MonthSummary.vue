<script setup lang="ts">
import InlineStat from '@/components/data/InlineStat.vue'

export interface MonthStat {
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

defineProps<{
  stats: MonthStat[]
}>()
</script>

<template>
  <div class="month-summary">
    <div v-for="(stat, i) in stats" :key="i" class="month-summary__stat">
      <InlineStat
        :label="stat.label"
        :value="stat.value"
        :subtitle="stat.subtitle"
        :trend="stat.trend"
      />
    </div>
  </div>
</template>

<style scoped>
.month-summary {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-card);
  margin-bottom: var(--space-m);
}

.month-summary__stat {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  border-right: 1px solid var(--color-border-subtle);
}

.month-summary__stat:last-child {
  border-right: none;
}
</style>
