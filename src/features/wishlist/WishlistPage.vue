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
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatCents } from '@/utils/format'
import type { WishlistItem } from '@/models/wishlist.model'

const wishlistStore = useWishlistStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingItem = ref<WishlistItem | null>(null)

const formName = ref('')
const formDescription = ref('')
const formUrl = ref('')
const formPrice = ref('')
const formPriority = ref<'high' | 'medium' | 'low'>('medium')
const formCategory = ref('')
const formNote = ref('')

const confirmDeleteOpen = ref(false)
const deletingItemId = ref<string | null>(null)

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'wanted', label: 'Wanted' },
  { value: 'saving', label: 'Saving' },
  { value: 'bought', label: 'Bought' },
  { value: 'dropped', label: 'Dropped' },
]

const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const priorityFormOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const filteredItems = computed(() => {
  let result = wishlistStore.items
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((i) => i.name.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter((i) => i.status === statusFilter.value)
  }
  if (priorityFilter.value) {
    result = result.filter((i) => i.priority === priorityFilter.value)
  }
  return result
})

const activeItemCount = computed(() =>
  wishlistStore.items.filter((i) => i.status === 'wanted' || i.status === 'saving').length,
)

function priorityVariant(priority: string): 'warning' | 'info' | 'default' {
  if (priority === 'high') return 'warning'
  if (priority === 'medium') return 'info'
  return 'default'
}

function statusVariant(status: string): 'success' | 'info' | 'warning' | 'default' {
  if (status === 'bought') return 'success'
  if (status === 'saving') return 'info'
  if (status === 'wanted') return 'warning'
  return 'default'
}

function savingProgress(item: WishlistItem): number {
  if (!item.price || item.price === 0) return 0
  return Math.min(100, Math.round(((item.saved_amount ?? 0) / item.price) * 100))
}

function isItemDimmed(item: WishlistItem): boolean {
  return item.status === 'bought' || item.status === 'dropped'
}

