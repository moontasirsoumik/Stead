<script setup lang="ts">
import { ref, computed, watch, nextTick, useId, onMounted, onBeforeUnmount } from 'vue'

const id = useId()
const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
  }>(),
  { placeholder: 'HH:MM', disabled: false, required: false },
)

const open = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const hourCol = ref<HTMLElement | null>(null)
const minuteCol = ref<HTMLElement | null>(null)

/* Parse model into hour/minute */
const parsed = computed(() => {
  const m = model.value.match(/^(\d{1,2}):(\d{2})$/)
  return m ? { h: parseInt(m[1], 10), m: parseInt(m[2], 10) } : null
})

const displayValue = computed(() => model.value || '')

/* Data for columns */
const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 12 }, (_, i) => i * 5) // 0,5,10...55

/* Input handling — allow manual entry */
function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  model.value = raw
}

function onBlur() {
  /* Auto-fix partial entries */
  const v = model.value.trim()
  if (!v) return

  /* Try various formats */
  let match = v.match(/^(\d{1,2}):(\d{2})$/)
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)))
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)))
    model.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return
  }

  match = v.match(/^(\d{1,2}):(\d{1})$/)
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)))
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10) * 10))
    model.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return
  }

  match = v.match(/^(\d{1,2})$/)
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)))
    model.value = `${String(h).padStart(2, '0')}:00`
    return
  }

  /* Invalid — clear */
  model.value = ''
}

/* Picker toggle */
function togglePicker() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    nextTick(scrollToSelected)
  }
}

function scrollToSelected() {
  const p = parsed.value
  if (!p) return
  const hEl = hourCol.value?.querySelector(`[data-value="${p.h}"]`) as HTMLElement | null
  const mEl = minuteCol.value?.querySelector(`[data-value="${p.m}"]`) as HTMLElement | null
  hEl?.scrollIntoView({ block: 'center', behavior: 'instant' })
  mEl?.scrollIntoView({ block: 'center', behavior: 'instant' })
}

function selectHour(h: number) {
  const m = parsed.value?.m ?? 0
  model.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function selectMinute(m: number) {
  const h = parsed.value?.h ?? 12
  model.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/* Close on outside click */
function onClickOutside(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onClickOutside))
</script>

<template>
  <div
    ref="wrapperRef"
    :class="['stimepicker', { 'stimepicker--error': error, 'stimepicker--disabled': disabled }]"
  >
    <label v-if="label" class="stimepicker__label" :for="id">
      {{ label }}
      <span v-if="required" class="stimepicker__required" aria-hidden="true">*</span>
    </label>

    <div class="stimepicker__control">
      <input
        :id="id"
        class="stimepicker__input"
        type="text"
        inputmode="numeric"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
        autocomplete="off"
        @input="onInput"
        @blur="onBlur"
        @focus="togglePicker"
      />

      <button
        type="button"
        class="stimepicker__trigger"
        tabindex="-1"
        :disabled="disabled"
        aria-label="Pick time"
        @pointerdown.prevent="togglePicker"
      >
        <span class="stimepicker__icon" aria-hidden="true">schedule</span>
      </button>

      <!-- Dropdown picker -->
      <Transition name="picker-fade">
        <div v-if="open" class="stimepicker__dropdown" role="listbox" aria-label="Time picker">
          <div ref="hourCol" class="stimepicker__column">
            <div class="stimepicker__column-label">Hr</div>
            <div class="stimepicker__scroll">
              <button
                v-for="h in hours"
                :key="h"
                type="button"
                :class="['stimepicker__option', { 'stimepicker__option--active': parsed?.h === h }]"
                :data-value="h"
                tabindex="-1"
                @pointerdown.prevent="selectHour(h)"
              >
                {{ String(h).padStart(2, '0') }}
              </button>
            </div>
          </div>

          <div class="stimepicker__divider" />

          <div ref="minuteCol" class="stimepicker__column">
            <div class="stimepicker__column-label">Min</div>
            <div class="stimepicker__scroll">
              <button
                v-for="m in minutes"
                :key="m"
                type="button"
                :class="['stimepicker__option', { 'stimepicker__option--active': parsed?.m === m }]"
                :data-value="m"
                tabindex="-1"
                @pointerdown.prevent="selectMinute(m)"
              >
                {{ String(m).padStart(2, '0') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <p v-if="error" :id="`${id}-error`" class="stimepicker__message stimepicker__message--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="stimepicker__message stimepicker__message--hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.stimepicker {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.stimepicker__label {
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.stimepicker__required {
  color: var(--color-error);
  margin-left: var(--space-2xs);
}

.stimepicker__control {
  position: relative;
  display: flex;
  align-items: center;
  height: var(--height-input);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  overflow: visible;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.stimepicker__control:hover:not(.stimepicker--disabled .stimepicker__control) {
  border-color: var(--color-border-input-hover);
}

.stimepicker__control:focus-within {
  border-color: var(--color-brand-primary);
}

.stimepicker__input {
  flex: 1;
  height: 100%;
  min-width: 0;
  padding: 0 var(--space-m);
  background: transparent;
  border: none;
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  letter-spacing: 0.04em;
}

.stimepicker__input::placeholder {
  color: var(--color-fg-tertiary);
}

.stimepicker__input:focus {
  outline: none;
}

.stimepicker__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-fg-secondary);
  transition: color var(--duration-fast) var(--easing-standard);
}

.stimepicker__trigger:hover {
  color: var(--color-brand-primary);
}

.stimepicker__icon {
  font-family: 'Material Symbols Rounded';
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1;
}

/* ── Dropdown ── */
.stimepicker__dropdown {
  position: absolute;
  top: calc(100% + var(--space-xs));
  left: 0;
  z-index: 100;
  display: flex;
  gap: 0;
  background: var(--color-surface-dialog);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  min-width: 160px;
}

.stimepicker__column {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stimepicker__column-label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-align: center;
  padding: var(--space-s) var(--space-xs);
  border-bottom: 1px solid var(--color-border-subtle);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stimepicker__scroll {
  overflow-y: auto;
  max-height: 200px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-outline-variant) transparent;
  padding: var(--space-2xs) 0;
}

.stimepicker__scroll::-webkit-scrollbar {
  width: 4px;
}

.stimepicker__scroll::-webkit-scrollbar-thumb {
  background: var(--color-outline-variant);
  border-radius: 2px;
}

.stimepicker__divider {
  width: 1px;
  background: var(--color-border-subtle);
}

.stimepicker__option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  font: var(--text-body-2);
  font-variant-numeric: tabular-nums;
  color: var(--color-fg-primary);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.stimepicker__option:hover {
  background: var(--color-brand-subtle);
}

.stimepicker__option--active {
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: 600;
}

.stimepicker__option--active:hover {
  background: var(--color-brand-hover);
}

/* ── States ── */
.stimepicker--error .stimepicker__control {
  border-color: var(--color-error);
}

.stimepicker--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.stimepicker__message {
  font: var(--text-caption);
}

.stimepicker__message--hint {
  color: var(--color-fg-secondary);
}

.stimepicker__message--error {
  color: var(--color-error);
}

/* ── Transition ── */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition:
    opacity var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
