<script setup lang="ts">
export interface SortOption {
  value: string
  label: string
}

import { ref } from 'vue'

const model = defineModel<string>({ required: true })

defineProps<{
  options: SortOption[]
}>()

const open = ref(false)

function select(value: string) {
  model.value = value
  open.value = false
}
</script>

<template>
  <div class="sortmenu">
    <button class="sortmenu__trigger" @click="open = !open">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span>Sort</span>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="sortmenu__dropdown">
        <button
          v-for="opt in options"
          :key="opt.value"
          :class="['sortmenu__option', { 'sortmenu__option--active': model === opt.value }]"
          @click="select(opt.value)"
        >
          {{ opt.label }}
          <svg
            v-if="model === opt.value"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </Transition>

    <div v-if="open" class="sortmenu__backdrop" @click="open = false" />
  </div>
</template>

<style scoped>
.sortmenu {
  position: relative;
}

.sortmenu__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-m);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-primary);
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.sortmenu__trigger:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-2);
}

.sortmenu__dropdown {
  position: absolute;
  top: calc(100% + var(--space-xs));
  right: 0;
  min-width: 180px;
  background: var(--color-surface-dialog);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-8);
  padding: var(--space-xs);
  z-index: 50;
}

.sortmenu__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-s) var(--space-m);
  border-radius: var(--radius-s);
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.sortmenu__option:hover {
  background: var(--color-bg-secondary);
}

.sortmenu__option--active {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-semibold);
}

.sortmenu__backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
}

/* Transition */
.dropdown-enter-active {
  transition: opacity var(--duration-fast) var(--easing-decelerate),
    transform var(--duration-fast) var(--easing-decelerate);
}

.dropdown-leave-active {
  transition: opacity var(--duration-ultra-fast) var(--easing-accelerate);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.dropdown-leave-to {
  opacity: 0;
}
</style>
