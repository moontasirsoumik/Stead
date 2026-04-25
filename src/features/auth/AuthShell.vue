<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import { useRoute } from 'vue-router'
import LoginPage from './LoginPage.vue'
import SignupPage from './SignupPage.vue'
import LegalOverlay from './LegalPage.vue'
import SteadHeroAnimation from '@/components/ui/SteadHeroAnimation.vue'
import SteadLogo from '@/components/ui/SteadLogo.vue'

const route = useRoute()
const isSignup = computed(() => route.name === 'signup')

const legalDoc = ref<'privacy' | 'terms' | null>(null)
const animDone = ref(false)
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
})

function onHeroDone() {
  animDone.value = true
}

function openLegal(doc: 'privacy' | 'terms') {
  legalDoc.value = doc
}

function closeLegal() {
  legalDoc.value = null
}

provide('openLegal', openLegal)
</script>

<template>
  <div :class="['auth-shell', { 'auth-shell--signup': isSignup, 'auth-shell--anim-done': animDone }]">
    <!-- Forms + door: all in one container for mobile vertical slide -->
    <div class="auth-forms">
      <div class="auth-form-slot auth-form-slot--signup">
        <div class="form-inner">
          <SignupPage />
        </div>
      </div>

      <!-- Sliding door (brand panel) -->
      <div :class="['auth-door', { 'auth-door--settled': animDone }]">
        <div class="door-inner">
          <!-- Mobile-only: compact brand bar (visible after animation settles) -->
          <div :class="['mobile-brand', { 'mobile-brand--visible': animDone }]">
            <SteadLogo :size="32" />
            <span class="mobile-brand-name">Stead</span>
            <span class="mobile-brand-tagline">Your household, organized.</span>
          </div>

          <div class="brand-hero">
            <SteadHeroAnimation :mobile="isMobile" @done="onHeroDone" />
          </div>

          <div :class="['brand-copy', { 'brand-copy--visible': animDone }]">
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

          <div :class="['brand-features', { 'brand-features--visible': animDone }]">
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
  align-items: flex-start;
  gap: var(--space-l);
}

.brand-hero {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* Mobile-only brand bar — hidden on desktop/tablet */
.mobile-brand {
  display: none;
}

.brand-copy {
  position: relative;
  min-height: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.brand-copy--visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
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
  min-height: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s,
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
  pointer-events: none;
}

.brand-features--visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
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

  .brand-hero {
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
    Mobile layout:
    Phase 1 (animation): Door is 100dvh, covers entire viewport.
      Forms track offset hides signup above, door fills screen.
    Phase 2 (settled): Door shrinks to 56px, login form slides up.
      Track: [signup 100dvh-56px] [door 56px] [login 100dvh-56px]
  */

  .auth-shell {
    height: 100dvh;
    overflow: hidden;
  }

  /* The track: tall vertical strip that slides */
  .auth-forms {
    display: flex;
    flex-direction: column;
    /*
     * During animation: signup=calc(100dvh-56px), door=100dvh, login=calc(100dvh-56px)
     * Need to skip signup to show door: translateY(-(100dvh - 56px))
     * Door top = viewport top + 56px. Door is 100dvh tall. Close enough.
     * (The 56px gap at top won't show because auth-shell has overflow:hidden
     *  and the door has the same green background as the shell bg we set.)
     */
    transform: translateY(calc(-100dvh + 56px));
    transition: transform 0.95s cubic-bezier(0.22, 0.68, 0.18, 1);
  }

  /*
   * After animation: door=56px. Track is now standard.
   * Same transform value works because door shrank from 100dvh to 56px,
   * eating 100dvh-56px from the track. Now login slot aligns below door.
   */

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

  /* ── Door: starts full-screen for animation, settled state below ── */
  .auth-door::before {
    display: none;
  }

  .auth-shell--signup .auth-door {
    transform: none;
    background: linear-gradient(135deg, #2D7A6F 0%, #21605a 100%);
  }

  /* ── Door content: centered during animation, row when settled ── */
  .door-inner {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-m);
    max-width: 100%;
    width: 100%;
    height: 100%;
    transition: all 0.6s ease;
  }

  .auth-door--settled .door-inner {
    flex-direction: row;
    justify-content: flex-start;
    height: auto;
  }

  .brand-copy,
  .brand-features {
    display: none;
  }

  /* ── Mobile brand bar: hidden until door settles ── */
  .mobile-brand {
    display: flex;
    align-items: center;
    gap: var(--space-s);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    pointer-events: none;
  }

  .mobile-brand--visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .mobile-brand-name {
    font-size: 15px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    line-height: 1;
    white-space: nowrap;
  }

  .mobile-brand-tagline {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1;
    white-space: nowrap;
  }

  /* Dot separator between name and tagline */
  .mobile-brand-name::after {
    content: ' ·';
    color: rgba(255, 255, 255, 0.4);
  }

  /* ── Door: starts full-screen, shrinks to 56px bar after animation ── */
  .auth-door {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    height: 100dvh;
    flex-shrink: 0;
    order: 1;
    padding: 0 var(--space-l);
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #49662E 0%, #3a5422 100%);
    z-index: 2;
    transition: height 0.8s cubic-bezier(0.22, 0.68, 0.18, 1);
    will-change: height;
    overflow: hidden;
  }

  .auth-door--settled {
    height: 56px;
  }

  /* Hide animation content once door is fully settled */
  .auth-door--settled .brand-hero {
    opacity: 0;
    pointer-events: none;
    position: absolute;
    transition: none; /* Instant — prevent visible jump when pulled from flex flow */
  }

  .brand-hero {
    display: flex !important;
    transition: opacity 0.3s ease;
    /* Allow animation to overflow within the full-screen door */
    overflow: visible;
  }

  .brand-hero :deep(.hero-container) {
    height: 220px; /* Full scene height on mobile so 3D house isn't clipped */
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
