<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SInput from '@/components/ui/SInput.vue'
import SSelect from '@/components/ui/SSelect.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import MonthSummary from '@/features/money/components/MonthSummary.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import { useSavingsStore } from '@/stores/savings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents, formatDate } from '@/utils/format'
import type { SavingsGoal } from '@/models/savings-goal.model'
import type { GoalStatus, TaskPriority } from '@/models/enums'

const savingsStore = useSavingsStore()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const goalDrawerOpen = ref(false)
const contribDrawerOpen = ref(false)
const editingGoalId = ref<string | null>(null)
const contributingGoalId = ref<string | null>(null)
const expandedGoalId = ref<string | null>(null)
const saving = ref(false)

const goalForm = ref({
  name: '',
  target_amount: '',
  deadline: '',
  priority: 'medium' as string,
  note: '',
})

const contribForm = ref({
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  contributed_by: '',
  note: '',
})

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const memberOptions = computed(() =>
  householdStore.activeMembers.map((m) => ({
    value: m.id,
    label: m.name,
  })),
)

function getMemberName(id: string): string {
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? 'Unknown'
}

function getMemberColor(id: string): string | undefined {
  return householdStore.activeMembers.find((m) => m.id === id)?.color
}

function statusVariant(status: GoalStatus): 'default' | 'success' | 'warning' | 'error' {
  const map: Record<GoalStatus, 'default' | 'success' | 'warning' | 'error'> = {
    active: 'default',
    reached: 'success',
    paused: 'warning',
    cancelled: 'error',
  }
  return map[status]
}

function priorityVariant(p: TaskPriority): 'error' | 'warning' | 'default' {
  return p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'default'
}

const summaryStats = computed(() => [
  {
    label: 'Total saved',
    value: formatCents(savingsStore.totalSaved),
  },
  {
    label: 'Active goals',
    value: String(savingsStore.goals.filter((g) => g.status === 'active').length),
  },
])

function openAddGoal() {
  editingGoalId.value = null
  goalForm.value = {
    name: '',
    target_amount: '',
    deadline: '',
    priority: 'medium',
    note: '',
  }
  goalDrawerOpen.value = true
}

function openEditGoal(goal: SavingsGoal) {
  editingGoalId.value = goal.id
  goalForm.value = {
    name: goal.name,
    target_amount: String(goal.target_amount / 100),
    deadline: goal.deadline?.slice(0, 10) ?? '',
    priority: goal.priority,
    note: goal.note ?? '',
  }
  goalDrawerOpen.value = true
}

function openAddContribution(goalId: string) {
  contributingGoalId.value = goalId
  contribForm.value = {
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    contributed_by: authStore.memberId ?? '',
    note: '',
  }
  contribDrawerOpen.value = true
}

async function toggleExpand(goalId: string) {
  if (expandedGoalId.value === goalId) {
    expandedGoalId.value = null
  } else {
    expandedGoalId.value = goalId
    if (!savingsStore.contributions[goalId]) {
      await savingsStore.loadContributions(goalId)
    }
  }
}

async function handleGoalSubmit() {
  saving.value = true
  try {
    const cents = Math.round(parseFloat(goalForm.value.target_amount) * 100)
    const payload = {
      household_id: authStore.householdId!,
      name: goalForm.value.name,
      target_amount: cents,
      current_amount: 0,
      deadline: goalForm.value.deadline || null,
      priority: goalForm.value.priority as TaskPriority,
      status: 'active' as GoalStatus,
      note: goalForm.value.note || null,
      deleted: false,
    }
    if (editingGoalId.value) {
      const { current_amount: _c, status: _s, ...rest } = payload
      await savingsStore.updateGoal(editingGoalId.value, rest)
    } else {
      await savingsStore.createGoal(payload)
    }
    goalDrawerOpen.value = false
  } finally {
    saving.value = false
  }
}