function openCreateDrawer() {
  editingItem.value = null
  formName.value = ''
  formDescription.value = ''
  formUrl.value = ''
  formPrice.value = ''
  formPriority.value = 'medium'
  formCategory.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(item: WishlistItem) {
  editingItem.value = item
  formName.value = item.name
  formDescription.value = item.description ?? ''
  formUrl.value = item.url ?? ''
  formPrice.value = item.price ? String(item.price / 100) : ''
  formPriority.value = item.priority
  formCategory.value = item.category ?? ''
  formNote.value = item.note ?? ''
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      description: formDescription.value.trim(),
      url: formUrl.value.trim(),
      price: formPrice.value ? Math.round(Number(formPrice.value) * 100) : 0,
      priority: formPriority.value,
      category: formCategory.value.trim(),
      note: formNote.value.trim(),
    }
    if (editingItem.value) {
      await wishlistStore.update(editingItem.value.id, payload)
    } else {
      await wishlistStore.create({
        ...payload,
        status: 'wanted',
        saved_amount: 0,
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

async function markAsBought(item: WishlistItem) {
  await wishlistStore.update(item.id, { status: 'bought' })
}

async function startSaving(item: WishlistItem) {
  await wishlistStore.update(item.id, { status: 'saving' })
}

async function dropItem(item: WishlistItem) {
  await wishlistStore.update(item.id, { status: 'dropped' })
}

function confirmDelete(id: string) {
  if (appStore.confirmBeforeDelete) {
    deletingItemId.value = id
    confirmDeleteOpen.value = true
  } else {
    wishlistStore.remove(id)
  }
}

async function handleDelete() {
  if (deletingItemId.value) {
    await wishlistStore.remove(deletingItemId.value)
  }
  confirmDeleteOpen.value = false
  deletingItemId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await wishlistStore.fetchItems(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Wishlist" subtitle="Things you want — someday or soon" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Item</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="wishlistStore.error" :message="wishlistStore.error" @retry="authStore.householdId && wishlistStore.fetchItems(authStore.householdId)" />

    <!-- Stats -->
    <div class="stats-bar page-enter" :style="{ '--stagger': 1 }">
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Items wanted</span>
        <span class="stats-bar__value">{{ activeItemCount }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Total value</span>
        <span class="stats-bar__value">{{ formatCents(wishlistStore.totalWishlistValue) }}</span>
      </div>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
      <SSelect v-model="priorityFilter" :options="priorityOptions" placeholder="Priority" />
    </FilterBar>

    <div v-if="wishlistStore.loading && !wishlistStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else-if="!filteredItems.length">
      <div class="empty-section page-enter" :style="{ '--stagger': 3 }">
        <EmptyState v-if="!wishlistStore.items.length" title="Your wishlist is empty" subtitle="Start dreaming! Add the things you'd love to have." icon="empty" action-label="Add first item" @action="openCreateDrawer" />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
      </div>
    </template>

    <template v-else>
      <div class="wish-table page-enter" :style="{ '--stagger': 3 }">
        <div class="wish-table__header">
          <span class="wish-table__th">Item</span>
          <span class="wish-table__th wish-table__th--center">Priority</span>
          <span class="wish-table__th wish-table__th--center">Status</span>
          <span class="wish-table__th wish-table__th--right">Price</span>
        </div>
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="wish-row"
          :class="{ 'wish-row--dimmed': isItemDimmed(item) }"
          @click="openEditDrawer(item)"
        >
          <div class="wish-row__name">
            <span class="wish-row__title">{{ item.name }}</span>
            <span v-if="item.category" class="wish-row__cat">{{ item.category }}</span>
          </div>
          <div class="wish-row__chips">
            <div class="wish-row__priority">
              <SBadge :variant="priorityVariant(item.priority)" size="sm">{{ item.priority }}</SBadge>
            </div>
            <div class="wish-row__status">
              <SBadge :variant="statusVariant(item.status)" size="sm">{{ item.status }}</SBadge>
            </div>
          </div>
          <div class="wish-row__price">{{ formatCents(item.price ?? 0) }}</div>
        </div>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingItem ? 'Edit Item' : 'Add Wishlist Item'" :submit-label="editingItem ? 'Update' : 'Add'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="What do you want?" /></FormField>
        <FormField><STextarea v-model="formDescription" label="Description" :rows="3" placeholder="Why you want it…" /></FormField>
        <FormField><SInput v-model="formUrl" label="URL" placeholder="https://…" /></FormField>
        <FormField><SInput v-model="formPrice" label="Price ($)" type="number" placeholder="0.00" /></FormField>
        <FormField><SSelect v-model="formPriority" :options="priorityFormOptions" label="Priority" /></FormField>
        <FormField><SInput v-model="formCategory" label="Category" placeholder="e.g. Tech, Home, Clothing" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Item" message="This wishlist item will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
  </PageContainer>
</template>

<style scoped>
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

.wish-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.wish-table__header {
  display: grid;
  grid-template-columns: 1fr 90px 90px 110px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

.wish-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.wish-table__th--center { text-align: center; }
.wish-table__th--right { text-align: right; }

.wish-row {
  display: grid;
  grid-template-columns: 1fr 90px 90px 110px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.wish-row:last-child { border-bottom: none; }
.wish-row:hover { background: var(--color-bg-tertiary); }
.wish-row--dimmed { opacity: 0.5; }

.wish-row__name {
  display: flex;
  align-items: baseline;
  gap: var(--space-s);
  min-width: 0;
}

.wish-row__title {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wish-row__cat {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
}

.wish-row__priority,
.wish-row__status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wish-row__price {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  text-align: right;
}

.wish-row__chips {
  display: contents;
}

@media (max-width: 640px) {
  .wish-table__header { display: none; }
  .wish-row {
    grid-template-columns: 1fr 5.5rem;
    grid-template-rows: auto auto;
    padding: var(--space-s) var(--space-l);
    row-gap: var(--space-2xs);
    column-gap: var(--space-m);
  }
  .wish-row__name { grid-column: 1; grid-row: 1; min-width: 0; }
  .wish-row__price { grid-column: 2; grid-row: 1 / -1; align-self: center; text-align: right; }
  .wish-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    grid-column: 1;
    grid-row: 2;
    align-items: center;
  }
}
</style>
