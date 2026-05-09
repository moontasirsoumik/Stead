<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import PantryTabs from '@/features/pantry/components/PantryTabs.vue'
import { useShoppingStore } from '@/stores/shopping.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import type { GroceryItem } from '@/models/grocery.model'
import type { GroceryStatus, TaskPriority } from '@/models/enums'

const shoppingStore = useShoppingStore()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const search = ref('')
const categoryFilter = ref('')
const showArchive = ref(false)

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingItem = ref<GroceryItem | null>(null)

const formName = ref('')
const formQuantity = ref('1')
const formUnit = ref('')
const formCategory = ref('')
const formPriority = ref<TaskPriority>('medium')
const formAssignedTo = ref('')
const formPreferredStore = ref('')
const formNote = ref('')

const quickAddName = ref('')

const confirmClearOpen = ref(false)
const confirmDeleteOpen = ref(false)
const deletingItemId = ref<string | null>(null)

const priorityFormOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const memberFormOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...householdStore.activeMembers.map((m) => ({ value: m.id, label: m.name })),
])

function getMemberName(id: string | null): string | null {
  if (!id) return null
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? null
}

function getDoneByName(id: string | null): string | null {
  return getMemberName(id)
}

const categoryOptions = computed(() => {
  const cats = new Set<string>()
  for (const item of shoppingStore.items) {
    if (item.category) cats.add(item.category)
  }
  return [
    { value: '', label: 'All categories' },
    ...Array.from(cats).sort().map((c) => ({ value: c, label: c })),
  ]
})

const filteredItems = computed(() => {
  let result = shoppingStore.items.filter((i) => i.status !== 'bought')
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((i) => i.name.toLowerCase().includes(q))
  }
  if (categoryFilter.value) {
    result = result.filter((i) => i.category === categoryFilter.value)
  }
  return result
})

function getDateLabel(iso: string | null | undefined): string {
  if (!iso) return 'Earlier'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This week'
  if (diffDays < 14) return 'Last week'
  const month = d.toLocaleString('default', { month: 'long', year: 'numeric' })
  return month
}

