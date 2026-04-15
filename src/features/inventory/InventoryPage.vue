<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import DataList from '@/components/data/DataList.vue'
import InlineStat from '@/components/data/InlineStat.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SToggle from '@/components/ui/SToggle.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useInventoryStore } from '@/stores/inventory.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/format'
import type { InventoryItem } from '@/models/inventory.model'
import type { StockStatus, TargetLevel } from '@/models/enums'

const inventoryStore = useInventoryStore()
const authStore = useAuthStore()

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
  deletingItemId.value = id
  confirmDeleteOpen.value = true
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

onMounted(async () => {
  if (authStore.householdId) {
    await inventoryStore.fetchItems(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Inventory" subtitle="Track household items" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Item</SButton>
      </template>
    </PageHeader>

    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <InlineStat label="Total Items" :value="inventoryStore.items.length" />
      <InlineStat label="Low Stock" :value="inventoryStore.lowStockItems.length" :trend="inventoryStore.lowStockItems.length > 0 ? 'down' : 'neutral'" />
      <InlineStat label="Restock Needed" :value="inventoryStore.restockNeeded.length" :trend="inventoryStore.restockNeeded.length > 0 ? 'down' : 'neutral'" />
    </div>

    <ErrorBanner v-if="inventoryStore.error" :message="inventoryStore.error" @retry="authStore.householdId && inventoryStore.fetchItems(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="stockStatusFilter" :options="stockStatusOptions" placeholder="Stock status" />
      <SSelect v-model="categoryFilter" :options="categoryOptions" placeholder="Category" />
      <SSelect v-model="locationFilter" :options="locationOptions" placeholder="Location" />
    </FilterBar>

    <ContentCard v-if="inventoryStore.loading && !inventoryStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState v-if="!inventoryStore.items.length" title="No items tracked" subtitle="Add items to keep track of household stock levels." icon="empty" action-label="Add item" @action="openCreateDrawer" />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 3 }">
      <DataList dividers>
        <div v-for="item in filteredItems" :key="item.id" class="inv-row" role="listitem" @click="openEditDrawer(item)">
          <span class="inv-row__name">{{ item.name }}</span>
          <div class="inv-row__meta">
            <StatusBadge :variant="stockVariant(item.stock_status)">{{ stockLabel(item.stock_status) }}</StatusBadge>
            <SBadge v-if="item.category" size="sm">{{ item.category }}</SBadge>
            <span v-if="item.location" class="inv-row__location">{{ item.location }}</span>
            <span class="inv-row__target">{{ targetLabel(item.target_level) }}</span>
            <SBadge v-if="item.restock_needed" variant="warning" size="sm">Restock</SBadge>
          </div>
          <div class="inv-row__end">
            <span v-if="item.last_checked_date" class="inv-row__checked">{{ formatDate(item.last_checked_date) }}</span>
            <div class="inv-row__actions" @click.stop>
              <SButton v-if="item.stock_status !== 'out'" variant="subtle" size="sm" @click="quickStockUpdate(item.id, 'out')">Out</SButton>
              <SButton v-if="item.stock_status !== 'enough'" variant="subtle" size="sm" @click="quickStockUpdate(item.id, 'enough')">Stocked</SButton>
              <SIconButton label="Delete" size="sm" @click="confirmDelete(item.id)">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
              </SIconButton>
            </div>
          </div>
        </div>
      </DataList>
    </ContentCard>

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

.inv-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: 36px;
  padding: var(--space-xs) var(--space-l);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.inv-row:hover {
  background: var(--color-bg-secondary);
}

.inv-row__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}

.inv-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.inv-row__location,
.inv-row__target {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.inv-row__end {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
  margin-left: auto;
}

.inv-row__checked {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.inv-row__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.inv-row:hover .inv-row__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .stats-row { flex-direction: column; }
  .stats-row > * { border-right: none; border-bottom: 1px solid var(--color-border-subtle); }
  .stats-row > *:last-child { border-bottom: none; }
  .inv-row { flex-wrap: wrap; }
  .inv-row__actions { opacity: 1; }
}
</style>
