<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import EntryLogTable from './components/EntryLogTable.vue'
import EntryFormDrawer from './components/EntryFormDrawer.vue'
import TrackerFormDrawer from './components/TrackerFormDrawer.vue'
import TrackerChart from './components/TrackerChart.vue'
import CyclePanel from './components/CyclePanel.vue'
import AnalyticsPanel from './components/AnalyticsPanel.vue'
import { useTrackerStore } from '@/stores/tracker.store'
import { useAuthStore } from '@/stores/auth.store'
import { useTrackerAnalytics } from './composables/useTrackerAnalytics'
import type { Tracker, TrackerEntry } from '@/models/tracker.model'

const route = useRoute()
const router = useRouter()
const trackerStore = useTrackerStore()
const authStore = useAuthStore()

const trackerId = computed(() => route.params.id as string)

const tracker = computed(() =>
  trackerStore.trackers.find((t) => t.id === trackerId.value) ?? null,
)

const entries = computed(() => trackerStore.getEntriesForTracker(trackerId.value))

const { stats } = useTrackerAnalytics(tracker, entries)

// Entry drawer
const entryDrawerOpen = ref(false)
const entryDrawerLoading = ref(false)
const editingEntry = ref<TrackerEntry | null>(null)

// Tracker edit drawer
const trackerDrawerOpen = ref(false)
const trackerDrawerLoading = ref(false)

// Confirm delete
const confirmDeleteOpen = ref(false)
const deletingEntryId = ref<string | null>(null)

// Sections expandable
const showChart = ref(true)
const showAnalytics = ref(true)

function openEntryDrawer(entry?: TrackerEntry) {
  editingEntry.value = entry ?? null
  entryDrawerOpen.value = true
}

async function handleEntrySubmit(data: Record<string, unknown>) {
  if (!tracker.value) return
  entryDrawerLoading.value = true
  try {
    if (editingEntry.value) {
      await trackerStore.updateEntry(editingEntry.value.id, data as Partial<TrackerEntry>)
    } else {
      await trackerStore.createEntry({
        ...data,
        household_id: tracker.value.household_id,
        tracker_id: tracker.value.id,
        deleted: false,
      } as Omit<TrackerEntry, 'id' | 'created_at' | 'updated_at'>)
    }
    entryDrawerOpen.value = false
  } finally {
    entryDrawerLoading.value = false
  }
}

async function handleTrackerSubmit(data: Record<string, unknown>) {
  if (!tracker.value) return
  trackerDrawerLoading.value = true
  try {
    await trackerStore.updateTracker(tracker.value.id, data as Partial<Tracker>)
    trackerDrawerOpen.value = false
  } finally {
    trackerDrawerLoading.value = false
  }
}

function confirmDeleteEntry(id: string) {
  deletingEntryId.value = id
  confirmDeleteOpen.value = true
}

async function handleDeleteEntry() {
  if (deletingEntryId.value) {
    await trackerStore.removeEntry(deletingEntryId.value)
  }
  confirmDeleteOpen.value = false
  deletingEntryId.value = null
}

function formatLatest(): string {
  const v = stats.value.latest
  if (v === null) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'number') {
    if (tracker.value?.value_type === 'duration') {
      const h = Math.floor(v / 60)
      const m = v % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    }
    return tracker.value?.unit ? `${v} ${tracker.value.unit}` : v.toString()
  }
  return String(v)
}

onMounted(async () => {
  if (authStore.householdId) {
    await trackerStore.fetchTrackers(authStore.householdId)
    await trackerStore.fetchEntriesForTracker(authStore.householdId, trackerId.value)
  }
})
</script>

