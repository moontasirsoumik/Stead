<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import SButton from '@/components/ui/SButton.vue'
import SInput from '@/components/ui/SInput.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import { useHouseholdStore } from '@/stores/household.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Member } from '@/models/member.model'
import type { MemberRole } from '@/models/enums'

const householdStore = useHouseholdStore()
const authStore = useAuthStore()

const householdName = ref('')
const editingName = ref(false)
const savingName = ref(false)

const drawerOpen = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const drawerLoading = ref(false)
const editingMemberId = ref<string | null>(null)

const formName = ref('')
const formRole = ref<MemberRole>('member')
const formColor = ref('#0F6CBD')

const MEMBER_COLORS = [
  '#0F6CBD', '#107C10', '#C4314B', '#D48C00',
  '#8764B8', '#038387', '#CA5010', '#4F6BED',
]

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      householdStore.loadHousehold(authStore.householdId),
      householdStore.loadMembers(authStore.householdId),
    ])
    if (householdStore.household) {
      householdName.value = householdStore.household.name
    }
  }
})

watch(
  () => householdStore.household?.name,
  (name) => {
    if (name && !editingName.value) householdName.value = name
  },
)

async function saveHouseholdName() {
  if (!householdName.value.trim()) return
  savingName.value = true
  try {
    await householdStore.updateHousehold({ name: householdName.value.trim() })
    editingName.value = false
  } finally {
    savingName.value = false
  }
}

function cancelEditName() {
  householdName.value = householdStore.household?.name ?? ''
  editingName.value = false
}

function openAddDrawer() {
  drawerMode.value = 'add'
  editingMemberId.value = null
  formName.value = ''
  formRole.value = 'member'
  formColor.value = MEMBER_COLORS[householdStore.members.length % MEMBER_COLORS.length]
  drawerOpen.value = true
}

function openEditDrawer(member: Member) {
  drawerMode.value = 'edit'
  editingMemberId.value = member.id
  formName.value = member.name
  formRole.value = member.role
  formColor.value = member.color
  drawerOpen.value = true
}

