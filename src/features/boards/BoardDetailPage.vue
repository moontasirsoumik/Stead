<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SCheckbox from '@/components/ui/SCheckbox.vue'
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
import type { Board, BoardItem } from '@/models/board.model'

const route = useRoute()
const router = useRouter()
const boardsStore = useBoardsStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const boardId = computed(() => route.params.id as string)

const board = computed<Board | undefined>(() =>
  boardsStore.boards.find((b) => b.id === boardId.value),
)

const items = computed(() => boardsStore.getItemsForBoard(boardId.value))

const groupedItems = computed(() => {
  const groups = new Map<string | null, BoardItem[]>()
  for (const item of items.value) {
    const key = item.group_name || null
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return groups
})

const hasGroups = computed(() => {
  const keys = [...groupedItems.value.keys()]
  return keys.some((k) => k !== null)
})

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingItem = ref<BoardItem | null>(null)

const formName = ref('')
const formNotes = ref('')
const formGroupName = ref('')
const formIsChecked = ref(false)

const confirmDeleteOpen = ref(false)
const deletingItemId = ref<string | null>(null)

const quickAddNames = ref<Map<string | null, string>>(new Map())

function getQuickAddName(group: string | null): string {
  return quickAddNames.value.get(group) ?? ''
}

function setQuickAddName(group: string | null, value: string | number) {
  quickAddNames.value.set(group, String(value))
}

function openCreateDrawer() {
  editingItem.value = null
  formName.value = ''
  formNotes.value = ''
  formGroupName.value = ''
  formIsChecked.value = false
  drawerOpen.value = true
}

function openEditDrawer(item: BoardItem) {
  editingItem.value = item
  formName.value = item.name
  formNotes.value = item.notes ?? ''
  formGroupName.value = item.group_name ?? ''
  formIsChecked.value = item.is_checked
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload: Record<string, unknown> = {
      name: formName.value.trim(),
      notes: formNotes.value.trim() || null,
      group_name: formGroupName.value.trim() || null,
      is_checked: formIsChecked.value,
    }
    if (editingItem.value) {
      await boardsStore.updateItem(editingItem.value.id, payload)
    } else {
      await boardsStore.createItem({
        ...payload,
        board_id: boardId.value,
        household_id: authStore.householdId!,
        position: items.value.length,
        deleted: false,
      } as Omit<BoardItem, 'id' | 'created_at' | 'updated_at'>)
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

async function handleQuickAdd(group: string | null) {
  const name = getQuickAddName(group)?.trim()
  if (!name) return
  await boardsStore.createItem({
    board_id: boardId.value,
    household_id: authStore.householdId!,
    name,
    notes: null,
    group_name: group,
    is_checked: false,
    position: items.value.length,
    deleted: false,
  } as Omit<BoardItem, 'id' | 'created_at' | 'updated_at'>)
  setQuickAddName(group, '')
}

async function toggleCheck(id: string) {
  await boardsStore.toggleItemCheck(id)
}

function confirmDelete(id: string) {
  if (appStore.confirmBeforeDelete) {
    deletingItemId.value = id
    confirmDeleteOpen.value = true
  } else {
    boardsStore.removeItem(id)
  }
}

async function handleDelete() {
  if (deletingItemId.value) {
    await boardsStore.removeItem(deletingItemId.value)
  }
  confirmDeleteOpen.value = false
  deletingItemId.value = null
}

function goBack() {
  router.push('/boards')
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
    <template v-if="!boardsStore.loading && !board">
      <div class="not-found page-enter" :style="{ '--stagger': 0 }">
        <ErrorBanner message="Board not found — it may have been deleted." />
        <SButton variant="subtle" @click="goBack">
          <span class="material-symbols-rounded">arrow_back</span>
          Back to Boards
        </SButton>
      </div>
    </template>

    <template v-else>
      <PageHeader :title="board?.name ?? 'Board'" class="page-enter" :style="{ '--stagger': 0 }">
        <template #before>
          <SIconButton label="Back to Boards" size="sm" @click="goBack"><span class="material-symbols-rounded">arrow_back</span></SIconButton>
        </template>
        <template #actions>
          <SButton @click="openCreateDrawer">Add Item</SButton>
        </template>
      </PageHeader>

      <ErrorBanner v-if="boardsStore.error" :message="boardsStore.error" @retry="authStore.householdId && boardsStore.fetchBoardItems(authStore.householdId)" />

      <div v-if="boardsStore.loading && !items.length" class="page-enter" :style="{ '--stagger': 1 }">
        <LoadingSkeleton :lines="5" />
      </div>

      <template v-else-if="!items.length">
        <div class="empty-section page-enter" :style="{ '--stagger': 1 }">
          <EmptyState title="This board is empty" subtitle="Add your first item to get started." icon="empty" action-label="Add Item" @action="openCreateDrawer" />
        </div>
      </template>

      <template v-else>
        <div class="item-list page-enter" :style="{ '--stagger': 1 }">
          <!-- Grouped display -->
          <template v-if="hasGroups">
            <template v-for="[group, groupItems] in groupedItems" :key="group ?? '__ungrouped'">
              <div v-if="group" class="group-header">{{ group }}</div>
              <div v-else class="group-header">Ungrouped</div>

              <div
                v-for="item in groupItems"
                :key="item.id"
                class="item-row"
                :class="{ 'item-row--checked': item.is_checked }"
              >
                <SCheckbox :model-value="item.is_checked" @update:model-value="toggleCheck(item.id)" />
                <div class="item-row__content">
                  <span class="item-row__name">{{ item.name }}</span>
                  <span v-if="item.notes" class="item-row__notes">{{ item.notes }}</span>
                </div>
                <div class="item-row__actions">
                  <SIconButton label="Edit item" size="sm" @click="openEditDrawer(item)"><span class="material-symbols-rounded">edit</span></SIconButton>
                  <SIconButton label="Delete item" size="sm" @click="confirmDelete(item.id)"><span class="material-symbols-rounded">delete</span></SIconButton>
                </div>
              </div>

              <div class="quick-add">
                <SInput :model-value="getQuickAddName(group)" placeholder="Add item…" @update:model-value="setQuickAddName(group, $event)" @keydown.enter="handleQuickAdd(group)" />
              </div>
            </template>
          </template>

          <!-- Flat display -->
          <template v-else>
            <div
              v-for="item in items"
              :key="item.id"
              class="item-row"
              :class="{ 'item-row--checked': item.is_checked }"
            >
              <SCheckbox :model-value="item.is_checked" @update:model-value="toggleCheck(item.id)" />
              <div class="item-row__content">
                <span class="item-row__name">{{ item.name }}</span>
                <span v-if="item.notes" class="item-row__notes">{{ item.notes }}</span>
              </div>
              <div class="item-row__actions">
                <SIconButton label="Edit item" size="sm" @click="openEditDrawer(item)"><span class="material-symbols-rounded">edit</span></SIconButton>
                <SIconButton label="Delete item" size="sm" @click="confirmDelete(item.id)"><span class="material-symbols-rounded">delete</span></SIconButton>
              </div>
            </div>

            <div class="quick-add">
              <SInput :model-value="getQuickAddName(null)" placeholder="Add item…" @update:model-value="setQuickAddName(null, $event)" @keydown.enter="handleQuickAdd(null)" />
            </div>
          </template>
        </div>
      </template>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingItem ? 'Edit Item' : 'Add Item'" :submit-label="editingItem ? 'Update' : 'Add'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="Item name" /></FormField>
        <FormField><STextarea v-model="formNotes" label="Notes" :rows="3" placeholder="Any details…" /></FormField>
        <FormField><SInput v-model="formGroupName" label="Group" placeholder="e.g. Monday, Morning, Priority" /></FormField>
        <FormField><SCheckbox v-model="formIsChecked" label="Checked" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Item" message="This item will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  align-items: flex-start;
}

.item-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.group-header {
  font: var(--text-label-md);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  padding: var(--space-m) var(--space-l) var(--space-xs);
  border-bottom: 1px solid var(--color-border-subtle);
  margin-top: var(--space-l);
  background: var(--color-surface-container-low);
}
.group-header:first-child { margin-top: 0; }

.item-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  min-height: var(--height-row-min);
  transition: background var(--duration-fast) var(--easing-standard);
}
.item-row:hover { background: var(--color-bg-tertiary); }

.item-row__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.item-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  transition: color var(--duration-fast) var(--easing-standard);
}

.item-row--checked .item-row__name {
  text-decoration: line-through;
  color: var(--color-fg-tertiary);
}

.item-row__notes {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-row__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}
.item-row:hover .item-row__actions { opacity: 1; }

.quick-add {
  padding: var(--space-s) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
}
.quick-add:last-child { border-bottom: none; }

@media (max-width: 640px) {
  .item-row__actions { opacity: 1; }
}
</style>
