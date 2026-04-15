<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}>()
</script>

<template>
  <div class="inlinestat">
    <p class="inlinestat__label">{{ label }}</p>
    <p :class="['inlinestat__value', trend ? `inlinestat__value--${trend}` : '']">
      {{ value }}
    </p>
    <p v-if="subtitle" class="inlinestat__subtitle">{{ subtitle }}</p>
  </div>
</template>

<style scoped>
.inlinestat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.inlinestat__label {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.inlinestat__value {
  font: var(--text-title-1);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.inlinestat__value--up { color: var(--color-success); }
.inlinestat__value--down { color: var(--color-error); }

.inlinestat__subtitle {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}
</style>
