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
import { useBoardsStore } from '@/stores/boards.store'
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
const boards = useBoardsStore()

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

// Boards widget — top boards with progress
const recentBoards = computed(() =>
  boards.boards.slice(0, 5).map((b) => {
    const items = boards.getItemsForBoard(b.id)
    const total = items.length
    const checked = items.filter((i) => i.is_checked).length
    return { ...b, total, checked }
  }),
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

// ── Visualization data ──
const netCashFlow = computed(() => income.currentMonthTotal - expenses.currentMonthTotal)

const monthlyTrend = computed(() => {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const inc = income.items.filter(x => x.date.startsWith(ym)).reduce((s, x) => s + x.amount, 0)
    const exp = expenses.items.filter(x => x.date.startsWith(ym)).reduce((s, x) => s + x.amount, 0)
    return { label, income: inc, expense: exp }
  })
  const scale = Math.max(1, ...months.flatMap(m => [m.income, m.expense]))
  return months.map(m => ({
    ...m,
    incomeHeight: m.income > 0 ? Math.max(4, Math.round((m.income / scale) * 100)) : 0,
    expenseHeight: m.expense > 0 ? Math.max(4, Math.round((m.expense / scale) * 100)) : 0,
  }))
})

const categoryBreakdown = computed(() => {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthExpenses = scoped(expenses.items).filter(e => e.date.startsWith(ym))
  const totals: Record<string, number> = {}
  for (const e of monthExpenses) {
    totals[e.category] = (totals[e.category] || 0) + e.amount
  }
  const total = Object.values(totals).reduce((s, v) => s + v, 0)
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amount]) => ({
      category: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      width: total > 0 ? Math.max(4, Math.round((amount / total) * 100)) : 0,
    }))
})

const taskBreakdown = computed(() => {
  const all = tasks.items
  const overdue = tasks.overdueTasks.length
  const inProgress = all.filter(t => t.status === 'in_progress').length
  const notStarted = all.filter(t => t.status === 'not_started').length
  const done = all.filter(t => t.status === 'done').length
  const total = overdue + inProgress + notStarted + done
  return { overdue, inProgress, notStarted, done, total }
})

// ── 7-day spending sparkline ──
const weeklySpend = computed(() => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    const total = scoped(expenses.items)
      .filter(e => e.date.slice(0, 10) === iso)
      .reduce((s, e) => s + e.amount, 0)
    return { iso, label, total }
  })
  const max = Math.max(1, ...days.map(d => d.total))
  return days.map(d => ({
    ...d,
    y: d.total > 0 ? Math.round((d.total / max) * 60) : 0,
  }))
})

const weeklySpendPath = computed(() => {
  const points = weeklySpend.value.map((d, i) => ({
    x: 20 + i * 40,
    y: 70 - d.y,
  }))
  if (points.every(p => p.y === 70)) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
})

const weekTotal = computed(() =>
  weeklySpend.value.reduce((s, d) => s + d.total, 0),
)

// ── Bills horizon ──
const billsHorizon = computed(() => {
  const today = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return bills.items
    .filter(b => b.status !== 'skipped')
    .map(b => ({
      id: b.id,
      name: b.name,
      day: b.due_day,
      amount: b.amount,
      status: b.status,
      position: Math.round((b.due_day / daysInMonth) * 100),
      isPast: b.due_day < today,
    }))
    .sort((a, b) => a.day - b.day)
})

const todayPosition = computed(() => {
  const today = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  return Math.round((today / daysInMonth) * 100)
})

// ── Reminders countdown ──
const reminderCountdown = computed(() => {
  const now = new Date()
  return [...reminders.activeReminders, ...reminders.overdueReminders]
    .filter(r => r.due_date)
    .map(r => {
      const due = new Date(r.due_date!)
      const diffMs = due.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return {
        id: r.id,
        title: r.title,
        days: diffDays,
        isOverdue: diffDays < 0,
        label: diffDays === 0 ? 'Today'
          : diffDays === 1 ? 'Tomorrow'
          : diffDays < 0 ? `${Math.abs(diffDays)}d overdue`
          : `${diffDays}d left`,
      }
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)
})

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
  boards.fetchBoards(hid)
  boards.fetchBoardItems(hid)
})
</script>

