<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import SInput from '@/components/ui/SInput.vue'
import SButton from '@/components/ui/SButton.vue'

const router = useRouter()
const { createHousehold, user, error: authError } = useAuth()

const householdName = ref('')
const memberName = ref(user.value?.user_metadata?.full_name ?? '')
const loading = ref(false)

const colors = ['#0F6CBD', '#107C10', '#C4314B', '#D48C00', '#8764B8', '#038387', '#CA5010', '#4F6BED']
const selectedColor = ref(colors[0])

async function handleSubmit() {
  loading.value = true
  const success = await createHousehold(householdName.value, memberName.value, selectedColor.value)
  loading.value = false
  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card page-enter" :style="{ '--stagger': 0 }">
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">S</span>
        <h1 class="auth-title">Set up your household</h1>
        <p class="auth-subtitle">Name your household and pick a color for yourself</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
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
  max-width: 360px;
  background: var(--color-surface-card);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-4);
  padding: var(--space-2xl);
  border: 1px solid var(--color-border-subtle);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-xl);
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
  box-shadow: var(--shadow-2);
}
</style>
