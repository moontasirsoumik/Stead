<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SInput from '@/components/ui/SInput.vue'
import SSelect from '@/components/ui/SSelect.vue'
import STextarea from '@/components/ui/STextarea.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import { useExpenseSplitsStore } from '@/stores/expense-splits.store'
import { useExpensesStore } from '@/stores/expenses.store'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useManualSettlementsStore } from '@/stores/manual-settlements.store'
import { useToastStore } from '@/stores/toast.store'
import { formatCents } from '@/utils/format'
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
import type { ManualSettlement } from '@/models/manual-settlement.model'

const splitsStore = useExpenseSplitsStore()
const expensesStore = useExpensesStore()
const householdStore = useHouseholdStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const manualStore = useManualSettlementsStore()
const toastStore = useToastStore()

const drawerOpen = ref(false)
const editingManualId = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const confirmDeleteOpen = ref(false)

const manualForm = ref({
  date: new Date().toISOString().slice(0, 10),
  amount: '',
  direction: 'i_owe' as 'i_owe' | 'owed_to_me',
  counterparty_type: 'member' as 'member' | 'external',
  counterparty_member_id: '',
  counterparty_name: '',
  visibility: 'private' as 'private' | 'public',
  description: '',
  note: '',
  status: 'outstanding' as 'outstanding' | 'settled',
})

const paidByMap = computed<Record<string, string | null>>(() => {
  const map: Record<string, string | null> = {}
  for (const expense of expensesStore.items) map[expense.id] = expense.paid_by
  return map
})

const expenseById = computed(() => {
  const map = new Map<string, (typeof expensesStore.items)[number]>()
  for (const expense of expensesStore.items) map.set(expense.id, expense)
  return map
})

const myId = computed(() => authStore.memberId ?? '')

const iOwe = computed(() => splitsStore.perMemberOwedBy(myId.value, paidByMap.value))
const theyOwe = computed(() => splitsStore.perMemberOwedTo(myId.value, paidByMap.value))

const externalTheyOwe = computed(() => {
  const byPerson: Record<string, { payer_name: string; amount: number; splits: { id: string }[] }> = {}

  for (const split of splitsStore.splits) {
    const expense = expenseById.value.get(split.expense_id)
    if (!expense || expense.paid_by !== myId.value || split.participant_type !== 'external' || split.settled) {
      continue
    }

    const name = split.participant_name ?? 'Outside person'
    if (!byPerson[name]) {
      byPerson[name] = { payer_name: name, amount: 0, splits: [] }
    }
    byPerson[name].amount += split.amount
    byPerson[name].splits.push({ id: split.id })
  }

  return Object.values(byPerson)
})

const visibleManualSettlements = computed(() =>
  manualStore.items
    .filter((item) => {
      if (item.deleted) return false
      if (appStore.scope === 'household') return item.visibility === 'public'
      return item.owner_id === myId.value
    })
    .sort((a, b) => b.date.localeCompare(a.date)),
)

const outstandingManualSettlements = computed(() =>
  visibleManualSettlements.value.filter((item) => item.status === 'outstanding'),
)

const manualIOweTotal = computed(() =>
  outstandingManualSettlements.value.reduce((sum, item) => {
    const relation = getManualRelation(item)
    return relation === 'i_owe' ? sum + item.amount : sum
  }, 0),
)

const manualTheyOweTotal = computed(() =>
  outstandingManualSettlements.value.reduce((sum, item) => {
    const relation = getManualRelation(item)
    return relation === 'owed_to_me' ? sum + item.amount : sum
  }, 0),
)

const externalExpenseIOwe = computed(() => {
  const byPayer: Record<string, { payer_name: string; amount: number; splits: { id: string }[] }> = {}

  for (const split of splitsStore.splits) {
    const expense = expenseById.value.get(split.expense_id)
    if (!expense || expense.paid_by_type !== 'external' || split.member_id !== myId.value || split.settled) {
      continue
    }

    const payerName = expense.paid_by_name ?? 'External payer'
    if (!byPayer[payerName]) {
      byPayer[payerName] = { payer_name: payerName, amount: 0, splits: [] }
    }
    byPayer[payerName].amount += split.amount
    byPayer[payerName].splits.push({ id: split.id })
  }

  return Object.values(byPayer)
})

const externalExpenseIOweTotal = computed(() =>
  externalExpenseIOwe.value.reduce((sum, group) => sum + group.amount, 0),
)

const externalTheyOweTotal = computed(() =>
  externalTheyOwe.value.reduce((sum, group) => sum + group.amount, 0),
)

