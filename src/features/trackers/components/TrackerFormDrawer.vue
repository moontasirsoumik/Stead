<script setup lang="ts">
import { ref, watch } from 'vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SToggle from '@/components/ui/SToggle.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import type { Tracker } from '@/models/tracker.model'
import type { TrackerValueType, TargetDirection } from '@/models/enums'

const props = defineProps<{
  open: boolean
  tracker?: Tracker | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: {
    name: string
    description: string | null
    icon: string | null
    color: string | null
    value_type: TrackerValueType
    unit: string | null
    categories: string | null
    target_value: number | null
    target_direction: TargetDirection | null
    is_cyclic: boolean
  }]
}>()

const formName = ref('')
const formDescription = ref('')
const formIcon = ref('')
const formColor = ref('')
const formValueType = ref<TrackerValueType>('numeric')
const formUnit = ref('')
const formCategories = ref('')
const formTargetValue = ref('')
const formTargetDirection = ref<TargetDirection | ''>('')
const formIsCyclic = ref(false)

const valueTypeOptions = [
  { value: 'numeric', label: 'Numeric (weight, amount, etc.)' },
  { value: 'boolean', label: 'Yes/No (did or didn\'t)' },
  { value: 'category', label: 'Category (mood, intensity, etc.)' },
  { value: 'duration', label: 'Duration (hours & minutes)' },
  { value: 'counter', label: 'Counter (daily count)' },
]

const colorOptions = [
  { value: '', label: 'Default' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'amber', label: 'Amber' },
  { value: 'green', label: 'Green' },
  { value: 'teal', label: 'Teal' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'rose', label: 'Rose' },
  { value: 'slate', label: 'Slate' },
]

const directionOptions = [
  { value: '', label: 'None' },
  { value: 'increase', label: 'Increase (e.g. savings)' },
  { value: 'decrease', label: 'Decrease (e.g. weight loss)' },
  { value: 'maintain', label: 'Maintain (stay around target)' },
]

watch(() => props.open, (isOpen) => {
  if (isOpen && props.tracker) {
    formName.value = props.tracker.name
    formDescription.value = props.tracker.description ?? ''
    formIcon.value = props.tracker.icon ?? ''
    formColor.value = props.tracker.color ?? ''
    formValueType.value = props.tracker.value_type
    formUnit.value = props.tracker.unit ?? ''
    formCategories.value = props.tracker.categories ?? ''
    formTargetValue.value = props.tracker.target_value?.toString() ?? ''
    formTargetDirection.value = props.tracker.target_direction ?? ''
    formIsCyclic.value = props.tracker.is_cyclic
  } else if (isOpen) {
    formName.value = ''
    formDescription.value = ''
    formIcon.value = ''
    formColor.value = ''
    formValueType.value = 'numeric'
    formUnit.value = ''
    formCategories.value = ''
    formTargetValue.value = ''
    formTargetDirection.value = ''
    formIsCyclic.value = false
  }
})

function handleSubmit() {
  if (!formName.value.trim()) return
  emit('submit', {
    name: formName.value.trim(),
    description: formDescription.value.trim() || null,
    icon: formIcon.value.trim() || null,
    color: formColor.value || null,
    value_type: formValueType.value,
    unit: formUnit.value.trim() || null,
    categories: formCategories.value.trim() || null,
    target_value: formTargetValue.value ? parseFloat(formTargetValue.value) : null,
    target_direction: formTargetDirection.value || null,
    is_cyclic: formIsCyclic.value,
  })
}
</script>

<template>
  <FormDrawer
    :open="open"
    :title="tracker ? 'Edit Tracker' : 'New Tracker'"
    :submit-label="tracker ? 'Update' : 'Create'"
    :loading="loading"
    @close="$emit('close')"
    @submit="handleSubmit"
  >
    <FormSection title="Basics">
      <FormField>
        <SInput v-model="formName" label="Name" required placeholder="e.g. Weight, Period, Savings" />
      </FormField>
      <FormField>
        <STextarea v-model="formDescription" label="Description" :rows="2" placeholder="What are you tracking?" />
      </FormField>
      <FormField>
        <SInput v-model="formIcon" label="Icon" placeholder="Material Symbol name (e.g. monitor_weight)" />
      </FormField>
      <FormField>
        <SSelect v-model="formColor" :options="colorOptions" label="Color" />
      </FormField>
    </FormSection>

    <FormSection title="Data Type">
      <FormField>
        <SSelect v-model="formValueType" :options="valueTypeOptions" label="Value Type" />
      </FormField>
      <FormField v-if="formValueType === 'numeric' || formValueType === 'duration' || formValueType === 'counter'">
        <SInput v-model="formUnit" label="Unit" placeholder="e.g. kg, $, hours, glasses" />
      </FormField>
      <FormField v-if="formValueType === 'category'">
        <SInput v-model="formCategories" label="Categories" placeholder='e.g. ["light","medium","heavy"]' />
      </FormField>
    </FormSection>

    <FormSection title="Goal (optional)">
      <FormField>
        <SInput v-model="formTargetValue" label="Target Value" type="number" placeholder="e.g. 70" />
      </FormField>
      <FormField>
        <SSelect v-model="formTargetDirection" :options="directionOptions" label="Direction" />
      </FormField>
    </FormSection>

    <FormSection title="Pattern Detection">
      <FormField>
        <SToggle v-model="formIsCyclic" label="Cyclic tracking" description="Enable cycle detection (e.g. for period tracking)" />
      </FormField>
    </FormSection>
  </FormDrawer>
</template>
