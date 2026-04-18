<script setup lang="ts">
withDefaults(
  defineProps<{
    lines?: number
    height?: string
    circle?: boolean
    width?: string
  }>(),
  {
    lines: 3,
    height: '14px',
    circle: false,
    width: '100%',
  },
)
</script>

<template>
  <div class="skeleton" role="status" aria-label="Loading">
    <span class="sr-only">Loading...</span>

    <div
      v-if="circle"
      class="skeleton__bone skeleton__bone--circle"
      :style="{ width: height, height }"
    />

    <template v-else>
      <div
        v-for="i in lines"
        :key="i"
        class="skeleton__bone"
        :style="{
          height,
          width: i === lines ? '60%' : width,
        }"
      />
    </template>
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.skeleton__bone {
  border-radius: var(--radius-s);
  background: var(--color-bg-tertiary);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeleton__bone--circle {
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
