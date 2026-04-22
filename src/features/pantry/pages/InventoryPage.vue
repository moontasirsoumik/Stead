<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
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
import PantryTabs from '@/features/pantry/components/PantryTabs.vue'
import { useInventoryStore } from '@/stores/inventory.store'
import { useShoppingStore } from '@/stores/shopping.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatDate } from '@/utils/format'
import type { InventoryItem } from '@/models/inventory.model'
import type { StockStatus, TargetLevel } from '@/models/enums'

const inventoryStore = useInventoryStore()
const authStore = useAuthStore()
const shoppingStore = useShoppingStore()
const appStore = useAppStore()

const search = ref('')
const stockStatusFilter = ref('')
const categoryFilter = ref('')
const locationFilter = ref('')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingItem = ref<InventoryItem | null>(null)

const formName = ref('')
const formCategory = ref('')
const formLocation = ref('')
const formStockStatus = ref<StockStatus>('enough')
const formTargetLevel = ref<TargetLevel>('keep_1')
const formRestockNeeded = ref(false)
const formLastCheckedDate = ref('')
const formNote = ref('')

const confirmDeleteOpen = ref(false)
const deletingItemId = ref<string | null>(null)

const stockStatusOptions = [
  { value: '', label: 'All stock statuses' },
  { value: 'out', label: 'Out' },
  { value: 'almost_finished', label: 'Almost finished' },
  { value: 'low', label: 'Low' },
  { value: 'enough', label: 'Enough' },
  { value: 'extra_stock', label: 'Extra stock' },
]

const stockStatusFormOptions = [
  { value: 'out', label: 'Out' },
  { value: 'almost_finished', label: 'Almost finished' },
  { value: 'low', label: 'Low' },
  { value: 'enough', label: 'Enough' },
  { value: 'extra_stock', label: 'Extra stock' },
]

const targetLevelOptions = [
  { value: 'keep_1', label: 'Keep 1' },
  { value: 'keep_2', label: 'Keep 2' },
  { value: 'keep_3_plus', label: 'Keep 3+' },
  { value: 'weekly_item', label: 'Weekly item' },
  { value: 'monthly_item', label: 'Monthly item' },
]

const categoryOptions = computed(() => {
  const cats = new Set<string>()
  for (const item of inventoryStore.items) {
    if (item.category) cats.add(item.category)
  }
  return [
    { value: '', label: 'All categories' },
    ...Array.from(cats).sort().map((c) => ({ value: c, label: c })),
  ]
})

const locationOptions = computed(() => {
  const locs = new Set<string>()
  for (const item of inventoryStore.items) {
    if (item.location) locs.add(item.location)
  }
  return [
    { value: '', label: 'All locations' },
    ...Array.from(locs).sort().map((l) => ({ value: l, label: l })),
  ]
})

const filteredItems = computed(() => {
  let result = inventoryStore.items
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((i) => i.name.toLowerCase().includes(q))
  }
  if (stockStatusFilter.value) {
    result = result.filter((i) => i.stock_status === stockStatusFilter.value)
  }
  if (categoryFilter.value) {
    result = result.filter((i) => i.category === categoryFilter.value)
  }
  if (locationFilter.value) {
    result = result.filter((i) => i.location === locationFilter.value)
  }
  return result
})

function stockVariant(s: StockStatus) {
  const map: Record<StockStatus, 'error' | 'warning' | 'success' | 'brand' | 'default'> = {
    out: 'error', almost_finished: 'warning', low: 'warning', enough: 'success', extra_stock: 'brand',
  }
  return map[s]
}

function stockLabel(s: StockStatus) {
  const map: Record<StockStatus, string> = {
    out: 'Out', almost_finished: 'Almost finished', low: 'Low', enough: 'Enough', extra_stock: 'Extra stock',
  }
  return map[s]
}

function targetLabel(t: TargetLevel) {
  const map: Record<TargetLevel, string> = {
    keep_1: 'Keep 1', keep_2: 'Keep 2', keep_3_plus: 'Keep 3+', weekly_item: 'Weekly', monthly_item: 'Monthly',
  }
  return map[t]
}

