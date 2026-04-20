<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SectionHeader from '@/components/data/SectionHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SToggle from '@/components/ui/SToggle.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useNotesStore } from '@/stores/notes.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatDate } from '@/utils/format'
import SVisibilityPicker from '@/components/ui/SVisibilityPicker.vue'
import SMemberPicker from '@/components/ui/SMemberPicker.vue'
import { entitySharesDataService } from '@/services/data/entity-shares.data'
import { useHouseholdStore } from '@/stores/household.store'
import type { Note } from '@/models/note.model'
import type { Visibility } from '@/models/enums'

const notesStore = useNotesStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const householdStore = useHouseholdStore()
const search = ref('')
const categoryFilter = ref('')
const viewMode = ref(appStore.defaultNoteView)

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingNote = ref<Note | null>(null)

const formTitle = ref('')
const formCategory = ref('')
const formContent = ref('')
const formPinned = ref(false)
const formVisibility = ref<Visibility>('private')
const formSharedWith = ref<string[]>([])

const confirmDeleteOpen = ref(false)
const deletingNoteId = ref<string | null>(null)

const categoryOptions = computed(() => {
  const cats = new Set<string>()
  for (const note of notesStore.items) {
    if (note.category) cats.add(note.category)
  }
  return [
    { value: '', label: 'All categories' },
    ...Array.from(cats).sort().map((c) => ({ value: c, label: c })),
  ]
})

const filteredItems = computed(() => {
  let result = notesStore.recentNotes.filter((n) => n.scope === appStore.scope)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((n) =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    )
  }
  if (categoryFilter.value) {
    result = result.filter((n) => n.category === categoryFilter.value)
  }
  return result
})

const pinnedItems = computed(() => filteredItems.value.filter((n) => n.pinned))
const unpinnedItems = computed(() => filteredItems.value.filter((n) => !n.pinned))

function contentPreview(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim())
  return lines.slice(0, 2).join('\n').slice(0, 120) + (content.length > 120 ? '…' : '')
}

function openCreateDrawer() {
  editingNote.value = null
  formTitle.value = ''
  formCategory.value = ''
  formContent.value = ''
  formPinned.value = false
  formVisibility.value = 'private'
  formSharedWith.value = []
  drawerOpen.value = true
}

function openEditDrawer(note: Note) {
  editingNote.value = note
  formTitle.value = note.title
  formCategory.value = note.category ?? ''
  formContent.value = note.content
  formPinned.value = note.pinned
  formVisibility.value = (note.visibility ?? 'private') as Visibility
  formSharedWith.value = []
  if (note.visibility === 'shared' && authStore.householdId) {
    entitySharesDataService.getByEntity('note', note.id).then((shares) => {
      formSharedWith.value = shares.map((s) => s.shared_with)
    })
  }
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formTitle.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      title: formTitle.value.trim(),
      category: formCategory.value.trim() || null,
      content: formContent.value,
      pinned: formPinned.value,
      visibility: appStore.isPersonal ? formVisibility.value : ('private' as const),
    }
    if (editingNote.value) {
      await notesStore.update(editingNote.value.id, payload)
      if (appStore.isPersonal && formVisibility.value === 'shared' && authStore.householdId) {
        await entitySharesDataService.setShares(authStore.householdId, 'note', editingNote.value.id, formSharedWith.value)
      } else if (appStore.isPersonal && editingNote.value.id) {
        await entitySharesDataService.deleteByEntity('note', editingNote.value.id)
      }
    } else {
      const created = await notesStore.create({
        ...payload,
        linked_type: null,
        linked_id: null,
        created_by: authStore.memberId ?? null,
        household_id: authStore.householdId!,
        deleted: false,
        scope: appStore.scope,
        owner_id: appStore.scope === 'personal' ? authStore.memberId : null,
      })
      if (appStore.isPersonal && formVisibility.value === 'shared' && created && authStore.householdId) {
        await entitySharesDataService.setShares(authStore.householdId, 'note', created.id, formSharedWith.value)
      }
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  if (appStore.confirmBeforeDelete) {
    deletingNoteId.value = id
    confirmDeleteOpen.value = true
  } else {
    notesStore.remove(id)
  }
}

