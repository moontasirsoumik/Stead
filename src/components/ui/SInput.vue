<script setup lang="ts">
import { useId } from 'vue'

const inputId = useId()
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date'
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    type: 'text',
    disabled: false,
    required: false,
  },
)

defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()
</script>

<template>
  <div :class="['sinput', { 'sinput--error': error, 'sinput--disabled': disabled }]">
    <label v-if="label" class="sinput__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="sinput__required" aria-hidden="true">*</span>
    </label>

    <div class="sinput__wrapper">
      <span v-if="$slots.prefix" class="sinput__affix sinput__prefix">
        <slot name="prefix" />
      </span>

      <input
        :id="inputId"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        class="sinput__field"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />

      <span v-if="$slots.suffix" class="sinput__affix sinput__suffix">
        <slot name="suffix" />
      </span>
    </div>

    <p v-if="error" :id="`${inputId}-error`" class="sinput__message sinput__message--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${inputId}-hint`" class="sinput__message sinput__message--hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.sinput {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sinput__label {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.sinput__required {
  color: var(--color-error);
  margin-left: var(--space-2xs);
}

.sinput__wrapper {
  display: flex;
  align-items: center;
  height: var(--height-input);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  overflow: hidden;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.sinput__wrapper:hover:not(.sinput--disabled .sinput__wrapper) {
  border-color: var(--color-border-input-hover);
}

.sinput__wrapper:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 1px var(--color-brand-primary);
}

.sinput__field {
  flex: 1;
  height: 100%;
  padding: 0 var(--space-m);
  background: transparent;
  border: none;
  font: var(--text-body-1);
  color: var(--color-fg-primary);
}

.sinput__field::placeholder {
  color: var(--color-fg-tertiary);
}

.sinput__field:focus {
  outline: none;
}

.sinput__affix {
  display: flex;
  align-items: center;
  padding: 0 var(--space-s);
  color: var(--color-fg-secondary);
  font: var(--text-body-2);
}

.sinput__prefix {
  padding-left: var(--space-m);
  padding-right: 0;
}

.sinput__suffix {
  padding-right: var(--space-m);
  padding-left: 0;
}

.sinput--error .sinput__wrapper {
  border-color: var(--color-error);
}

.sinput--error .sinput__wrapper:focus-within {
  box-shadow: 0 0 0 1px var(--color-error);
}

.sinput--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.sinput__message {
  font: var(--text-caption);
}

.sinput__message--hint {
  color: var(--color-fg-secondary);
}

.sinput__message--error {
  color: var(--color-error);
}
</style>
