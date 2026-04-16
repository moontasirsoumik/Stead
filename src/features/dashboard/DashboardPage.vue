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
    <PageHeader
      :title="greeting"
      :subtitle="householdName"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    />

    <!-- Stats row — 4 individual cards instead of a monolithic bar -->
    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
      <div class="stat-card">
        <InlineStat
          label="Monthly spending"
          :value="formatCents(expenses.currentMonthTotal)"
        />
      </div>
      <div class="stat-card">
        <InlineStat
          label="Monthly income"
          :value="formatCents(income.currentMonthTotal)"
        />
      </div>
      <div class="stat-card">
        <InlineStat
          label="Upcoming bills"
          :value="String(bills.upcomingBills.length)"
        />
      </div>
      <div class="stat-card">
        <InlineStat
          label="Tasks due"
          :value="String(tasks.overdueTasks.length + tasks.dueToday.length)"
        />
      </div>
    </div>

    <!-- Bento grid — asymmetric card sizes -->
    <div class="bento">
      <!-- Row 1: Tasks (wide) + Bills (narrow) -->
      <ContentCard padding="md" class="bento__card bento--wide page-enter" :style="{ '--stagger': 2 }">
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
          <p class="widget__empty-text">All caught up — no tasks due</p>
        </div>
      </ContentCard>

      <!-- Bills (household only) -->
      <ContentCard v-if="!app.isPersonal" padding="md" class="bento__card page-enter" :style="{ '--stagger': 3 }">
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

      <!-- Row 2: Expenses + Savings + Inventory — 3 equal -->
      <ContentCard padding="md" class="bento__card page-enter" :style="{ '--stagger': 4 }">
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

      <ContentCard padding="md" class="bento__card page-enter" :style="{ '--stagger': 5 }">
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

      <!-- Low Stock (household only) -->
      <ContentCard v-if="!app.isPersonal" padding="md" class="bento__card page-enter" :style="{ '--stagger': 6 }">
        <div class="widget__header">
          <h3 class="widget__title">Low Stock</h3>
          <RouterLink to="/pantry/inventory" class="widget__link">View All</RouterLink>
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

      <!-- Row 3: Shopping (wide) + Reminders (household only) -->
      <ContentCard v-if="!app.isPersonal" padding="md" class="bento__card bento--wide page-enter" :style="{ '--stagger': 7 }">
        <div class="widget__header">
          <h3 class="widget__title">Shopping List</h3>
          <RouterLink to="/pantry/shopping" class="widget__link">View All</RouterLink>
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
          <p class="widget__empty-text">Shopping list is empty</p>
        </div>
      </ContentCard>

      <ContentCard v-if="!app.isPersonal" padding="md" class="bento__card page-enter" :style="{ '--stagger': 8 }">
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

      <!-- Row 4: Notes + Maintenance (wide) -->
      <ContentCard padding="md" class="bento__card page-enter" :style="{ '--stagger': 9 }">
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

      <!-- Maintenance (household only) -->
      <ContentCard v-if="!app.isPersonal" padding="md" class="bento__card bento--wide page-enter" :style="{ '--stagger': 10 }">
        <div class="widget__header">
          <h3 class="widget__title">Maintenance</h3>
          <RouterLink to="/tasks" class="widget__link">View All</RouterLink>
        </div>
        <LoadingSkeleton v-if="tasks.loading" :lines="3" />
        <template v-else-if="maintenanceAlerts.length">
          <ul class="widget__list">
            <li v-for="item in maintenanceAlerts" :key="item.id" class="widget__item">
              <div class="widget__item-main">
                <span class="widget__item-title">{{ item.title }}</span>
                <SBadge :variant="item.status === 'overdue' || (item.due_date && new Date(item.due_date) < new Date(new Date().toDateString())) ? 'error' : 'default'" size="sm">
                  {{ item.status === 'not_started' ? 'upcoming' : item.status }}
                </SBadge>
              </div>
              <span v-if="item.due_date" class="widget__item-meta">{{ formatRelativeDate(item.due_date) }}</span>
            </li>
          </ul>
        </template>
        <div v-else class="widget__empty">
          <p class="widget__empty-text">No maintenance due</p>
        </div>
      </ContentCard>
    </div>

    <!-- Personal scope widgets (only when personal) -->
    <template v-if="app.isPersonal">
      <div class="bento">
        <ContentCard padding="md" class="bento__card page-enter" :style="{ '--stagger': 11 }">
          <div class="widget__header">
            <h3 class="widget__title">Wishlist</h3>
            <RouterLink to="/wishlist" class="widget__link">View All</RouterLink>
          </div>
          <template v-if="wishlistItems.length">
            <ul class="widget__list">
              <li v-for="item in wishlistItems" :key="item.id" class="widget__item">
                <div class="widget__item-main">
                  <span class="widget__item-title">{{ item.name }}</span>
                  <span class="widget__item-amount">{{ formatCents(item.price) }}</span>
                </div>
                <SBadge :variant="item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'" size="sm">{{ item.priority }}</SBadge>
              </li>
            </ul>
          </template>
          <div v-else class="widget__empty">
            <p class="widget__empty-text">Your wishlist is empty — start dreaming!</p>
          </div>
        </ContentCard>

        <ContentCard padding="md" class="bento__card page-enter" :style="{ '--stagger': 12 }">
          <div class="widget__header">
            <h3 class="widget__title">Subscriptions</h3>
            <RouterLink to="/subscriptions" class="widget__link">View All</RouterLink>
          </div>
          <template v-if="activeSubscriptions.length">
            <p class="widget__count">{{ formatCents(subscriptions.monthlyTotal) }}/mo</p>
            <ul class="widget__list">
              <li v-for="sub in activeSubscriptions" :key="sub.id" class="widget__item">
                <div class="widget__item-main">
                  <span class="widget__item-title">{{ sub.name }}</span>
                  <span class="widget__item-amount">{{ formatCents(sub.amount) }}</span>
                </div>
                <SBadge variant="info" size="sm">{{ sub.frequency }}</SBadge>
              </li>
            </ul>
          </template>
          <div v-else class="widget__empty">
            <p class="widget__empty-text">No subscriptions tracked</p>
          </div>
        </ContentCard>

        <ContentCard padding="md" class="bento__card page-enter" :style="{ '--stagger': 13 }">
          <div class="widget__header">
            <h3 class="widget__title">Habits Today</h3>
            <RouterLink to="/habits" class="widget__link">View All</RouterLink>
          </div>
          <template v-if="activeHabits.length">
            <ul class="widget__list">
              <li v-for="habit in activeHabits" :key="habit.id" class="widget__item">
                <div class="widget__item-main">
                  <span class="widget__item-title">{{ habit.name }}</span>
                  <SBadge variant="default" size="sm">{{ habit.frequency }}</SBadge>
                </div>
              </li>
            </ul>
          </template>
          <div v-else class="widget__empty">
            <p class="widget__empty-text">No habits yet — build your first one!</p>
          </div>
        </ContentCard>
      </div>
    </template>
  </PageContainer>
