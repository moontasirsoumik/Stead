<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
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
  return Math.min(100, Math.round((item.saved_amount / item.price) * 100))
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
  formDescription.value = item.description
  formUrl.value = item.url
  formPrice.value = item.price ? String(item.price / 100) : ''
  formPriority.value = item.priority
  formCategory.value = item.category
  formNote.value = item.note
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
  deletingItemId.value = id
  confirmDeleteOpen.value = true
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
    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <ContentCard class="stat-card">
        <span class="stat-value">{{ activeItemCount }}</span>
        <span class="stat-label">Items wanted</span>
      </ContentCard>
      <ContentCard class="stat-card">
        <span class="stat-value">{{ formatCents(wishlistStore.totalWishlistValue) }}</span>
        <span class="stat-label">Total value</span>
      </ContentCard>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" />
      <SSelect v-model="priorityFilter" :options="priorityOptions" placeholder="Priority" />
    </FilterBar>

    <ContentCard v-if="wishlistStore.loading && !wishlistStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <template v-else-if="!filteredItems.length">
      <ContentCard class="page-enter" :style="{ '--stagger': 3 }">
        <EmptyState v-if="!wishlistStore.items.length" title="Your wishlist is empty" subtitle="Start dreaming! Add the things you'd love to have." icon="empty" action-label="Add first item" @action="openCreateDrawer" />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
      </ContentCard>
    </template>

    <template v-else>
      <div class="wishlist-grid page-enter" :style="{ '--stagger': 3 }">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="wishlist-card"
          :class="{ 'wishlist-card--dimmed': isItemDimmed(item) }"
          @click="openEditDrawer(item)"
        >
          <div class="wishlist-card__header">
            <span class="wishlist-card__name">{{ item.name }}</span>
            <SBadge :variant="statusVariant(item.status)" size="sm">{{ item.status }}</SBadge>
          </div>

          <div class="wishlist-card__price-row">
            <span class="wishlist-card__price">{{ formatCents(item.price) }}</span>
            <SBadge :variant="priorityVariant(item.priority)" size="sm">{{ item.priority }}</SBadge>
          </div>

          <div v-if="item.status === 'saving' && item.price > 0" class="wishlist-card__progress">
            <div class="progress-bar">
              <div class="progress-bar__fill" :style="{ width: savingProgress(item) + '%' }" />
            </div>
            <span class="progress-text">{{ formatCents(item.saved_amount) }} / {{ formatCents(item.price) }}</span>
          </div>

          <p v-if="item.description" class="wishlist-card__desc">{{ item.description }}</p>

          <div class="wishlist-card__actions" @click.stop>
            <SIconButton v-if="item.status === 'wanted'" label="Start saving" size="sm" @click="startSaving(item)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
            </SIconButton>
            <SIconButton v-if="item.status === 'wanted' || item.status === 'saving'" label="Mark bought" size="sm" @click="markAsBought(item)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </SIconButton>
            <SIconButton v-if="item.status === 'wanted' || item.status === 'saving'" label="Drop item" size="sm" @click="dropItem(item)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
            </SIconButton>
            <SIconButton label="Delete" size="sm" @click="confirmDelete(item.id)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3H10M4 3V2H8V3M5 5V9M7 5V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" /></svg>
            </SIconButton>
          </div>
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
.stats-row {
  display: flex;
  gap: var(--space-m);
  margin-bottom: var(--space-l);
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-l);
}

.stat-value {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
}

.stat-label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-top: var(--space-2xs);
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-l);
  margin-bottom: var(--space-l);
}

.wishlist-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-l);
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-default);
  box-shadow: var(--shadow-2), var(--shadow-card);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard),
    opacity var(--duration-fast) var(--easing-standard);
}

.wishlist-card:hover {
  background: var(--color-surface-card-hover);
  box-shadow: var(--shadow-8), var(--shadow-card);
  border-color: var(--color-outline-variant);
}

.wishlist-card--dimmed {
  opacity: 0.55;
}

.wishlist-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.wishlist-card__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.wishlist-card__price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.wishlist-card__price {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
}

.wishlist-card__progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.progress-bar {
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: var(--radius-s);
  transition: width var(--duration-normal) var(--easing-standard);
}

.progress-text {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.wishlist-card__desc {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.wishlist-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.wishlist-card:hover .wishlist-card__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .stats-row {
    flex-direction: column;
  }
  .wishlist-grid {
    grid-template-columns: 1fr;
  }
  .wishlist-card__actions {
    opacity: 1;
  }
}
</style>