<template>
  <PageContainer :class="{ 'dash--compact': app.dashboardDensity === 'compact', 'dash--spacious': app.dashboardDensity === 'spacious' }">
    <PageHeader v-if="app.showDashboardGreeting" :title="greeting" :subtitle="householdName" class="page-enter" :style="{ '--stagger': 0 }" />
    <PageHeader v-else title="Dashboard" subtitle="Your household at a glance" class="page-enter" :style="{ '--stagger': 0 }" />

    <!-- Stats row — compact bar with vertical dividers -->
    <div class="stats-row page-enter" :style="{ '--stagger': 1 }">
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

    <!-- Financial Pulse — net cashflow + 6-month trend -->
    <section v-if="app.dashboardWidgets.money" class="pulse-panel page-enter" :style="{ '--stagger': 2 }">
      <div class="pulse-panel__summary">
        <span class="pulse-panel__eyebrow">Net this month</span>
        <div class="pulse-panel__hero" :class="netCashFlow >= 0 ? 'pulse-panel__hero--pos' : 'pulse-panel__hero--neg'">
          {{ netCashFlow >= 0 ? '+' : '' }}{{ formatCents(netCashFlow) }}
        </div>
        <div class="pulse-panel__legend">
          <span class="pulse-legend">
            <span class="pulse-dot pulse-dot--income"></span>
            Income
          </span>
          <span class="pulse-legend">
            <span class="pulse-dot pulse-dot--expense"></span>
            Spending
          </span>
        </div>
      </div>
      <div class="pulse-panel__chart">
        <svg viewBox="0 0 288 120" class="trend-svg" role="img" aria-label="6-month cashflow trend">
          <g v-for="(month, i) in monthlyTrend" :key="month.label" :transform="`translate(${i * 48}, 0)`">
            <rect
              x="2" :y="100 - month.incomeHeight"
              width="18" :height="Math.max(0, month.incomeHeight)"
              rx="2" class="trend-bar trend-bar--income"
            />
            <rect
              x="24" :y="100 - month.expenseHeight"
              width="18" :height="Math.max(0, month.expenseHeight)"
              rx="2" class="trend-bar trend-bar--expense"
            />
            <text x="22" y="116" text-anchor="middle" class="trend-label">{{ month.label }}</text>
          </g>
        </svg>
      </div>
    </section>

    <!-- Insights — spending breakdown + task pulse -->
    <div v-if="app.dashboardWidgets.money || app.dashboardWidgets.tasks" class="insights-grid page-enter" :style="{ '--stagger': 3 }">
      <section v-if="app.dashboardWidgets.money" class="insight-card">
        <div class="insight-card__header">
          <h3 class="insight-card__title">Where it goes</h3>
          <RouterLink to="/money/expenses" class="insight-card__link">Details</RouterLink>
        </div>
        <div v-if="categoryBreakdown.length" class="cat-chart">
          <div v-for="cat in categoryBreakdown" :key="cat.category" class="cat-row">
            <div class="cat-row__head">
              <span class="cat-row__label">{{ cat.label }}</span>
              <span class="cat-row__amount">{{ cat.percent }}% · {{ formatCents(cat.amount) }}</span>
            </div>
            <div class="cat-row__track">
              <span class="cat-row__fill" :style="{ width: `${cat.width}%` }"></span>
            </div>
          </div>
        </div>
        <p v-else class="insight-empty">No spending data this month</p>
      </section>

      <section v-if="app.dashboardWidgets.tasks" class="insight-card">
        <div class="insight-card__header">
          <h3 class="insight-card__title">Task pulse</h3>
          <RouterLink to="/tasks" class="insight-card__link">Details</RouterLink>
        </div>
        <div v-if="taskBreakdown.total" class="task-viz">
          <div class="task-bar">
            <span v-if="taskBreakdown.done" class="task-bar__seg task-bar__seg--done" :style="{ flex: taskBreakdown.done }"></span>
            <span v-if="taskBreakdown.inProgress" class="task-bar__seg task-bar__seg--active" :style="{ flex: taskBreakdown.inProgress }"></span>
            <span v-if="taskBreakdown.notStarted" class="task-bar__seg task-bar__seg--pending" :style="{ flex: taskBreakdown.notStarted }"></span>
            <span v-if="taskBreakdown.overdue" class="task-bar__seg task-bar__seg--overdue" :style="{ flex: taskBreakdown.overdue }"></span>
          </div>
          <div class="task-legend">
            <div class="task-legend__item">
              <span class="task-legend__dot task-legend__dot--done"></span>
              <span class="task-legend__num">{{ taskBreakdown.done }}</span>
              <span class="task-legend__text">Done</span>
            </div>
            <div class="task-legend__item">
              <span class="task-legend__dot task-legend__dot--active"></span>
              <span class="task-legend__num">{{ taskBreakdown.inProgress }}</span>
              <span class="task-legend__text">Active</span>
            </div>
            <div class="task-legend__item">
              <span class="task-legend__dot task-legend__dot--pending"></span>
              <span class="task-legend__num">{{ taskBreakdown.notStarted }}</span>
              <span class="task-legend__text">Pending</span>
            </div>
            <div v-if="taskBreakdown.overdue" class="task-legend__item">
              <span class="task-legend__dot task-legend__dot--overdue"></span>
              <span class="task-legend__num">{{ taskBreakdown.overdue }}</span>
              <span class="task-legend__text">Overdue</span>
            </div>
          </div>
        </div>
        <p v-else class="insight-empty">No tasks tracked yet</p>
      </section>
    </div>

    <!-- Second row visualizations: weekly spend + bills horizon + reminder countdown -->
    <div v-if="app.dashboardWidgets.money || app.dashboardWidgets.reminders" class="viz-row page-enter" :style="{ '--stagger': 4 }">
      <!-- Weekly Spending Sparkline -->
      <section v-if="app.dashboardWidgets.money" class="spark-card">
        <div class="spark-card__header">
          <div>
            <h3 class="spark-card__title">Last 7 days</h3>
            <span class="spark-card__total">{{ formatCents(weekTotal) }} spent</span>
          </div>
          <RouterLink to="/money/expenses" class="insight-card__link">Details</RouterLink>
        </div>
        <svg viewBox="0 0 300 90" class="spark-svg" role="img" aria-label="7-day spending">
          <!-- Grid lines -->
          <line x1="20" y1="70" x2="260" y2="70" stroke="var(--color-border-subtle)" stroke-width="1" />
          <line x1="20" y1="40" x2="260" y2="40" stroke="var(--color-border-subtle)" stroke-width="0.5" stroke-dasharray="4 4" />
          <line x1="20" y1="10" x2="260" y2="10" stroke="var(--color-border-subtle)" stroke-width="0.5" stroke-dasharray="4 4" />
          <!-- Area fill -->
          <path
            v-if="weeklySpendPath"
            :d="weeklySpendPath + ` L260,70 L20,70 Z`"
            class="spark-area"
          />
          <!-- Line -->
          <path
            v-if="weeklySpendPath"
            :d="weeklySpendPath"
            fill="none"
            class="spark-line"
          />
          <!-- Dots + labels -->
          <g v-for="(day, i) in weeklySpend" :key="day.iso">
            <circle
              :cx="20 + i * 40"
              :cy="70 - day.y"
              r="3"
              class="spark-dot"
            />
            <text
              :x="20 + i * 40"
              y="85"
              text-anchor="middle"
              class="spark-day-label"
            >{{ day.label }}</text>
          </g>
        </svg>
      </section>

      <!-- Bills Horizon -->
      <section v-if="!app.isPersonal && app.dashboardWidgets.money && billsHorizon.length" class="horizon-card">
        <div class="horizon-card__header">
          <div>
            <h3 class="spark-card__title">Bills this month</h3>
            <span class="spark-card__total">{{ billsHorizon.length }} tracked</span>
          </div>
          <RouterLink to="/money/bills" class="insight-card__link">Details</RouterLink>
        </div>
        <div class="horizon-track">
          <div class="horizon-track__rail">
            <span class="horizon-track__today" :style="{ left: `${todayPosition}%` }"></span>
            <span
              v-for="bill in billsHorizon"
              :key="bill.id"
              class="horizon-pip"
              :class="{
                'horizon-pip--paid': bill.status === 'paid',
                'horizon-pip--overdue': bill.status === 'overdue',
                'horizon-pip--past': bill.isPast && bill.status !== 'paid',
              }"
              :style="{ left: `${bill.position}%` }"
              :title="`${bill.name} — Day ${bill.day} — ${formatCents(bill.amount)}`"
            ></span>
          </div>
          <div class="horizon-labels">
            <span>1st</span>
            <span>Today</span>
            <span>End</span>
          </div>
        </div>
        <div class="horizon-legend">
          <span
            v-for="bill in billsHorizon.slice(0, 4)"
            :key="bill.id"
            class="horizon-item"
          >
            <span
              class="horizon-item__dot"
              :class="{
                'horizon-item__dot--paid': bill.status === 'paid',
                'horizon-item__dot--overdue': bill.status === 'overdue',
              }"
            ></span>
            <span class="horizon-item__name">{{ truncate(bill.name, 12) }}</span>
            <span class="horizon-item__day">Day {{ bill.day }}</span>
          </span>
        </div>
      </section>

      <!-- Reminder Countdown -->
      <section v-if="!app.isPersonal && app.dashboardWidgets.reminders && reminderCountdown.length" class="countdown-card">
        <div class="countdown-card__header">
          <h3 class="spark-card__title">Coming up</h3>
          <RouterLink to="/reminders" class="insight-card__link">All</RouterLink>
        </div>
        <div class="countdown-list">
          <div
            v-for="rem in reminderCountdown"
            :key="rem.id"
            class="countdown-row"
          >
            <span class="countdown-row__title">{{ truncate(rem.title, 18) }}</span>
            <span
              class="countdown-row__badge"
              :class="{
                'countdown-row__badge--overdue': rem.isOverdue,
                'countdown-row__badge--soon': !rem.isOverdue && rem.days <= 2,
              }"
            >{{ rem.label }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Tasks Due -->
    <section v-if="app.dashboardWidgets.tasks" class="dash-section page-enter" :style="{ '--stagger': 5 }">
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
    <section v-if="!app.isPersonal && app.dashboardWidgets.money" class="dash-section page-enter" :style="{ '--stagger': 6 }">
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
    <section v-if="app.dashboardWidgets.money" class="dash-section page-enter" :style="{ '--stagger': 7 }">
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
    <section v-if="!app.isPersonal && app.dashboardWidgets.reminders" class="dash-section page-enter" :style="{ '--stagger': 8 }">
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
    <section v-if="!app.isPersonal && app.dashboardWidgets.tasks" class="dash-section page-enter" :style="{ '--stagger': 9 }">
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
    <div class="dash-grid page-enter" :style="{ '--stagger': 10 }">
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
    <div v-if="!app.isPersonal && app.dashboardWidgets.pantry" class="dash-grid page-enter" :style="{ '--stagger': 11 }">
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
      <section v-if="app.dashboardWidgets.wishlist" class="dash-section">
        <div class="dash-section__header">
          <h3 class="dash-section__title">Wishlist ({{ wishlistItems.length }})</h3>
          <RouterLink to="/wishlist" class="dash-section__link">View all</RouterLink>
        </div>
        <div v-if="wishlistItems.length" class="dash-table">
          <div v-for="item in wishlistItems" :key="item.id" class="dash-row">
            <span class="dash-row__name">{{ item.name }}</span>
            <span class="dash-row__badge"><SBadge :variant="item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'" size="sm">{{ item.priority }}</SBadge></span>
            <span class="dash-row__trailing"></span>
            <span class="dash-row__amount">{{ formatCents(item.price ?? 0) }}</span>
          </div>
        </div>
        <p v-else class="dash-empty">Your wishlist is empty — start dreaming!</p>
      </section>
    </template>

    <!-- Boards widget (both scopes) -->
    <section v-if="app.dashboardWidgets.boards" class="dash-section">
      <div class="dash-section__header">
        <h3 class="dash-section__title">Boards ({{ recentBoards.length }})</h3>
        <RouterLink to="/boards" class="dash-section__link">View all</RouterLink>
      </div>
      <div v-if="recentBoards.length" class="dash-table">
        <div v-for="board in recentBoards" :key="board.id" class="dash-row">
          <span class="dash-row__name">{{ board.name }}</span>
          <span class="dash-row__badge"><SBadge variant="default" size="sm">{{ board.total }} items</SBadge></span>
          <span class="dash-row__trailing"></span>
          <span v-if="board.total" class="dash-row__amount">{{ board.checked }}/{{ board.total }}</span>
        </div>
      </div>
      <p v-else class="dash-empty">No boards yet — create one to organize anything!</p>
    </section>
  </PageContainer>
</template>

<style scoped>
/* ── Stats row: compact bar with vertical dividers ── */
.stats-row {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.stat-cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  border-right: 1px solid var(--color-border-subtle);
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
  border-bottom: 1px solid var(--color-border-subtle);
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
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  overflow: hidden;
  box-shadow: var(--shadow-card);
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

/* ── Financial Pulse panel ── */
.pulse-panel {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.pulse-panel__summary {
  flex: 0 0 200px;
  padding: var(--space-l) var(--space-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-s);
  border-right: 1px solid var(--color-border-subtle);
}

.pulse-panel__eyebrow {
  font: var(--text-label-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  color: var(--color-fg-tertiary);
}

.pulse-panel__hero {
  font: var(--text-title-1);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-tight);
}

.pulse-panel__hero--pos { color: var(--color-success-fg); }
.pulse-panel__hero--neg { color: var(--color-error-fg); }

.pulse-panel__legend {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pulse-legend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pulse-dot--income { background: var(--color-success); }
.pulse-dot--expense { background: var(--color-error); opacity: 0.55; }

.pulse-panel__chart {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  display: flex;
  align-items: flex-end;
  min-width: 0;
}

.trend-svg {
  width: 100%;
  height: 120px;
  display: block;
}

.trend-bar--income { fill: var(--color-success); opacity: 0.65; }
.trend-bar--expense { fill: var(--color-error); opacity: 0.35; }

.trend-label {
  font-size: 10px;
  fill: var(--color-fg-tertiary);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
}

/* ── Insights grid ── */
.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-l);
  margin-bottom: var(--space-xl);
}

.insight-card {
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
}

.insight-card:only-child {
  grid-column: 1 / -1;
}

.insight-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-m);
}

