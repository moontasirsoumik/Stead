<script setup lang="ts">
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    options: SelectOption[]
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    disabled: false,
    required: false,
  },
)
</script>

<template>
  <div :class="['sselect', { 'sselect--error': error, 'sselect--disabled': disabled }]">
    <label v-if="label" class="sselect__label">
      {{ label }}
      <span v-if="required" class="sselect__required" aria-hidden="true">*</span>
    </label>

    <div class="sselect__wrapper">
      <select
        v-model="model"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :class="['sselect__field', { 'sselect__field--placeholder': !model }]"
      >
        <option v-if="placeholder" value="" disabled class="sselect__placeholder-opt">{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </select>

      <span class="sselect__chevron" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <p v-if="error" class="sselect__message sselect__message--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="sselect__message sselect__message--hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.sselect {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sselect__label {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.sselect__required {
  color: var(--color-error);
  margin-left: var(--space-2xs);
}

.sselect__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.sselect__field {
  width: 100%;
  height: var(--height-input);
  padding: 0 var(--space-2xl) 0 var(--space-m);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  appearance: none;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

/* Ensure dropdown options have proper contrast in all themes */
.sselect__field option {
  background: var(--color-surface-dialog);
  color: var(--color-fg-primary);
}

.sselect__field option:disabled {
  color: var(--color-fg-tertiary);
}

/* Hide placeholder option from the dropdown list */
.sselect__placeholder-opt {
  display: none;
}

/* Placeholder state — when no value selected */
.sselect__field--placeholder,
.sselect__field:invalid,
.sselect__field option[value=""][disabled] {
  color: var(--color-fg-tertiary);
}

.sselect__field:hover:not(:disabled) {
  border-color: var(--color-border-input-hover);
}

.sselect__field:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 1px var(--color-brand-primary);
}

.sselect__chevron {
  position: absolute;
  right: var(--space-m);
  pointer-events: none;
  color: var(--color-fg-tertiary);
  display: flex;
}

.sselect--error .sselect__field {
  border-color: var(--color-error);
}

.sselect--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.sselect__message {
  font: var(--text-caption);
}

.sselect__message--hint { color: var(--color-fg-secondary); }
.sselect__message--error { color: var(--color-error); }
</style>
