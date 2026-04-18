<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SBadge from '@/components/ui/SBadge.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
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
import { useWishlistStore } from '@/stores/wishlist.store'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useHabitsStore } from '@/stores/habits.store'
import { formatCents, formatRelativeDate } from '@/utils/format'
import type { TaskPriority } from '@/models/enums'
import type { BadgeVariant } from '@/components/ui/SBadge.vue'

const auth = useAuthStore()
const app = useAppStore()
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
const wishlist = useWishlistStore()
const subscriptions = useSubscriptionsStore()
const habits = useHabitsStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  const name = household.currentMember?.name ?? 'there'
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
})

const householdName = computed(() => household.household?.name ?? '')

// Scope-aware filtering helper
function scoped<T extends { scope?: string; owner_id?: string | null }>(items: T[]): T[] {
  if (app.scope === 'personal') {
    return items.filter((i) => i.scope === 'personal' && i.owner_id === auth.memberId)
  }
  return items.filter((i) => !i.scope || i.scope === 'household')
}

// Tasks widget
const tasksDue = computed(() => {
  const all = scoped([...tasks.overdueTasks, ...tasks.dueToday])
  const ids = new Set<string>()
  return all.filter((t) => {
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
  [...scoped(expenses.items)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5),
)

// Savings widget — active goals max 3
const activeGoals = computed(() =>
  scoped(savings.goals).filter((g) => g.status === 'active').slice(0, 3),
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
  scoped(notes.pinnedNotes).slice(0, 3),
)

// Personal-only widgets
const wishlistItems = computed(() =>
  wishlist.wantedItems.slice(0, 5),
)
const activeSubscriptions = computed(() =>
  subscriptions.activeSubscriptions.slice(0, 5),
)
const activeHabits = computed(() =>
  habits.activeHabits.slice(0, 5),
)

// Maintenance widget — overdue + upcoming max 5 (now from tasks store)
const maintenanceAlerts = computed(() => {
  const combined = [...tasks.overdueMaintenanceTasks, ...tasks.upcomingMaintenanceTasks]
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
  || savings.loading,
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
  wishlist.fetchItems(hid)
  subscriptions.fetchSubscriptions(hid)
  habits.fetchHabits(hid)
  habits.fetchLogs(hid)
})
</script>

<template>
  <PageContainer>
    <PageHeader :title="greeting" :subtitle="householdName" />

    <!-- Stats row — compact bar with vertical dividers -->
    <div class="stats-row">
      <div class="stat-cell">
        <span class="stat-cell__label">Monthly spending</span>
        <span class="stat-cell__value">{{ formatCents(expenses.currentMonthTotal) }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell__label">Monthly income</span>
        <span class="stat-cell__value">{{ formatCents(income.currentMonthTotal) }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell__label">Upcoming bills</span>
        <span class="stat-cell__value">{{ bills.upcomingBills.length }}</span>
      </div>
      <div class="stat-cell">
        <span class="stat-cell__label">Tasks due</span>
        <span class="stat-cell__value">{{ tasks.overdueTasks.length + tasks.dueToday.length }}</span>
      </div>
    </div>

    <!-- Tasks Due -->
    <section class="dash-section">
      <div class="dash-section__header">
        <h3 class="dash-section__title">Tasks Due ({{ tasksDue.length }})</h3>
        <RouterLink to="/tasks" class="dash-section__link">View all</RouterLink>
      </div>
      <LoadingSkeleton v-if="tasks.loading" :lines="3" />
      <div v-else-if="tasksDue.length" class="dash-table">
        <div v-for="task in tasksDue" :key="task.id" class="dash-row">
          <span class="dash-row__name">{{ task.title }}</span>
          <span class="dash-row__badge"><SBadge :variant="priorityVariant(task.priority)" size="sm">{{ task.priority }}</SBadge></span>
          <span class="dash-row__trailing">{{ task.due_date ? formatRelativeDate(task.due_date) : '' }}</span>
          <span class="dash-row__amount"></span>
        </div>
      </div>
      <p v-else class="dash-empty">All caught up — no tasks due</p>
    </section>

    <!-- Upcoming Bills (household only) -->
    <section v-if="!app.isPersonal" class="dash-section">
      <div class="dash-section__header">
        <h3 class="dash-section__title">Upcoming Bills ({{ nextBills.length }})</h3>
        <RouterLink to="/money/bills" class="dash-section__link">View all</RouterLink>
      </div>
      <LoadingSkeleton v-if="bills.loading" :lines="3" />
      <div v-else-if="nextBills.length" class="dash-table">
        <div v-for="bill in nextBills" :key="bill.id" class="dash-row">
          <span class="dash-row__name">{{ bill.name }}</span>
          <span class="dash-row__badge"><SBadge :variant="bill.status === 'overdue' ? 'error' : 'info'" size="sm">{{ bill.status }}</SBadge></span>
          <span class="dash-row__trailing">Due day {{ bill.due_day }}</span>
          <span class="dash-row__amount">{{ formatCents(bill.amount) }}</span>
        </div>
      </div>
      <p v-else class="dash-empty">No upcoming bills</p>
    </section>

    <!-- Recent Expenses -->
    <section class="dash-section">
      <div class="dash-section__header">
        <h3 class="dash-section__title">Recent Expenses ({{ recentExpenses.length }})</h3>
        <RouterLink to="/money/expenses" class="dash-section__link">View all</RouterLink>
      </div>
      <LoadingSkeleton v-if="expenses.loading" :lines="3" />
      <div v-else-if="recentExpenses.length" class="dash-table">
        <div v-for="exp in recentExpenses" :key="exp.id" class="dash-row">
          <span class="dash-row__name">{{ truncate(exp.description, 30) }}</span>
          <span class="dash-row__badge"><SBadge variant="default" size="sm">{{ exp.category }}</SBadge></span>
          <span class="dash-row__trailing">{{ formatRelativeDate(exp.date) }}</span>
          <span class="dash-row__amount">{{ formatCents(exp.amount) }}</span>
        </div>
      </div>
      <p v-else class="dash-empty">No expenses yet</p>
    </section>

    <!-- Reminders (household only) -->
    <section v-if="!app.isPersonal" class="dash-section">
      <div class="dash-section__header">
        <h3 class="dash-section__title">Reminders ({{ upcomingReminders.length }})</h3>
        <RouterLink to="/reminders" class="dash-section__link">View all</RouterLink>
      </div>
      <LoadingSkeleton v-if="reminders.loading" :lines="3" />
      <div v-else-if="upcomingReminders.length" class="dash-table">
        <div v-for="rem in upcomingReminders" :key="rem.id" class="dash-row">
          <span class="dash-row__name">{{ rem.title }}</span>
          <span class="dash-row__badge">
            <SBadge
              :variant="rem.status === 'active' && rem.due_date && new Date(rem.due_date) < new Date(new Date().toDateString()) ? 'error' : 'info'"
              size="sm"
            >
              {{ rem.status === 'active' && rem.due_date && new Date(rem.due_date) < new Date(new Date().toDateString()) ? 'overdue' : rem.status }}
            </SBadge>
          </span>
          <span class="dash-row__trailing">{{ rem.due_date ? formatRelativeDate(rem.due_date) : '' }}</span>
          <span class="dash-row__amount"></span>
        </div>
      </div>
      <p v-else class="dash-empty">No reminders</p>
    </section>

    <!-- Maintenance (household only) -->
    <section v-if="!app.isPersonal" class="dash-section">
      <div class="dash-section__header">
        <h3 class="dash-section__title">Maintenance ({{ maintenanceAlerts.length }})</h3>
        <RouterLink to="/tasks" class="dash-section__link">View all</RouterLink>
      </div>
      <LoadingSkeleton v-if="tasks.loading" :lines="3" />
      <div v-else-if="maintenanceAlerts.length" class="dash-table">
        <div v-for="item in maintenanceAlerts" :key="item.id" class="dash-row">
          <span class="dash-row__name">{{ item.title }}</span>
          <span class="dash-row__badge">
            <SBadge :variant="item.status === 'overdue' || (item.due_date && new Date(item.due_date) < new Date(new Date().toDateString())) ? 'error' : 'default'" size="sm">
              {{ item.status === 'not_started' ? 'upcoming' : item.status }}
            </SBadge>
          </span>
          <span class="dash-row__trailing">{{ item.due_date ? formatRelativeDate(item.due_date) : '' }}</span>
          <span class="dash-row__amount"></span>
        </div>
      </div>
      <p v-else class="dash-empty">No maintenance due</p>
    </section>

    <!-- Pinned Notes -->
    <!-- Two-column bottom area -->
    <div class="dash-grid">
      <!-- Savings Progress -->
      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Savings Progress</h3>
          <RouterLink to="/money/savings" class="dash-section__link">View all</RouterLink>
        </div>
        <LoadingSkeleton v-if="savings.loading" :lines="3" />
        <div v-else-if="activeGoals.length" class="dash-table">
          <div v-for="goal in activeGoals" :key="goal.id" class="goal-row">
            <div class="goal-row__ring">
              <svg viewBox="0 0 40 40" class="goal-row__svg">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-bg-tertiary)" stroke-width="3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-brand-primary)" stroke-width="3"
                  stroke-linecap="round" stroke-dasharray="100.53" :stroke-dashoffset="100.53 - (100.53 * goalPercent(goal.current_amount, goal.target_amount) / 100)"
                  transform="rotate(-90 20 20)" />
              </svg>
              <span class="goal-row__pct">{{ goalPercent(goal.current_amount, goal.target_amount) }}</span>
            </div>
            <div class="goal-row__info">
              <span class="goal-row__name">{{ goal.name }}</span>
              <span class="goal-row__amounts">{{ formatCents(goal.current_amount) }} / {{ formatCents(goal.target_amount) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="dash-empty">No savings goals</p>
      </section>

      <!-- Pinned Notes -->
      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Pinned Notes ({{ pinned.length }})</h3>
          <RouterLink to="/notes" class="dash-section__link">View all</RouterLink>
        </div>
        <LoadingSkeleton v-if="notes.loading" :lines="3" />
        <div v-else-if="pinned.length" class="dash-table">
          <div v-for="note in pinned" :key="note.id" class="dash-row dash-row--compact note-row">
            <span class="dash-row__name dash-row__name--bold">{{ note.title }}</span>
            <span class="note-row__preview">{{ truncate(note.content, 40) }}</span>
          </div>
        </div>
        <p v-else class="dash-empty">Pin a note to see it here</p>
      </section>
    </div>

    <!-- Low Stock + Shopping row -->
    <div v-if="!app.isPersonal" class="dash-grid">
      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Low Stock</h3>
          <RouterLink to="/pantry/inventory" class="dash-section__link">View all</RouterLink>
        </div>
        <LoadingSkeleton v-if="inventory.loading" :lines="2" />
        <div v-else-if="lowStock.length" class="dash-table">
          <div v-for="item in lowStock" :key="item.id" class="dash-row dash-row--compact">
            <span class="dash-row__name">{{ item.name }}</span>
            <span class="dash-row__badge"><SBadge :variant="stockVariant(item.stock_status)" size="sm">{{ stockLabel(item.stock_status) }}</SBadge></span>
          </div>
        </div>
        <p v-else class="dash-empty">Everything stocked</p>
      </section>

      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Shopping List ({{ shopping.neededCount }})</h3>
          <RouterLink to="/pantry/shopping" class="dash-section__link">View all</RouterLink>
        </div>
        <LoadingSkeleton v-if="shopping.loading" :lines="2" />
        <div v-else-if="neededItems.length" class="dash-table">
          <div v-for="item in neededItems" :key="item.id" class="dash-row dash-row--compact">
            <span class="dash-row__name">{{ item.name }}</span>
            <span v-if="item.quantity > 1" class="dash-row__trailing">×{{ item.quantity }}</span>
          </div>
        </div>
        <p v-else class="dash-empty">Shopping list is empty</p>
      </section>
    </div>

    <!-- Personal scope widgets -->
    <template v-if="app.isPersonal">
      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Wishlist ({{ wishlistItems.length }})</h3>
          <RouterLink to="/wishlist" class="dash-section__link">View all</RouterLink>
        </div>
        <div v-if="wishlistItems.length" class="dash-table">
          <div v-for="item in wishlistItems" :key="item.id" class="dash-row">
            <span class="dash-row__name">{{ item.name }}</span>
            <span class="dash-row__badge"><SBadge :variant="item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'" size="sm">{{ item.priority }}</SBadge></span>
            <span class="dash-row__trailing"></span>
            <span class="dash-row__amount">{{ formatCents(item.price) }}</span>
          </div>
        </div>
        <p v-else class="dash-empty">Your wishlist is empty — start dreaming!</p>
      </section>

      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Subscriptions</h3>
          <RouterLink to="/subscriptions" class="dash-section__link">View all</RouterLink>
        </div>
        <template v-if="activeSubscriptions.length">
          <p class="dash-section__count">{{ formatCents(subscriptions.monthlyTotal) }}/mo</p>
          <div class="dash-table">
            <div v-for="sub in activeSubscriptions" :key="sub.id" class="dash-row">
              <span class="dash-row__name">{{ sub.name }}</span>
              <span class="dash-row__badge"><SBadge variant="info" size="sm">{{ sub.frequency }}</SBadge></span>
              <span class="dash-row__trailing"></span>
              <span class="dash-row__amount">{{ formatCents(sub.amount) }}</span>
            </div>
          </div>
        </template>
        <p v-else class="dash-empty">No subscriptions tracked</p>
      </section>

      <section class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Habits Today</h3>
          <RouterLink to="/habits" class="dash-section__link">View all</RouterLink>
        </div>
        <div v-if="activeHabits.length" class="dash-table">
          <div v-for="habit in activeHabits" :key="habit.id" class="dash-row">
            <span class="dash-row__name">{{ habit.name }}</span>
            <span class="dash-row__badge"><SBadge variant="default" size="sm">{{ habit.frequency }}</SBadge></span>
            <span class="dash-row__trailing"></span>
            <span class="dash-row__amount"></span>
          </div>
        </div>
        <p v-else class="dash-empty">No habits yet — build your first one!</p>
      </section>
    </template>
  </PageContainer>
</template>

<style scoped>
/* ── Stats row: compact bar with vertical dividers ── */
.stats-row {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-xl);
  overflow: hidden;
}

.stat-cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  border-right: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-cell:last-child {
  border-right: none;
}

.stat-cell__label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.stat-cell__value {
  font: var(--text-body-1);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

/* ── Section headers ── */
.dash-section {
  margin-bottom: var(--space-xl);
}

.dash-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-s);
  border-bottom: 1px solid var(--color-border-default);
  margin-bottom: var(--space-s);
}

.dash-section__title {
  font: var(--text-label-md);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  color: var(--color-fg-tertiary);
  margin: 0;
}

.dash-section__link {
  font: var(--text-caption);
  color: var(--color-brand-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--duration-fast) var(--easing-standard);
}

.dash-section__link:hover {
  color: var(--color-brand-pressed);
  text-decoration: underline;
}

.dash-section__count {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  margin-bottom: var(--space-xs);
}

/* ── Uniform table rows — grid for alignment ── */
.dash-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  overflow: hidden;
}

.dash-row {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) 110px 90px 90px;
  align-items: center;
  min-height: 40px;
  padding: var(--space-xs) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  gap: var(--space-s);
}

.dash-row:last-child {
  border-bottom: none;
}

.dash-row__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.dash-row__name--bold {
  font-weight: var(--font-weight-medium);
}

.dash-row__amount {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  white-space: nowrap;
  text-align: right;
}

.dash-row__badge {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.dash-row__trailing {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  text-align: right;
}

.dash-empty {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
  padding: var(--space-l) 0;
  margin: 0;
}

/* ── Two-column grid ── */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: var(--space-l);
  margin-bottom: var(--space-xl);
}

/* ── Compact two-column rows (Low Stock, Shopping, Notes) ── */
.dash-row--compact {
  grid-template-columns: 1fr auto;
}

/* ── Note row inside dash-table ── */
.note-row {
  cursor: pointer;
}

.note-row__preview {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Savings goal rows inside dash-table ── */
.goal-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
}

.goal-row:last-child {
  border-bottom: none;
}

.goal-row__ring {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.goal-row__svg {
  width: 36px;
  height: 36px;
  display: block;
}

.goal-row__pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1;
}

.goal-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
}

.goal-row__name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goal-row__amounts {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-family: var(--font-mono);
  white-space: nowrap;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .stat-cell {
    border-right: none;
  }

  .stat-cell:nth-child(odd) {
    border-right: 1px solid var(--color-border-default);
  }

  .stat-cell:nth-child(1),
  .stat-cell:nth-child(2) {
    border-bottom: 1px solid var(--color-border-default);
  }

  .dash-grid {
    grid-template-columns: 1fr;
  }

  .dash-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    min-height: auto;
    padding: var(--space-s) var(--space-m);
    row-gap: var(--space-2xs);
  }

  .dash-row__name {
    grid-column: 1;
    grid-row: 1;
  }

  .dash-row__amount {
    grid-column: 2;
    grid-row: 1;
  }

  .dash-row__badge {
    grid-column: 1;
    grid-row: 2;
    justify-content: flex-start;
  }

  .dash-row__trailing {
    grid-column: 2;
    grid-row: 2;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .stat-cell {
    border-right: none;
  }

  .stat-cell:nth-child(odd) {
    border-right: none;
  }

  .stat-cell:not(:last-child) {
    border-bottom: 1px solid var(--color-border-default);
  }
}
</style>