.insight-card__title {
  font: var(--text-label-md);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  color: var(--color-fg-tertiary);
  margin: 0;
}

.insight-card__link {
  font: var(--text-caption);
  color: var(--color-brand-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--duration-fast) var(--easing-standard);
}

.insight-card__link:hover {
  color: var(--color-brand-pressed);
  text-decoration: underline;
}

.insight-empty {
  font: var(--text-body-2);
  color: var(--color-fg-tertiary);
  margin: 0;
  padding: var(--space-m) 0;
}

/* ── Category breakdown bars ── */
.cat-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.cat-row__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.cat-row__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}

.cat-row__amount {
  font: var(--text-caption);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
}

.cat-row__track {
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.cat-row__fill {
  display: block;
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: 3px;
  opacity: 0.65;
  transition: width var(--duration-slow) var(--easing-standard);
}

/* ── Task pulse visualization ── */
.task-viz {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.task-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  gap: 2px;
}

.task-bar__seg {
  border-radius: 5px;
  min-width: 6px;
  transition: flex var(--duration-slow) var(--easing-standard);
}

.task-bar__seg--done { background: var(--color-success); opacity: 0.65; }
.task-bar__seg--active { background: var(--color-brand-primary); opacity: 0.65; }
.task-bar__seg--pending { background: var(--color-bg-tertiary); }
.task-bar__seg--overdue { background: var(--color-error); opacity: 0.65; }

.task-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-m);
}

