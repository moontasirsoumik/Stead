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
  <label :class="['stoggle', { 'stoggle--disabled': disabled }]">
    <input
      v-model="model"
      type="checkbox"
      role="switch"
      :disabled="disabled"
      class="stoggle__input"
    />

    <span class="stoggle__track" :class="{ 'stoggle__track--on': model }" aria-hidden="true">
      <span class="stoggle__thumb" />
    </span>

    <span v-if="label" class="stoggle__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.stoggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-s);
  cursor: pointer;
  user-select: none;
}

.stoggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.stoggle__track {
  position: relative;
  width: 40px;
  height: 20px;
  background: var(--color-border-strong);
  border-radius: 10px;
  transition:
    background-color var(--duration-fast) var(--easing-standard);
  flex-shrink: 0;
}

.stoggle__track--on {
  background: var(--color-brand-primary);
}

.stoggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--color-fg-on-brand);
  border-radius: var(--radius-circle);
  box-shadow: var(--shadow-2);
  transition:
    transform var(--duration-fast) var(--easing-decelerate);
}

.stoggle__track--on .stoggle__thumb {
  transform: translateX(20px);
}

.stoggle__input:focus-visible + .stoggle__track {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.stoggle__label {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
}

.stoggle--disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>
