<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useInvitationStore } from '@/stores/invitation.store'
import SInput from '@/components/ui/SInput.vue'
import SButton from '@/components/ui/SButton.vue'

const router = useRouter()
const { createHousehold, user, error: authError } = useAuth()
const invitationStore = useInvitationStore()

const mode = ref<'choose' | 'create' | 'join'>('choose')

/* -- Create household state -- */
const householdName = ref('')
const memberName = ref(user.value?.user_metadata?.full_name ?? '')
const loading = ref(false)

const colors = ['#0F6CBD', '#107C10', '#C4314B', '#D48C00', '#8764B8', '#038387', '#CA5010', '#4F6BED']
const selectedColor = ref(colors[0])

/* -- Join household state -- */
const inviteCode = ref('')
const joinLoading = ref(false)
const joinError = ref('')

async function handleCreate() {
  loading.value = true
  const success = await createHousehold(householdName.value, memberName.value, selectedColor.value)
  loading.value = false
  if (success) {
    router.push('/')
  }
}

async function handleJoin() {
  joinError.value = ''
  if (!inviteCode.value.trim()) {
    joinError.value = 'Please enter an invite code'
    return
  }

  joinLoading.value = true
  try {
    const success = await invitationStore.acceptInvitation(inviteCode.value.trim().toUpperCase())
    if (success) {
      router.push('/')
    } else {
      joinError.value = invitationStore.error || 'Invalid or expired invitation code'
    }
  } finally {
    joinLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Step 1: Choose path -->
    <div v-if="mode === 'choose'" class="auth-card page-enter" :style="{ '--stagger': 0 }">
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">S</span>
        <h1 class="auth-title">Welcome to Stead</h1>
        <p class="auth-subtitle">How would you like to get started?</p>
      </div>

      <div class="choose-actions">
        <button class="choose-card" @click="mode = 'create'">
          <span class="material-symbols-rounded choose-card__icon">add_home</span>
          <span class="choose-card__title">Create a household</span>
          <span class="choose-card__desc">Start fresh and invite others later</span>
        </button>

        <button class="choose-card" @click="mode = 'join'">
          <span class="material-symbols-rounded choose-card__icon">group_add</span>
          <span class="choose-card__title">Join a household</span>
          <span class="choose-card__desc">I have an invite code from someone</span>
        </button>
      </div>
    </div>

    <!-- Step 2a: Create household -->
    <div v-if="mode === 'create'" class="auth-card page-enter" :style="{ '--stagger': 0 }">
      <div class="auth-header">
        <button class="back-btn" @click="mode = 'choose'" type="button">
          <span class="material-symbols-rounded">arrow_back</span>
        </button>
        <span class="auth-logo" aria-hidden="true">S</span>
        <h1 class="auth-title">Set up your household</h1>
        <p class="auth-subtitle">Name your household and pick a color for yourself</p>
      </div>

      <form class="auth-form" @submit.prevent="handleCreate">
        <SInput
          v-model="householdName"
          label="Household name"
          placeholder="e.g. The Smiths"
          required
        />

        <SInput
          v-model="memberName"
          label="Your display name"
          placeholder="Your name"
          required
        />

        <div class="color-picker">
          <label class="color-picker__label">Your color</label>
          <div class="color-picker__grid">
            <button
              v-for="c in colors"
              :key="c"
              type="button"
              :class="['color-swatch', { 'color-swatch--selected': selectedColor === c }]"
              :style="{ backgroundColor: c }"
              :aria-label="`Select color ${c}`"
              @click="selectedColor = c"
            />
          </div>
        </div>

        <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>

        <SButton :loading="loading" type="submit" full-width size="lg">
          Create household
        </SButton>
      </form>
    </div>

    <!-- Step 2b: Join household -->
    <div v-if="mode === 'join'" class="auth-card page-enter" :style="{ '--stagger': 0 }">
      <div class="auth-header">
        <button class="back-btn" @click="mode = 'choose'" type="button">
          <span class="material-symbols-rounded">arrow_back</span>
        </button>
        <span class="auth-logo" aria-hidden="true">S</span>
        <h1 class="auth-title">Join a household</h1>
        <p class="auth-subtitle">Enter the invite code shared with you</p>
      </div>

      <form class="auth-form" @submit.prevent="handleJoin">
        <SInput
          v-model="inviteCode"
          label="Invite code"
          placeholder="e.g. A1B2C3D4"
          required
        />

        <p class="auth-hint">Ask the household admin for this 8-character code. It&rsquo;s case-insensitive.</p>

        <p v-if="joinError" class="auth-error" role="alert">{{ joinError }}</p>

        <SButton :loading="joinLoading" type="submit" full-width size="lg">
          Join household
        </SButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-xl);
  background: var(--color-bg-wash);
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  padding: var(--space-2xl);
  border: 1px solid var(--color-border-default);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-xl);
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-fg-secondary);
  padding: var(--space-2xs);
  border-radius: var(--radius-s);
  transition: color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.back-btn:hover {
  color: var(--color-fg-primary);
  background: var(--color-bg-tertiary);
}

.back-btn .material-symbols-rounded {
  font-size: 20px;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  border-radius: var(--radius-m);
  margin-bottom: var(--space-m);
}

.auth-title {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  margin-bottom: var(--space-2xs);
}

.auth-subtitle {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.auth-error {
  font: var(--text-body-2);
  color: var(--color-error);
  background: var(--color-error-bg);
  padding: var(--space-xs) var(--space-m);
  border-radius: var(--radius-s);
}

.color-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.color-picker__label {
  font: var(--text-body-1-strong);
  color: var(--color-fg-primary);
}

.color-picker__grid {
  display: flex;
  gap: var(--space-s);
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  border: 2px solid transparent;
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--easing-standard),
    border-color var(--duration-fast) var(--easing-standard);
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch--selected {
  border-color: var(--color-fg-primary);
  transform: scale(1.1);
}

/* -- Choose path cards -- */
.choose-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.choose-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-l) var(--space-m);
  background: var(--color-bg-primary);
  border: 1.5px solid var(--color-border-default);
  border-radius: var(--radius-m);
  cursor: pointer;
  text-align: center;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background-color var(--duration-fast) var(--easing-standard);
}

.choose-card:hover {
  border-color: var(--color-brand-primary);
  background: var(--color-brand-selected, var(--color-bg-tertiary));
}

.choose-card__icon {
  font-size: 28px;
  color: var(--color-brand-primary);
}

.choose-card__title {
  font: var(--text-body-1);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.choose-card__desc {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.auth-hint {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  text-align: center;
}
</style>