async function handleContribSubmit() {
  if (!contributingGoalId.value) return
  saving.value = true
  try {
    const cents = Math.round(parseFloat(contribForm.value.amount) * 100)
    await savingsStore.addContribution({
      household_id: authStore.householdId!,
      goal_id: contributingGoalId.value,
      amount: cents,
      date: contribForm.value.date,
      contributed_by: contribForm.value.contributed_by,
      note: contribForm.value.note || null,
      deleted: false,
    })
    contribDrawerOpen.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (authStore.householdId) {
    if (!householdStore.activeMembers.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
    await savingsStore.loadGoals(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Savings"
      subtitle="Track your saving goals"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    >
      <template #actions>
        <SButton @click="openAddGoal">Create Goal</SButton>
      </template>
    </PageHeader>

    <MoneyTabs />

    <ErrorBanner
      v-if="savingsStore.error"
      :message="savingsStore.error"
      class="page-enter"
      :style="{ '--stagger': 2 }"
      @dismiss="savingsStore.error = null"
    />

    <MonthSummary
      :stats="summaryStats"
      class="page-enter"
      :style="{ '--stagger': 2 }"
    />

    <div v-if="savingsStore.loading && !savingsStore.goals.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="savingsStore.goals.length" class="goals-grid">
      <ContentCard
        v-for="(goal, idx) in savingsStore.goals"
        :key="goal.id"
        padding="md"
        class="goal-card page-enter"
        :style="{ '--stagger': 3 + idx }"
      >
        <div class="goal-card__header">
          <span class="goal-card__name">{{ goal.name }}</span>
          <div class="goal-card__badges">
            <SBadge :variant="priorityVariant(goal.priority)" size="sm">{{ goal.priority }}</SBadge>
            <StatusBadge :variant="statusVariant(goal.status)">{{ goal.status }}</StatusBadge>
          </div>
        </div>

        <div class="goal-card__amounts">
          <span class="goal-card__current">{{ formatCents(goal.current_amount) }}</span>
          <span class="goal-card__target">of {{ formatCents(goal.target_amount) }}</span>
        </div>

        <div class="goal-card__bar">
          <div
            class="goal-card__fill"
            :style="{ width: `${savingsStore.goalProgress(goal.id)}%` }"
          />
        </div>

        <div class="goal-card__footer">
          <span v-if="goal.deadline" class="goal-card__deadline">
            Deadline: {{ formatDate(goal.deadline) }}
          </span>
          <span class="goal-card__percent">{{ Math.round(savingsStore.goalProgress(goal.id)) }}%</span>
        </div>

        <div class="goal-card__actions">
          <SButton variant="subtle" size="sm" @click.stop="openAddContribution(goal.id)">
            Add Contribution
          </SButton>
          <SButton variant="subtle" size="sm" @click.stop="toggleExpand(goal.id)">
            {{ expandedGoalId === goal.id ? 'Hide' : 'Show' }} History
          </SButton>
          <SButton variant="subtle" size="sm" @click.stop="openEditGoal(goal)">
            Edit
          </SButton>
        </div>

        <div v-if="expandedGoalId === goal.id" class="goal-card__contributions">
          <div
            v-for="contrib in (savingsStore.contributions[goal.id] ?? [])"
            :key="contrib.id"
            class="contrib-row"
          >
            <div class="contrib-row__left">
              <SAvatar :name="getMemberName(contrib.contributed_by)" :color="getMemberColor(contrib.contributed_by)" size="sm" />
              <div class="contrib-row__details">
                <span class="contrib-row__amount">{{ formatCents(contrib.amount) }}</span>
                <span class="contrib-row__date">{{ formatDate(contrib.date) }}</span>
              </div>
            </div>
            <span v-if="contrib.note" class="contrib-row__note">{{ contrib.note }}</span>
          </div>
          <p v-if="!(savingsStore.contributions[goal.id]?.length)" class="goal-card__no-contribs">
            No contributions yet
          </p>
        </div>
      </ContentCard>
    </div>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        title="No savings goals"
        subtitle="Set a goal and watch your progress grow"
        icon="empty"
        action-label="Create Goal"
        @action="openAddGoal"
      />
    </ContentCard>

    <!-- Goal Drawer -->
    <FormDrawer
      :open="goalDrawerOpen"
      :title="editingGoalId ? 'Edit Goal' : 'Create Goal'"
      :submit-label="editingGoalId ? 'Update' : 'Create'"
      :loading="saving"
      @close="goalDrawerOpen = false"
      @submit="handleGoalSubmit"
    >
      <FormSection title="Goal Details">
        <FormField>
          <SInput v-model="goalForm.name" label="Goal name" placeholder="e.g., Emergency fund" required />
        </FormField>
        <FormField>
          <SInput v-model="goalForm.target_amount" label="Target amount ($)" type="number" placeholder="0.00" required />
        </FormField>
        <FormField>
          <SInput v-model="goalForm.deadline" label="Deadline" type="text" placeholder="YYYY-MM-DD" />
        </FormField>
        <FormField>
          <SSelect
            v-model="goalForm.priority"
            label="Priority"
            :options="priorityOptions"
            required
          />
        </FormField>
      </FormSection>
      <FormSection title="Extra">
        <FormField>
          <STextarea v-model="goalForm.note" label="Note" placeholder="What is this goal for?" :rows="3" />
        </FormField>
      </FormSection>
    </FormDrawer>

    <!-- Contribution Drawer -->
    <FormDrawer
      :open="contribDrawerOpen"
      title="Add Contribution"
      submit-label="Add"
      :loading="saving"
      @close="contribDrawerOpen = false"
      @submit="handleContribSubmit"
    >
      <FormSection title="Contribution Details">
        <FormField>
          <SInput v-model="contribForm.amount" label="Amount ($)" type="number" placeholder="0.00" required />
        </FormField>
        <FormField>
          <SInput v-model="contribForm.date" label="Date" type="text" placeholder="YYYY-MM-DD" required />
        </FormField>
        <FormField>
          <SSelect
            v-model="contribForm.contributed_by"
            label="Contributed by"
            :options="memberOptions"
            placeholder="Select member"
            required
          />
        </FormField>
      </FormSection>
      <FormSection title="Extra">
        <FormField>
          <STextarea v-model="contribForm.note" label="Note" placeholder="Optional note…" :rows="2" />
        </FormField>
      </FormSection>
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-l);
}

.goal-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.goal-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.goal-card__name {
  font: var(--text-body-1);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
}

.goal-card__badges {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.goal-card__amounts {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.goal-card__current {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.goal-card__target {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.goal-card__bar {
  height: 3px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.goal-card__fill {
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: 2px;
  transition: width var(--duration-normal) var(--easing-standard);
}

.goal-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-card__deadline {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.goal-card__percent {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
}

.goal-card__actions {
  display: flex;
  gap: var(--space-xs);
  padding-top: var(--space-s);
  border-top: 1px solid var(--color-border-subtle);
}

.goal-card__contributions {
  padding-top: var(--space-s);
  border-top: 1px solid var(--color-border-subtle);
}

.contrib-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
}

.contrib-row:last-child {
  border-bottom: none;
}

.contrib-row__left {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.contrib-row__details {
  display: flex;
  flex-direction: column;
}

.contrib-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
}

.contrib-row__date {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.contrib-row__note {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  text-align: right;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goal-card__no-contribs {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: center;
  padding: var(--space-l) 0;
}
</style>
