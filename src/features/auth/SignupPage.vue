<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import SInput from '@/components/ui/SInput.vue'
import SButton from '@/components/ui/SButton.vue'

const router = useRouter()
const { signUp, error: authError, loading } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')

async function handleSubmit() {
  const success = await signUp(email.value, password.value, name.value)
  if (success) {
    router.push('/onboarding')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card page-enter" :style="{ '--stagger': 0 }">
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">S</span>
        <h1 class="auth-title">Create your account</h1>
        <p class="auth-subtitle">Start managing your household with Stead</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <SInput
          v-model="name"
          label="Full name"
          placeholder="Your name"
          required
        />

        <SInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
        />

        <SInput
          v-model="password"
          label="Password"
          type="password"
          placeholder="Create a password"
          hint="Must be at least 6 characters"
          required
        />

        <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>

        <SButton :loading="loading" type="submit" full-width size="lg">
          Create account
        </SButton>
      </form>

      <p class="auth-footer">
        Already have an account?
        <RouterLink to="/login" class="auth-link">Sign in</RouterLink>
      </p>
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
  padding: var(--space-2xl);
  border: 1px solid var(--color-border-default);
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

.auth-footer {
  text-align: center;
  margin-top: var(--space-l);
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
}

.auth-link {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-semibold);
  transition: color var(--duration-fast) var(--easing-standard);
}

.auth-link:hover {
  color: var(--color-brand-hover);
}
</style>
