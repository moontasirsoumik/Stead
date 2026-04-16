<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
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
import { useHabitsStore } from '@/stores/habits.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { Habit } from '@/models/habit.model'

const habitsStore = useHabitsStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingHabit = ref<Habit | null>(null)

const formName = ref('')
const formDescription = ref('')
const formFrequency = ref<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily')
const formColor = ref('#6366f1')
const formTargetDays = ref('')

const confirmDeleteOpen = ref(false)
const deletingHabitId = ref<string | null>(null)

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
]

const weekDates = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  const dates: { date: string; label: string; isToday: boolean }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    dates.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: dateStr === today.toISOString().slice(0, 10),
    })
  }
  return dates
})

function isChecked(habitId: string, date: string): boolean {
  return habitsStore.logs.some(
    (l) => l.habit_id === habitId && l.log_date === date && l.completed,
  )
}

async function toggle(habitId: string, date: string) {
  await habitsStore.toggleLog(habitId, date)
}

const weekCompletionRate = computed(() => {
  const activeHabits = habitsStore.activeHabits
  if (!activeHabits.length) return 0
  const totalSlots = activeHabits.length * 7
  let completed = 0
  for (const habit of activeHabits) {
    for (const wd of weekDates.value) {
      if (isChecked(habit.id, wd.date)) completed++
    }
  }
  return Math.round((completed / totalSlots) * 100)
})

const habitStreaks = computed(() =>
  habitsStore.activeHabits
    .map((h) => ({ name: h.name, streak: habitsStore.getStreak(h.id), color: h.color }))
    .filter((s) => s.streak > 0)
    .sort((a, b) => b.streak - a.streak),
)

function openCreateDrawer() {
  editingHabit.value = null
  formName.value = ''
  formDescription.value = ''
  formFrequency.value = 'daily'
  formColor.value = '#6366f1'
  formTargetDays.value = ''
  drawerOpen.value = true
}

