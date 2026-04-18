<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string
    retryLabel?: string
  }>(),
  {
    retryLabel: 'Try again',
  },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="errorbanner" role="alert">
    <span class="errorbanner__icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
        <path d="M8 4.5V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
    </span>

    <p class="errorbanner__message">{{ message }}</p>

    <button class="errorbanner__retry" @click="$emit('retry')">
      {{ retryLabel }}
    </button>
  </div>
</template>

<style scoped>
.errorbanner {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  padding: var(--space-l);
  background: var(--color-error-bg);
  border-radius: var(--radius-m);
  border-left: 3px solid var(--color-error);
  margin-bottom: var(--space-l);
}

.errorbanner__icon {
  display: flex;
  color: var(--color-error);
  flex-shrink: 0;
}

.errorbanner__message {
  flex: 1;
  font: var(--text-body-2);
  color: var(--color-error-fg);
}

.errorbanner__retry {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  cursor: pointer;
  padding: var(--space-2xs) var(--space-s);
  border-radius: var(--radius-s);
  white-space: nowrap;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.errorbanner__retry:hover {
  background: var(--color-error);
  color: var(--color-fg-on-brand);
}
</style>
