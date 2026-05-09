<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import SBadge from '@/components/ui/SBadge.vue'
import { useExpensesStore } from '@/stores/expenses.store'
import { useIncomeStore } from '@/stores/income.store'
import { useBillsStore } from '@/stores/bills.store'
import { useBudgetsStore } from '@/stores/budgets.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { formatCents, formatDate } from '@/utils/format'

type SurfaceTone = 'neutral' | 'positive' | 'negative' | 'warning'
type BadgeTone = 'default' | 'success' | 'warning' | 'error'
type BudgetTone = 'safe' | 'watch' | 'over'

const router = useRouter()
const expensesStore = useExpensesStore()
const incomeStore = useIncomeStore()
const billsStore = useBillsStore()
const budgetsStore = useBudgetsStore()
const authStore = useAuthStore()
const appStore = useAppStore()

const loading = ref(true)

function titleCase(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function matchesScope(item: { scope?: string; owner_id?: string | null }): boolean {
  if (!('scope' in item)) return true
  return item.scope === appStore.scope
}

function budgetVariant(tone: BudgetTone): BadgeTone {
  if (tone === 'over') return 'error'
  if (tone === 'watch') return 'warning'
  return 'default'
}

function budgetLabel(tone: BudgetTone): string {
  if (tone === 'over') return 'Over budget'
  if (tone === 'watch') return 'Watch'
  return 'On track'
}

function billVariant(status: string): BadgeTone {
  if (status === 'paid') return 'success'
  if (status === 'overdue') return 'error'
  return 'warning'
}

const scopeLabel = computed(() => (appStore.scope === 'personal' ? 'Personal scope' : 'Household scope'))
const currentYM = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})
const currentPeriodLabel = computed(() =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
)

const scopedExpenses = computed(() => expensesStore.items.filter(matchesScope))
const scopedIncome = computed(() => incomeStore.items.filter(matchesScope))
const scopedBudgets = computed(() => budgetsStore.currentMonthBudgets.filter(matchesScope))

const currentMonthExpenses = computed(() =>
  scopedExpenses.value.filter((expense) => expense.date.startsWith(currentYM.value)),
)
const currentMonthIncome = computed(() =>
  scopedIncome.value.filter((income) => income.date.startsWith(currentYM.value)),
)

const monthExpenseTotal = computed(() =>
  currentMonthExpenses.value.reduce((sum, expense) => sum + expense.amount, 0),
)
const monthIncomeTotal = computed(() =>
  currentMonthIncome.value.reduce((sum, income) => sum + income.amount, 0),
)
const monthNetTotal = computed(() => monthIncomeTotal.value - monthExpenseTotal.value)
const currentMonthTransactionCount = computed(() =>
  currentMonthIncome.value.length + currentMonthExpenses.value.length,
)
const averageDailySpend = computed(() => {
  const daysElapsed = Math.max(new Date().getDate(), 1)
  return Math.round(monthExpenseTotal.value / daysElapsed)
})

const categoryTotals = computed<Record<string, number>>(() => {
  const totals: Record<string, number> = {}
  for (const expense of currentMonthExpenses.value) {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
  }
  return totals
})

const categoryCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const expense of currentMonthExpenses.value) {
    counts[expense.category] = (counts[expense.category] ?? 0) + 1
  }
  return counts
})

const spendingMix = computed(() => {
  if (monthExpenseTotal.value === 0) return []

  return Object.entries(categoryTotals.value)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([category, amount]) => ({
      category,
      label: titleCase(category),
      amount,
      count: categoryCounts.value[category] ?? 0,
      share: Math.round((amount / monthExpenseTotal.value) * 100),
      width: Math.max(8, Math.round((amount / monthExpenseTotal.value) * 100)),
    }))
})

const incomeSources = computed(() => {
  if (monthIncomeTotal.value === 0) return []

  const sourceTotals: Record<string, { amount: number; count: number }> = {}
  for (const entry of currentMonthIncome.value) {
    const key = entry.source || 'Other'
    if (!sourceTotals[key]) sourceTotals[key] = { amount: 0, count: 0 }
    sourceTotals[key].amount += entry.amount
    sourceTotals[key].count += 1
  }

  return Object.entries(sourceTotals)
    .sort((left, right) => right[1].amount - left[1].amount)
    .slice(0, 6)
    .map(([source, data]) => ({
      source,
      amount: data.amount,
      count: data.count,
      share: Math.round((data.amount / monthIncomeTotal.value) * 100),
      width: Math.max(8, Math.round((data.amount / monthIncomeTotal.value) * 100)),
    }))
})

