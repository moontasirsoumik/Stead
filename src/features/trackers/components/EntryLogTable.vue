<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

const props = defineProps<{
  tracker: Tracker
  entries: TrackerEntry[]
}>()

defineEmits<{
  edit: [entry: TrackerEntry]
  delete: [id: string]
}>()

const showAll = ref(false)
const VISIBLE_LIMIT = 20

const sortedEntries = computed(() =>
  [...props.entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
  ),
)

const visibleEntries = computed(() =>
  showAll.value ? sortedEntries.value : sortedEntries.value.slice(0, VISIBLE_LIMIT),
)

const hasMore = computed(() => sortedEntries.value.length > VISIBLE_LIMIT)

interface MonthGroup {
  key: string
  label: string
  entries: TrackerEntry[]
}

const groupedByMonth = computed((): MonthGroup[] => {
  const groups = new Map<string, TrackerEntry[]>()
  for (const entry of visibleEntries.value) {
    const d = new Date(entry.entry_date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    const existing = groups.get(key)
    if (existing) existing.push(entry)
    else groups.set(key, [entry])
  }
  return Array.from(groups.entries()).map(([key, entries]) => {
    const [year, month] = key.split('-')
    const d = new Date(parseInt(year), parseInt(month))
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return { key, label, entries }
  })
})

function formatValue(entry: TrackerEntry): string {
  switch (props.tracker.value_type) {
    case 'boolean':
      return entry.boolean_value ? 'Yes' : 'No'
    case 'category':
      return entry.text_value ?? '—'
    case 'duration': {
      if (entry.numeric_value === null) return '—'
      const h = Math.floor(entry.numeric_value / 60)
      const m = entry.numeric_value % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    case 'counter':
    case 'numeric': {
      if (entry.numeric_value === null) return '—'
      const val = entry.numeric_value % 1 === 0
        ? entry.numeric_value.toString()
        : entry.numeric_value.toFixed(1)
      return props.tracker.unit ? `${val} ${props.tracker.unit}` : val
    }
    default:
      return '—'
  }
}

function isPositiveBoolean(entry: TrackerEntry): boolean | null {
  if (props.tracker.value_type !== 'boolean') return null
  return entry.boolean_value === true
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
}

function formatTags(tags: string | null): string[] {
  if (!tags) return []
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}
</script>

<template>
  <div class="el">
    <div v-if="!entries.length" class="el__empty">
      <span class="el__empty-icon material-symbols-rounded">edit_note</span>
      <p class="el__empty-msg">No entries yet</p>
      <p class="el__empty-sub">Log your first entry to start tracking</p>
    </div>

    <template v-else>
      <div v-for="group in groupedByMonth" :key="group.key" class="el__group">
        <div class="el__month">
          <span class="el__month-text">{{ group.label }}</span>
          <span class="el__month-badge">{{ group.entries.length }}</span>
        </div>

        <div class="el__rows">
          <div
            v-for="entry in group.entries"
            :key="entry.id"
            class="el__row"
          >
            <span class="el__date">{{ formatDay(entry.entry_date) }}</span>

            <span class="el__val" :class="{
              'el__val--positive': isPositiveBoolean(entry) === true,
              'el__val--negative': isPositiveBoolean(entry) === false,
            }">
              <span v-if="tracker.value_type === 'boolean'" class="el__dot" :class="entry.boolean_value ? 'el__dot--on' : 'el__dot--off'" />
              {{ formatValue(entry) }}
            </span>

            <span class="el__extra">
              <span v-if="entry.notes" class="el__note" :title="entry.notes">{{ entry.notes }}</span>
              <span v-for="tag in formatTags(entry.tags)" :key="tag" class="el__tag">{{ tag }}</span>
            </span>

            <span class="el__actions">
              <button class="el__btn" title="Edit" @click.stop="$emit('edit', entry)">
                <span class="material-symbols-rounded">edit</span>
              </button>
              <button class="el__btn el__btn--del" title="Delete" @click.stop="$emit('delete', entry.id)">
                <span class="material-symbols-rounded">close</span>
              </button>
            </span>
          </div>
        </div>
      </div>

      <button
        v-if="hasMore && !showAll"
        class="el__more"
        @click="showAll = true"
      >
        <span class="material-symbols-rounded" style="font-size: 16px;">expand_more</span>
        Show {{ sortedEntries.length - VISIBLE_LIMIT }} more
      </button>
    </template>
  </div>
</template>

<style scoped>
.el {
  display: flex;
  flex-direction: column;
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Empty */
.el__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) var(--space-l);
  gap: var(--space-2xs);
}
.el__empty-icon { font-size: 28px; color: var(--color-fg-muted); opacity: 0.5; }
.el__empty-msg { font: var(--text-body-2); color: var(--color-fg-secondary); margin: 0; }
.el__empty-sub { font: var(--text-caption); color: var(--color-fg-muted); margin: 0; }

/* Month group */
.el__group + .el__group {
  border-top: 1px solid var(--color-border-subtle);
}

.el__month {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-l);
  background: var(--color-bg-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
}
.el__month-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-tertiary);
}
.el__month-badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-fg-muted);
  background: var(--color-bg-tertiary);
  padding: 1px 6px;
  border-radius: 10px;
  font-variant-numeric: tabular-nums;
}

/* Rows */
.el__rows {
  display: flex;
  flex-direction: column;
}

.el__row {
  display: grid;
  grid-template-columns: 68px minmax(48px, auto) 1fr auto;
  gap: var(--space-s);
  align-items: center;
  padding: 7px var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--duration-fast) var(--easing-standard);
}
.el__row:last-child { border-bottom: none; }
.el__row:hover { background: var(--color-surface-card-hover); }
.el__row:hover .el__actions { opacity: 1; pointer-events: auto; }

/* Date */
.el__date {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Value */
.el__val {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-fg-primary);
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.el__val--positive { color: var(--color-success-fg); }
.el__val--negative { color: var(--color-fg-muted); }

.el__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.el__dot--on { background: var(--color-success); }
.el__dot--off { background: var(--color-fg-disabled); }

/* Notes + tags */
.el__extra {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
  overflow: hidden;
}
.el__note {
  font-size: 12px;
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.el__tag {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-fg-secondary);
  background: var(--color-bg-tertiary);
  padding: 1px 6px;
  border-radius: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Actions */
.el__actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-fast) var(--easing-standard);
}
.el__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard);
}
.el__btn .material-symbols-rounded { font-size: 15px; }
.el__btn:hover { background: var(--color-bg-tertiary); color: var(--color-fg-secondary); }
.el__btn--del:hover { background: var(--color-error-bg); color: var(--color-error); }

/* Show more */
.el__more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-s);
  border: none;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-secondary);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard);
}
.el__more:hover { background: var(--color-bg-tertiary); color: var(--color-brand-primary); }

/* === Mobile === */
@media (max-width: 640px) {
  .el__month { padding: var(--space-xs) var(--space-m); }
  .el__row {
    grid-template-columns: 56px 1fr auto;
    gap: var(--space-xs);
    padding: 6px var(--space-m);
  }
  .el__extra { display: none; }
  .el__actions { opacity: 1; pointer-events: auto; }
}
</style>
