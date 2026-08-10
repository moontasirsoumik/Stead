<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import type { Member } from '@/models/member.model'

export type PersonKind = 'member' | 'external'

export interface PersonValue {
  type: PersonKind
  memberId: string | null
  name: string
}

const props = withDefaults(defineProps<{
  modelValue?: PersonValue | null
  members: Member[]
  label: string
  placeholder?: string
  required?: boolean
  allowExternal?: boolean
}>(), {
  placeholder: 'Search or add a person',
  required: false,
  allowExternal: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: PersonValue]
}>()

const root = ref<HTMLElement | null>(null)
const search = ref('')
const open = ref(false)

const selectedMember = computed(() => {
  if (props.modelValue?.type !== 'member' || !props.modelValue.memberId) return null
  return props.members.find((member) => member.id === props.modelValue?.memberId) ?? null
})

const selectedName = computed(() => {
  if (props.modelValue?.type === 'external') return props.modelValue.name
  return selectedMember.value?.name ?? props.modelValue?.name ?? ''
})

const selectedColor = computed(() => selectedMember.value?.color)
const normalizedSelectedName = computed(() => selectedName.value.trim().toLowerCase())
const query = computed(() => search.value.trim().toLowerCase())

const memberOptions = computed(() =>
  props.members.filter((member) => {
    const sameId = props.modelValue?.type === 'member' && props.modelValue.memberId === member.id
    const sameName = !!normalizedSelectedName.value && member.name.trim().toLowerCase() === normalizedSelectedName.value
    return !sameId
      && !sameName
      && (!query.value || member.name.toLowerCase().includes(query.value))
  }),
)

const exactMemberMatch = computed(() => {
  if (!query.value) return null
  if (query.value === normalizedSelectedName.value) return null
  return props.members.find((member) => member.name.toLowerCase() === query.value) ?? null
})

const canAddExternal = computed(() =>
  props.allowExternal
  && !!search.value.trim()
  && query.value !== normalizedSelectedName.value
  && !exactMemberMatch.value,
)

function syncSearch() {
  search.value = selectedName.value
}

function selectMember(member: Member) {
  emit('update:modelValue', {
    type: 'member',
    memberId: member.id,
    name: member.name,
  })
  search.value = member.name
  open.value = false
}

function selectExternal(name = search.value) {
  const trimmed = name.trim()
  if (!trimmed || !props.allowExternal) return
  emit('update:modelValue', {
    type: 'external',
    memberId: null,
    name: trimmed,
  })
  search.value = trimmed
  open.value = false
}

function commitSearch() {
  const trimmed = search.value.trim()
  if (!trimmed) {
    syncSearch()
    open.value = false
    return
  }

  const member = props.members.find((item) => item.name.toLowerCase() === trimmed.toLowerCase())
  if (member) {
    selectMember(member)
  } else {
    selectExternal(trimmed)
  }
}

function handlePointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof Node) || !root.value || root.value.contains(target)) return
  commitSearch()
  open.value = false
}

watch(
  () => [props.modelValue?.type, props.modelValue?.memberId, props.modelValue?.name, props.members.length],
  syncSearch,
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
})
</script>

<template>
  <div ref="root" class="person-picker">
    <label class="person-picker__label">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <div class="person-picker__control">
      <SAvatar
        v-if="selectedName"
        :name="selectedName"
        :color="selectedColor"
        size="sm"
      />
      <input
        v-model="search"
        class="person-picker__input"
        type="text"
        autocomplete="off"
        :placeholder="placeholder"
        :required="required"
        @focus="open = true"
        @input="open = true"
        @keydown.enter.prevent="commitSearch"
        @keydown.esc.prevent="open = false; syncSearch()"
      >
    </div>

    <div v-if="open" class="person-picker__menu">
      <div v-if="memberOptions.length" class="person-picker__section">Household</div>
      <button
        v-for="member in memberOptions"
        :key="member.id"
        class="person-picker__option"
        type="button"
        @mousedown.prevent="selectMember(member)"
      >
        <SAvatar :name="member.name" :color="member.color" size="sm" />
        <span>{{ member.name }}</span>
      </button>

      <div v-if="canAddExternal" class="person-picker__section">Outside household</div>
      <button
        v-if="canAddExternal"
        class="person-picker__option person-picker__option--add"
        type="button"
        @mousedown.prevent="selectExternal()"
      >
        <span class="material-symbols-rounded">add</span>
        <span>Add "{{ search.trim() }}"</span>
      </button>

      <div v-if="!memberOptions.length && !canAddExternal" class="person-picker__empty">
        No more matches
      </div>
    </div>
  </div>
</template>

<style scoped>
.person-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.person-picker__label {
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.person-picker__label span {
  color: var(--color-error);
  margin-left: var(--space-2xs);
}

.person-picker__control {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-height: var(--height-input);
  padding: 0 var(--space-m);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.person-picker__control:focus-within {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(74, 85, 120, 0.12);
}

.person-picker__input {
  flex: 1;
  min-width: 0;
  height: calc(var(--height-input) - 2px);
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-fg-primary);
  font: var(--text-body-1);
}

.person-picker__input::placeholder {
  color: var(--color-fg-tertiary);
}

.person-picker__menu {
  position: absolute;
  top: calc(100% + var(--space-2xs));
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 220px;
  overflow-y: auto;
  padding: var(--space-s);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-dialog);
  box-shadow: var(--shadow-dialog);
}

.person-picker__section {
  padding: var(--space-xs) var(--space-s) var(--space-2xs);
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.person-picker__option {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  width: 100%;
  min-height: 42px;
  padding: var(--space-s);
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-fg-primary);
  font: var(--text-body-2);
  text-align: left;
  cursor: pointer;
}

.person-picker__option:hover {
  background: var(--color-surface-container-low);
}

.person-picker__option--add {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
}

.person-picker__option .material-symbols-rounded {
  font-size: 18px;
}

.person-picker__empty {
  padding: var(--space-m) var(--space-s);
  color: var(--color-fg-tertiary);
  font: var(--text-body-2);
  text-align: center;
}
</style>
