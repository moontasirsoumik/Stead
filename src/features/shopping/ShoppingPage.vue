<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SectionHeader from '@/components/data/SectionHeader.vue'
import DataList from '@/components/data/DataList.vue'
import InlineStat from '@/components/data/InlineStat.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
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
const statusFilter = ref('')

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

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'needed', label: 'Needed' },
  { value: 'in_cart', label: 'In cart' },
  { value: 'bought', label: 'Bought' },
  { value: 'skipped', label: 'Skipped' },
]

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
  let result = shoppingStore.items
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((i) => i.name.toLowerCase().includes(q))
  }
  if (categoryFilter.value) {
    result = result.filter((i) => i.category === categoryFilter.value)
  }
  if (statusFilter.value) {
    result = result.filter((i) => i.status === statusFilter.value)
  }
  return result
})

const groupedByCategory = computed(() => {
  const groups: Record<string, GroceryItem[]> = {}
  for (const item of filteredItems.value) {
    const cat = item.category ?? 'Uncategorized'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

function statusVariant(s: GroceryStatus) {
  const map: Record<GroceryStatus, 'default' | 'brand' | 'success' | 'warning'> = {
    needed: 'default', in_cart: 'brand', bought: 'success', skipped: 'warning',
  }
  return map[s]
}

function priorityVariant(p: TaskPriority) {
  const map: Record<TaskPriority, 'error' | 'warning' | 'default'> = { high: 'error', medium: 'warning', low: 'default' }
  return map[p]
}

function statusLabel(s: GroceryStatus) {
  const map: Record<GroceryStatus, string> = { needed: 'Needed', in_cart: 'In cart', bought: 'Bought', skipped: 'Skipped' }
  return map[s]
}

async function handleQuickAdd() {
  if (!quickAddName.value.trim()) return
  await shoppingStore.create({
    name: quickAddName.value.trim(),
    quantity: 1,
    unit: null,
    category: null,
    priority: 'medium' as TaskPriority,
    assigned_to: null,
    status: 'needed' as GroceryStatus,
    preferred_store: null,
    note: null,
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

async function handleClearBought() {
  await shoppingStore.clearBought()
  confirmClearOpen.value = false
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
    <PageHeader title="Shopping" subtitle="Shopping lists & wishlists" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Item</SButton>
      </template>
    </PageHeader>

    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <InlineStat label="Needed" :value="shoppingStore.neededCount" />
      <InlineStat label="In Cart" :value="shoppingStore.inCartCount" />
    </div>

    <ErrorBanner v-if="shoppingStore.error" :message="shoppingStore.error" @retry="authStore.householdId && shoppingStore.fetchItems(authStore.householdId)" />

    <!-- Quick add -->
    <div class="quick-add page-enter" :style="{ '--stagger': 2 }">
      <SInput v-model="quickAddName" placeholder="Quick add item…" @keydown.enter="handleQuickAdd" />
      <SButton variant="subtle" @click="handleQuickAdd">Add</SButton>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 3 }">
      <SSelect v-model="categoryFilter" :options="categoryOptions" placeholder="Category" />
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
      <template #actions>
        <SButton v-if="shoppingStore.groupedByStatus.bought.length" variant="subtle" size="sm" @click="confirmClearOpen = true">Clear Bought</SButton>
      </template>
    </FilterBar>

    <ContentCard v-if="shoppingStore.loading && !shoppingStore.items.length" class="page-enter" :style="{ '--stagger': 4 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 4 }">
      <EmptyState v-if="!shoppingStore.items.length" title="Shopping list is empty" subtitle="Add items you need to pick up." icon="empty" action-label="Add item" @action="openCreateDrawer" />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <template v-else>
      <div v-for="([category, items], ci) in groupedByCategory" :key="category" class="page-enter" :style="{ '--stagger': 4 + ci }">
        <SectionHeader :title="category" :count="items.length" />
        <ContentCard>
          <DataList dividers>
            <div v-for="item in items" :key="item.id" class="shop-row" role="listitem">
              <button class="shop-row__status-btn" @click.stop="shoppingStore.toggleStatus(item.id)" :title="'Toggle status'">
                <StatusBadge :variant="statusVariant(item.status)">{{ statusLabel(item.status) }}</StatusBadge>
              </button>
              <span class="shop-row__name">{{ item.name }}</span>
              <span v-if="item.quantity > 1 || item.unit" class="shop-row__qty">
                {{ item.quantity }}<template v-if="item.unit"> {{ item.unit }}</template>
              </span>
              <div class="shop-row__end">
                <SBadge v-if="item.priority !== 'medium'" :variant="priorityVariant(item.priority)" size="sm">{{ item.priority }}</SBadge>
                <SAvatar v-if="getMemberName(item.assigned_to)" :name="getMemberName(item.assigned_to)!" size="sm" />
                <div class="shop-row__actions" @click.stop>
                  <SIconButton label="Edit" size="sm" @click="openEditDrawer(item)">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
                  </SIconButton>
                  <SIconButton label="Delete" size="sm" @click="confirmDelete(item.id)">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
                  </SIconButton>
                </div>
              </div>
            </div>
          </DataList>
        </ContentCard>
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
.stats-row {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-card);
  margin-bottom: var(--space-m);
  overflow: hidden;
}

.stats-row > * {
  flex: 1;
  border-right: 1px solid var(--color-border-subtle);
}

.stats-row > *:last-child {
  border-right: none;
}

.quick-add {
  display: flex;
  gap: var(--space-xs);
  align-items: flex-end;
  margin-bottom: var(--space-m);
}

.shop-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: 36px;
  padding: var(--space-xs) var(--space-l);
  transition: background var(--duration-fast) var(--easing-standard);
}

.shop-row:hover {
  background: var(--color-bg-secondary);
}

.shop-row__status-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.shop-row__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}

.shop-row__qty {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

.shop-row__end {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
  margin-left: auto;
}

.shop-row__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.shop-row:hover .shop-row__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .stats-row > * { border-right: none; border-bottom: 1px solid var(--color-border-subtle); }
  .stats-row > *:last-child { border-bottom: none; }
  .shop-row { flex-wrap: wrap; }
  .shop-row__actions { opacity: 1; }
}
</style>