const budgetWatchItems = computed(() =>
  scopedBudgets.value
    .map((budget) => {
      const spent = categoryTotals.value[budget.category] ?? 0
      const ratio = budget.budget_amount > 0 ? spent / budget.budget_amount : 0
      let tone: BudgetTone = 'safe'
      if (ratio >= 1) tone = 'over'
      else if (ratio >= 0.75) tone = 'watch'

      return {
        id: budget.id,
        label: titleCase(budget.category),
        spent,
        budget: budget.budget_amount,
        remaining: budget.budget_amount - spent,
        ratio,
        tone,
        width: spent > 0 ? Math.max(8, Math.min(100, Math.round(ratio * 100))) : 0,
      }
    })
    .sort((left, right) => {
      const priority: Record<BudgetTone, number> = { over: 2, watch: 1, safe: 0 }
      return priority[right.tone] - priority[left.tone] || right.ratio - left.ratio || right.spent - left.spent
    })
    .slice(0, 6),
)

const budgetMetrics = computed(() => {
  const totalBudget = scopedBudgets.value.reduce((sum, budget) => sum + budget.budget_amount, 0)
  const trackedSpent = scopedBudgets.value.reduce(
    (sum, budget) => sum + (categoryTotals.value[budget.category] ?? 0),
    0,
  )
  const atRisk = scopedBudgets.value.filter((budget) => {
    if (budget.budget_amount <= 0) return false
    return (categoryTotals.value[budget.category] ?? 0) / budget.budget_amount >= 0.75
  }).length

  return {
    totalBudget,
    trackedSpent,
    remaining: totalBudget - trackedSpent,
    atRisk,
  }
})

const monthlyCadence = computed(() => {
  const months = Array.from({ length: 6 }, (_, index) => {
    const current = new Date()
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1)
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const income = scopedIncome.value
      .filter((entry) => entry.date.startsWith(period))
      .reduce((sum, entry) => sum + entry.amount, 0)
    const expense = scopedExpenses.value
      .filter((entry) => entry.date.startsWith(period))
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      label: new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(date),
      income,
      expense,
      net: income - expense,
    }
  })

  const scale = Math.max(1, ...months.flatMap((month) => [month.income, month.expense]))

  return months.map((month) => ({
    ...month,
    incomeWidth: month.income > 0 ? Math.max(8, Math.round((month.income / scale) * 100)) : 0,
    expenseWidth: month.expense > 0 ? Math.max(8, Math.round((month.expense / scale) * 100)) : 0,
  }))
})

const billsSummary = computed(() => {
  const activeBills = billsStore.items.filter((bill) => bill.status !== 'skipped')
  const paid = activeBills.filter((bill) => bill.status === 'paid').length
  const overdue = activeBills.filter((bill) => bill.status === 'overdue').length
  const upcoming = activeBills.filter((bill) => bill.status === 'upcoming').length
  const dueNow = activeBills
    .filter((bill) => bill.status === 'upcoming' || bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.amount, 0)
  const monthlyTotal = activeBills.reduce((sum, bill) => sum + bill.amount, 0)

  return {
    total: activeBills.length,
    paid,
    overdue,
    upcoming,
    dueNow,
    monthlyTotal,
  }
})

const billStatusCards = computed(() => [
  { label: 'Overdue', value: String(billsSummary.value.overdue), tone: 'negative' as SurfaceTone },
  { label: 'Upcoming', value: String(billsSummary.value.upcoming), tone: 'warning' as SurfaceTone },
  { label: 'Paid', value: String(billsSummary.value.paid), tone: 'positive' as SurfaceTone },
])

const highlightedBills = computed(() => {
  const priority: Record<string, number> = {
    overdue: 0,
    upcoming: 1,
    paid: 2,
    skipped: 3,
  }

  return billsStore.items
    .filter((bill) => bill.status !== 'skipped')
    .slice()
    .sort((left, right) => {
      return priority[left.status] - priority[right.status] || left.due_day - right.due_day || left.name.localeCompare(right.name)
    })
    .slice(0, 5)
})

const recentActivity = computed(() => {
  const expenseRows = scopedExpenses.value.map((expense) => ({
    id: `expense-${expense.id}`,
    kind: 'Expense',
    title: expense.description,
    detail: titleCase(expense.category),
    date: expense.date,
    amount: expense.amount,
    tone: 'neutral' as SurfaceTone,
    route: '/money/expenses',
  }))

  const incomeRows = scopedIncome.value.map((income) => ({
    id: `income-${income.id}`,
    kind: 'Income',
    title: income.source,
    detail: titleCase(income.category),
    date: income.date,
    amount: income.amount,
    tone: 'positive' as SurfaceTone,
    route: '/money/income',
  }))

  return [...expenseRows, ...incomeRows]
    .sort((left, right) => right.date.localeCompare(left.date) || right.amount - left.amount)
    .slice(0, 8)
})

