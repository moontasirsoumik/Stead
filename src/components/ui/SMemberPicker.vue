<script setup lang="ts">
import { computed } from 'vue'
import type { Member } from '@/models/member.model'

const model = defineModel<string[]>({ default: () => [] })

const props = defineProps<{
  members: Member[]
  label?: string
  currentMemberId?: string
}>()

const selectableMembers = computed(() =>
  props.members.filter((m) => m.active && m.id !== props.currentMemberId),
)

function toggle(memberId: string) {
  const idx = model.value.indexOf(memberId)
  if (idx >= 0) {
    model.value = model.value.filter((id) => id !== memberId)
  } else {
    model.value = [...model.value, memberId]
  }
}

function isSelected(memberId: string) {
  return model.value.includes(memberId)
}

function selectAll() {
  model.value = selectableMembers.value.map((m) => m.id)
}

function selectNone() {
  model.value = []
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <div class="member-picker">
    <div v-if="label" class="member-picker__header">
      <label class="member-picker__label">{{ label }}</label>
      <div class="member-picker__actions">
        <button type="button" class="member-picker__link" @click="selectAll">All</button>
        <button type="button" class="member-picker__link" @click="selectNone">None</button>
      </div>
    </div>
    <div class="member-picker__grid">
      <button
        v-for="member in selectableMembers"
        :key="member.id"
        type="button"
        :class="['member-chip', { 'member-chip--active': isSelected(member.id) }]"
        @click="toggle(member.id)"
      >
        <span
          class="member-chip__avatar"
          :style="{ background: member.color }"
        >{{ initials(member.name) }}</span>
        <span class="member-chip__name">{{ member.name }}</span>
      </button>
    </div>
    <p v-if="!selectableMembers.length" class="member-picker__empty">
      No other members in this household
    </p>
  </div>
</template>

<style scoped>
.member-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.member-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-picker__label {
  font: var(--text-label-md);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.member-picker__actions {
  display: flex;
  gap: var(--space-s);
}

.member-picker__link {
  font: var(--text-caption);
  color: var(--color-brand-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.member-picker__link:hover {
  color: var(--color-brand-hover);
}

.member-picker__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.member-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-2xs) var(--space-s) var(--space-2xs) var(--space-2xs);
  border: 1.5px solid var(--color-border-default);
  border-radius: var(--radius-circle);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.member-chip:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-tertiary);
}

.member-chip--active {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-selected);
  box-shadow: 0 0 0 1px var(--color-brand-primary) inset;
}

.member-chip--active:hover {
  background: var(--color-brand-selected);
  border-color: var(--color-brand-hover);
}

.member-chip__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--text-label-sm);
  color: #fff;
  flex-shrink: 0;
}

.member-chip__name {
  font: var(--text-label-md);
  color: var(--color-fg-primary);
  white-space: nowrap;
}

.member-chip__check {
  font-size: 14px;
  color: var(--color-brand-primary);
  line-height: 1;
}

.member-picker__empty {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}
</style>
