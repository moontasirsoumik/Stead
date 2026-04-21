<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoginPage from './LoginPage.vue'
import SignupPage from './SignupPage.vue'
import LegalOverlay from './LegalPage.vue'

const route = useRoute()
const isSignup = computed(() => route.name === 'signup')

const legalDoc = ref<'privacy' | 'terms' | null>(null)

function openLegal(doc: 'privacy' | 'terms') {
  legalDoc.value = doc
}

function closeLegal() {
  legalDoc.value = null
}

provide('openLegal', openLegal)
</script>

<template>
  <div :class="['auth-shell', { 'auth-shell--signup': isSignup }]">
    <!-- Both forms sit side by side behind the door -->
    <div class="auth-forms">
      <div class="auth-form-slot auth-form-slot--signup">
        <div class="form-inner">
          <div class="mobile-brand">
            <div class="mobile-logo">S</div>
          </div>
          <SignupPage />
        </div>
      </div>
      <div class="auth-form-slot auth-form-slot--login">
        <div class="form-inner">
          <div class="mobile-brand">
            <div class="mobile-logo">S</div>
          </div>
          <LoginPage />
        </div>
      </div>
    </div>

    <!-- Sliding door (brand panel) -->
    <div class="auth-door">
      <div class="door-inner">
        <div class="brand-top">
          <div class="brand-logo">S</div>
          <span class="brand-name">Stead</span>
        </div>

        <div class="brand-copy">
          <Transition :name="isSignup ? 'slide-left' : 'slide-right'">
            <div v-if="!isSignup" key="login">
              <h1 class="brand-headline">Your household,<br />beautifully organized.</h1>
              <p class="brand-sub">Tasks, finances, calendars, journals — everything your home needs, in one place.</p>
            </div>
            <div v-else key="signup">
              <h1 class="brand-headline">Run your home<br />like it runs itself.</h1>
              <p class="brand-sub">Tasks, budgets, calendars, and more — one calm place for your entire household.</p>
            </div>
          </Transition>
        </div>

        <div class="brand-features">
          <Transition :name="isSignup ? 'slide-left' : 'slide-right'">
            <div v-if="!isSignup" key="login-feats" class="brand-feature-list">
              <div class="brand-feature">
                <span class="material-symbols-rounded brand-feature-icon">lock</span>
                <span class="brand-feature-text">Private by default</span>
              </div>
              <div class="brand-feature">
                <span class="material-symbols-rounded brand-feature-icon">cloud_off</span>
                <span class="brand-feature-text">Works offline</span>
              </div>
              <div class="brand-feature">
                <span class="material-symbols-rounded brand-feature-icon">group</span>
                <span class="brand-feature-text">Built for families</span>
              </div>
            </div>
            <div v-else key="signup-feats" class="brand-feature-list">
              <div class="brand-feature">
                <span class="material-symbols-rounded brand-feature-icon">schedule</span>
                <span class="brand-feature-text">Set up in 2 minutes</span>
              </div>
              <div class="brand-feature">
                <span class="material-symbols-rounded brand-feature-icon">devices</span>
                <span class="brand-feature-text">Access anywhere</span>
              </div>
              <div class="brand-feature">
                <span class="material-symbols-rounded brand-feature-icon">shield</span>
                <span class="brand-feature-text">Your data stays yours</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    <!-- Legal overlay -->
    <LegalOverlay v-if="legalDoc" :doc="legalDoc" @close="closeLegal" @switch-doc="openLegal" />
  </div>
</template>

<style scoped>
/* ── Shell: always light — no dark mode on the auth page whatsoever ──
   Declaring all semantic tokens here as their light-mode values means every
   child component inherits light values regardless of what :root[data-theme='dark']
   sets. CSS custom properties resolve at the nearest ancestor that defines them. */
.auth-shell {
  color-scheme: light;

  /* Backgrounds */
  --color-bg-primary: #FAFAF8;
  --color-bg-secondary: #F4F4F2;
  --color-bg-tertiary: #EDEDEB;
  --color-bg-elevated: #FFFFFF;
  --color-bg-wash: #F7F7F5;
  --color-bg-overlay: rgba(0, 0, 0, 0.40);

  /* Foreground */
  --color-fg-primary: #1A1D26;
  --color-fg-secondary: #555968;
  --color-fg-tertiary: #787D8C;
  --color-fg-disabled: #A8ABB4;
  --color-fg-on-brand: #FFFFFF;
  --color-fg-muted: #9498A4;

  /* Borders */
  --color-border-default: #E2E3E6;
  --color-border-strong: #CDCED4;
  --color-border-subtle: #EDEDEB;
  --color-border-input: #D2D3D9;
  --color-border-input-hover: #B5B7C0;

  /* Surfaces */
  --color-surface-card: #F4F4F2;
  --color-surface-card-hover: #EDEDEB;
  --color-surface-dialog: #FFFFFF;
  --color-surface-input: #F2F2F0;
  --color-surface-input-hover: #EAEAE8;

  /* Outline */
  --color-outline: #737888;
  --color-outline-variant: #C8CAD0;

  /* Status */
  --color-error: #A04040;
  --color-error-bg: #FDEEEE;
  --color-error-fg: #813232;
  --color-success: #3B7A52;
  --color-success-bg: #EEF6F0;
  --color-success-fg: #2E6140;
  --color-warning: #8A6D1B;
  --color-warning-bg: #FDF6E7;
  --color-warning-fg: #6E5614;
  --color-info: #3A6C9E;
  --color-info-bg: #EDF4FB;

  /* Brand tokens — login state (household green) */
  --color-brand-primary: #49662E;
  --color-brand-hover: #3D5726;
  --color-brand-pressed: #324A1E;
  --color-brand-selected: #EFF5EA;
  --color-brand-subtle: #DEE9D4;
  --color-primary-container: #DEE9D4;
  --color-on-primary-container: #2A3D1A;
  --color-border-brand: #49662E;

  /* Door text — always white on saturated brand bg */
  --door-fg: #fff;
  --door-fg-muted: rgba(255, 255, 255, 0.7);
  --door-fg-soft: rgba(255, 255, 255, 0.55);
  --door-logo-bg: rgba(255, 255, 255, 0.15);
  --door-border: rgba(255, 255, 255, 0.2);
  --door-divider: rgba(255, 255, 255, 0.1);
  --door-glow: rgba(255, 255, 255, 0.06);
  --door-glow-soft: rgba(255, 255, 255, 0.04);

  position: relative;
  min-height: 100dvh;
  overflow: hidden;
}