const totalIOwe = computed(() =>
  iOwe.value.reduce((sum, group) => sum + group.amount, 0)
  + manualIOweTotal.value
  + externalExpenseIOweTotal.value,
)
const totalTheyOwe = computed(() =>
  theyOwe.value.reduce((sum, group) => sum + group.amount, 0)
  + manualTheyOweTotal.value
  + externalTheyOweTotal.value,
)
const netBalance = computed(() => totalTheyOwe.value - totalIOwe.value)

const memberOptions = computed(() =>
  householdStore.activeMembers
    .filter((member) => member.id !== myId.value)
    .map((member) => ({ value: member.id, label: member.name })),
)

function getMemberName(id: string) {
  return householdStore.activeMembers.find((member) => member.id === id)?.name ?? 'Unknown'
}

function getMemberColor(id: string | null) {
  if (!id) return undefined
  return householdStore.activeMembers.find((member) => member.id === id)?.color
}

async function settleGroup(splits: { id: string }[]) {
  try {
    for (const split of splits) {
      await splitsStore.settle(split.id)
    }
    toastStore.success('Marked settled')
  } catch (err) {
    toastStore.error('Could not settle split', err instanceof Error ? err.message : 'Please try again.')
  }
}

function getManualCounterpartyName(item: ManualSettlement) {
  return item.counterparty_member_id ? getMemberName(item.counterparty_member_id) : item.counterparty_name
}

function getManualRelation(item: ManualSettlement): 'i_owe' | 'owed_to_me' | null {
  if (item.owner_id === myId.value) return item.direction
  if (item.counterparty_member_id !== myId.value) return null
  return item.direction === 'i_owe' ? 'owed_to_me' : 'i_owe'
}

function getManualSentence(item: ManualSettlement) {
  const ownerName = getMemberName(item.owner_id)
  const otherName = getManualCounterpartyName(item)

  if (item.owner_id === myId.value) {
    return item.direction === 'i_owe'
      ? `You owe ${otherName}`
      : `${otherName} owes you`
  }

  if (item.counterparty_member_id === myId.value) {
    return item.direction === 'i_owe'
      ? `${ownerName} owes you`
      : `You owe ${ownerName}`
  }

  return item.direction === 'i_owe'
    ? `${ownerName} owes ${otherName}`
    : `${otherName} owes ${ownerName}`
}

function canEditManual(item: ManualSettlement) {
  return item.owner_id === myId.value
}

function openAddManual() {
  editingManualId.value = null
  manualForm.value = {
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    direction: 'i_owe',
    counterparty_type: 'member',
    counterparty_member_id: '',
    counterparty_name: '',
    visibility: appStore.scope === 'household' ? 'public' : 'private',
    description: '',
    note: '',
    status: 'outstanding',
  }
  drawerOpen.value = true
}

function openEditManual(item: ManualSettlement) {
  if (!canEditManual(item)) return
  editingManualId.value = item.id
  manualForm.value = {
    date: item.date.slice(0, 10),
    amount: String(item.amount / 100),
    direction: item.direction,
    counterparty_type: item.counterparty_member_id ? 'member' : 'external',
    counterparty_member_id: item.counterparty_member_id ?? '',
    counterparty_name: item.counterparty_member_id ? '' : item.counterparty_name,
    visibility: item.visibility,
    description: item.description,
    note: item.note ?? '',
    status: item.status,
  }
  drawerOpen.value = true
}

async function handleManualSubmit() {
  if (!authStore.householdId || !myId.value) return
  saving.value = true
  try {
    const amount = Math.round((parseFloat(manualForm.value.amount) || 0) * 100)
    if (amount <= 0) {
      toastStore.warning('Add an amount', 'Settlement amount must be greater than zero.')
      return
    }

    const counterpartyMember = householdStore.activeMembers.find(
      (member) => member.id === manualForm.value.counterparty_member_id,
    )
    const counterpartyName = manualForm.value.counterparty_type === 'member'
      ? counterpartyMember?.name
      : manualForm.value.counterparty_name.trim()

    if (!counterpartyName) {
      toastStore.warning('Choose who this is with', 'Select a member or enter an outside person.')
      return
    }

    const payload = {
      household_id: authStore.householdId,
      owner_id: myId.value,
      visibility: manualForm.value.visibility,
      direction: manualForm.value.direction,
      counterparty_member_id: manualForm.value.counterparty_type === 'member'
        ? manualForm.value.counterparty_member_id
        : null,
      counterparty_name: counterpartyName,
      amount,
      date: manualForm.value.date,
      description: manualForm.value.description.trim() || 'Manual settlement',
      note: manualForm.value.note.trim() || null,
      status: manualForm.value.status,
      settled_at: manualForm.value.status === 'settled' ? new Date().toISOString() : null,
      deleted: false,
      updated_by: myId.value,
    }

    if (editingManualId.value) {
      await manualStore.update(editingManualId.value, payload)
      toastStore.success('Settlement updated')
    } else {
      await manualStore.create(payload)
      toastStore.success('Settlement added')
    }
    drawerOpen.value = false
  } catch (err) {
    toastStore.error('Settlement was not saved', err instanceof Error ? err.message : 'Please try again.')
  } finally {
    saving.value = false
  }
}

