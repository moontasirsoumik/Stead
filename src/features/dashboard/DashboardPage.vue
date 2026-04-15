<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import InlineStat from '@/components/data/InlineStat.vue'
import SBadge from '@/components/ui/SBadge.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useExpensesStore } from '@/stores/expenses.store'
import { useIncomeStore } from '@/stores/income.store'
import { useBillsStore } from '@/stores/bills.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useShoppingStore } from '@/stores/shopping.store'
import { useInventoryStore } from '@/stores/inventory.store'
import { useRemindersStore } from '@/stores/reminders.store'
import { useNotesStore } from '@/stores/notes.store'
import { useSavingsStore } from '@/stores/savings.store'
import { useMaintenanceStore } from '@/stores/maintenance.store'
import { formatCents, formatRelativeDate } from '@/utils/format'
import type { TaskPriority } from '@/models/enums'
import type { BadgeVariant } from '@/components/ui/SBadge.vue'

const auth = useAuthStore()
const household = useHouseholdStore()
const expenses = useExpensesStore()
const income = useIncomeStore()
const bills = useBillsStore()
const tasks = useTasksStore()
const shopping = useShoppingStore()
const inventory = useInventoryStore()
const reminders = useRemindersStore()
const notes = useNotesStore()
const savings = useSavingsStore()
const maintenance = useMaintenanceStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = household.currentMember?.name ?? 'there'
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
})

const householdName = computed(() => household.household?.name ?? '')

// Tasks widget
const tasksDue = computed(() => {
  const combined = [...tasks.overdueTasks, ...tasks.dueToday]
  const ids = new Set<string>()
  return combined.filter((t) => {
    if (ids.has(t.id)) return false
    ids.add(t.id)
    return true
  }).slice(0, 5)
})

// Bills widget
const nextBills = computed(() =>
  bills.upcomingBills.slice(0, 5),
)

// Expenses widget — last 5 sorted by date desc
const recentExpenses = computed(() =>
  [...expenses.items]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5),
)

// Savings widget — active goals max 3
const activeGoals = computed(() =>
  savings.goals.filter((g) => g.status === 'active').slice(0, 3),
)

// Low stock items widget
const lowStock = computed(() =>
  inventory.lowStockItems.slice(0, 5),
)

// Shopping widget — needed items
const neededItems = computed(() =>
  shopping.items.filter((i) => i.status === 'needed').slice(0, 5),
)

// Reminders widget — overdue + upcoming
const upcomingReminders = computed(() => {
  const combined = [...reminders.overdueReminders, ...reminders.activeReminders]
  const ids = new Set<string>()
  return combined.filter((r) => {
    if (ids.has(r.id)) return false
    ids.add(r.id)
    return true
  }).slice(0, 5)
})

// Notes widget — pinned max 3
const pinned = computed(() =>
  notes.pinnedNotes.slice(0, 3),
)

// Maintenance widget — overdue + upcoming max 5
const maintenanceAlerts = computed(() => {
  const combined = [...maintenance.overdueItems, ...maintenance.upcomingItems]
  const ids = new Set<string>()
  return combined.filter((i) => {
    if (ids.has(i.id)) return false
    ids.add(i.id)
    return true
  }).slice(0, 5)
})

function priorityVariant(p: TaskPriority): BadgeVariant {
  if (p === 'high') return 'error'
  if (p === 'medium') return 'warning'
  return 'default'
}

function stockVariant(status: string): BadgeVariant {
  if (status === 'out') return 'error'
  if (status === 'almost_finished') return 'warning'
  return 'info'
}

function stockLabel(status: string): string {
  if (status === 'out') return 'Out'
  if (status === 'almost_finished') return 'Almost out'
  if (status === 'low') return 'Low'
  return status
}