/* Signup state — switch to personal teal across the whole shell */
.auth-shell--signup {
  --color-brand-primary: #2D7A6F;
  --color-brand-hover: #24665D;
  --color-brand-pressed: #1C544C;
  --color-brand-selected: #E8F5F2;
  --color-brand-subtle: #CEEAE4;
  --color-primary-container: #CEEAE4;
  --color-on-primary-container: #1A3430;
  --color-border-brand: #2D7A6F;
}

/* ── Forms layer: two halves side by side, always visible behind the door ── */
.auth-forms {
  display: flex;
  min-height: 100dvh;
}

.auth-form-slot {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  background: var(--color-bg-primary);
}

.form-inner {
  width: 100%;
  max-width: 380px;
}

.mobile-brand {
  display: none;
}

/* ── Sliding door: absolutely positioned, 50% wide, slides left↔right ── */
.auth-door {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #49662E;
  padding: var(--space-2xl);
  z-index: 2;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  overflow: hidden;
}

.auth-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 80%, var(--door-glow) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, var(--door-glow-soft) 0%, transparent 50%);
  pointer-events: none;
}

/* Default: door starts on left, covering signup form → login form visible on right */
.auth-door {
  left: 0;
  right: auto;
  transform: translateX(0);
}

/* Signup: door slides right, covering login form → signup form visible on left */
.auth-shell--signup .auth-door {
  transform: translateX(100%);
  background-color: #2D7A6F;
}

/* ── Door content ── */
.door-inner {
  position: relative;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.brand-top {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--door-logo-bg);
  border: 1px solid var(--door-border);
  border-radius: var(--radius-m);
  color: var(--door-fg);
  font-weight: var(--font-weight-bold);
  font-size: 18px;
  font-family: var(--font-family);
}

.brand-name {
  font: var(--text-title-2);
  color: var(--door-fg-muted);
  letter-spacing: var(--tracking-wide);
}

.brand-copy {
  position: relative;
  min-height: 120px;
  overflow: hidden;
}

.brand-headline {
  font: var(--text-display);
  color: var(--door-fg);
  margin: 0 0 var(--space-m);
  letter-spacing: var(--tracking-tight);
  line-height: 1.15;
}

.brand-sub {
  font: var(--text-body-1);
  color: var(--door-fg-soft);
  line-height: 1.6;
  max-width: 340px;
}

.brand-features {
  position: relative;
  padding-top: var(--space-m);
  border-top: 1px solid var(--door-divider);
  min-height: 100px;
  overflow: hidden;
}

.brand-feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.brand-feature {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.brand-feature-icon {
  font-size: 18px;
  color: var(--door-fg-soft);
}

.brand-feature-text {
  font: var(--text-body-2);
  color: var(--door-fg-soft);
}

/* ── Brand text transitions (simultaneous horizontal slide) ── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  width: 100%;
}

/* Slide left: old exits left, new enters from right (login → signup) */
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

/* Slide right: old exits right, new enters from left (signup → login) */
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

/* ── Responsive: Tablet ── */
@media (max-width: 900px) {
  .auth-forms {
    flex-direction: column;
  }

  .auth-form-slot {
    width: 100%;
    min-height: 100dvh;
    padding: var(--space-xl);
  }

  .auth-door {
    width: 100%;
    height: 50%;
    top: 0;
    left: 0;
    transform: translateY(0);
    transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .auth-shell--signup .auth-door {
    transform: translateY(100%);
  }

  .brand-headline {
    font: var(--text-title-1);
    line-height: 1.25;
  }

  .brand-sub {
    display: none;
  }

  .brand-features {
    min-height: auto;
  }

  .brand-feature-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-m);
  }
}

/* ── Responsive: Mobile ── */
@media (max-width: 640px) {
  .auth-door {
    display: none;
  }

  .auth-forms {
    flex-direction: column;
  }

  .auth-form-slot {
    width: 100%;
    min-height: 100dvh;
    padding: var(--space-xl) var(--space-l);
    align-items: center;
    justify-content: center;
  }

  .form-inner {
    max-width: 400px;
  }

  /* Show only the active form — with entry animation */
  .auth-form-slot--signup {
    display: none;
  }

  .auth-shell--signup .auth-form-slot--login {
    display: none;
  }

  .auth-shell--signup .auth-form-slot--signup {
    display: flex;
  }

  .auth-form-slot--login,
  .auth-shell--signup .auth-form-slot--signup {
    animation: mobile-form-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .mobile-brand {
    display: flex;
    margin-bottom: var(--space-xl);
  }

  .mobile-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: var(--color-brand-primary);
    color: var(--color-fg-on-brand);
    font-weight: var(--font-weight-bold);
    font-size: 20px;
    font-family: var(--font-family);
    border-radius: var(--radius-m);
  }
}

@keyframes mobile-form-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
