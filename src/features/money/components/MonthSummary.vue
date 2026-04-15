<script setup lang="ts">
import InlineStat from '@/components/data/InlineStat.vue'
import ContentCard from '@/components/layout/ContentCard.vue'

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
  <ContentCard padding="md">
    <div class="month-summary">
      <InlineStat
        v-for="(stat, i) in stats"
        :key="i"
        :label="stat.label"
        :value="stat.value"
        :subtitle="stat.subtitle"
        :trend="stat.trend"
      />
    </div>
  </ContentCard>
</template>

<style scoped>
.month-summary {
  display: flex;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.month-summary > * {
  flex: 1;
  min-width: 120px;
}
</style>
