<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SToggle from '@/components/ui/SToggle.vue'
import SButton from '@/components/ui/SButton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

const props = defineProps<{
  open: boolean
  tracker: Tracker
  entry?: TrackerEntry | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: {
    entry_date: string
    numeric_value: number | null
    text_value: string | null
    boolean_value: boolean | null
    notes: string | null
    tags: string | null
  }]
}>()

const formDate = ref(new Date().toISOString().slice(0, 10))
const formNumericValue = ref('')
const formTextValue = ref('')
const formBooleanValue = ref(false)
const formDurationHours = ref('')
const formDurationMinutes = ref('')
const formCounterValue = ref(1)
const formNotes = ref('')
const formTags = ref('')

const parsedCategories = computed<string[]>(() => {
  if (!props.tracker.categories) return []
  try {
    const parsed = JSON.parse(props.tracker.categories)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return props.tracker.categories.split(',').map((c) => c.trim()).filter(Boolean)
  }
})

watch(() => props.open, (isOpen) => {
  if (isOpen && props.entry) {
    formDate.value = props.entry.entry_date
    formNumericValue.value = props.entry.numeric_value?.toString() ?? ''
    formTextValue.value = props.entry.text_value ?? ''
    formBooleanValue.value = props.entry.boolean_value ?? false
    formNotes.value = props.entry.notes ?? ''
    formTags.value = props.entry.tags ?? ''

    if (props.tracker.value_type === 'duration' && props.entry.numeric_value !== null) {
      formDurationHours.value = Math.floor(props.entry.numeric_value / 60).toString()
      formDurationMinutes.value = (props.entry.numeric_value % 60).toString()
    }
    if (props.tracker.value_type === 'counter' && props.entry.numeric_value !== null) {
      formCounterValue.value = props.entry.numeric_value
    }
  } else if (isOpen) {
    formDate.value = new Date().toISOString().slice(0, 10)
    formNumericValue.value = ''
    formTextValue.value = ''
    formBooleanValue.value = false
    formDurationHours.value = ''
    formDurationMinutes.value = ''
    formCounterValue.value = 1
    formNotes.value = ''
    formTags.value = ''
  }
})

function handleSubmit() {
  let numericValue: number | null = null
  let textValue: string | null = null
  let booleanValue: boolean | null = null

  switch (props.tracker.value_type) {
    case 'numeric':
      numericValue = formNumericValue.value ? parseFloat(formNumericValue.value) : null
      break
    case 'boolean':
      booleanValue = formBooleanValue.value
      break
    case 'category':
      textValue = formTextValue.value || null
      break
    case 'duration':
      numericValue = (parseInt(formDurationHours.value || '0') * 60) + parseInt(formDurationMinutes.value || '0')
      break
    case 'counter':
      numericValue = formCounterValue.value
      break
  }

  emit('submit', {
    entry_date: formDate.value,
    numeric_value: numericValue,
    text_value: textValue,
    boolean_value: booleanValue,
    notes: formNotes.value.trim() || null,
    tags: formTags.value.trim() || null,
  })
}
</script>

<template>
  <FormDrawer
    :open="open"
    :title="entry ? 'Edit Entry' : 'Log Entry'"
    :submit-label="entry ? 'Update' : 'Log'"
    :loading="loading"
    @close="$emit('close')"
    @submit="handleSubmit"
  >
    <FormSection>
      <FormField>
        <SInput v-model="formDate" label="Date" type="date" required />
      </FormField>

      <!-- Numeric -->
      <FormField v-if="tracker.value_type === 'numeric'">
        <SInput
          v-model="formNumericValue"
          :label="`Value${tracker.unit ? ` (${tracker.unit})` : ''}`"
          type="number"
          placeholder="Enter value"
          required
        />
      </FormField>

      <!-- Boolean -->
      <FormField v-if="tracker.value_type === 'boolean'">
        <SToggle v-model="formBooleanValue" label="Done / Yes" />
      </FormField>

      <!-- Category -->
      <FormField v-if="tracker.value_type === 'category'">
        <div class="category-picker">
          <label class="category-picker__label">Category</label>
          <div class="category-picker__chips">
            <button
              v-for="cat in parsedCategories"
              :key="cat"
              :class="['category-chip', { 'category-chip--active': formTextValue === cat }]"
              type="button"
              @click="formTextValue = formTextValue === cat ? '' : cat"
            >
              {{ cat }}
            </button>
          </div>
          <SInput v-if="!parsedCategories.length" v-model="formTextValue" label="Value" placeholder="Enter category value" />
        </div>
      </FormField>

      <!-- Duration -->
      <template v-if="tracker.value_type === 'duration'">
        <div class="duration-row">
          <FormField>
            <SInput v-model="formDurationHours" label="Hours" type="number" placeholder="0" />
          </FormField>
          <FormField>
            <SInput v-model="formDurationMinutes" label="Minutes" type="number" placeholder="0" />
          </FormField>
        </div>
      </template>

      <!-- Counter -->
      <FormField v-if="tracker.value_type === 'counter'">
        <div class="counter-control">
          <label class="counter-control__label">Count{{ tracker.unit ? ` (${tracker.unit})` : '' }}</label>
          <div class="counter-control__row">
            <SButton size="sm" variant="secondary" @click="formCounterValue = Math.max(0, formCounterValue - 1)">−</SButton>
            <span class="counter-control__value">{{ formCounterValue }}</span>
            <SButton size="sm" variant="secondary" @click="formCounterValue++">+</SButton>
          </div>
        </div>
      </FormField>
    </FormSection>

    <FormSection title="Notes">
      <FormField>
        <STextarea v-model="formNotes" label="Notes" :rows="2" placeholder="Any additional context..." />
      </FormField>
      <FormField>
        <SInput v-model="formTags" label="Tags" placeholder="e.g. cramps, headache, start" />
      </FormField>
    </FormSection>
  </FormDrawer>
</template>

<style scoped>
.category-picker__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  display: block;
  margin-bottom: var(--space-xs);
}
.category-picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.category-chip {
  padding: var(--space-xs) var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  background: var(--color-surface-container-low);
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--easing-standard);
}
.category-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.category-chip--active {
  background: var(--color-accent-subtle);
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 500;
}

.duration-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

.counter-control__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  display: block;
  margin-bottom: var(--space-xs);
}
.counter-control__row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}
.counter-control__value {
  font: var(--text-headline-s);
  color: var(--color-fg-primary);
  min-width: 3ch;
  text-align: center;
}
</style>