</template>

<style scoped>
/* ── Stats row: 4 separate cards ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-l);
  margin-bottom: var(--space-xl);
}

.stat-card {
  background: var(--color-surface-card);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-2), var(--shadow-card);
  overflow: hidden;
}

/* ── Bento grid: 3-column base with wide cards spanning 2 ── */
.bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-l);
}

.bento--wide {
  grid-column: span 2;
}

.section-title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
  margin: var(--space-xl) 0 var(--space-l);
}

/* ── Responsive ── */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento--wide {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento {
    grid-template-columns: 1fr;
  }

  .bento--wide {
    grid-column: span 1;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

/* ── Widget internals ── */
.widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-m);
}

.widget__title {
  font: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.widget__link {
  font: var(--text-caption);
  color: var(--color-brand-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--duration-fast) var(--easing-standard);
}

.widget__link:hover {
  color: var(--color-brand-pressed);
  text-decoration: underline;
}

.widget__count {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  margin-bottom: var(--space-s);
}

.widget__list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}

.widget__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-s) 0;
  border-bottom: 1px solid var(--color-border-subtle);
  min-height: 32px;
  justify-content: center;
}

.widget__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.widget__item:first-child {
  padding-top: 0;
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
  font-weight: var(--font-weight-medium);
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

.widget__empty {
  padding: var(--space-xl) 0;
  text-align: center;
}

.widget__empty-text {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
}

.widget__goal {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-s) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.widget__goal:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.widget__goal:first-child {
  padding-top: 0;
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

.widget__note {
  padding: var(--space-s) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.widget__note:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.widget__note:first-child {
  padding-top: 0;
}

.widget__note-title {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  display: block;
  margin-bottom: 2px;
}

.widget__note-preview {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  line-height: 1.5;
}
</style>
