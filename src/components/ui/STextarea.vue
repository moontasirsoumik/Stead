<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
    rows?: number
    maxlength?: number
  }>(),
  {
    disabled: false,
    required: false,
    rows: 3,
  },
)
</script>

<template>
  <div :class="['stextarea', { 'stextarea--error': error, 'stextarea--disabled': disabled }]">
    <label v-if="label" class="stextarea__label">
      {{ label }}
      <span v-if="required" class="stextarea__required" aria-hidden="true">*</span>
    </label>

    <textarea
      v-model="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :maxlength="maxlength"
      :aria-invalid="!!error"
      class="stextarea__field"
    />

    <div class="stextarea__footer">
      <p v-if="error" class="stextarea__message stextarea__message--error" role="alert">
        {{ error }}
      </p>
      <p v-else-if="hint" class="stextarea__message stextarea__message--hint">
        {{ hint }}
      </p>
      <span v-if="maxlength" class="stextarea__count">
        {{ model.length }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.stextarea {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stextarea__label {
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.stextarea__required {
  color: var(--color-error);
  margin-left: var(--space-2xs);
}

.stextarea__field {
  width: 100%;
  padding: var(--space-s) var(--space-m);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  resize: vertical;
  min-height: 56px;
  transition: border-color var(--duration-fast) var(--easing-standard);
}

.stextarea__field::placeholder {
  color: var(--color-fg-tertiary);
}

.stextarea__field:hover:not(:disabled) {
  border-color: var(--color-border-input-hover);
}

.stextarea__field:focus {
  outline: none;
  border-color: var(--color-brand-primary);
}

.stextarea--error .stextarea__field {
  border-color: var(--color-error);
}

.stextarea--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.stextarea__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stextarea__message {
  font: var(--text-caption);
}

.stextarea__message--hint { color: var(--color-fg-secondary); }
.stextarea__message--error { color: var(--color-error); }

.stextarea__count {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-left: auto;
}
</style>