function openCreateDrawer() {
  editingItem.value = null
  formName.value = ''
  formCategory.value = ''
  formLocation.value = ''
  formStockStatus.value = 'enough'
  formTargetLevel.value = 'keep_1'
  formRestockNeeded.value = false
  formLastCheckedDate.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(item: InventoryItem) {
  editingItem.value = item
  formName.value = item.name
  formCategory.value = item.category ?? ''
  formLocation.value = item.location ?? ''
  formStockStatus.value = item.stock_status
  formTargetLevel.value = item.target_level
  formRestockNeeded.value = item.restock_needed
  formLastCheckedDate.value = item.last_checked_date ? item.last_checked_date.slice(0, 10) : ''
  formNote.value = item.note ?? ''
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      category: formCategory.value.trim() || null,
      location: formLocation.value.trim() || null,
      stock_status: formStockStatus.value,
      target_level: formTargetLevel.value,
      restock_needed: formRestockNeeded.value,
      last_checked_date: formLastCheckedDate.value || null,
      note: formNote.value.trim() || null,
    }
    if (editingItem.value) {
      await inventoryStore.update(editingItem.value.id, payload)
    } else {
      await inventoryStore.create({
        ...payload,
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
  if (appStore.confirmBeforeDelete) {
    deletingItemId.value = id
    confirmDeleteOpen.value = true
  } else {
    inventoryStore.remove(id)
  }
}

async function handleDelete() {
  if (deletingItemId.value) {
    await inventoryStore.remove(deletingItemId.value)
  }
  confirmDeleteOpen.value = false
  deletingItemId.value = null
}

async function quickStockUpdate(id: string, status: StockStatus) {
  await inventoryStore.update(id, { stock_status: status })
}

async function addToShoppingList(item: InventoryItem) {
  await shoppingStore.create({
    name: item.name,
    quantity: 1,
    unit: null,
    category: item.category,
    priority: 'medium',
    assigned_to: null,
    status: 'needed',
    preferred_store: null,
    note: null,
    household_id: authStore.householdId!,
    deleted: false,
  })
}

onMounted(async () => {
  if (authStore.householdId) {
    await inventoryStore.fetchItems(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Pantry" subtitle="Track household items" class="page-enter" :style="{ '--stagger': 0 }">
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
        <span class="stats-bar__label">Total Items</span>
        <span class="stats-bar__value">{{ inventoryStore.items.length }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Low Stock</span>
        <span class="stats-bar__value">{{ inventoryStore.lowStockItems.length }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Restock Needed</span>
        <span class="stats-bar__value">{{ inventoryStore.restockNeeded.length }}</span>
      </div>
    </div>

    <ErrorBanner v-if="inventoryStore.error" :message="inventoryStore.error" @retry="authStore.householdId && inventoryStore.fetchItems(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="stockStatusFilter" :options="stockStatusOptions" placeholder="Stock status" />
      <SSelect v-model="categoryFilter" :options="categoryOptions" placeholder="Category" />
      <SSelect v-model="locationFilter" :options="locationOptions" placeholder="Location" />
    </FilterBar>

    <div v-if="inventoryStore.loading && !inventoryStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="!filteredItems.length" class="empty-section page-enter" :style="{ '--stagger': 3 }">
      <EmptyState v-if="!inventoryStore.items.length" title="No items tracked" subtitle="Add items to keep track of household stock levels." icon="empty" action-label="Add item" @action="openCreateDrawer" />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </div>

    <div v-else class="inv-table page-enter" :style="{ '--stagger': 3 }">
      <div class="inv-table__header">
        <span class="inv-table__th">Item</span>
        <span class="inv-table__th inv-table__th--center">Stock</span>
        <span class="inv-table__th inv-table__th--center">Category</span>
        <span class="inv-table__th inv-table__th--center">Location</span>
        <span class="inv-table__th inv-table__th--center">Target</span>
        <span class="inv-table__th inv-table__th--right">Last checked</span>
      </div>
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="inv-row"
        @click="openEditDrawer(item)"
      >
        <div class="inv-row__name">{{ item.name }}</div>
        <div class="inv-row__stock">
          <SBadge v-if="appStore.showStockIndicators" :variant="stockVariant(item.stock_status)" size="sm">{{ stockLabel(item.stock_status) }}</SBadge>
        </div>
        <div class="inv-row__chips">
          <div class="inv-row__category">
            <SBadge v-if="item.category" size="sm">{{ item.category }}</SBadge>
          </div>
          <div class="inv-row__location">
            <span v-if="item.location">{{ item.location }}</span>
          </div>
          <div class="inv-row__target">{{ targetLabel(item.target_level) }}</div>
          <div class="inv-row__checked">{{ item.last_checked_date ? formatDate(item.last_checked_date) : '—' }}</div>
        </div>
      </div>
    </div>

    <FormDrawer :open="drawerOpen" :title="editingItem ? 'Edit Item' : 'Add Item'" :submit-label="editingItem ? 'Update' : 'Add'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="Item name" /></FormField>
        <FormField><SInput v-model="formCategory" label="Category" placeholder="e.g. Cleaning, Pantry" /></FormField>
        <FormField><SInput v-model="formLocation" label="Location" placeholder="e.g. Kitchen cabinet, Garage" /></FormField>
        <FormField><SSelect v-model="formStockStatus" label="Stock Status" :options="stockStatusFormOptions" /></FormField>
        <FormField><SSelect v-model="formTargetLevel" label="Target Level" :options="targetLevelOptions" /></FormField>
        <FormField row><SToggle v-model="formRestockNeeded" label="Restock needed" /></FormField>
        <FormField><SInput v-model="formLastCheckedDate" label="Last Checked" type="date" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Item" message="Remove this inventory item?" confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
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
.inv-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.inv-table__header {
  display: grid;
  grid-template-columns: 1fr 120px 100px 100px 80px 100px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

.inv-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.inv-table__th--center { text-align: center; }
.inv-table__th--right { text-align: right; }

.inv-row {
  display: grid;
  grid-template-columns: 1fr 120px 100px 100px 80px 100px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.inv-row:last-child { border-bottom: none; }
.inv-row:hover { background: var(--color-bg-tertiary); }

.inv-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inv-row__stock,
.inv-row__category {
  display: flex;
  align-items: center;
  justify-content: center;
}

.inv-row__location {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: center;
}

.inv-row__target {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: center;
}

.inv-row__checked {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: right;
}

.inv-row__chips {
  display: contents;
}

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }
  .pantry-mobile-actions { display: flex; margin-bottom: var(--space-m); }
  .inv-table__header { display: none; }
  .inv-row {
    grid-template-columns: 1fr 5rem;
    grid-template-rows: auto auto;
    padding: var(--space-s) var(--space-l);
    row-gap: var(--space-2xs);
    column-gap: var(--space-m);
  }
  .inv-row__name { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .inv-row__stock { grid-column: 2; grid-row: 1 / -1; align-self: center; justify-self: end; }
  .inv-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    grid-column: 1;
    grid-row: 2;
    align-items: center;
  }
  .inv-row__location,
  .inv-row__target,
  .inv-row__checked { font: var(--text-caption); color: var(--color-fg-tertiary); }
}
</style>