<template>
  <PageContainer>
    <template v-if="!tracker && !trackerStore.loading">
      <PageHeader title="Tracker not found" class="page-enter" :style="{ '--stagger': 0 }">
        <template #actions>
          <SButton variant="secondary" @click="router.push('/trackers')">Back</SButton>
        </template>
      </PageHeader>
    </template>

    <template v-else-if="trackerStore.loading && !tracker">
      <LoadingSkeleton :lines="8" />
    </template>

    <template v-else-if="tracker">
      <PageHeader :title="tracker.name" :subtitle="tracker.description ?? undefined" class="page-enter" :style="{ '--stagger': 0 }">
        <template #actions>
          <SButton variant="secondary" size="sm" @click="router.push('/trackers')">
            <span class="material-symbols-rounded" style="font-size: 18px;">arrow_back</span>
            Back
          </SButton>
          <SIconButton label="Edit tracker" @click="trackerDrawerOpen = true">
            <span class="material-symbols-rounded">settings</span>
          </SIconButton>
          <SButton @click="openEntryDrawer()">Log Entry</SButton>
        </template>
      </PageHeader>

      <ErrorBanner v-if="trackerStore.error" :message="trackerStore.error" />

      <!-- Stats row -->
      <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
        <div class="stat-card">
          <span class="stat-card__label">Latest</span>
          <span class="stat-card__value">{{ formatLatest() }}</span>
        </div>
        <div v-if="stats.average !== null" class="stat-card">
          <span class="stat-card__label">Average</span>
          <span class="stat-card__value">{{ stats.average.toFixed(1) }}</span>
        </div>
        <div v-if="stats.trend" class="stat-card">
          <span class="stat-card__label">Trend</span>
          <span :class="['stat-card__value', `stat-card__value--${stats.trend}`]">
            <span class="material-symbols-rounded" style="font-size: 18px;">
              {{ stats.trend === 'up' ? 'trending_up' : stats.trend === 'down' ? 'trending_down' : 'trending_flat' }}
            </span>
            {{ stats.trend }}
          </span>
        </div>
        <div v-if="stats.currentStreak > 0" class="stat-card">
          <span class="stat-card__label">Streak</span>
          <span class="stat-card__value">{{ stats.currentStreak }} days</span>
        </div>
        <div v-if="stats.goalProgress !== null" class="stat-card">
          <span class="stat-card__label">Goal</span>
          <span class="stat-card__value stat-card__value--accent">{{ stats.goalProgress.toFixed(0) }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Entries</span>
          <span class="stat-card__value">{{ stats.count }}</span>
        </div>
      </div>

      <!-- Chart section -->
      <template v-if="tracker.is_cyclic">
        <div class="section-header page-enter" :style="{ '--stagger': 2 }">
          <h2 class="section-header__title">Cycle</h2>
        </div>
        <CyclePanel
          :tracker="tracker"
          :entries="entries"
          class="page-enter"
          :style="{ '--stagger': 3 }"
        />
      </template>
      <template v-else>
        <div class="section-toggle page-enter" :style="{ '--stagger': 2 }">
          <button class="section-toggle__btn" @click="showChart = !showChart">
            <span class="material-symbols-rounded">{{ showChart ? 'expand_less' : 'expand_more' }}</span>
            Chart
          </button>
        </div>
        <TrackerChart
          v-if="showChart"
          :tracker="tracker"
          :entries="entries"
          class="page-enter"
          :style="{ '--stagger': 3 }"
        />
      </template>

      <!-- Entry log -->
      <div class="section-header page-enter" :style="{ '--stagger': 4 }">
        <h2 class="section-header__title">Entry Log</h2>
      </div>
      <EntryLogTable
        :tracker="tracker"
        :entries="entries"
        class="page-enter"
        :style="{ '--stagger': 5 }"
        @edit="openEntryDrawer"
        @delete="confirmDeleteEntry"
      />

      <!-- Analytics section -->
      <div class="section-toggle page-enter" :style="{ '--stagger': 6 }">
        <button class="section-toggle__btn" @click="showAnalytics = !showAnalytics">
          <span class="material-symbols-rounded">{{ showAnalytics ? 'expand_less' : 'expand_more' }}</span>
          Analytics
        </button>
      </div>
      <AnalyticsPanel
        v-if="showAnalytics"
        :tracker="tracker"
        :entries="entries"
        :all-entries="trackerStore.entries"
        :all-trackers="trackerStore.trackers"
        class="page-enter"
        :style="{ '--stagger': 7 }"
      />

      <!-- Entry form drawer -->
      <EntryFormDrawer
        v-if="tracker"
        :open="entryDrawerOpen"
        :tracker="tracker"
        :entry="editingEntry"
        :loading="entryDrawerLoading"
        @close="entryDrawerOpen = false"
        @submit="handleEntrySubmit"
      />

      <!-- Tracker edit drawer -->
      <TrackerFormDrawer
        :open="trackerDrawerOpen"
        :tracker="tracker"
        :loading="trackerDrawerLoading"
        @close="trackerDrawerOpen = false"
        @submit="handleTrackerSubmit"
      />

      <!-- Confirm delete -->
      <ConfirmDialog
        :open="confirmDeleteOpen"
        title="Delete Entry"
        message="This entry will be permanently removed."
        confirm-label="Delete"
        variant="danger"
        @confirm="handleDeleteEntry"
        @cancel="confirmDeleteOpen = false"
      />
    </template>
  </PageContainer>
</template>

<style scoped>
.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-m);
  margin-bottom: var(--space-l);
}

.stat-card {
  flex: 1;
  min-width: 100px;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-m) var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  box-shadow: var(--shadow-card);
}

.stat-card__label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.stat-card__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}
.stat-card__value--up { color: var(--color-green); }
.stat-card__value--down { color: var(--color-red); }
.stat-card__value--flat { color: var(--color-fg-secondary); }
.stat-card__value--accent { color: var(--color-accent); }

.section-toggle {
  margin: var(--space-l) 0 var(--space-s);
}
.section-toggle__btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: none;
  border: none;
  padding: var(--space-xs) 0;
  font: var(--text-body-1-strong);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--easing-standard);
}
.section-toggle__btn:hover { color: var(--color-fg-primary); }
.section-toggle__btn .material-symbols-rounded { font-size: 20px; }

.section-header {
  margin: var(--space-l) 0 var(--space-s);
}
.section-header__title {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
  margin: 0;
}

@media (max-width: 640px) {
  .stats-row {
    flex-direction: column;
  }
  .stat-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