async function handleDelete() {
  if (deletingNoteId.value) {
    await notesStore.remove(deletingNoteId.value)
  }
  confirmDeleteOpen.value = false
  deletingNoteId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await notesStore.fetchNotes(authStore.householdId)
    if (!householdStore.members.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Notes" subtitle="Shared household notes" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">New Note</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="notesStore.error" :message="notesStore.error" @retry="authStore.householdId && notesStore.fetchNotes(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 1 }">
      <SSelect v-model="categoryFilter" :options="categoryOptions" placeholder="Category" />
      <SIconButton :label="viewMode === 'grid' ? 'List view' : 'Grid view'" size="sm" @click="viewMode = viewMode === 'grid' ? 'list' : 'grid'">
        <svg v-if="viewMode === 'grid'" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
      </SIconButton>
    </FilterBar>

    <div v-if="notesStore.loading && !notesStore.items.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else-if="!filteredItems.length">
      <div class="empty-section page-enter" :style="{ '--stagger': 2 }">
        <EmptyState v-if="!notesStore.items.length" title="No notes yet" subtitle="Jot down ideas, recipes, or anything the household needs to remember." icon="empty" action-label="New note" @action="openCreateDrawer" />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
      </div>
    </template>

    <template v-else>
      <!-- Pinned section -->
      <div v-if="pinnedItems.length" class="page-enter" :style="{ '--stagger': 2 }">
        <SectionHeader title="Pinned" :count="pinnedItems.length" />
        <div :class="viewMode === 'grid' ? 'notes-grid' : 'notes-list'">
          <div
            v-for="note in pinnedItems"
            :key="note.id"
            class="note-card note-card--pinned"
            @click="openEditDrawer(note)"
          >
            <div class="note-card__header">
              <span class="note-card__title">{{ note.title }}</span>
              <button class="note-card__pin" @click.stop="notesStore.togglePin(note.id)" title="Unpin">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1V5M4 5H10L9 9H5L4 5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" opacity="0.3"/>
                  <path d="M7 9V13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <SBadge v-if="note.category" size="sm">{{ note.category }}</SBadge>
            <p class="note-card__preview">{{ contentPreview(note.content) }}</p>
            <span class="note-card__date">{{ formatDate(note.updated_at) }}</span>
            <div class="note-card__actions" @click.stop>
              <SIconButton label="Delete" size="sm" @click="confirmDelete(note.id)">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
              </SIconButton>
            </div>
          </div>
        </div>
      </div>

      <!-- All notes -->
      <div class="page-enter" :style="{ '--stagger': pinnedItems.length ? 3 : 2 }">
        <SectionHeader v-if="pinnedItems.length" title="All Notes" :count="unpinnedItems.length" />
        <div :class="viewMode === 'grid' ? 'notes-grid' : 'notes-list'">
          <div
            v-for="note in unpinnedItems"
            :key="note.id"
            class="note-card"
            @click="openEditDrawer(note)"
          >
            <div class="note-card__header">
              <span class="note-card__title">{{ note.title }}</span>
              <button class="note-card__pin" @click.stop="notesStore.togglePin(note.id)" title="Pin">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1V5M4 5H10L9 9H5L4 5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 9V13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <SBadge v-if="note.category" size="sm">{{ note.category }}</SBadge>
            <p class="note-card__preview">{{ contentPreview(note.content) }}</p>
            <span class="note-card__date">{{ formatDate(note.updated_at) }}</span>
            <div class="note-card__actions" @click.stop>
              <SIconButton label="Delete" size="sm" @click="confirmDelete(note.id)">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
              </SIconButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingNote ? 'Edit Note' : 'New Note'" :submit-label="editingNote ? 'Update' : 'Create'" :loading="drawerLoading" wide @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formTitle" label="Title" required placeholder="Note title" /></FormField>
        <FormField><SInput v-model="formCategory" label="Category" placeholder="e.g. Recipe, Idea, Reference" /></FormField>
        <FormField><STextarea v-model="formContent" label="Content" :rows="10" placeholder="Write your note…" /></FormField>
        <FormField row><SToggle v-model="formPinned" label="Pin to top" /></FormField>
      </FormSection>
      <!-- Visibility — only in personal scope -->
      <FormSection v-if="appStore.isPersonal" title="Privacy">
        <FormField>
          <SVisibilityPicker v-model="formVisibility" label="Who can see this?" />
        </FormField>
        <FormField v-if="formVisibility === 'shared'">
          <SMemberPicker
            v-model="formSharedWith"
            :members="householdStore.activeMembers"
            :current-member-id="authStore.memberId ?? undefined"
            label="Share with"
          />
        </FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Note" message="This note will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
/* ── Notes grid ── */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-m);
  margin-bottom: var(--space-l);
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  margin-bottom: var(--space-l);
}

.notes-list .note-card {
  flex-direction: row;
  align-items: center;
  gap: var(--space-m);
}

.notes-list .note-card__preview {
  flex: 1;
  -webkit-line-clamp: 1;
}

/* ── Note card ── */
.note-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-l) var(--space-l);
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-default);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard);
}

.note-card:hover {
  background: var(--color-surface-card-hover);
  border-color: var(--color-outline-variant);
}

.note-card--pinned {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-selected);
}

.note-card--pinned:hover {
  background: var(--color-surface-card-hover);
}

/* ── Card header ── */
.note-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.note-card__title {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.note-card__pin {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-fg-tertiary);
  padding: var(--space-2xs);
  border-radius: var(--radius-s);
  transition: color var(--duration-fast) var(--easing-standard);
  flex-shrink: 0;
  line-height: 0;
}

.note-card__pin:hover {
  color: var(--color-brand-primary);
}

.note-card--pinned .note-card__pin {
  color: var(--color-brand-primary);
}

/* ── Card content ── */
.note-card__preview {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  white-space: pre-line;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.note-card__date {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
}

.note-card__actions {
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.note-card:hover .note-card__actions {
  opacity: 1;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .notes-grid {
    grid-template-columns: 1fr;
  }
  .note-card__actions {
    opacity: 1;
  }
}
</style>
