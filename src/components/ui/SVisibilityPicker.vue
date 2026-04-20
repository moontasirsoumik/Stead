<script setup lang="ts">
import type { Visibility } from '@/models/enums'

const model = defineModel<Visibility>({ default: 'private' })

defineProps<{
  label?: string
}>()

const options: { value: Visibility; label: string; icon: string; desc: string }[] = [
  { value: 'private', label: 'Private', icon: 'lock', desc: 'Only you' },
  { value: 'shared', label: 'Shared', icon: 'group', desc: 'Select people' },
  { value: 'household', label: 'Everyone', icon: 'home', desc: 'All members' },
]
</script>

<template>
  <div class="vis-picker">
    <label v-if="label" class="vis-picker__label">{{ label }}</label>
    <div class="vis-picker__options">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        :class="['vis-picker__option', { 'vis-picker__option--active': model === opt.value }]"
        @click="model = opt.value"
      >
        <span class="vis-picker__icon material-symbols-rounded">{{ opt.icon }}</span>
        <span class="vis-picker__text">
          <span class="vis-picker__name">{{ opt.label }}</span>
          <span class="vis-picker__desc">{{ opt.desc }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.vis-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.vis-picker__label {
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.vis-picker__options {
  display: flex;
  gap: var(--space-xs);
}

.vis-picker__option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-m);
  border: 1.5px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.vis-picker__option:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-tertiary);
}

.vis-picker__option--active {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-selected);
  box-shadow: 0 0 0 1px var(--color-brand-primary) inset;
}

.vis-picker__option--active:hover {
  background: var(--color-brand-selected);
  border-color: var(--color-brand-hover);
}

.vis-picker__icon {
  font-size: 1.125rem;
  color: var(--color-fg-tertiary);
  line-height: 1;
}

.vis-picker__option--active .vis-picker__icon {
  color: var(--color-brand-primary);
}

.vis-picker__text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.vis-picker__name {
  font: var(--text-label-md);
  color: var(--color-fg-primary);
}

.vis-picker__desc {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.vis-picker__option--active .vis-picker__name {
  color: var(--color-brand-primary);
}

@media (max-width: 640px) {
  .vis-picker__options {
    flex-direction: column;
  }
}
</style>