.task-legend__item {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
}

.task-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-legend__dot--done { background: var(--color-success); opacity: 0.65; }
.task-legend__dot--active { background: var(--color-brand-primary); opacity: 0.65; }
.task-legend__dot--pending { background: var(--color-bg-tertiary); }
.task-legend__dot--overdue { background: var(--color-error); opacity: 0.65; }

.task-legend__num {
  font: var(--text-caption);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.task-legend__text {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

/* ── Viz row: sparkline + horizon + countdown ── */
.viz-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-l);
  margin-bottom: var(--space-xl);
}

/* Sparkline card */
.spark-card {
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.spark-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-m);
}

.spark-card__title {
  font: var(--text-label-md);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  color: var(--color-fg-tertiary);
  margin: 0;
}

.spark-card__total {
  font: var(--text-body-2);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.spark-svg {
  width: 100%;
  height: auto;
  display: block;
  flex: 1;
}

.spark-area {
  fill: var(--color-brand-primary);
  opacity: 0.08;
}

.spark-line {
  stroke: var(--color-brand-primary);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.7;
}

.spark-dot {
  fill: var(--color-brand-primary);
  opacity: 0.8;
}

.spark-day-label {
  font-size: 9px;
  fill: var(--color-fg-tertiary);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
}

/* Horizon card */
.horizon-card {
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.horizon-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-m);
}