const overviewCards = computed(() => [
  {
    label: 'Income this month',
    value: formatCents(monthIncomeTotal.value),
    meta: currentMonthIncome.value.length ? `${currentMonthIncome.value.length} income entries` : 'No income logged yet',
    tone: 'neutral' as SurfaceTone,
  },
  {
    label: 'Spent this month',
    value: formatCents(monthExpenseTotal.value),
    meta: currentMonthExpenses.value.length ? `${currentMonthExpenses.value.length} expense entries` : 'No expenses logged yet',
    tone: 'neutral' as SurfaceTone,
  },
  {
    label: 'Net flow',
    value: formatCents(monthNetTotal.value),
    meta: monthNetTotal.value >= 0 ? 'Income is ahead of spend' : 'Spend is ahead of income',
    tone: monthNetTotal.value >= 0 ? ('positive' as SurfaceTone) : ('negative' as SurfaceTone),
  },
  {
    label: 'Budget tracked',
    value: formatCents(budgetMetrics.value.totalBudget),
    meta: scopedBudgets.value.length
      ? `${formatCents(budgetMetrics.value.trackedSpent)} used • ${budgetMetrics.value.atRisk} at risk`
      : 'No budgets set this month',
    tone: budgetMetrics.value.atRisk > 0 ? ('warning' as SurfaceTone) : ('neutral' as SurfaceTone),
  },
  {
    label: 'Bills due now',
    value: formatCents(billsSummary.value.dueNow),
    meta: billsSummary.value.total
      ? `${billsSummary.value.overdue} overdue • ${billsSummary.value.upcoming} upcoming`
      : 'No active bills tracked',
    tone:
      billsSummary.value.overdue > 0
        ? ('negative' as SurfaceTone)
        : billsSummary.value.upcoming > 0
          ? ('warning' as SurfaceTone)
          : ('neutral' as SurfaceTone),
  },
])

const hasAnyData = computed(() =>
  scopedExpenses.value.length > 0 ||
  scopedIncome.value.length > 0 ||
  billsStore.items.length > 0 ||
  scopedBudgets.value.length > 0,
)

// ── Visualization: 6-month trend line ──
const trendLine = computed(() => {
  const reversed = [...monthlyCadence.value].reverse()
  const maxVal = Math.max(1, ...reversed.flatMap(m => [m.income, m.expense]))
  const points = reversed.map((m, i) => {
    const x = 30 + i * 52
    return {
      x,
      incY: 10 + (1 - m.income / maxVal) * 80,
      expY: 10 + (1 - m.expense / maxVal) * 80,
      label: m.label,
    }
  })
  const incomePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.incY}`).join(' ')
  const expensePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.expY}`).join(' ')
  const incomeArea = incomePath + ` L${points[points.length - 1].x},95 L${points[0].x},95 Z`
  const expenseArea = expensePath + ` L${points[points.length - 1].x},95 L${points[0].x},95 Z`
  return { points, incomePath, expensePath, incomeArea, expenseArea }
})

// ── Visualization: Daily spend heatmap (current month) ──
const spendHeatmap = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()

  const dailyTotals: number[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const total = scopedExpenses.value
      .filter(e => e.date.slice(0, 10) === dateStr)
      .reduce((s, e) => s + e.amount, 0)
    dailyTotals.push(total)
  }
  const max = Math.max(1, ...dailyTotals)

  // Build weeks (Sun-Sat rows)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const cells: Array<{ day: number; intensity: number; amount: number; isFuture: boolean } | null> = []

  // Pad the start
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      intensity: dailyTotals[d - 1] > 0 ? Math.max(0.15, dailyTotals[d - 1] / max) : 0,
      amount: dailyTotals[d - 1],
      isFuture: d > today,
    })
  }
  // Pad the end to complete the last week
  while (cells.length % 7 !== 0) cells.push(null)

  // Split into weeks
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
})

