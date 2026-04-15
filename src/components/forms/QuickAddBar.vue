<script setup lang="ts">
import SIconButton from '@/components/ui/SIconButton.vue'

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: 'Quick add…',
  },
)

const emit = defineEmits<{
  submit: [value: string]
}>()

function handleSubmit() {
  const trimmed = model.value.trim()
  if (!trimmed) return
  emit('submit', trimmed)
  model.value = ''
}
</script>

<template>
  <form
    class="quickadd"
    @submit.prevent="handleSubmit()"
  >
    <input
      v-model="model"
      :placeholder="placeholder"
      class="quickadd__input"
      aria-label="Quick add"
    />

    <SIconButton
      label="Add"
      size="sm"
      type="submit"
      :disabled="!model.trim()"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </SIconButton>
  </form>
</template>

<style scoped>
.quickadd {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  height: var(--height-input);
  padding: 0 var(--space-m);
  background: var(--color-surface-card);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-m);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.quickadd:focus-within {
  border-color: var(--color-brand-primary);
  border-style: solid;
  box-shadow: var(--shadow-2);
}

.quickadd__input {
  flex: 1;
  background: transparent;
  border: none;
  font: var(--text-body-1);
  color: var(--color-fg-primary);
}

.quickadd__input::placeholder {
  color: var(--color-fg-tertiary);
}

.quickadd__input:focus {
  outline: none;
}
</style>
