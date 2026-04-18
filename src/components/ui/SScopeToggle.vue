<script setup lang="ts">
import type { DataScope } from '@/models/enums'

const modelValue = defineModel<DataScope>({ default: 'household' })
</script>

<template>
  <div class="scope-toggle" role="radiogroup" aria-label="Data scope">
    <button
      :class="['scope-toggle__btn', { 'scope-toggle__btn--active': modelValue === 'household' }]"
      role="radio"
      :aria-checked="modelValue === 'household'"
      @click="modelValue = 'household'"
    >
      Household
    </button>
    <button
      :class="['scope-toggle__btn', { 'scope-toggle__btn--active': modelValue === 'personal' }]"
      role="radio"
      :aria-checked="modelValue === 'personal'"
      @click="modelValue = 'personal'"
    >
      Personal
    </button>
    <div class="scope-toggle__pill" :class="{ 'scope-toggle__pill--right': modelValue === 'personal' }" />
  </div>
</template>

<style scoped>
.scope-toggle {
  display: inline-flex;
  position: relative;
  gap: var(--space-2xs);
  padding: var(--space-2xs);
  background: var(--color-surface-container);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  width: fit-content;
}

.scope-toggle__btn {
  position: relative;
  z-index: 1;
  height: var(--height-control-sm);
  padding: 0 var(--space-l);
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-s);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--duration-fast) var(--easing-standard);
}

.scope-toggle__btn:hover {
  color: var(--color-fg-primary);
}

.scope-toggle__btn--active {
  color: var(--color-fg-on-brand);
}

.scope-toggle__btn--active:hover {
  color: var(--color-fg-on-brand);
}

.scope-toggle__pill {
  position: absolute;
  top: var(--space-2xs);
  left: var(--space-2xs);
  width: calc(50% - var(--space-2xs));
  height: calc(100% - var(--space-2xs) * 2);
  background: var(--color-brand-primary);
  border-radius: var(--radius-s);
  z-index: 0;
  transition: transform var(--duration-normal) cubic-bezier(0.4, 0, 0, 1);
}

.scope-toggle__pill--right {
  transform: translateX(100%);
}
</style>
