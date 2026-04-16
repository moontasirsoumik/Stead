<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
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
      title="Balances"
      subtitle="Shared expenses and what you owe each other"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    />

    <MoneyTabs />

    <div v-if="splitsStore.loading" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="4" />
    </div>

    <template v-else>
      <!-- Net summary card -->
      <ContentCard
        class="page-enter net-card"
        :style="{ '--stagger': 2 }"
        :class="{
          'net-card--positive': netBalance > 0,
          'net-card--negative': netBalance < 0,
        }"
      >
        <div class="net-summary">
          <div class="net-summary__label">Net balance</div>
          <div class="net-summary__amount" :class="netBalance >= 0 ? 'net-positive' : 'net-negative'">
            {{ netBalance >= 0 ? '+' : '' }}{{ formatCents(Math.abs(netBalance)) }}
          </div>
          <div class="net-summary__sub">
            <span class="net-chip net-chip--owe">You owe {{ formatCents(totalIOwe) }}</span>
            <span class="net-divider">·</span>
            <span class="net-chip net-chip--owed">Owed to you {{ formatCents(totalTheyOwe) }}</span>
          </div>
        </div>
      </ContentCard>

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
      <ContentCard
        v-if="!theyOwe.length && !iOwe.length"
        class="page-enter"
        :style="{ '--stagger': 3 }"
      >
        <EmptyState
          title="All settled up"
          subtitle="No outstanding balances — everyone's even"
          icon="empty"
        />
      </ContentCard>
    </template>
  </PageContainer>
</template>

<style scoped>
.net-card {
  margin-bottom: var(--space-l);
}

.net-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) var(--space-l);
  gap: var(--space-xs);
}

.net-summary__label {
  font: var(--text-label-2);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.net-summary__amount {
  font: var(--text-title-1);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
}

.net-positive { color: var(--color-success); }
.net-negative { color: var(--color-error); }

.net-summary__sub {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  margin-top: var(--space-xs);
}

.net-divider {
  color: var(--color-fg-tertiary);
}

.net-chip {
  font: var(--text-caption);
  font-weight: var(--font-weight-medium);
  padding: 2px var(--space-s);
  border-radius: var(--radius-pill);
}

.net-chip--owe {
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  color: var(--color-error);
}

.net-chip--owed {
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  color: var(--color-success);
}

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
  box-shadow: var(--shadow-2), var(--shadow-card);
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