const archivedByDate = computed((): [string, typeof shoppingStore.items][] => {
  const archived = shoppingStore.items
    .filter((i) => i.status === 'bought')
    .slice()
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
  const groups: Record<string, typeof archived> = {}
  for (const item of archived) {
    const label = getDateLabel(item.updated_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  const order = ['Today', 'Yesterday', 'This week', 'Last week']
  const sorted = Object.entries(groups).sort(([a], [b]) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return b.localeCompare(a)
  })
  return sorted
})

const archivedCount = computed(() => shoppingStore.items.filter((i) => i.status === 'bought').length)

function priorityVariant(p: TaskPriority) {
  const map: Record<TaskPriority, 'error' | 'warning' | 'default'> = { high: 'error', medium: 'warning', low: 'default' }
  return map[p]
}

async function handleQuickAdd() {
  if (!quickAddName.value.trim()) return
  await shoppingStore.create({
    name: quickAddName.value.trim(),
    quantity: 1,
    unit: null,
    category: 'other',
    priority: 'medium' as TaskPriority,
    assigned_to: null,
    status: 'needed' as GroceryStatus,
    preferred_store: null,
    note: null,
    done_by: null,
    household_id: authStore.householdId!,
    deleted: false,
  })
  quickAddName.value = ''
}

function openCreateDrawer() {
  editingItem.value = null
  formName.value = ''
  formQuantity.value = '1'
  formUnit.value = ''
  formCategory.value = ''
  formPriority.value = 'medium'
  formAssignedTo.value = ''
  formPreferredStore.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(item: GroceryItem) {
  editingItem.value = item
  formName.value = item.name
  formQuantity.value = String(item.quantity)
  formUnit.value = item.unit ?? ''
  formCategory.value = item.category ?? ''
  formPriority.value = item.priority
  formAssignedTo.value = item.assigned_to ?? ''
  formPreferredStore.value = item.preferred_store ?? ''
  formNote.value = item.note ?? ''
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      quantity: parseInt(formQuantity.value, 10) || 1,
      unit: formUnit.value.trim() || null,
      category: formCategory.value.trim() || null,
      priority: formPriority.value,
      assigned_to: formAssignedTo.value || null,
      preferred_store: formPreferredStore.value.trim() || null,
      note: formNote.value.trim() || null,
      done_by: null,
    }
    if (editingItem.value) {
      await shoppingStore.update(editingItem.value.id, payload)
    } else {
      await shoppingStore.create({
        ...payload,
        status: 'needed' as GroceryStatus,
        household_id: authStore.householdId!,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  deletingItemId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingItemId.value) {
    await shoppingStore.remove(deletingItemId.value)
  }
  confirmDeleteOpen.value = false
  deletingItemId.value = null
}

async function handleMarkDone(id: string) {
  await shoppingStore.markDone(id, authStore.memberId ?? null)
}

async function handleUnmarkDone(id: string) {
  await shoppingStore.unmarkDone(id)
}

async function handleClearBought() {
  await shoppingStore.clearBought()
  confirmClearOpen.value = false
  showArchive.value = false
}

onMounted(async () => {
  if (authStore.householdId) {
    await shoppingStore.fetchItems(authStore.householdId)
    if (!householdStore.members.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Pantry" subtitle="Shopping lists & wishlists" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Item</SButton>
      </template>
    </PageHeader>

    <PantryTabs />

    <div class="pantry-mobile-actions">
      <SButton @click="openCreateDrawer">Add Item</SButton>
    </div>

    <div class="stats-bar page-enter" :style="{ '--stagger': 1 }">
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Needed</span>
        <span class="stats-bar__value">{{ shoppingStore.neededCount }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">In Cart</span>
        <span class="stats-bar__value">{{ shoppingStore.inCartCount }}</span>
      </div>
    </div>

    <ErrorBanner v-if="shoppingStore.error" :message="shoppingStore.error" @retry="authStore.householdId && shoppingStore.fetchItems(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-if="!showArchive" v-model="categoryFilter" :options="categoryOptions" placeholder="Category" />
      <button
        type="button"
        class="archive-select-btn"
        :class="{ 'archive-select-btn--active': showArchive }"
        @click="showArchive = !showArchive"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
        Archive{{ archivedCount ? ` · ${archivedCount}` : '' }}
      </button>
      <template #actions>
        <SButton v-if="showArchive && archivedCount" variant="subtle" size="sm" @click="confirmClearOpen = true">Clear all</SButton>
        <div v-else class="quick-add">
          <SInput v-model="quickAddName" placeholder="Quick add item…" @keydown.enter="handleQuickAdd" />
          <SButton @click="handleQuickAdd">Add</SButton>
        </div>
      </template>
    </FilterBar>

    <div v-if="shoppingStore.loading && !shoppingStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else>
      <!-- ── Active list ── -->
      <div v-if="!showArchive">
        <div v-if="!filteredItems.length" class="empty-section page-enter" :style="{ '--stagger': 3 }">
          <EmptyState v-if="!shoppingStore.items.filter(i => i.status !== 'bought').length" title="Shopping list is empty" subtitle="Add items you need to pick up." icon="empty" action-label="Add item" @action="openCreateDrawer" />
          <EmptyState v-else title="No matches" subtitle="Try adjusting your filters." icon="search" />
        </div>

        <div v-else class="shop-table page-enter" :style="{ '--stagger': 3 }">
          <div class="shop-table__header">
            <span class="shop-table__th">Item</span>
            <span class="shop-table__th shop-table__th--center">Priority</span>
            <span class="shop-table__th shop-table__th--center">Qty</span>
            <span class="shop-table__th shop-table__th--center">Assignee</span>
            <span class="shop-table__th shop-table__th--right">Actions</span>
          </div>
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="shop-row"
            @click="openEditDrawer(item)"
          >
            <div class="shop-row__name">
              <span class="shop-row__name-text">{{ item.name }}</span>
              <span v-if="item.category" class="shop-row__category-tag">{{ item.category }}</span>
            </div>
            <div class="shop-row__chips">
              <div class="shop-row__priority">
                <SBadge v-if="item.priority !== 'medium'" :variant="priorityVariant(item.priority)" size="sm">{{ item.priority }}</SBadge>
              </div>
              <div class="shop-row__qty">
                <span v-if="item.quantity > 1 || item.unit">{{ item.quantity }}<template v-if="item.unit"> {{ item.unit }}</template></span>
              </div>
              <div class="shop-row__assignee">
                <SAvatar v-if="getMemberName(item.assigned_to)" :name="getMemberName(item.assigned_to)!" size="sm" />
              </div>
            </div>
            <div class="shop-row__actions" @click.stop>
              <button class="shop-row__action-btn shop-row__action-btn--done" :aria-label="'Mark ' + item.name + ' done'" @click="handleMarkDone(item.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="shop-row__action-btn shop-row__action-btn--delete" :aria-label="'Remove ' + item.name" @click="confirmDelete(item.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Archive view ── -->
      <div v-else class="page-enter" :style="{ '--stagger': 3 }">
        <div v-if="!archivedCount" class="empty-section">
          <EmptyState title="Archive is empty" subtitle="Items you mark as done will appear here." icon="empty" />
        </div>

        <template v-else>
          <div v-for="([dateLabel, group]) in archivedByDate" :key="dateLabel" class="archive-group">
            <div class="archive-group__label">{{ dateLabel }}</div>
            <div class="shop-table">
              <div class="shop-table__header">
                <span class="shop-table__th">Item</span>
                <span class="shop-table__th shop-table__th--center">Qty</span>
                <span class="shop-table__th shop-table__th--center">Assigned to</span>
                <span class="shop-table__th shop-table__th--center">Bought by</span>
                <span class="shop-table__th shop-table__th--right">Actions</span>
              </div>
              <div
                v-for="item in group"
                :key="item.id"
                class="shop-row shop-row--archived"
              >
                <div class="shop-row__name">
                  <span class="shop-row__name-text">{{ item.name }}</span>
                  <span v-if="item.category" class="shop-row__category-tag">{{ item.category }}</span>
                </div>
                <div class="shop-row__chips">
                  <div class="shop-row__qty">
                    <span v-if="item.quantity > 1 || item.unit">{{ item.quantity }}<template v-if="item.unit"> {{ item.unit }}</template></span>
                    <span v-else class="shop-row__qty-dash">—</span>
                  </div>
                  <div class="shop-row__assignee shop-row__assignee--archive">
                    <SAvatar v-if="getMemberName(item.assigned_to)" :name="getMemberName(item.assigned_to)!" size="sm" />
                    <span v-else class="shop-row__unassigned">—</span>
                  </div>
                  <div class="shop-row__done-by">
                    <SAvatar v-if="getDoneByName(item.done_by)" :name="getDoneByName(item.done_by)!" size="sm" />
                    <span v-else class="shop-row__unassigned">—</span>
                  </div>
                </div>
                <div class="shop-row__archive-actions" @click.stop>
                  <button class="shop-row__action-btn shop-row__action-btn--undo" title="Move back to list" @click="handleUnmarkDone(item.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                  </button>
                  <button class="shop-row__action-btn shop-row__action-btn--delete" :aria-label="'Delete ' + item.name" @click="confirmDelete(item.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingItem ? 'Edit Item' : 'Add Item'" :submit-label="editingItem ? 'Update' : 'Add'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="Item name" /></FormField>
        <FormField row>
          <SInput v-model="formQuantity" label="Quantity" type="number" placeholder="1" />
          <SInput v-model="formUnit" label="Unit" placeholder="e.g. kg, pack" />
        </FormField>
        <FormField><SInput v-model="formCategory" label="Category" placeholder="e.g. Dairy, Produce" /></FormField>
        <FormField><SSelect v-model="formPriority" label="Priority" :options="priorityFormOptions" /></FormField>
        <FormField><SSelect v-model="formAssignedTo" label="Assigned To" :options="memberFormOptions" placeholder="Select member" /></FormField>
        <FormField><SInput v-model="formPreferredStore" label="Preferred Store" placeholder="e.g. Walmart, Target" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Item" message="Remove this item from the shopping list?" confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
    <ConfirmDialog :open="confirmClearOpen" title="Clear Bought Items" message="Remove all bought items from the list?" confirm-label="Clear All" variant="danger" @confirm="handleClearBought" @cancel="confirmClearOpen = false" />
  </PageContainer>
</template>

<style scoped>
.pantry-mobile-actions {
  display: none;
}

/* ── Stats bar ── */
.stats-bar {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-l);
  overflow: hidden;
  box-shadow: var(--shadow-2);
}
.stats-bar__cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  border-right: 1px solid var(--color-border-default);
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

/* ── Data table ── */
.shop-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

/* Active list: Item | Priority | Qty | Assignee | Actions */
.shop-table__header {
  display: grid;
  grid-template-columns: 1fr 80px 60px 72px 80px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

/* Archive table: Item | Qty | Assigned to | Bought by | Actions */
.archive-group .shop-table__header {
  grid-template-columns: 1fr 60px 72px 72px 80px;
}

.shop-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.shop-table__th--center { text-align: center; }
.shop-table__th--right { text-align: right; }

/* ── Quick add ── */
.quick-add {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}

/* ── Active shopping row ── */
.shop-row {
  display: grid;
  grid-template-columns: 1fr 80px 60px 72px 80px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

/* Archive row has an extra column (bought-by avatar) */
.archive-group .shop-row {
  grid-template-columns: 1fr 60px 72px 72px 80px;
  cursor: default;
  opacity: 0.8;
}

.shop-row:last-child { border-bottom: none; }
.shop-row:hover { background: var(--color-bg-tertiary); }
.archive-group .shop-row:hover { opacity: 1; }

.shop-row__name {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.shop-row__name-text {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-row__category-tag {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-row__chips {
  display: contents;
}

.shop-row__priority,
.shop-row__assignee,
.shop-row__assignee--archive,
.shop-row__done-by {
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-row__qty {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: center;
}

.shop-row__qty-dash,
.shop-row__unassigned {
  font: var(--text-caption);
  color: var(--color-fg-disabled);
  text-align: center;
}

/* ── Row action buttons ── */
.shop-row__actions,
.shop-row__archive-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2xs);
}

.shop-row__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-s);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--color-fg-tertiary);
  transition:
    background var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.shop-row__action-btn:active { transform: scale(0.88); }

.shop-row__action-btn--done:hover {
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-success) 28%, transparent);
  color: var(--color-success);
}

.shop-row__action-btn--delete:hover {
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-error) 28%, transparent);
  color: var(--color-error);
}

.shop-row__action-btn--undo:hover {
  background: color-mix(in srgb, var(--color-brand) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-brand) 28%, transparent);
  color: var(--color-brand);
}

/* ── Archive select-style toggle ── */
.archive-select-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  height: var(--height-input);
  padding: 0 var(--space-m);
  background: var(--color-surface-input);
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-m);
  font: var(--text-body-1);
  color: var(--color-fg-tertiary);
  box-shadow: var(--shadow-inset);
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    transform 160ms var(--easing-out);
}

.archive-select-btn:hover {
  border-color: var(--color-outline-variant);
  color: var(--color-fg-primary);
}

.archive-select-btn--active {
  background: var(--color-brand-selected);
  border-color: var(--color-brand-primary);
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
}

.archive-select-btn--active:hover {
  background: var(--color-brand-selected);
  border-color: var(--color-brand-hover);
  color: var(--color-brand-primary);
}

.archive-select-btn:active {
  transform: scale(var(--press-scale));
}

/* ── Archive date groups ── */
.archive-group {
  margin-bottom: var(--space-l);
}

.archive-group__label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  padding: 0 var(--space-xs) var(--space-xs);
}

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }
  .pantry-mobile-actions { display: flex; margin-bottom: var(--space-m); }
  .shop-table__header { display: none; }
  .shop-row,
  .archive-group .shop-row {
    grid-template-columns: 1fr 3.5rem;
    grid-template-rows: auto auto;
    padding: var(--space-s) var(--space-l);
    row-gap: var(--space-2xs);
    column-gap: var(--space-m);
  }
  .shop-row__name { grid-column: 1; grid-row: 1; }
  .shop-row__actions,
  .shop-row__archive-actions { grid-column: 2; grid-row: 1 / -1; align-self: center; justify-self: end; }
  .shop-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    grid-column: 1;
    grid-row: 2;
    align-items: center;
  }
  .shop-row__qty { text-align: left; }
}
</style>