onMounted(async () => {
  const householdId = authStore.householdId
  if (!householdId) {
    loading.value = false
    return
  }

  try {
    await Promise.all([
      expensesStore.fetchFresh(householdId),
      incomeStore.fetchFresh(householdId),
      billsStore.fetchFresh(householdId),
      budgetsStore.fetchFresh(householdId),
    ])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Finances" subtitle="Household overview" class="page-enter" :style="{ '--stagger': 0 }" />
    <MoneyTabs />

    <LoadingSkeleton v-if="loading" :lines="10" class="page-enter" :style="{ '--stagger': 2 }" />

    <EmptyState
      v-else-if="!hasAnyData"
      title="No financial data yet"
      subtitle="Start by adding expenses, income, budgets, or bills from the other tabs."
      icon="empty"
      class="page-enter" :style="{ '--stagger': 2 }"
    />

    <div v-else class="finance-overview">
      <!-- Stats rail -->
      <section class="overview-rail page-enter" :style="{ '--stagger': 2 }">
        <article
          v-for="card in overviewCards"
          :key="card.label"
          class="overview-stat"
          :class="`overview-stat--${card.tone}`"
        >
          <span class="overview-stat__label">{{ card.label }}</span>
          <strong class="overview-stat__value">{{ card.value }}</strong>
          <span class="overview-stat__meta">{{ card.meta }}</span>
        </article>
      </section>

      <section class="overview-grid">
        <!-- Cashflow panel with trend line chart -->
        <article class="panel panel--cashflow page-enter" :style="{ '--stagger': 3 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Cashflow</span>
              <h2 class="panel__title">Six-month cadence</h2>
            </div>
            <div class="panel__context">{{ currentPeriodLabel }} · {{ scopeLabel }}</div>
          </header>

          <!-- Trend Line Chart -->
          <div class="trend-chart-shell">
            <svg viewBox="0 0 310 110" class="trend-chart" role="img" aria-label="6-month income vs expense trend">
              <!-- Grid -->
              <line x1="30" y1="95" x2="290" y2="95" stroke="var(--color-border-subtle)" stroke-width="1" />
              <line x1="30" y1="50" x2="290" y2="50" stroke="var(--color-border-subtle)" stroke-width="0.5" stroke-dasharray="4 4" />
              <line x1="30" y1="10" x2="290" y2="10" stroke="var(--color-border-subtle)" stroke-width="0.5" stroke-dasharray="4 4" />
              <!-- Income area -->
              <path :d="trendLine.incomeArea" class="trend-fill trend-fill--income" />
              <!-- Expense area -->
              <path :d="trendLine.expenseArea" class="trend-fill trend-fill--expense" />
              <!-- Income line -->
              <path :d="trendLine.incomePath" fill="none" class="trend-stroke trend-stroke--income" />
              <!-- Expense line -->
              <path :d="trendLine.expensePath" fill="none" class="trend-stroke trend-stroke--expense" />
              <!-- Dots + labels -->
              <g v-for="pt in trendLine.points" :key="pt.label">
                <circle :cx="pt.x" :cy="pt.incY" r="3" class="trend-dot trend-dot--income" />
                <circle :cx="pt.x" :cy="pt.expY" r="3" class="trend-dot trend-dot--expense" />
                <text :x="pt.x" y="108" text-anchor="middle" class="trend-month-label">{{ pt.label }}</text>
              </g>
            </svg>
            <div class="trend-chart-legend">
              <span class="trend-legend-item">
                <span class="trend-legend-dot trend-legend-dot--income"></span>
                Income
              </span>
              <span class="trend-legend-item">
                <span class="trend-legend-dot trend-legend-dot--expense"></span>
                Spending
              </span>
            </div>
          </div>

          <div class="flow-summary">
            <div class="flow-stat">
              <span class="flow-stat__label">Avg daily spend</span>
              <span class="flow-stat__value">{{ formatCents(averageDailySpend) }}</span>
            </div>
            <div class="flow-stat">
              <span class="flow-stat__label">Entries this month</span>
              <span class="flow-stat__value">{{ currentMonthTransactionCount }}</span>
            </div>
            <div class="flow-stat">
              <span class="flow-stat__label">Tracked headroom</span>
              <span class="flow-stat__value">
                {{ scopedBudgets.length ? formatCents(budgetMetrics.remaining) : 'Not set' }}
              </span>
            </div>
          </div>

          <div class="table-shell">
            <div class="cadence-table">
              <div class="cadence-table__head">
                <span>Month</span>
                <span>Range</span>
                <span class="align-right">Income</span>
                <span class="align-right">Spent</span>
                <span class="align-right">Net</span>
              </div>
              <div
                v-for="month in monthlyCadence"
                :key="month.label"
                class="cadence-row"
              >
                <span class="cadence-row__period">{{ month.label }}</span>
                <div class="cadence-row__bars">
                  <div class="cadence-row__track">
                    <span class="cadence-row__bar cadence-row__bar--income" :style="{ width: `${month.incomeWidth}%` }" />
                  </div>
                  <div class="cadence-row__track">
                    <span class="cadence-row__bar cadence-row__bar--expense" :style="{ width: `${month.expenseWidth}%` }" />
                  </div>
                </div>
                <span class="cadence-row__amount cadence-row__amount--income">{{ formatCents(month.income) }}</span>
                <span class="cadence-row__amount cadence-row__amount--expense">{{ formatCents(month.expense) }}</span>
                <span
                  class="cadence-row__amount"
                  :class="month.net >= 0 ? 'cadence-row__amount--positive' : 'cadence-row__amount--negative'"
                >
                  {{ formatCents(month.net) }}
                </span>
              </div>
            </div>
          </div>
        </article>

        <article class="panel page-enter" :style="{ '--stagger': 4 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Spending</span>
              <h2 class="panel__title">Month mix</h2>
            </div>
            <button class="panel__link" @click="router.push('/money/expenses')">View expenses</button>
          </header>

          <div v-if="!spendingMix.length" class="panel__empty">No expense activity yet for this month.</div>

          <div v-else class="mix-list">
            <div v-for="item in spendingMix" :key="item.category" class="mix-row">
              <div class="mix-row__top">
                <div>
                  <div class="mix-row__label">{{ item.label }}</div>
                  <div class="mix-row__meta">{{ item.count }} entries</div>
                </div>
                <div class="mix-row__value">{{ formatCents(item.amount) }}</div>
              </div>
              <div class="mix-row__track">
                <span class="mix-row__fill" :style="{ width: `${item.width}%` }" />
              </div>
              <div class="mix-row__foot">{{ item.share }}% of current month spend</div>
            </div>
          </div>
        </article>

        <!-- Daily Spend Heatmap -->
        <article class="panel page-enter" :style="{ '--stagger': 5 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Activity</span>
              <h2 class="panel__title">Daily spend</h2>
            </div>
            <div class="panel__context">{{ currentPeriodLabel }}</div>
          </header>

          <div v-if="!currentMonthExpenses.length" class="panel__empty">No expense data to map this month.</div>

          <div v-else class="heatmap">
            <div class="heatmap__days">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div class="heatmap__grid">
              <div v-for="(week, wi) in spendHeatmap" :key="wi" class="heatmap__week">
                <div
                  v-for="(cell, ci) in week"
                  :key="`${wi}-${ci}`"
                  class="heatmap__cell"
                  :class="{
                    'heatmap__cell--empty': !cell,
                    'heatmap__cell--future': cell?.isFuture,
                    'heatmap__cell--zero': cell && !cell.isFuture && cell.amount === 0,
                  }"
                  :style="cell && !cell.isFuture && cell.amount > 0 ? { opacity: cell.intensity, background: 'var(--color-brand-primary)' } : undefined"
                  :title="cell ? `Day ${cell.day}: ${formatCents(cell.amount)}` : ''"
                >
                  <span v-if="cell" class="heatmap__day-num">{{ cell.day }}</span>
                </div>
              </div>
            </div>
            <div class="heatmap__scale">
              <span class="heatmap__scale-label">Less</span>
              <span class="heatmap__scale-dot" style="opacity: 0.15"></span>
              <span class="heatmap__scale-dot" style="opacity: 0.35"></span>
              <span class="heatmap__scale-dot" style="opacity: 0.6"></span>
              <span class="heatmap__scale-dot" style="opacity: 0.85"></span>
              <span class="heatmap__scale-dot" style="opacity: 1"></span>
              <span class="heatmap__scale-label">More</span>
            </div>
          </div>
        </article>

        <article class="panel page-enter" :style="{ '--stagger': 6 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Budgets</span>
              <h2 class="panel__title">Budget watch</h2>
            </div>
            <button class="panel__link" @click="router.push('/money/budgets')">View budgets</button>
          </header>

          <div class="summary-strip" v-if="scopedBudgets.length">
            <div class="summary-chip">
              <span class="summary-chip__value">{{ formatCents(budgetMetrics.trackedSpent) }}</span>
              <span class="summary-chip__label">Spent</span>
            </div>
            <span class="summary-strip__divider"></span>
            <div class="summary-chip">
              <span class="summary-chip__value">{{ formatCents(budgetMetrics.totalBudget) }}</span>
              <span class="summary-chip__label">Budgeted</span>
            </div>
            <span class="summary-strip__divider"></span>
            <div class="summary-chip">
              <span class="summary-chip__value" :class="budgetMetrics.atRisk > 0 ? 'summary-chip__value--warn' : ''">{{ budgetMetrics.atRisk }}</span>
              <span class="summary-chip__label">At risk</span>
            </div>
          </div>

          <div v-if="!budgetWatchItems.length" class="panel__empty">No budgets set for this month.</div>

          <div v-else class="budget-list">
            <div v-for="item in budgetWatchItems" :key="item.id" class="budget-row">
              <div class="budget-row__top">
                <div>
                  <div class="budget-row__label">{{ item.label }}</div>
                  <div class="budget-row__meta">{{ formatCents(item.spent) }} of {{ formatCents(item.budget) }}</div>
                </div>
                <div class="budget-row__status">
                  <SBadge :variant="budgetVariant(item.tone)" size="sm">{{ budgetLabel(item.tone) }}</SBadge>
                  <span
                    class="budget-row__delta"
                    :class="`budget-row__delta--${item.tone}`"
                  >
                    {{ item.remaining >= 0 ? `${formatCents(item.remaining)} left` : `${formatCents(Math.abs(item.remaining))} over` }}
                  </span>
                </div>
              </div>
              <div class="budget-row__track">
                <span class="budget-row__fill" :class="`budget-row__fill--${item.tone}`" :style="{ width: `${item.width}%` }" />
              </div>
            </div>
          </div>
        </article>

        <article class="panel page-enter" :style="{ '--stagger': 7 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Bills</span>
              <h2 class="panel__title">Due board</h2>
            </div>
            <button class="panel__link" @click="router.push('/money/bills')">View bills</button>
          </header>

          <div class="summary-strip" v-if="billsSummary.total">
            <div class="summary-chip">
              <span class="summary-chip__value" :class="billsSummary.dueNow > 0 ? 'summary-chip__value--accent' : ''">{{ formatCents(billsSummary.dueNow) }}</span>
              <span class="summary-chip__label">Due now</span>
            </div>
            <span class="summary-strip__divider"></span>
            <div class="summary-chip">
              <span class="summary-chip__value">{{ formatCents(billsSummary.monthlyTotal) }}</span>
              <span class="summary-chip__label">Monthly total</span>
            </div>
          </div>

          <div class="status-strip">
            <div
              v-for="item in billStatusCards"
              :key="item.label"
              class="status-card"
              :class="`status-card--${item.tone}`"
            >
              <span class="status-card__label">{{ item.label }}</span>
              <strong class="status-card__value">{{ item.value }}</strong>
            </div>
          </div>

          <div v-if="!highlightedBills.length" class="panel__empty">No bills tracked right now.</div>

          <div v-else class="bills-list">
            <button
              v-for="bill in highlightedBills"
              :key="bill.id"
              type="button"
              class="bills-row"
              @click="router.push('/money/bills')"
            >
              <div>
                <div class="bills-row__label">{{ bill.name }}</div>
                <div class="bills-row__meta">Day {{ bill.due_day }} · {{ titleCase(bill.category) }}</div>
              </div>
              <div class="bills-row__side">
                <SBadge :variant="billVariant(bill.status)" size="sm">{{ titleCase(bill.status) }}</SBadge>
                <span class="bills-row__value">{{ formatCents(bill.amount) }}</span>
              </div>
            </button>
          </div>
        </article>

        <!-- Income sources -->
        <article class="panel page-enter" :style="{ '--stagger': 8 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Income</span>
              <h2 class="panel__title">Sources</h2>
            </div>
            <button class="panel__link" @click="router.push('/money/income')">View income</button>
          </header>

          <div v-if="!incomeSources.length" class="panel__empty">No income recorded this month yet.</div>

          <div v-else class="source-list">
            <div v-for="item in incomeSources" :key="item.source" class="source-row">
              <div class="source-row__top">
                <div>
                  <div class="source-row__label">{{ item.source }}</div>
                  <div class="source-row__meta">{{ item.count }} {{ item.count === 1 ? 'entry' : 'entries' }}</div>
                </div>
                <div class="source-row__value">{{ formatCents(item.amount) }}</div>
              </div>
              <div class="source-row__track">
                <span class="source-row__fill" :style="{ width: `${item.width}%` }" />
              </div>
              <div class="source-row__foot">{{ item.share }}% of month income</div>
            </div>
          </div>
        </article>

        <article class="panel panel--full page-enter" :style="{ '--stagger': 9 }">
          <header class="panel__header">
            <div>
              <span class="panel__eyebrow">Ledger</span>
              <h2 class="panel__title">Latest movement</h2>
            </div>
            <div class="panel__context">Recent income and expense activity</div>
          </header>

          <div v-if="!recentActivity.length" class="panel__empty">No recent finance activity to show yet.</div>

          <div v-else class="table-shell">
            <div class="ledger-table">
              <div class="ledger-table__head">
                <span>Type</span>
                <span>Details</span>
                <span>Date</span>
                <span class="align-right">Amount</span>
              </div>
              <button
                v-for="entry in recentActivity"
                :key="entry.id"
                type="button"
                class="ledger-row"
                @click="router.push(entry.route)"
              >
                <span>
                  <SBadge :variant="entry.kind === 'Income' ? 'success' : 'default'" size="sm">{{ entry.kind }}</SBadge>
                </span>
                <span class="ledger-row__details">
                  <span class="ledger-row__title">{{ entry.title }}</span>
                  <span class="ledger-row__meta">{{ entry.detail }}</span>
                </span>
                <span class="ledger-row__date">{{ formatDate(entry.date) }}</span>
                <span
                  class="ledger-row__amount"
                  :class="entry.tone === 'positive' ? 'ledger-row__amount--positive' : 'ledger-row__amount--neutral'"
                >
                  {{ entry.kind === 'Income' ? '+' : '-' }}{{ formatCents(entry.amount) }}
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  </PageContainer>
</template>

<style scoped>
.finance-overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

/* ── Stats rail ── */
.overview-rail {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-s);
}

@media (min-width: 620px) {
  .overview-rail {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .overview-rail {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.overview-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: var(--space-m);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-elevated);
}

.overview-stat--positive {
  background: color-mix(in srgb, var(--color-success-bg) 48%, var(--color-bg-elevated));
  border-color: color-mix(in srgb, var(--color-success) 18%, var(--color-border-default));
}

.overview-stat--negative {
  background: color-mix(in srgb, var(--color-error-bg) 50%, var(--color-bg-elevated));
  border-color: color-mix(in srgb, var(--color-error) 18%, var(--color-border-default));
}

.overview-stat--warning {
  background: color-mix(in srgb, var(--color-warning-bg) 54%, var(--color-bg-elevated));
  border-color: color-mix(in srgb, var(--color-warning) 18%, var(--color-border-default));
}

.overview-stat__label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
}

.overview-stat__value {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.overview-stat--positive .overview-stat__value {
  color: var(--color-success-fg);
}

.overview-stat--negative .overview-stat__value {
  color: var(--color-error-fg);
}

.overview-stat--warning .overview-stat__value {
  color: var(--color-warning-fg);
}

.overview-stat__meta {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  line-height: 1.45;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-s);
}

@media (min-width: 980px) {
  .overview-grid {
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  }

  .panel--full {
    grid-column: 1 / -1;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  min-width: 0;
  padding: var(--space-m);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  background: var(--color-bg-elevated);
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  flex-wrap: wrap;
}

.panel__eyebrow {
  display: block;
  margin-bottom: 2px;
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
}

.panel__title {
  margin: 0;
  font: var(--text-title-3);
  color: var(--color-fg-primary);
}

.panel__context {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.panel__link {
  padding: 0;
  border: none;
  background: transparent;
  font: var(--text-label-sm);
  color: var(--color-fg-secondary);
  cursor: pointer;
}

.panel__link:hover {
  color: var(--color-fg-primary);
}

.summary-strip {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-container-low);
}

.summary-strip__divider {
  width: 1px;
  align-self: stretch;
  background: var(--color-border-subtle);
  flex-shrink: 0;
}

.summary-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  text-align: center;
}

.summary-chip__value {
  font: var(--text-body-1-strong);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.summary-chip__value--warn {
  color: var(--color-warning-fg);
}

.summary-chip__value--accent {
  color: var(--color-brand-primary);
}

.summary-chip__label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
}

.panel__empty {
  padding: var(--space-s) 0;
  text-align: center;
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.flow-summary {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: var(--space-s);
}

@media (min-width: 680px) {
  .flow-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.flow-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-s) var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-container-low);
}