.horizon-track {
  margin-bottom: var(--space-m);
}

.horizon-track__rail {
  position: relative;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
}

.horizon-track__today {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 14px;
  background: var(--color-fg-primary);
  border-radius: 1px;
  transform: translateX(-1px);
}

.horizon-pip {
  position: absolute;
  top: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-brand-primary);
  border: 2px solid var(--color-surface-container-low);
  transform: translateX(-6px);
}

.horizon-pip--paid {
  background: var(--color-success);
  opacity: 0.6;
}

.horizon-pip--overdue {
  background: var(--color-error);
}

.horizon-pip--past {
  opacity: 0.4;
}

.horizon-labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-size: 10px;
}

.horizon-legend {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.horizon-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.horizon-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-brand-primary);
  flex-shrink: 0;
}

.horizon-item__dot--paid { background: var(--color-success); opacity: 0.6; }
.horizon-item__dot--overdue { background: var(--color-error); }

.horizon-item__name {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  flex: 1;
}

.horizon-item__day {
  font: var(--text-caption);
  font-family: var(--font-mono);
  color: var(--color-fg-tertiary);
  font-size: 10px;
}

/* Countdown card */
.countdown-card {
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  padding: var(--space-l);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.countdown-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-m);
}

.countdown-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.countdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.countdown-row:last-child {
  border-bottom: none;
}

