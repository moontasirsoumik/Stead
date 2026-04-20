<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useJournalStore } from '@/stores/journal.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatDate } from '@/utils/format'
import type { JournalEntry } from '@/models/journal.model'
import type { Mood } from '@/models/enums'

const journalStore = useJournalStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingEntry = ref<JournalEntry | null>(null)

const formEntryDate = ref('')
const formContent = ref('')
const formMood = ref<Mood | ''>('')
const formTags = ref('')

const confirmDeleteOpen = ref(false)
const deletingEntryId = ref<string | null>(null)

const moodOptions = [
  { value: '', label: 'No mood' },
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'okay', label: 'Okay' },
  { value: 'bad', label: 'Bad' },
  { value: 'terrible', label: 'Terrible' },
]

const moodIcon: Record<string, string> = {
  great: 'sentiment_very_satisfied',
  good: 'sentiment_satisfied',
  okay: 'sentiment_neutral',
  bad: 'sentiment_dissatisfied',
  terrible: 'sentiment_very_dissatisfied',
}

const todayString = computed(() => new Date().toISOString().slice(0, 10))

const hasTodayEntry = computed(() => journalStore.todayEntry !== null)

const groupedEntries = computed(() => {
  const groups: Record<string, JournalEntry[]> = {}
  for (const entry of journalStore.sortedEntries) {
    const date = new Date(entry.entry_date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, entries]) => {
      const [year, month] = key.split('-').map(Number)
      const label = new Date(year, month - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
      return { key, label, entries }
    })
})

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function parseTags(entry: JournalEntry): string[] {
  if (!entry.tags) return []
  return entry.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function openCreateDrawer(forToday = false) {
  editingEntry.value = null
  formEntryDate.value = forToday ? todayString.value : ''
  formContent.value = ''
  formMood.value = ''
  formTags.value = ''
  drawerOpen.value = true
}

function openEditDrawer(entry: JournalEntry) {
  editingEntry.value = entry
  formEntryDate.value = entry.entry_date
  formContent.value = entry.content
  formMood.value = entry.mood ?? ''
  formTags.value = entry.tags
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formContent.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      entry_date: formEntryDate.value || todayString.value,
      content: formContent.value.trim(),
      mood: (formMood.value || null) as Mood | null,
      tags: formTags.value.trim(),
    }
    if (editingEntry.value) {
      await journalStore.update(editingEntry.value.id, payload)
    } else {
      await journalStore.create({
        ...payload,
        household_id: authStore.householdId!,
        owner_id: authStore.memberId!,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  deletingEntryId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingEntryId.value) {
    await journalStore.remove(deletingEntryId.value)
  }
  confirmDeleteOpen.value = false
  deletingEntryId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await journalStore.fetchEntries(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Journal" subtitle="Your personal reflections" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer(false)">New Entry</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="journalStore.error" :message="journalStore.error" @retry="authStore.householdId && journalStore.fetchEntries(authStore.householdId)" />

    <!-- Quick-write CTA -->
    <div v-if="appStore.journalPromptEnabled && !hasTodayEntry && !journalStore.loading" class="today-cta page-enter" :style="{ '--stagger': 1 }">
      <div class="today-cta__inner">
        <div class="today-cta__text">
          <span class="today-cta__title">How's your day going?</span>
          <span class="today-cta__subtitle">You haven't written anything today — take a moment to reflect.</span>
        </div>
        <SButton @click="openCreateDrawer(true)">Write today's entry</SButton>
      </div>
    </div>

    <div v-if="journalStore.loading && !journalStore.items.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else-if="!journalStore.items.length">
      <div class="empty-section page-enter" :style="{ '--stagger': 2 }">
        <EmptyState title="Your journal awaits" subtitle="Capture today's thoughts — even a few words can make a difference." icon="empty" action-label="Write first entry" @action="openCreateDrawer(true)" />
      </div>
    </template>

    <template v-else>
      <div
        v-for="(group, gi) in groupedEntries"
        :key="group.key"
        class="journal-month page-enter"
        :style="{ '--stagger': gi + 2 }"
      >
        <h3 class="journal-month__label">{{ group.label }}</h3>
        <div class="journal-timeline">
          <div
            v-for="entry in group.entries"
            :key="entry.id"
            class="journal-entry"
            @click="openEditDrawer(entry)"
          >
            <div class="journal-entry__date-col">
              <span class="journal-entry__date">{{ formatEntryDate(entry.entry_date) }}</span>
              <span v-if="entry.mood" class="journal-entry__mood material-symbols-rounded">{{ moodIcon[entry.mood] }}</span>
            </div>
            <div class="journal-entry__line" />
            <div class="journal-entry__body">
              <p class="journal-entry__content">{{ entry.content }}</p>
              <div v-if="parseTags(entry).length" class="journal-entry__tags">
                <SBadge v-for="tag in parseTags(entry)" :key="tag" size="sm">{{ tag }}</SBadge>
              </div>
              <div class="journal-entry__actions" @click.stop>
                <SIconButton label="Delete" size="sm" @click="confirmDelete(entry.id)">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4 3V2H8V3M5 5V9M7 5V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" /></svg>
                </SIconButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingEntry ? 'Edit Entry' : 'New Journal Entry'" :submit-label="editingEntry ? 'Update' : 'Save'" :loading="drawerLoading" wide @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formEntryDate" label="Date" type="date" /></FormField>
        <FormField><SSelect v-model="formMood" :options="moodOptions" label="How are you feeling?" /></FormField>
        <FormField><STextarea v-model="formContent" label="What's on your mind?" :rows="10" required placeholder="Write freely…" /></FormField>
        <FormField><SInput v-model="formTags" label="Tags" placeholder="e.g. gratitude, work, family (comma-separated)" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Entry" message="This journal entry will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
.today-cta__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-l);
}

.today-cta__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.today-cta__title {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.today-cta__subtitle {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

.today-cta {
  margin-bottom: var(--space-l);
  padding: var(--space-m) var(--space-l);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
}

.journal-month {
  margin-bottom: var(--space-xl);
}

.journal-month__label {
  font: var(--text-title-3);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-m);
}

.journal-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.journal-entry {
  display: flex;
  gap: var(--space-m);
  cursor: pointer;
  padding: var(--space-l);
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-default);
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard);
}

.journal-entry:hover {
  background: var(--color-surface-card-hover);
  border-color: var(--color-outline-variant);
}

.journal-entry__date-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  flex-shrink: 0;
  min-width: 72px;
}

.journal-entry__date {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.journal-entry__mood {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-fg-secondary);
}

.journal-entry__line {
  width: 2px;
  background: var(--color-border-default);
  border-radius: var(--radius-pill);
  flex-shrink: 0;
  display: none;
}

.journal-entry__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.journal-entry__content {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  white-space: pre-line;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.journal-entry__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
}

.journal-entry__actions {
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.journal-entry:hover .journal-entry__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .today-cta__inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .journal-entry__date-col {
    min-width: 56px;
  }
  .journal-entry__line {
    display: none;
  }
  .journal-entry__actions {
    opacity: 1;
  }
}
</style>