function openEditDrawer(habit: Habit) {
  editingHabit.value = habit
  formName.value = habit.name
  formDescription.value = habit.description
  formFrequency.value = habit.frequency
  formColor.value = habit.color || '#6366f1'
  formTargetDays.value = habit.target_days
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      description: formDescription.value.trim(),
      frequency: formFrequency.value,
      color: formColor.value,
      target_days: formTargetDays.value.trim(),
    }
    if (editingHabit.value) {
      await habitsStore.update(editingHabit.value.id, payload)
    } else {
      await habitsStore.create({
        ...payload,
        active: true,
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

function confirmDelete(id: string) {
  deletingHabitId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingHabitId.value) {
    await habitsStore.remove(deletingHabitId.value)
  }
  confirmDeleteOpen.value = false
  deletingHabitId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      habitsStore.fetchHabits(authStore.householdId),
      habitsStore.fetchLogs(authStore.householdId),
    ])
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Habits" subtitle="Build consistency, one day at a time" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">New Habit</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="habitsStore.error" :message="habitsStore.error" @retry="() => { if (authStore.householdId) { habitsStore.fetchHabits(authStore.householdId!); habitsStore.fetchLogs(authStore.householdId!) } }" />

    <!-- Stats -->
    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <ContentCard class="stat-card">
        <span class="stat-value">{{ habitsStore.activeHabits.length }}</span>
        <span class="stat-label">Active habits</span>
      </ContentCard>
      <ContentCard class="stat-card">
        <span class="stat-value">{{ weekCompletionRate }}%</span>
        <span class="stat-label">This week</span>
      </ContentCard>
    </div>

    <ContentCard v-if="habitsStore.loading && !habitsStore.items.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <template v-else-if="!habitsStore.activeHabits.length">
      <ContentCard class="page-enter" :style="{ '--stagger': 2 }">
        <EmptyState title="No habits yet" subtitle="Build your first daily habit — small steps lead to big changes." icon="empty" action-label="Create habit" @action="openCreateDrawer" />
      </ContentCard>
    </template>

    <template v-else>
      <!-- Weekly grid -->
      <ContentCard class="habits-grid-card page-enter" :style="{ '--stagger': 2 }">
        <div class="habits-grid">
          <!-- Header row -->
          <div class="habits-grid__header">
            <div class="habits-grid__habit-col">Habit</div>
            <div
              v-for="wd in weekDates"
              :key="wd.date"
              class="habits-grid__day-col"
              :class="{ 'habits-grid__day-col--today': wd.isToday }"
            >
              {{ wd.label }}
            </div>
            <div class="habits-grid__streak-col">Streak</div>
          </div>

          <!-- Habit rows -->
          <div
            v-for="habit in habitsStore.activeHabits"
            :key="habit.id"
            class="habits-grid__row"
          >
            <div class="habits-grid__habit-col">
              <span class="habit-dot" :style="{ background: habit.color || 'var(--color-brand-primary)' }" />
              <span class="habit-name" @click="openEditDrawer(habit)">{{ habit.name }}</span>
            </div>
            <div
              v-for="wd in weekDates"
              :key="wd.date"
              class="habits-grid__day-col"
              :class="{ 'habits-grid__day-col--today': wd.isToday }"
            >
              <button
                class="habit-check"
                :class="{ 'habit-check--checked': isChecked(habit.id, wd.date) }"
                :style="isChecked(habit.id, wd.date) ? { background: habit.color || 'var(--color-brand-primary)', borderColor: habit.color || 'var(--color-brand-primary)' } : {}"
                @click="toggle(habit.id, wd.date)"
              >
                <svg v-if="isChecked(habit.id, wd.date)" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
            <div class="habits-grid__streak-col">
              <span class="streak-count">{{ habitsStore.getStreak(habit.id) }}</span>
            </div>
          </div>
        </div>
      </ContentCard>

      <!-- Streaks -->
      <div v-if="habitStreaks.length" class="streaks-section page-enter" :style="{ '--stagger': 3 }">
        <h3 class="streaks-title">Current Streaks</h3>
        <div class="streaks-list">
          <div v-for="s in habitStreaks" :key="s.name" class="streak-item">
            <span class="habit-dot" :style="{ background: s.color || 'var(--color-brand-primary)' }" />
            <span class="streak-item__name">{{ s.name }}</span>
            <span class="streak-item__count">{{ s.streak }} day{{ s.streak !== 1 ? 's' : '' }} 🔥</span>
          </div>
        </div>
      </div>
    </template>

    <FormDrawer :open="drawerOpen" :title="editingHabit ? 'Edit Habit' : 'New Habit'" :submit-label="editingHabit ? 'Update' : 'Create'" :loading="drawerLoading" @close="drawerOpen = false" @submit="handleSubmit">
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="e.g. Read 30 minutes" /></FormField>
        <FormField><STextarea v-model="formDescription" label="Description" :rows="3" placeholder="Why this habit matters…" /></FormField>
        <FormField><SSelect v-model="formFrequency" :options="frequencyOptions" label="Frequency" /></FormField>
        <FormField><SInput v-model="formColor" label="Color" type="text" placeholder="#hexcode" /></FormField>
        <FormField><SInput v-model="formTargetDays" label="Target days" placeholder="e.g. mon,tue,wed,thu,fri" /></FormField>
      </FormSection>

      <template v-if="editingHabit" #footer-extra>
        <SButton variant="subtle" @click="confirmDelete(editingHabit!.id)">Delete habit</SButton>
      </template>
    </FormDrawer>

    <ConfirmDialog :open="confirmDeleteOpen" title="Delete Habit" message="This habit and all its logs will be permanently removed." confirm-label="Delete" variant="danger" @confirm="handleDelete" @cancel="confirmDeleteOpen = false" />
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

.habits-grid-card {
  margin-bottom: var(--space-l);
  overflow-x: auto;
}

.habits-grid {
  display: flex;
  flex-direction: column;
  min-width: 520px;
}

.habits-grid__header {
  display: flex;
  align-items: center;
  padding: var(--space-s) 0;
  border-bottom: 1px solid var(--color-border-default);
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.habits-grid__row {
  display: flex;
  align-items: center;
  padding: var(--space-s) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.habits-grid__row:last-child {
  border-bottom: none;
}

.habits-grid__habit-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 120px;
}

.habits-grid__day-col {
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.habits-grid__day-col--today {
  background: var(--color-surface-raised);
  border-radius: var(--radius-m);
}

.habits-grid__streak-col {
  width: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.habit-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
}

.habit-name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.habit-name:hover {
  color: var(--color-brand-primary);
}

.habit-check {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-s);
  border: 2px solid var(--color-border-default);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.habit-check:hover {

  transform: scale(1.1);
}

.habit-check--checked {
  border-color: transparent;
}

.streak-count {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.streaks-section {
  margin-bottom: var(--space-l);
}

.streaks-title {
  font: var(--text-title-3);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-m);
}

.streaks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.streak-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-s) var(--space-m);
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-default);
}

.streak-item__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  flex: 1;
}

.streak-item__count {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

@media (max-width: 640px) {
  .stats-row {
    flex-direction: column;
  }
}
</style>