.flow-stat__label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
}

.flow-stat__value {
  font: var(--text-body-1-strong);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
}

.table-shell {
  overflow-x: auto;
}

.cadence-table,
.ledger-table {
  min-width: 640px;
}

.cadence-table__head,
.cadence-row,
.ledger-table__head,
.ledger-row {
  display: grid;
  gap: var(--space-s);
  align-items: center;
}

.cadence-table__head,
.ledger-table__head {
  padding: 0 0 var(--space-s);
  border-bottom: 1px solid var(--color-border-subtle);
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
}

.cadence-table__head,
.cadence-row {
  grid-template-columns: 72px minmax(0, 1fr) minmax(88px, auto) minmax(88px, auto) minmax(88px, auto);
}

.cadence-row {
  padding: var(--space-s) 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.cadence-row:last-child {
  border-bottom: none;
}

.cadence-row__period {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
}

.cadence-row__bars {
  display: grid;
  gap: 6px;
}

.cadence-row__track,
.mix-row__track,
.budget-row__track {
  display: block;
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-circle);
  background: var(--color-surface-container);
}

.cadence-row__bar,
.mix-row__fill,
.budget-row__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.cadence-row__bar--income {
  background: var(--color-success);
}

.cadence-row__bar--expense {
  background: var(--color-brand-primary);
}