.countdown-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.countdown-row__badge {
  font: var(--text-caption);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-secondary);
  white-space: nowrap;
  padding: 2px var(--space-s);
  border-radius: var(--radius-s);
  background: var(--color-bg-tertiary);
}

.countdown-row__badge--overdue {
  color: var(--color-error-fg);
  background: var(--color-error-bg);
}

.countdown-row__badge--soon {
  color: var(--color-warning-fg);
  background: var(--color-warning-bg);
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
    border-right: 1px solid var(--color-border-subtle);
  }

  .stat-cell:nth-child(1),
  .stat-cell:nth-child(2) {
    border-bottom: 1px solid var(--color-border-subtle);
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

  .dash-row--compact {
    grid-template-rows: auto;
  }

  .dash-row--compact .dash-row__trailing {
    grid-row: 1;
  }

  .goal-row__info {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .goal-row__amounts {
    font-size: 11px;
  }

  .note-row {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .note-row__preview {
    grid-column: 1;
    grid-row: 2;
  }

  .pulse-panel {
    flex-direction: column;
  }

  .pulse-panel__summary {
    flex: none;
    border-right: none;
    border-bottom: 1px solid var(--color-border-subtle);
    padding: var(--space-m) var(--space-l);
  }

  .pulse-panel__legend {
    flex-direction: row;
    gap: var(--space-l);
  }

  .pulse-panel__chart {
    padding: var(--space-s) var(--space-m);
  }

  .trend-svg {
    height: 90px;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .viz-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stat-cell {
    padding: var(--space-s) var(--space-m);
  }
}

/* Dashboard density */
.dash--compact :deep(.dash-section) { margin-bottom: var(--space-m); }
.dash--compact :deep(.stat-cell) { padding: var(--space-xs) var(--space-s); }
.dash--spacious :deep(.dash-section) { margin-bottom: var(--space-3xl); }
.dash--spacious :deep(.stat-cell) { padding: var(--space-l) var(--space-xl); }
</style>
