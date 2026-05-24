<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SButton from '@/components/ui/SButton.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import TrackerCard from './components/TrackerCard.vue'
import TrackerFormDrawer from './components/TrackerFormDrawer.vue'
import { useTrackerStore } from '@/stores/tracker.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { Tracker } from '@/models/tracker.model'

const router = useRouter()
const trackerStore = useTrackerStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const search = ref('')
const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingTracker = ref<Tracker | null>(null)
const confirmDeleteOpen = ref(false)
const deletingTrackerId = ref<string | null>(null)

const filteredTrackers = computed(() => {
  let items = trackerStore.sortedTrackers.filter(
    (t) => t.scope === (appStore.isPersonal ? 'personal' : 'household'),
  )
  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter((t) => t.name.toLowerCase().includes(q))
  }
  return items
})

function getEntries(trackerId: string) {
  return trackerStore.entries.filter((e) => e.tracker_id === trackerId)
}

function openCreateDrawer() {
  editingTracker.value = null
  drawerOpen.value = true
}

function navigateToTracker(id: string) {
  router.push(`/trackers/${id}`)
}

async function handleSubmit(data: Record<string, unknown>) {
  drawerLoading.value = true
  try {
    if (editingTracker.value) {
      await trackerStore.updateTracker(editingTracker.value.id, data as Partial<Tracker>)
    } else {
      await trackerStore.createTracker({
        ...data,
        household_id: authStore.householdId!,
        scope: appStore.isPersonal ? 'personal' : 'household',
        owner_id: appStore.isPersonal ? authStore.memberId! : null,
        position: trackerStore.trackers.length,
        deleted: false,
      } as Omit<Tracker, 'id' | 'created_at' | 'updated_at'>)
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  if (appStore.confirmBeforeDelete) {
    deletingTrackerId.value = id
    confirmDeleteOpen.value = true
  } else {
    trackerStore.removeTracker(id)
  }
}

async function handleDelete() {
  if (deletingTrackerId.value) {
    await trackerStore.removeTracker(deletingTrackerId.value)
  }
  confirmDeleteOpen.value = false
  deletingTrackerId.value = null
}

async function handleQuickLog(tracker: Tracker, e: Event) {
  e.stopPropagation()
  // For boolean trackers, quick-log toggles true
  if (tracker.value_type === 'boolean') {
    await trackerStore.createEntry({
      household_id: tracker.household_id,
      tracker_id: tracker.id,
      entry_date: new Date().toISOString().slice(0, 10),
      numeric_value: null,
      text_value: null,
      boolean_value: true,
      notes: null,
      tags: null,
      deleted: false,
    } as Omit<import('@/models/tracker.model').TrackerEntry, 'id' | 'created_at' | 'updated_at'>)
  } else {
    // For other types, navigate to detail page for entry
    router.push(`/trackers/${tracker.id}`)
  }
}

onMounted(async () => {
  if (authStore.householdId) {
    await trackerStore.fetchTrackers(authStore.householdId)
    // Fetch entries per tracker to avoid Supabase 1000-row limit
    await Promise.all(
      trackerStore.trackers.map((t) =>
        trackerStore.fetchEntriesForTracker(authStore.householdId!, t.id),
      ),
    )
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Trackers" subtitle="Track anything — discover patterns" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">New Tracker</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="trackerStore.error" :message="trackerStore.error" @retry="authStore.householdId && trackerStore.fetchTrackers(authStore.householdId)" />

    <!-- Stats -->
    <div class="stats-bar page-enter" :style="{ '--stagger': 1 }">
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Trackers</span>
        <span class="stats-bar__value">{{ filteredTrackers.length }}</span>
      </div>
      <div class="stats-bar__cell">
        <span class="stats-bar__label">Total entries</span>
        <span class="stats-bar__value">{{ trackerStore.entries.length }}</span>
      </div>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }" />

    <div v-if="trackerStore.loading && !trackerStore.trackers.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <template v-else-if="!filteredTrackers.length">
      <div class="empty-section page-enter" :style="{ '--stagger': 3 }">
        <EmptyState
          v-if="!trackerStore.trackers.length"
          title="No trackers yet"
          subtitle="Start tracking weight, habits, cycles, savings — anything meaningful to you."
          icon="empty"
          action-label="New Tracker"
          @action="openCreateDrawer"
        />
        <EmptyState v-else title="No matches" subtitle="Try adjusting your search term." icon="search" />
      </div>
    </template>

    <template v-else>
      <div class="tracker-grid page-enter" :style="{ '--stagger': 3 }">
        <TrackerCard
          v-for="tracker in filteredTrackers"
          :key="tracker.id"
          :tracker="tracker"
          :entries="getEntries(tracker.id)"
          @click="navigateToTracker(tracker.id)"
          @quick-log="handleQuickLog(tracker, $event)"
        />
      </div>
    </template>

    <TrackerFormDrawer
      :open="drawerOpen"
      :tracker="editingTracker"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    />

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="Delete Tracker"
      message="This tracker and all its entries will be permanently removed."
      confirm-label="Delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="confirmDeleteOpen = false"
    />
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

.tracker-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-l);
}

@media (max-width: 640px) {
  .tracker-grid {
    grid-template-columns: 1fr;
  }
}
</style>
