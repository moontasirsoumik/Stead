<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    label?: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)
</script>

<template>
  <label :class="['scheckbox', { 'scheckbox--disabled': disabled }]">
    <input
      v-model="model"
      type="checkbox"
      :disabled="disabled"
      class="scheckbox__input"
    />

    <span class="scheckbox__box" aria-hidden="true">
      <svg
        v-if="model"
        class="scheckbox__check"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <span v-if="label" class="scheckbox__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.scheckbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-s);
  cursor: pointer;
  user-select: none;
}

.scheckbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.scheckbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border: 1.5px solid var(--color-border-strong);
  border-radius: var(--radius-s);
  background: var(--color-surface-input);
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard);
}

.scheckbox:hover .scheckbox__box {
  border-color: var(--color-brand-primary);
}

.scheckbox__input:checked + .scheckbox__box {
  background: var(--color-brand-primary);
  border-color: var(--color-brand-primary);
}

.scheckbox__input:focus-visible + .scheckbox__box {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 1px;
}

.scheckbox__check {
  color: var(--color-fg-on-brand);
}

.scheckbox__label {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
}

.scheckbox--disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>
