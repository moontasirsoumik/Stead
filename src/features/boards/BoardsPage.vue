<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SSelect from '@/components/ui/SSelect.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useBoardsStore } from '@/stores/boards.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { Board } from '@/models/board.model'

const router = useRouter()
const boardsStore = useBoardsStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const search = ref('')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingBoard = ref<Board | null>(null)

const formName = ref('')
const formDescription = ref('')
const formColor = ref('')

const confirmDeleteOpen = ref(false)
const deletingBoardId = ref<string | null>(null)

const colorOptions = [
  { value: '', label: 'No color' },
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

const filteredBoards = computed(() => {
  if (!search.value) return boardsStore.boards
  const q = search.value.toLowerCase()
  return boardsStore.boards.filter((b) => b.name.toLowerCase().includes(q))
})

const totalItemCount = computed(() => boardsStore.boardItems.length)

function getItemCount(boardId: string): number {
  return boardsStore.getItemsForBoard(boardId).length
}

function getCheckedCount(boardId: string): number {
  return boardsStore.getItemsForBoard(boardId).filter((i) => i.is_checked).length
}

function boardColorValue(color: string | null): string {
  if (!color) return 'var(--color-border-subtle)'
  const map: Record<string, string> = {
    red: 'var(--color-red)',
    orange: 'var(--color-orange)',
    amber: 'var(--color-amber)',
    green: 'var(--color-green)',
    teal: 'var(--color-teal)',
    blue: 'var(--color-blue)',
    purple: 'var(--color-purple)',
    rose: 'var(--color-rose)',
    slate: 'var(--color-slate)',
  }
  return map[color] ?? 'var(--color-border-subtle)'
}

function openCreateDrawer() {
  editingBoard.value = null
  formName.value = ''
  formDescription.value = ''
  formColor.value = ''
  drawerOpen.value = true
}

function openEditDrawer(board: Board, e: Event) {
  e.stopPropagation()
  editingBoard.value = board
  formName.value = board.name
  formDescription.value = board.description ?? ''
  formColor.value = board.color ?? ''
  drawerOpen.value = true
}

function navigateToBoard(id: string) {
  router.push(`/boards/${id}`)
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload: Record<string, unknown> = {
      name: formName.value.trim(),
      description: formDescription.value.trim() || null,
      color: formColor.value || null,
    }
    if (editingBoard.value) {
      await boardsStore.updateBoard(editingBoard.value.id, payload)
    } else {
      await boardsStore.createBoard({
        ...payload,
        household_id: authStore.householdId!,
        scope: appStore.isPersonal ? 'personal' : 'household',
        owner_id: appStore.isPersonal ? authStore.memberId! : null,
        position: boardsStore.boards.length,
        deleted: false,
      } as Omit<Board, 'id' | 'created_at' | 'updated_at'>)
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string, e: Event) {
  e.stopPropagation()
  if (appStore.confirmBeforeDelete) {
    deletingBoardId.value = id
    confirmDeleteOpen.value = true
  } else {
    boardsStore.removeBoard(id)
  }
}

async function handleDelete() {
  if (deletingBoardId.value) {
    await boardsStore.removeBoard(deletingBoardId.value)
  }
  confirmDeleteOpen.value = false
  deletingBoardId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      boardsStore.fetchBoards(authStore.householdId),
      boardsStore.fetchBoardItems(authStore.householdId),
    ])
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Boards" subtitle="Organize anything — your way" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">New Board</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="boardsStore.error" :message="boardsStore.error" @retry="authStore.householdId && boardsStore.fetchBoards(authStore.householdId)" />

    <!-- Stats -->
    <div class="stats-bar page-enter" :style="{ '--stagger': 1 }">
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Boards</span>
        <span class="stats-bar__value">{{ boardsStore.boardCount }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Total items</span>
        <span class="stats-bar__value">{{ totalItemCount }}</span>
      </div>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }" />

    <div v-if="boardsStore.loading && !boardsStore.boards.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else-if="!filteredBoards.length">
      <div class="empty-section page-enter" :style="{ '--stagger': 3 }">
        <EmptyState v-if="!boardsStore.boards.length" title="No boards yet" subtitle="Create your first board to start organizing." icon="empty" action-label="New Board" @action="openCreateDrawer" />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your search term." icon="search" />
      </div>
    </template>

    <template v-else>
      <div class="board-grid page-enter" :style="{ '--stagger': 3 }">
        <div
          v-for="board in filteredBoards"
          :key="board.id"
          class="board-card"
          @click="navigateToBoard(board.id)"
        >
          <div class="board-card__color" :style="{ background: boardColorValue(board.color) }" />
          <div class="board-card__body">
            <div class="board-card__header">
              <span class="board-card__name">{{ board.name }}</span>
              <div class="board-card__actions">
                <SIconButton label="Edit board" size="sm" @click="openEditDrawer(board, $event)"><span class="material-symbols-rounded">edit</span></SIconButton>
                <SIconButton label="Delete board" size="sm" @click="confirmDelete(board.id, $event)"><span class="material-symbols-rounded">delete</span></SIconButton>
              </div>
            </div>
            <p v-if="board.description" class="board-card__desc">{{ board.description }}</p>
            <div class="board-card__footer">
              <SBadge variant="default" size="sm">{{ getItemCount(board.id) }} items</SBadge>
              <span v-if="getItemCount(board.id)" class="board-card__progress">
                {{ getCheckedCount(board.id) }}/{{ getItemCount(board.id) }} done
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingBoard ? 'Edit Board' : 'New Board'" :submit-label="editingBoard ? 'Update' : 'Create'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="Board name" /></FormField>
        <FormField><STextarea v-model="formDescription" label="Description" :rows="3" placeholder="What's this board for?" /></FormField>
        <FormField><SSelect v-model="formColor" :options="colorOptions" label="Color" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Board" message="This board and all its items will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
.stats-bar {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-l);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.stats-bar__cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  border-right: 1px solid var(--color-border-subtle);
}
.stats-bar__cell:last-child { border-right: none; }
.stats-bar__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}
.stats-bar__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-l);
}

.board-card {
  display: flex;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}
.board-card:hover {
  background: var(--color-bg-tertiary);
  box-shadow: var(--shadow-card-hover);
}

.board-card__color {
  width: 4px;
  flex-shrink: 0;
}

.board-card__body {
  flex: 1;
  padding: var(--space-l);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.board-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-m);
}

.board-card__name {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.board-card__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}
.board-card:hover .board-card__actions { opacity: 1; }

.board-card__desc {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.board-card__footer {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  margin-top: auto;
}

.board-card__progress {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

@media (max-width: 640px) {
  .board-grid {
    grid-template-columns: 1fr;
  }
  .board-card__actions { opacity: 1; }
}
</style>
