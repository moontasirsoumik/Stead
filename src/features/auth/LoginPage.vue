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
const rememberMe = ref(false)

async function handleSubmit() {
  const success = await signIn(email.value, password.value, rememberMe.value)
  if (success) {
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="auth-form-content">
    <div class="auth-header">
      <h2 class="auth-title">Welcome back</h2>
      <p class="auth-subtitle">Sign in to continue to Stead</p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="input-group">
        <SInput
          v-model="email"
          type="email"
          placeholder="Email address"
          required
        >
          <template #prefix>
            <span class="material-symbols-rounded input-icon">mail</span>
          </template>
        </SInput>
      </div>

      <div class="input-group">
        <SInput
          v-model="password"
          type="password"
          placeholder="Password"
          required
        >
          <template #prefix>
            <span class="material-symbols-rounded input-icon">lock</span>
          </template>
        </SInput>
      </div>

      <label class="remember-row">
        <input v-model="rememberMe" type="checkbox" class="remember-row__check" />
        <span class="remember-row__text">Keep me signed in</span>
      </label>

      <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>

      <SButton :loading="loading" type="submit" full-width size="lg">
        Sign in
      </SButton>
    </form>

    <p class="auth-footer">
      Don't have an account?
      <RouterLink to="/signup" class="auth-link">Create one</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth-form-content {
  width: 100%;
}

.auth-header {
  margin-bottom: var(--space-xl);
}

.auth-title {
  font: var(--text-title-1);
  color: var(--color-fg-primary);
  margin-bottom: var(--space-2xs);
  letter-spacing: var(--tracking-tight);
}

.auth-subtitle {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
}

/* ── Form ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.input-icon {
  font-size: 20px;
  color: var(--color-fg-tertiary);
}

.input-group :deep(.sinput__wrapper) {
  height: 48px;
  border-radius: var(--radius-l);
  background: var(--color-bg-primary);
  border-color: var(--color-border-default);
}

.input-group :deep(.sinput__wrapper:focus-within) {
  border-color: var(--color-brand-primary);
  background: var(--color-bg-primary);
}

.input-group :deep(.sinput__field) {
  font: var(--text-body-1);
}

.input-group :deep(.sinput__field::placeholder) {
  color: var(--color-fg-tertiary);
}

.remember-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  user-select: none;
}

.remember-row__check {
  width: 16px;
  height: 16px;
  accent-color: var(--color-brand-primary);
  cursor: pointer;
  margin: 0;
}

.remember-row__text {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
}

.auth-error {
  font: var(--text-body-2);
  color: var(--color-error);
  background: var(--color-error-bg);
  padding: var(--space-xs) var(--space-m);
  border-radius: var(--radius-s);
}

/* ── Footer ── */
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