async function submitDrawer() {
  if (!formName.value.trim()) return
  drawerLoading.value = true

  try {
    if (drawerMode.value === 'add' && authStore.householdId) {
      await householdStore.addMember({
        household_id: authStore.householdId,
        user_id: null,
        name: formName.value.trim(),
        role: formRole.value,
        color: formColor.value,
        active: true,
      })
    } else if (drawerMode.value === 'edit' && editingMemberId.value) {
      await householdStore.updateMember(editingMemberId.value, {
        name: formName.value.trim(),
        role: formRole.value,
        color: formColor.value,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

async function deactivateMember(member: Member) {
  await householdStore.removeMember(member.id)
}
</script>

<template>
  <PageContainer>
    <PageHeader
      title="Settings"
      subtitle="Manage your household and members"
      class="page-enter"
      :style="{ '--stagger': 0 }"
    />

    <!-- Household Name -->
    <ContentCard padding="lg" class="settings-card page-enter" :style="{ '--stagger': 1 }">
      <div class="section-header">
        <h2 class="section-title">Household</h2>
      </div>

      <div v-if="householdStore.household" class="household-name-row">
        <template v-if="editingName">
          <SInput
            v-model="householdName"
            placeholder="Household name"
            @keyup.enter="saveHouseholdName"
          />
          <div class="household-name-actions">
            <SButton size="sm" :loading="savingName" @click="saveHouseholdName">Save</SButton>
            <SButton size="sm" variant="subtle" @click="cancelEditName">Cancel</SButton>
          </div>
        </template>
        <template v-else>
          <div class="household-name-display">
            <span class="household-name-text">{{ householdStore.household.name }}</span>
            <SIconButton label="Edit name" size="sm" @click="editingName = true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </SIconButton>
          </div>
        </template>
      </div>

      <div v-else class="household-placeholder">
        <p class="text-secondary">No household loaded.</p>
      </div>
    </ContentCard>

    <!-- Members List -->
    <ContentCard padding="lg" class="settings-card page-enter" :style="{ '--stagger': 2 }">
      <div class="section-header">
        <h2 class="section-title">Members</h2>
        <SButton size="sm" @click="openAddDrawer">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 4px;">
            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          Add Member
        </SButton>
      </div>

      <div v-if="householdStore.members.length > 0" class="members-list">
        <div
          v-for="(member, index) in householdStore.members"
          :key="member.id"
          :class="['member-row', { 'member-row--inactive': !member.active }]"
          class="page-enter"
          :style="{ '--stagger': 3 + index }"
        >
          <div class="member-identity">
            <SAvatar :name="member.name" :color="member.color" size="md" />
            <div class="member-info">
              <span class="member-name">{{ member.name }}</span>
              <div class="member-meta">
                <SBadge :variant="member.role === 'admin' ? 'brand' : 'default'" size="sm">
                  {{ member.role }}
                </SBadge>
                <span v-if="!member.active" class="member-inactive-label">Inactive</span>
              </div>
            </div>
          </div>

          <div class="member-color-dot" :style="{ backgroundColor: member.color }" />

          <div class="member-actions">
            <SIconButton label="Edit member" size="sm" @click="openEditDrawer(member)">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </SIconButton>
            <SIconButton
              v-if="member.active"
              label="Deactivate member"
              size="sm"
              @click="deactivateMember(member)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
                <path d="M4 8H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </SIconButton>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        title="No members yet"
        subtitle="Add members to your household so everyone can stay organized."
        action-label="Add First Member"
        @action="openAddDrawer"
      />
    </ContentCard>

    <!-- Member Form Drawer -->
    <FormDrawer
      :open="drawerOpen"
      :title="drawerMode === 'add' ? 'Add Member' : 'Edit Member'"
      :submit-label="drawerMode === 'add' ? 'Add' : 'Save'"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="submitDrawer"
    >
      <FormSection>
        <FormField>
          <SInput
            v-model="formName"
            label="Name"
            placeholder="Member name"
            :required="true"
          />
        </FormField>

        <FormField>
          <SSelect
            v-model="formRole"
            label="Role"
            :options="ROLE_OPTIONS"
          />
        </FormField>

        <FormField>
          <label class="color-label">Color</label>
          <div class="color-swatches">
            <button
              v-for="color in MEMBER_COLORS"
              :key="color"
              :class="['color-swatch', { 'color-swatch--selected': formColor === color }]"
              :style="{ backgroundColor: color }"
              type="button"
              :aria-label="color"
              @click="formColor = color"
            />
          </div>
        </FormField>
      </FormSection>
    </FormDrawer>
  </PageContainer>
</template>

<style scoped>
.settings-card {
  margin-bottom: var(--space-l);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-l);
}

.section-title {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.household-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}

.household-name-actions {
  display: flex;
  gap: var(--space-xs);
}

.household-name-display {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.household-name-text {
  font: var(--text-body-1);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
}

.household-placeholder {
  padding: var(--space-m) 0;
}

.text-secondary {
  color: var(--color-fg-secondary);
  font: var(--text-body-2);
}

.members-list {
  display: flex;
  flex-direction: column;
}

.member-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: 36px;
  padding: var(--space-xs) var(--space-s);
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background var(--duration-fast) var(--easing-standard);
}

.member-row:last-child {
  border-bottom: none;
}

.member-row:hover {
  background: var(--color-bg-tertiary);
}

.member-row--inactive {
  opacity: 0.5;
}

.member-identity {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex: 1;
  min-width: 0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-width: 0;
}

.member-name {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.member-inactive-label {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.member-color-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-circle);
  flex-shrink: 0;
}

.member-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.member-row:hover .member-actions {
  opacity: 1;
}

.color-label {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  font-weight: var(--font-weight-medium);
  display: block;
  margin-bottom: var(--space-xs);
}

.color-swatches {
  display: flex;
  gap: var(--space-s);
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-circle);
  border: 2px solid transparent;
  cursor: pointer;
  transition: box-shadow var(--duration-fast) var(--easing-standard);
}

.color-swatch:hover {
  box-shadow: 0 0 0 2px var(--color-fg-tertiary);
}

.color-swatch--selected {
  border-color: var(--color-fg-primary);
  box-shadow: 0 0 0 2px var(--color-bg-primary);
}
</style>