.cadence-row__amount,
.mix-row__value,
.bills-row__value,
.ledger-row__amount {
  font: var(--text-label-md);
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  text-align: right;
}

.cadence-row__amount--income {
  color: var(--color-success-fg);
}

.cadence-row__amount--expense {
  color: var(--color-brand-primary);
}

.cadence-row__amount--positive,
.ledger-row__amount--positive {
  color: var(--color-success-fg);
}

.cadence-row__amount--negative {
  color: var(--color-error-fg);
}

.align-right {
  text-align: right;
}

.mix-list,
.budget-list,
.bills-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.mix-row,
.budget-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-s) var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-container-low);
}

.mix-row__top,
.budget-row__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-s);
}

.mix-row__label,
.budget-row__label,
.bills-row__label,
.ledger-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
}

.mix-row__meta,
.budget-row__meta,
.bills-row__meta,
.ledger-row__meta,
.ledger-row__date,
.mix-row__foot {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.mix-row__fill {
  background: var(--color-brand-primary);
}

/* ── Income sources ── */
.source-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.source-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-s) var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-container-low);
}

.source-row__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-s);
}

.source-row__label {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
}

.source-row__meta,
.source-row__foot {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.source-row__value {
  font: var(--text-label-md);
  font-family: var(--font-mono);
  color: var(--color-success-fg);
  text-align: right;
}

.source-row__track {
  display: block;
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-circle);
  background: var(--color-surface-container);
}