function goalPercent(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(Math.round((current / target) * 100), 100)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

const isLoading = computed(() =>
  tasks.loading || bills.loading || expenses.loading || income.loading
  || shopping.loading || inventory.loading || reminders.loading || notes.loading
  || savings.loading || maintenance.loading,
)

onMounted(() => {
  const hid = auth.householdId
  if (!hid) return

  household.loadHousehold(hid)
  household.loadMembers(hid)
  expenses.fetchFresh(hid)
  income.fetchFresh(hid)
  bills.fetchFresh(hid)
  tasks.fetchTasks(hid)
  shopping.fetchItems(hid)
  inventory.fetchItems(hid)
  reminders.fetchReminders(hid)
  notes.fetchNotes(hid)
  savings.loadGoals(hid)
  maintenance.fetchItems(hid)
})
</script>

<template>
  <PageContainer>
    <PageHeader
      :title="greeting"
      :subtitle="householdName"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    />

    <!-- Top stats bar -->
    <div class="stats-bar page-enter" :style="{ '--stagger': 1 }">
      <div class="stat">
        <InlineStat
          label="Monthly spending"
          :value="formatCents(expenses.currentMonthTotal)"
        />
      </div>
      <div class="stat">
        <InlineStat
          label="Monthly income"
          :value="formatCents(income.currentMonthTotal)"
        />
      </div>
      <div class="stat">
        <InlineStat
          label="Upcoming bills"
          :value="String(bills.upcomingBills.length)"
        />
      </div>
      <div class="stat">
        <InlineStat
          label="Tasks due"
          :value="String(tasks.overdueTasks.length + tasks.dueToday.length)"
        />
      </div>
    </div>

    <!-- Widget grid -->
    <div class="dashboard-grid">
      <!-- Tasks Due -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 2 }">
        <div class="widget__header">
          <h3 class="widget__title">Tasks Due</h3>
          <RouterLink to="/tasks" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="tasks.loading" :lines="3" />
        <template v-else-if="tasksDue.length">
          <ul class="widget__list">
            <li v-for="task in tasksDue" :key="task.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ task.title }}</span>
                <SBadge :variant="priorityVariant(task.priority)" size="sm">{{ task.priority }}</SBadge>
              </div>
              <span v-if="task.due_date" class="widget__item-meta">{{ formatRelativeDate(task.due_date) }}</span>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">All caught up</p>
        </div>
      </ContentCard>

      <!-- Upcoming Bills -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 3 }">
        <div class="widget__header">
          <h3 class="widget__title">Upcoming Bills</h3>
          <RouterLink to="/money/bills" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="bills.loading" :lines="3" />
        <template v-else-if="nextBills.length">
          <ul class="widget__list">
            <li v-for="bill in nextBills" :key="bill.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ bill.name }}</span>
                <span class="widget__item-amount">{{ formatCents(bill.amount) }}</span>
              </div>
              <div class="widget__item-sub">
                <span class="widget__item-meta">Due day {{ bill.due_day }}</span>
                <SBadge :variant="bill.status === 'overdue' ? 'error' : 'info'" size="sm">{{ bill.status }}</SBadge>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">No upcoming bills</p>
        </div>
      </ContentCard>

      <!-- Recent Expenses -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 4 }">
        <div class="widget__header">
          <h3 class="widget__title">Recent Expenses</h3>
          <RouterLink to="/money/expenses" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="expenses.loading" :lines="3" />
        <template v-else-if="recentExpenses.length">
          <ul class="widget__list">
            <li v-for="exp in recentExpenses" :key="exp.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ exp.description }}</span>
                <span class="widget__item-amount">{{ formatCents(exp.amount) }}</span>
              </div>
              <div class="widget__item-sub">
                <SBadge variant="default" size="sm">{{ exp.category }}</SBadge>
                <span class="widget__item-meta">{{ formatRelativeDate(exp.date) }}</span>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">No expenses yet</p>
        </div>
      </ContentCard>

      <!-- Savings Progress -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 5 }">
        <div class="widget__header">
          <h3 class="widget__title">Savings Progress</h3>
          <RouterLink to="/money/savings" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="savings.loading" :lines="3" />
        <template v-else-if="activeGoals.length">
          <ul class="widget__list widget__list--goals">
            <li v-for="goal in activeGoals" :key="goal.id" class="widget__goal">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ goal.name }}</span>
                <span class="widget__item-meta">{{ goalPercent(goal.current_amount, goal.target_amount) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-bar__fill"
                  :style="{ width: goalPercent(goal.current_amount, goal.target_amount) + '%' }"
                />
              </div>
              <span class="widget__item-meta">{{ formatCents(goal.current_amount) }} / {{ formatCents(goal.target_amount) }}</span>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">No savings goals</p>
        </div>
      </ContentCard>

      <!-- Low Stock -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 6 }">
        <div class="widget__header">
          <h3 class="widget__title">Low Stock</h3>
          <RouterLink to="/inventory" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="inventory.loading" :lines="3" />
        <template v-else-if="lowStock.length">
          <ul class="widget__list">
            <li v-for="item in lowStock" :key="item.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ item.name }}</span>
                <SBadge :variant="stockVariant(item.stock_status)" size="sm">{{ stockLabel(item.stock_status) }}</SBadge>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">Everything stocked</p>
        </div>
      </ContentCard>

      <!-- Shopping List -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 7 }">
        <div class="widget__header">
          <h3 class="widget__title">Shopping List</h3>
          <RouterLink to="/shopping" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="shopping.loading" :lines="3" />
        <template v-else-if="neededItems.length">
          <p class="widget__count">{{ shopping.neededCount }} item{{ shopping.neededCount === 1 ? '' : 's' }} needed</p>
          <ul class="widget__list">
            <li v-for="item in neededItems" :key="item.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ item.name }}</span>
                <span v-if="item.quantity > 1" class="widget__item-meta">×{{ item.quantity }}</span>
              </div>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">Shopping list empty</p>
        </div>
      </ContentCard>

      <!-- Reminders -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 8 }">
        <div class="widget__header">
          <h3 class="widget__title">Reminders</h3>
          <RouterLink to="/reminders" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="reminders.loading" :lines="3" />
        <template v-else-if="upcomingReminders.length">
          <ul class="widget__list">
            <li v-for="rem in upcomingReminders" :key="rem.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ rem.title }}</span>
                <SBadge
                  :variant="rem.status === 'active' && rem.due_date && new Date(rem.due_date) < new Date(new Date().toDateString()) ? 'error' : 'info'"
                  size="sm"
                >
                  {{ rem.status === 'active' && rem.due_date && new Date(rem.due_date) < new Date(new Date().toDateString()) ? 'overdue' : rem.status }}
                </SBadge>
              </div>
              <span v-if="rem.due_date" class="widget__item-meta">{{ formatRelativeDate(rem.due_date) }}</span>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">No reminders</p>
        </div>
      </ContentCard>

      <!-- Pinned Notes -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 9 }">
        <div class="widget__header">
          <h3 class="widget__title">Pinned Notes</h3>
          <RouterLink to="/notes" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="notes.loading" :lines="3" />
        <template v-else-if="pinned.length">
          <ul class="widget__list widget__list--notes">
            <li v-for="note in pinned" :key="note.id" class="widget__note">
              <span class="widget__note-title">{{ note.title }}</span>
              <p class="widget__note-preview">{{ truncate(note.content, 100) }}</p>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">Pin a note to see it here</p>
        </div>
      </ContentCard>

      <!-- Maintenance -->
      <ContentCard padding="md" class="widget page-enter" :style="{ '--stagger': 10 }">
        <div class="widget__header">
          <h3 class="widget__title">Maintenance</h3>
          <RouterLink to="/maintenance" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="maintenance.loading" :lines="3" />
        <template v-else-if="maintenanceAlerts.length">
          <ul class="widget__list">
            <li v-for="item in maintenanceAlerts" :key="item.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ item.item }}</span>
                <SBadge :variant="item.status === 'overdue' ? 'error' : 'default'" size="sm">{{ item.status }}</SBadge>
              </div>
              <span v-if="item.next_due_date" class="widget__item-meta">{{ formatRelativeDate(item.next_due_date) }}</span>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">No maintenance due</p>
        </div>
      </ContentCard>
    </div>
  </PageContainer>
