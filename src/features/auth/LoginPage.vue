<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import SInput from '@/components/ui/SInput.vue'
import SButton from '@/components/ui/SButton.vue'

const router = useRouter()
const route = useRoute()
const { signIn, error: authError, loading } = useAuth()

const email = ref('')
const password = ref('')

async function handleSubmit() {
  const success = await signIn(email.value, password.value)
  if (success) {
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card page-enter" :style="{ '--stagger': 0 }">
      <div class="auth-header">
        <span class="auth-logo" aria-hidden="true">S</span>
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-subtitle">Sign in to your Stead account</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
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
          placeholder="Enter your password"
          required
        />

        <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>

        <SButton :loading="loading" type="submit" full-width size="lg">
          Sign in
        </SButton>
      </form>

      <p class="auth-footer">
        Don't have an account?
        <RouterLink to="/signup" class="auth-link">Sign up</RouterLink>
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
  max-width: 400px;
  background: var(--color-surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-8);
  padding: var(--space-3xl);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-semibold);
  font-size: 22px;
  border-radius: var(--radius-l);
  margin-bottom: var(--space-l);
}

.auth-title {
  font: var(--text-title-1);
  color: var(--color-fg-primary);
  margin-bottom: var(--space-xs);
}

.auth-subtitle {
  font: var(--text-body-1);
  color: var(--color-fg-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.auth-error {
  font: var(--text-body-2);
  color: var(--color-error);
  background: var(--color-error-bg);
  padding: var(--space-s) var(--space-m);
  border-radius: var(--radius-m);
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-xl);
  font: var(--text-body-1);
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
