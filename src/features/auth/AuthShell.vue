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
    <!-- Forms + door: all in one container for mobile vertical slide -->
    <div class="auth-forms">
      <div class="auth-form-slot auth-form-slot--signup">
        <div class="form-inner">
          <SignupPage />
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

      <div class="auth-form-slot auth-form-slot--login">
        <div class="form-inner">
          <LoginPage />
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
  /*
    Layout: [signup (100dvh−56px)] [door 56px] [login (100dvh−56px)]
    Total = 200dvh − 56px. Viewport = 100dvh.
    Login active:  translateY(-(100dvh − 56px))  → door at top, login below
    Signup active: translateY(0)                  → signup above, door at bottom
  */

  .auth-shell {
    height: 100dvh;
    overflow: hidden;
  }

  /* The track: tall vertical strip that slides */
  .auth-forms {
    display: flex;
    flex-direction: column;
    height: calc(200dvh - 56px);
    /* Default (login): shift up so door sits at top + login fills below */
    transform: translateY(calc(-100dvh + 56px));
    transition: transform 0.95s cubic-bezier(0.22, 0.68, 0.18, 1);
  }

  .auth-shell--signup .auth-forms {
    transform: translateY(0);
  }

  .auth-form-slot {
    width: 100%;
    min-height: 0;
    height: calc(100dvh - 56px);
    flex-shrink: 0;
    padding: var(--space-l);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Signup first in visual order */
  .auth-form-slot--signup {
    order: 0;
  }

  .auth-form-slot--login {
    order: 2;
  }

  .form-inner {
    max-width: 380px;
    width: 100%;
  }

  /* ── Door: inline in the flow, thin bar ── */
  .auth-door {
    position: relative;
    width: 100%;
    height: 56px;
    flex-shrink: 0;
    order: 1;
    top: auto;
    left: auto;
    padding: 0 var(--space-l);
    align-items: center;
    justify-content: flex-start;
    background: linear-gradient(135deg, #49662E 0%, #3a5422 100%);
    z-index: 2;
    transition: background 0.95s cubic-bezier(0.22, 0.68, 0.18, 1);
  }

  .auth-door::before {
    display: none;
  }

  .auth-shell--signup .auth-door {
    transform: none;
    background: linear-gradient(135deg, #2D7A6F 0%, #21605a 100%);
  }

  /* ── Door content: horizontal logo + tagline ── */
  .door-inner {
    flex-direction: row;
    align-items: center;
    gap: var(--space-m);
    max-width: 100%;
    width: 100%;
  }

  .brand-logo {
    width: 34px;
    height: 34px;
    font-size: 15px;
    flex-shrink: 0;
  }

  .brand-name {
    font: var(--text-subtitle-1);
    color: var(--door-fg);
    letter-spacing: var(--tracking-normal);
  }

  /* One-liner divider dot + tagline after the name */
  .brand-name::after {
    content: ' · Your household, organized.';
    font: var(--text-body-2);
    font-weight: var(--font-weight-regular);
    color: var(--door-fg-soft);
  }

  .auth-shell--signup .brand-name::after {
    content: ' · Run your home like it runs itself.';
  }

  .brand-copy,
  .brand-features {
    display: none;
  }

  /* ── Staggered form field entrance ── */
  .auth-form-slot :deep(.auth-header) {
    animation: m-field-in 0.5s var(--easing-spring) 0.1s both;
  }

  .auth-form-slot :deep(.auth-form > :nth-child(1)) {
    animation: m-field-in 0.45s var(--easing-spring) 0.18s both;
  }

  .auth-form-slot :deep(.auth-form > :nth-child(2)) {
    animation: m-field-in 0.45s var(--easing-spring) 0.24s both;
  }

  .auth-form-slot :deep(.auth-form > :nth-child(3)) {
    animation: m-field-in 0.45s var(--easing-spring) 0.3s both;
  }

  .auth-form-slot :deep(.auth-form > :nth-child(4)) {
    animation: m-field-in 0.45s var(--easing-spring) 0.36s both;
  }

  .auth-form-slot :deep(.auth-form > :nth-child(5)) {
    animation: m-field-in 0.45s var(--easing-spring) 0.42s both;
  }

  .auth-form-slot :deep(.auth-form > :nth-child(6)) {
    animation: m-field-in 0.45s var(--easing-spring) 0.48s both;
  }

  .auth-form-slot :deep(.auth-footer) {
    animation: m-field-in 0.45s var(--easing-spring) 0.53s both;
  }
}

/* ── Mobile keyframes ── */
@keyframes m-field-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .auth-form-slot :deep(.auth-header),
  .auth-form-slot :deep(.auth-form > *),
  .auth-form-slot :deep(.auth-footer) {
    animation: none !important;
  }
}
</style>
