<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Search…',
    disabled: false,
  },
)

const emit = defineEmits<{
  clear: []
}>()

function handleClear() {
  model.value = ''
  emit('clear')
}
</script>

<template>
  <div :class="['ssearch', { 'ssearch--disabled': disabled }]">
    <span class="ssearch__icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </span>

    <input
      v-model="model"
      type="search"
      :placeholder="placeholder"
      :disabled="disabled"
      class="ssearch__input"
      aria-label="Search"
    />

    <button
      v-if="model"
      class="ssearch__clear"
      aria-label="Clear search"
      @click="handleClear()"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ssearch {
  display: flex;
  align-items: center;
  height: var(--height-input);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-inset);
  padding: 0 var(--space-m);
  gap: var(--space-s);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.ssearch:hover:not(.ssearch--disabled) {
  border-color: var(--color-border-input-hover);
}

.ssearch:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 1px var(--color-brand-primary);
}

.ssearch__icon {
  display: flex;
  color: var(--color-fg-tertiary);
  flex-shrink: 0;
}

.ssearch__input {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  font: var(--text-body-1);
  color: var(--color-fg-primary);
}

.ssearch__input::placeholder {
  color: var(--color-fg-tertiary);
}

.ssearch__input:focus {
  outline: none;
}

/* Remove native search clear button */
.ssearch__input::-webkit-search-cancel-button {
  display: none;
}

.ssearch__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-circle);
  color: var(--color-fg-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.ssearch__clear:hover {
  background: var(--color-bg-tertiary);
}

.ssearch--disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>