.source-row__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-success);
}

.budget-row__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.budget-row__delta {
  font: var(--text-caption);
}

.budget-row__delta--safe {
  color: var(--color-fg-secondary);
}

.budget-row__delta--watch {
  color: var(--color-warning-fg);
}

.budget-row__delta--over {
  color: var(--color-error-fg);
}

.budget-row__fill--safe {
  background: var(--color-brand-primary);
}

.budget-row__fill--watch {
  background: var(--color-warning);
}

.budget-row__fill--over {
  background: var(--color-error);
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-s);
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-s) var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-container-low);
}

.status-card--positive {
  background: color-mix(in srgb, var(--color-success-bg) 40%, var(--color-surface-container-low));
}

.status-card--warning {
  background: color-mix(in srgb, var(--color-warning-bg) 44%, var(--color-surface-container-low));
}

.status-card--negative {
  background: color-mix(in srgb, var(--color-error-bg) 44%, var(--color-surface-container-low));
}

.status-card__label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
}

.status-card__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
}

.bills-row,
.ledger-row {
  width: 100%;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-container-low);
  cursor: pointer;
}

.bills-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-s);
  padding: var(--space-s) var(--space-m);
  text-align: left;
}

.bills-row__side {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.ledger-table__head,
.ledger-row {
  grid-template-columns: 88px minmax(0, 1.8fr) 120px minmax(110px, auto);
}

.ledger-row {
  padding: var(--space-s) var(--space-m);
  margin-top: var(--space-s);
  text-align: left;
}

.ledger-row__details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ledger-row__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-row__amount--neutral {
  color: var(--color-fg-primary);
}

.bills-row:hover,
.ledger-row:hover,
.panel__link:hover {
  transition: color var(--duration-fast) var(--easing-standard), border-color var(--duration-fast) var(--easing-standard), background-color var(--duration-fast) var(--easing-standard);
}

.bills-row:hover,
.ledger-row:hover {
  border-color: var(--color-border-default);
  background: var(--color-surface-container);
}

/* ── Trend Line Chart ── */
.trend-chart-shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-s);
}