</template>

<style scoped>
/* Stats bar — tight horizontal row with dividers */
.stats-bar {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-l);
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
}

.stat {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  border-right: 1px solid var(--color-border-subtle);
}

.stat:last-child {
  border-right: none;
}

/* Widget grid — 3 cols desktop, 2 tablet, 1 mobile */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-m);
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-bar {
    flex-wrap: wrap;
  }

  .stat {
    flex-basis: 50%;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .stat:nth-child(2) {
    border-right: none;
  }

  .stat:nth-last-child(-n+2) {
    border-bottom: none;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Widget card internals */
.widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-s);
}

.widget__title {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.widget__link {
  font: var(--text-caption);
  color: var(--color-brand-primary);
  text-decoration: none;
  transition: color var(--duration-fast) var(--easing-standard);
}

.widget__link:hover {
  color: var(--color-brand-pressed);
  text-decoration: underline;
}

.widget__count {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  margin-bottom: var(--space-xs);
}

/* List styles — border-bottom rows, no bg */
.widget__list {
  display: flex;
  flex-direction: column;
  gap: 0;
  list-style: none;
  margin: 0;
  padding: 0;
}

.widget__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--duration-fast) var(--easing-standard);
  min-height: var(--height-row-min);
  justify-content: center;
}

.widget__item:last-child {
  border-bottom: none;
}

.widget__item:hover {
  background: var(--color-bg-secondary);
}

.widget__item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.widget__item-title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.widget__item-amount {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.widget__item-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.widget__item-meta {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  flex-shrink: 0;
}

/* Empty state — compact */
.widget__empty {
  padding: var(--space-l) 0;
  text-align: center;
}

.widget__empty-text {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
}

/* Goals / progress bar — 4px */
.widget__goal {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.widget__goal:last-child {
  border-bottom: none;
}

.progress-bar {
  height: 4px;
  width: 100%;
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

/* Notes — border-bottom rows */
.widget__note {
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--duration-fast) var(--easing-standard);
}

.widget__note:last-child {
  border-bottom: none;
}

.widget__note:hover {
  background: var(--color-bg-secondary);
}

.widget__note-title {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  display: block;
  margin-bottom: var(--space-2xs);
}

.widget__note-preview {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  line-height: 1.4;
}
</style>
