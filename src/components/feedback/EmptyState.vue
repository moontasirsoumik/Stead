<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon?: 'empty' | 'search' | 'error' | 'success'
    actionLabel?: string
  }>(),
  {
    icon: 'empty',
  },
)

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="emptystate">
    <div class="emptystate__icon" aria-hidden="true">
      <!-- Empty / nothing here -->
      <svg v-if="icon === 'empty'" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="12" width="32" height="24" rx="3" stroke="currentColor" stroke-width="2" />
        <path d="M8 18H40" stroke="currentColor" stroke-width="2" />
        <circle cx="24" cy="28" r="3" stroke="currentColor" stroke-width="2" />
        <path d="M24 31V33" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <!-- Search no results -->
      <svg v-else-if="icon === 'search'" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="22" cy="22" r="10" stroke="currentColor" stroke-width="2" />
        <path d="M30 30L38 38" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <path d="M18 22H26" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <!-- Error -->
      <svg v-else-if="icon === 'error'" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2" />
        <path d="M24 16V26" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <circle cx="24" cy="32" r="1.5" fill="currentColor" />
      </svg>
      <!-- Success -->
      <svg v-else-if="icon === 'success'" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2" />
        <path d="M16 24L22 30L32 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>

    <h3 class="emptystate__title">{{ title }}</h3>
    <p v-if="subtitle" class="emptystate__subtitle">{{ subtitle }}</p>

    <button
      v-if="actionLabel"
      class="emptystate__action"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.emptystate {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  gap: var(--space-s);
}

.emptystate__icon {
  color: var(--color-fg-tertiary);
  margin-bottom: var(--space-xs);
  opacity: 0.5;
}

.emptystate__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
}

.emptystate__subtitle {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  max-width: 320px;
}

.emptystate__action {
  margin-top: var(--space-s);
  padding: var(--space-s) var(--space-l);
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font: var(--text-body-1-strong);
  border-radius: var(--radius-m);
  border: none;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    transform var(--duration-ultra-fast) var(--easing-standard);
}

.emptystate__action:hover {
  background: var(--color-brand-hover);
  box-shadow: var(--shadow-brand);
}

.emptystate__action:active {
  background: var(--color-brand-pressed);
  transform: scale(0.98);
}
</style>