.trend-chart {
  width: 100%;
  height: auto;
  display: block;
}

.trend-fill--income {
  fill: var(--color-success);
  opacity: 0.1;
}

.trend-fill--expense {
  fill: var(--color-error);
  opacity: 0.06;
}

.trend-stroke--income {
  stroke: var(--color-success);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.7;
}

.trend-stroke--expense {
  stroke: var(--color-error);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.45;
}

.trend-dot--income {
  fill: var(--color-success);
  opacity: 0.8;
}

.trend-dot--expense {
  fill: var(--color-error);
  opacity: 0.55;
}

.trend-month-label {
  font-size: 9px;
  fill: var(--color-fg-tertiary);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
}

.trend-chart-legend {
  display: flex;
  gap: var(--space-m);
  justify-content: flex-end;
}

.trend-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.trend-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.trend-legend-dot--income { background: var(--color-success); opacity: 0.7; }
.trend-legend-dot--expense { background: var(--color-error); opacity: 0.45; }

/* ── Daily Spend Heatmap ── */
.heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.heatmap__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  text-align: center;
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  letter-spacing: var(--tracking-caps);
}

.heatmap__grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.heatmap__week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.heatmap__cell {
  aspect-ratio: 1;
  border-radius: var(--radius-s);
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 28px;
}

.heatmap__cell--empty {
  background: transparent;
}

.heatmap__cell--future {
  background: var(--color-bg-tertiary);
  opacity: 0.4;
}

.heatmap__cell--zero {
  background: var(--color-bg-tertiary);
}

.heatmap__day-num {
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-tertiary);
  line-height: 1;
  mix-blend-mode: luminosity;
}

.heatmap__cell:not(.heatmap__cell--empty):not(.heatmap__cell--future):not(.heatmap__cell--zero) .heatmap__day-num {
  color: var(--color-fg-on-brand);
  mix-blend-mode: normal;
}

.heatmap__scale {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.heatmap__scale-label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-size: 10px;
}

.heatmap__scale-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-s);
  background: var(--color-brand-primary);
}

@media (max-width: 639px) {
  .overview-rail {
    grid-template-columns: 1fr 1fr;
  }

  .status-strip {
    grid-template-columns: 1fr;
  }

  .budget-row__top,
  .mix-row__top,
  .bills-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .budget-row__status,
  .bills-row__side {
    align-items: flex-start;
  }
}
</style>
