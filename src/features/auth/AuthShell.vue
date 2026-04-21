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
/* ── Shell: relative container, full viewport ── */
.auth-shell {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
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
  background: var(--color-brand-primary);
  padding: var(--space-2xl);
  z-index: 2;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  overflow: hidden;
}

.auth-door::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 80%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
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
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-m);
  color: #fff;
  font-weight: var(--font-weight-bold);
  font-size: 18px;
  font-family: var(--font-family);
}

.brand-name {
  font: var(--text-title-2);
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: var(--tracking-wide);
}

.brand-copy {
  position: relative;
  min-height: 120px;
  overflow: hidden;
}

.brand-headline {
  font: var(--text-display);
  color: #fff;
  margin: 0 0 var(--space-m);
  letter-spacing: var(--tracking-tight);
  line-height: 1.15;
}

.brand-sub {
  font: var(--text-body-1);
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
  max-width: 340px;
}

.brand-features {
  position: relative;
  padding-top: var(--space-m);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  color: rgba(255, 255, 255, 0.45);
}

.brand-feature-text {
  font: var(--text-body-2);
  color: rgba(255, 255, 255, 0.55);
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
