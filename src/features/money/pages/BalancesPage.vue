<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import { useExpenseSplitsStore } from '@/stores/expense-splits.store'
import { useExpensesStore } from '@/stores/expenses.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatCents } from '@/utils/format'

const splitsStore = useExpenseSplitsStore()
const expensesStore = useExpensesStore()
const householdStore = useHouseholdStore()
const authStore = useAuthStore()

/** Map of expense_id → paid_by member_id */
const paidByMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const e of expensesStore.items) map[e.id] = e.paid_by
  return map
})

const myId = computed(() => authStore.memberId ?? '')

const iOwe = computed(() => splitsStore.perMemberOwedBy(myId.value, paidByMap.value))
const theyOwe = computed(() => splitsStore.perMemberOwedTo(myId.value, paidByMap.value))

const totalIOwe = computed(() => iOwe.value.reduce((s, g) => s + g.amount, 0))
const totalTheyOwe = computed(() => theyOwe.value.reduce((s, g) => s + g.amount, 0))
const netBalance = computed(() => totalTheyOwe.value - totalIOwe.value)

function getMemberName(id: string) {
  return householdStore.activeMembers.find((m) => m.id === id)?.name ?? 'Unknown'
}
function getMemberColor(id: string) {
  return householdStore.activeMembers.find((m) => m.id === id)?.color
}

async function settleGroup(splits: { id: string }[]) {
  for (const s of splits) {
    await splitsStore.settle(s.id)
  }
}

onMounted(async () => {
  if (authStore.householdId) {
    if (!householdStore.activeMembers.length) {
      await householdStore.loadMembers(authStore.householdId)
    }
    await Promise.all([
      expensesStore.fetchFresh(authStore.householdId),
      splitsStore.fetchByHousehold(authStore.householdId),
    ])
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Settlements"
      subtitle="Private view — only you can see your debts and credits"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    />

    <MoneyTabs />

    <div v-if="splitsStore.loading" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="4" />
    </div>

    <template v-else>
      <!-- Net summary bar -->
      <div class="stats-bar page-enter" :style="{ '--stagger': 2 }">
        <div class="stats-bar__cell">
          <span class="stats-bar__label">Net balance</span>
          <span class="stats-bar__value" :class="netBalance >= 0 ? 'net-positive' : 'net-negative'">
            {{ netBalance >= 0 ? '+' : '' }}{{ formatCents(Math.abs(netBalance)) }}
          </span>
        </div>
        <div class="stats-bar__cell">
          <span class="stats-bar__label">You owe</span>
          <span class="stats-bar__value net-negative">{{ formatCents(totalIOwe) }}</span>
        </div>
        <div class="stats-bar__cell">
          <span class="stats-bar__label">Owed to you</span>
          <span class="stats-bar__value net-positive">{{ formatCents(totalTheyOwe) }}</span>
        </div>
      </div>

      <!-- Others owe me -->
      <section
        v-if="theyOwe.length"
        class="balance-section page-enter"
        :style="{ '--stagger': 3 }"
      >
        <h3 class="balance-section__title">Owed to you</h3>
        <div class="balance-list">
          <div v-for="group in theyOwe" :key="group.member_id" class="balance-row">
            <SAvatar
              :name="getMemberName(group.member_id)"
              :color="getMemberColor(group.member_id)"
              size="md"
            />
            <div class="balance-row__info">
              <span class="balance-row__name">{{ getMemberName(group.member_id) }}</span>
              <span class="balance-row__count">{{ group.splits.length }} expense{{ group.splits.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="balance-row__right">
              <span class="balance-amount balance-amount--owed">{{ formatCents(group.amount) }}</span>
              <SButton size="sm" variant="secondary" @click="settleGroup(group.splits)">
                Mark settled
              </SButton>
            </div>
          </div>
        </div>
      </section>

      <!-- I owe others -->
      <section
        v-if="iOwe.length"
        class="balance-section page-enter"
        :style="{ '--stagger': 4 }"
      >
        <h3 class="balance-section__title">You owe</h3>
        <div class="balance-list">
          <div v-for="group in iOwe" :key="group.member_id" class="balance-row">
            <SAvatar
              :name="getMemberName(group.member_id)"
              :color="getMemberColor(group.member_id)"
              size="md"
            />
            <div class="balance-row__info">
              <span class="balance-row__name">{{ getMemberName(group.member_id) }}</span>
              <span class="balance-row__count">{{ group.splits.length }} expense{{ group.splits.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="balance-row__right">
              <span class="balance-amount balance-amount--owe">{{ formatCents(group.amount) }}</span>
              <SBadge variant="warning" size="sm">You owe</SBadge>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty -->
      <div
        v-if="!theyOwe.length && !iOwe.length"
        class="empty-section page-enter"
        :style="{ '--stagger': 3 }"
      >
        <EmptyState
          title="All settled up"
          subtitle="No outstanding balances — everyone's even"
          icon="empty"
        />
      </div>
    </template>
  </PageContainer>
</template>

<style scoped>
.stats-bar {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-l);
  overflow: hidden;
}
.stats-bar__cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  border-right: 1px solid var(--color-border-default);
}
.stats-bar__cell:last-child { border-right: none; }
.stats-bar__label {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
}
.stats-bar__value {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
  font-family: var(--font-mono);
}

.net-positive { color: var(--color-success); }
.net-negative { color: var(--color-error); }

.balance-section {
  margin-bottom: var(--space-l);
}

.balance-section__title {
  font: var(--text-title-3);
  color: var(--color-fg-secondary);
  margin-bottom: var(--space-s);
}

.balance-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
}

.balance-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--duration-fast) var(--easing-standard);
}

.balance-row:last-child {
  border-bottom: none;
}

.balance-row:hover {
  background: var(--color-bg-tertiary);
}

.balance-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.balance-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
}

.balance-row__count {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.balance-row__right {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  flex-shrink: 0;
}

.balance-amount {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
}

.balance-amount--owed { color: var(--color-success); }
.balance-amount--owe  { color: var(--color-error); }
</style>