async function handleManualDelete() {
  if (!editingManualId.value) return
  deleting.value = true
  try {
    await manualStore.remove(editingManualId.value)
    toastStore.success('Settlement removed')
    confirmDeleteOpen.value = false
    drawerOpen.value = false
  } catch (err) {
    toastStore.error('Settlement was not removed', err instanceof Error ? err.message : 'Please try again.')
  } finally {
    deleting.value = false
  }
}

async function markManualSettled(item: ManualSettlement) {
  try {
    await manualStore.markSettled(item.id)
    toastStore.success('Marked settled')
  } catch (err) {
    toastStore.error('Could not settle item', err instanceof Error ? err.message : 'Please try again.')
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
      manualStore.fetchFresh(authStore.householdId),
    ])
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Settlements"
      subtitle="Split expenses and manual balances"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    >
      <template #actions>
        <SButton @click="openAddManual">Add Settlement</SButton>
      </template>
    </PageHeader>

    <MoneyTabs />

    <div class="money-mobile-actions">
      <SButton @click="openAddManual">Add Settlement</SButton>
    </div>

    <div v-if="splitsStore.loading || manualStore.loading" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="4" />
    </div>

    <template v-else>
      <div class="stats-bar page-enter" :style="{ '--stagger': 2 }">
        <div class="stats-bar__cell">
          <span class="stats-bar__label">Net balance</span>
          <span class="stats-bar__value" :class="netBalance >= 0 ? 'net-positive' : 'net-negative'">
            {{ netBalance >= 0 ? '+' : '-' }}{{ formatCents(Math.abs(netBalance)) }}
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

      <section
        v-if="theyOwe.length || externalTheyOwe.length"
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
          <div v-for="group in externalTheyOwe" :key="group.payer_name" class="balance-row">
            <SAvatar
              :name="group.payer_name"
              size="md"
            />
            <div class="balance-row__info">
              <span class="balance-row__name">{{ group.payer_name }}</span>
              <span class="balance-row__count">{{ group.splits.length }} outside share{{ group.splits.length !== 1 ? 's' : '' }}</span>
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

      <section
        v-if="iOwe.length || externalExpenseIOwe.length"
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
          <div v-for="group in externalExpenseIOwe" :key="group.payer_name" class="balance-row">
            <SAvatar
              :name="group.payer_name"
              size="md"
            />
            <div class="balance-row__info">
              <span class="balance-row__name">{{ group.payer_name }}</span>
              <span class="balance-row__count">{{ group.splits.length }} outside-paid expense{{ group.splits.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="balance-row__right">
              <span class="balance-amount balance-amount--owe">{{ formatCents(group.amount) }}</span>
              <SButton size="sm" variant="secondary" @click="settleGroup(group.splits)">
                Mark settled
              </SButton>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="visibleManualSettlements.length"
        class="balance-section page-enter"
        :style="{ '--stagger': 5 }"
      >
        <h3 class="balance-section__title">Manual settlements</h3>
        <div class="balance-list">
          <div v-for="item in visibleManualSettlements" :key="item.id" class="balance-row">
            <SAvatar
              :name="getManualCounterpartyName(item)"
              :color="getMemberColor(item.counterparty_member_id)"
              size="md"
            />
            <button
              :class="['balance-row__info', { 'balance-row__info--button': canEditManual(item) }]"
              type="button"
              :disabled="!canEditManual(item)"
              @click="openEditManual(item)"
            >
              <span class="balance-row__name">{{ getManualSentence(item) }}</span>
              <span class="balance-row__count">{{ item.description }} / {{ item.visibility }} / {{ item.status }}</span>
            </button>
            <div class="balance-row__right">
              <span
                class="balance-amount"
                :class="getManualRelation(item) === 'i_owe' ? 'balance-amount--owe' : 'balance-amount--owed'"
              >
                {{ formatCents(item.amount) }}
              </span>
              <SButton
                v-if="item.status === 'outstanding' && canEditManual(item)"
                size="sm"
                variant="secondary"
                @click="markManualSettled(item)"
              >
                Mark settled
              </SButton>
              <SBadge v-else-if="item.status === 'settled'" variant="success" size="sm">Settled</SBadge>
              <SBadge v-else variant="default" size="sm">Public</SBadge>
            </div>
          </div>
        </div>
      </section>

      <div
        v-if="!theyOwe.length && !externalTheyOwe.length && !iOwe.length && !externalExpenseIOwe.length && !visibleManualSettlements.length"
        class="empty-section page-enter"
        :style="{ '--stagger': 3 }"
      >
        <EmptyState
          title="All settled up"
          subtitle="No outstanding balances right now"
          icon="empty"
          action-label="Add Settlement"
          @action="openAddManual"
        />
      </div>
    </template>

    <FormDrawer
      :open="drawerOpen"
      :title="editingManualId ? 'Edit Settlement' : 'Add Settlement'"
      :submit-label="editingManualId ? 'Update' : 'Add'"
      :loading="saving"
      @close="drawerOpen = false"
      @submit="handleManualSubmit"
    >
      <FormSection title="Details">
        <FormField>
          <SInput v-model="manualForm.date" label="Date" type="text" placeholder="YYYY-MM-DD" required />
        </FormField>
        <FormField>
          <SInput v-model="manualForm.amount" label="Amount ($)" type="number" placeholder="0.00" required />
        </FormField>
        <FormField>
          <SSelect
            v-model="manualForm.direction"
            label="Direction"
            :options="[
              { value: 'i_owe', label: 'I owe them' },
              { value: 'owed_to_me', label: 'They owe me' },
            ]"
          />
        </FormField>
        <FormField>
          <SInput v-model="manualForm.description" label="Description" placeholder="Borrowed cash, paid back a bill..." required />
        </FormField>
      </FormSection>

      <FormSection title="Person">
        <FormField>
          <SSelect
            v-model="manualForm.counterparty_type"
            label="Person type"
            :options="[
              { value: 'member', label: 'Household member' },
              { value: 'external', label: 'Outside household' },
            ]"
          />
        </FormField>
        <FormField>
          <SSelect
            v-if="manualForm.counterparty_type === 'member'"
            v-model="manualForm.counterparty_member_id"
            label="With"
            :options="memberOptions"
            placeholder="Select member"
            required
          />
          <SInput
            v-else
            v-model="manualForm.counterparty_name"
            label="With"
            placeholder="Person name"
            required
          />
        </FormField>
      </FormSection>

      <FormSection title="Visibility">
        <FormField>
          <SSelect
            v-model="manualForm.visibility"
            label="Visibility"
            :options="[
              { value: 'private', label: 'Private' },
              { value: 'public', label: 'Public to household' },
            ]"
          />
        </FormField>
        <FormField>
          <SSelect
            v-model="manualForm.status"
            label="Status"
            :options="[
              { value: 'outstanding', label: 'Outstanding' },
              { value: 'settled', label: 'Settled' },
            ]"
          />
        </FormField>
        <FormField>
          <STextarea v-model="manualForm.note" label="Note" placeholder="Optional details" :rows="3" />
        </FormField>
      </FormSection>

      <template v-if="editingManualId" #footer-start>
        <SButton variant="danger" :loading="deleting" @click="confirmDeleteOpen = true">
          Remove
        </SButton>
      </template>
    </FormDrawer>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="Remove Settlement"
      message="This manual settlement will be removed."
      confirm-label="Remove"
      variant="danger"
      @confirm="handleManualDelete"
      @cancel="confirmDeleteOpen = false"
    />
  </PageContainer>
</template>

<style scoped>
.stats-bar {
  display: flex;
  align-items: stretch;
  background: var(--color-surface-container-low);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  margin-bottom: var(--space-l);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.stats-bar__cell {
  flex: 1;
  padding: var(--space-m) var(--space-l);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  border-right: 1px solid var(--color-border-subtle);
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
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  background: var(--color-surface-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.balance-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) var(--space-l);
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background-color var(--duration-fast) var(--easing-standard);
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
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
}

.balance-row__info:disabled {
  cursor: default;
}

.balance-row__info--button {
  cursor: pointer;
}

.balance-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
}

.balance-row__count {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.balance-amount--owe { color: var(--color-error); }

.money-mobile-actions {
  display: none;
}

@media (max-width: 640px) {
  :deep(.pageheader__actions) { display: none; }

  .money-mobile-actions {
    display: flex;
    margin-bottom: var(--space-m);
  }

  .stats-bar {
    flex-direction: column;
  }

  .stats-bar__cell {
    border-right: 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .stats-bar__cell:last-child {
    border-bottom: 0;
  }

  .balance-row {
    align-items: flex-start;
    padding: var(--space-m);
  }

  .balance-row__right {
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-xs);
  }
}
</style>
