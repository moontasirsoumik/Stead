<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import SInput from '@/components/ui/SInput.vue'
import SButton from '@/components/ui/SButton.vue'

const router = useRouter()
const { signUp, error: authError, loading } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordFocused = ref(false)
const agreedToTerms = ref(false)

const openLegal = inject<(doc: 'privacy' | 'terms') => void>('openLegal', () => {})

async function handleSubmit() {
  if (!agreedToTerms.value) return
  const success = await signUp(email.value, password.value, name.value)
  if (success) {
    router.push('/onboarding')
  }
}
</script>

<template>
  <div class="auth-form-content">
    <div class="auth-header">
      <h2 class="auth-title">Create your account</h2>
      <p class="auth-subtitle">Get started with Stead — it's free</p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="input-group">
        <SInput
          v-model="name"
          placeholder="Full name"
          required
        >
          <template #prefix>
            <span class="material-symbols-rounded input-icon">person</span>
          </template>
        </SInput>
      </div>

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
          placeholder="Create a password"
          :hint="passwordFocused ? 'Must be at least 6 characters' : undefined"
          required
          @focus="passwordFocused = true"
          @blur="passwordFocused = false"
        >
          <template #prefix>
            <span class="material-symbols-rounded input-icon">lock</span>
          </template>
        </SInput>
      </div>

      <label class="terms-row">
        <input v-model="agreedToTerms" type="checkbox" class="terms-row__check" />
        <span class="terms-row__text">
          I agree to the
          <button type="button" class="terms-row__link" @click.stop="openLegal('privacy')">Privacy Policy</button>
          and
          <button type="button" class="terms-row__link" @click.stop="openLegal('terms')">Terms of Service</button>
        </span>
      </label>

      <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>

      <SButton :loading="loading" :disabled="!agreedToTerms" type="submit" full-width size="lg">
        Create account
      </SButton>
    </form>

    <p class="auth-footer">
      Already have an account?
      <RouterLink to="/login" class="auth-link">Sign in</RouterLink>
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

.terms-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  cursor: pointer;
  user-select: none;
}

.terms-row__check {
  width: 16px;
  height: 16px;
  accent-color: var(--color-brand-primary);
  cursor: pointer;
  margin: 2px 0 0;
  flex-shrink: 0;
}

.terms-row__text {
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  line-height: 1.5;
}

.terms-row__link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: color var(--duration-fast) var(--easing-standard);
}

.terms-row__link:hover {
  color: var(--color-brand-hover);
  text-decoration: underline;
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
