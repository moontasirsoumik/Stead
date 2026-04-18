<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
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
import { useAppStore } from '@/stores/app.store'
import { useHouseholdStore } from '@/stores/household.store'
import { formatCents, formatDate } from '@/utils/format'
import type { SavingsGoal } from '@/models/savings-goal.model'
import type { GoalStatus, TaskPriority } from '@/models/enums'

const savingsStore = useSavingsStore()
const authStore = useAuthStore()
const appStore = useAppStore()
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

const scopedGoals = computed(() =>
  savingsStore.goals.filter((g) => g.scope === appStore.scope),
)

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
      scope: appStore.scope,
      owner_id: appStore.scope === 'personal' ? authStore.memberId : null,
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
      scope: appStore.scope,
      owner_id: appStore.scope === 'personal' ? authStore.memberId : null,
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

    <div v-else-if="scopedGoals.length" class="goals-table">
      <div class="goals-table__header">
        <span class="goals-table__th">Goal</span>
        <span class="goals-table__th goals-table__th--center">Priority</span>
        <span class="goals-table__th goals-table__th--center">Status</span>
        <span class="goals-table__th goals-table__th--center">Progress</span>
        <span class="goals-table__th goals-table__th--right">Saved</span>
        <span class="goals-table__th goals-table__th--right">Target</span>
        <span class="goals-table__th goals-table__th--right">Date</span>
      </div>
      <div
        v-for="(goal, idx) in scopedGoals"
        :key="goal.id"
        class="goal-block page-enter"
        :style="{ '--stagger': 3 + idx }"
      >
        <div class="goal-row" @click="openEditGoal(goal)">
          <div class="goal-row__name">{{ goal.name }}</div>
          <div class="goal-row__priority">
            <SBadge :variant="priorityVariant(goal.priority)" size="sm">{{ goal.priority }}</SBadge>
          </div>
          <div class="goal-row__status">
            <SBadge :variant="statusVariant(goal.status)" size="sm">{{ goal.status }}</SBadge>
          </div>
          <div class="goal-row__progress">
            <div class="goal-bar">
              <div class="goal-bar__fill" :style="{ width: `${savingsStore.goalProgress(goal.id)}%` }" />
            </div>
            <span class="goal-row__percent">{{ Math.round(savingsStore.goalProgress(goal.id)) }}%</span>
          </div>
          <div class="goal-row__saved">{{ formatCents(goal.current_amount) }}</div>
          <div class="goal-row__target">{{ formatCents(goal.target_amount) }}</div>
          <div class="goal-row__deadline">{{ goal.deadline ? formatDate(goal.deadline) : '—' }}</div>
        </div>
        <div class="goal-actions">
          <SButton variant="subtle" size="sm" @click.stop="openAddContribution(goal.id)">+ Contrib</SButton>
          <SButton variant="subtle" size="sm" @click.stop="toggleExpand(goal.id)">{{ expandedGoalId === goal.id ? 'Hide' : 'History' }}</SButton>
        </div>
        <div v-if="expandedGoalId === goal.id" class="goal-contribs">
          <div v-for="contrib in (savingsStore.contributions[goal.id] ?? [])" :key="contrib.id" class="contrib-row">
            <div class="contrib-row__left">
              <SAvatar :name="getMemberName(contrib.contributed_by)" :color="getMemberColor(contrib.contributed_by)" size="sm" />
              <div class="contrib-row__details">
                <span class="contrib-row__amount">{{ formatCents(contrib.amount) }}</span>
                <span class="contrib-row__date">{{ formatDate(contrib.date) }}</span>
              </div>
            </div>
            <span v-if="contrib.note" class="contrib-row__note">{{ contrib.note }}</span>
          </div>
          <p v-if="!(savingsStore.contributions[goal.id]?.length)" class="goal-no-contribs">No contributions yet</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-section page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        title="No savings goals"
        subtitle="Set a goal and watch your progress grow"
        icon="empty"
        action-label="Create Goal"
        @action="openAddGoal"
      />
    </div>

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
.goals-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
}

.goals-table__header {
  display: grid;
  grid-template-columns: 1fr 80px 80px 180px 100px 100px 100px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-default);
  gap: var(--space-m);
}

.goals-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.goals-table__th--center { text-align: center; }
.goals-table__th--right { text-align: right; }

.goal-block {
  border-bottom: 1px solid var(--color-border-subtle);
}

.goal-block:last-child { border-bottom: none; }

.goal-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px 180px 100px 100px 100px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.goal-row:hover { background: var(--color-bg-tertiary); }

.goal-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goal-row__priority,
.goal-row__status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.goal-row__progress {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.goal-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-circle);
  overflow: hidden;
}

.goal-bar__fill {
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: var(--radius-circle);
  transition: width var(--duration-normal) var(--easing-standard);
}

.goal-row__percent {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
  min-width: 32px;
  text-align: right;
}

.goal-row__saved {
  font: var(--text-body-2);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  white-space: nowrap;
  text-align: right;
}

.goal-row__target {
  font: var(--text-caption);
  font-family: var(--font-mono);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  text-align: right;
}

.goal-row__deadline {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  text-align: right;
}

.goal-actions {
  display: flex;
  gap: var(--space-2xs);
  padding: var(--space-2xs) var(--space-l);
  border-top: 1px solid var(--color-border-subtle);
}

.goal-contribs {
  padding: var(--space-xs) var(--space-l) var(--space-s);
  border-top: 1px solid var(--color-border-subtle);
}

.goal-no-contribs {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  padding: var(--space-xs) 0;
}

.contrib-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2xs) 0;
  gap: var(--space-m);
  border-bottom: 1px solid var(--color-border-subtle);
}

.contrib-row:last-child { border-bottom: none; }

.contrib-row__left {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.contrib-row__details {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.contrib-row__amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
}

.contrib-row__date {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.contrib-row__note {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

@media (max-width: 768px) {
  .goals-table__header { display: none; }
  .goal-row {
    grid-template-columns: 1fr auto auto;
    padding: var(--space-s) var(--space-l);
  }
  .goal-row__progress { display: none; }
  .goal-row__target { display: none; }
  .goal-row__deadline { display: none; }
}
</style>
