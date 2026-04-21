<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  doc: 'privacy' | 'terms'
}>()

const emit = defineEmits<{
  close: []
  'switch-doc': [doc: 'privacy' | 'terms']
}>()

const isPrivacy = computed(() => props.doc === 'privacy')
const isTerms = computed(() => props.doc === 'terms')

const visible = ref(false)

function requestClose() {
  visible.value = false
}

function afterLeave() {
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') requestClose()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  // Trigger enter on next frame
  requestAnimationFrame(() => { visible.value = true })
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Transition name="overlay" @after-leave="afterLeave">
    <div v-if="visible" class="legal-overlay" @click.self="requestClose">
      <div class="legal-panel">
        <header class="legal-header">
          <div class="legal-header__left">
            <div class="legal-logo">S</div>
            <span class="legal-brand-name">Stead</span>
          </div>
          <button class="legal-close" @click="requestClose" aria-label="Close">
            <span class="material-symbols-rounded">close</span>
          </button>
        </header>

        <main class="legal-content">
        <!-- Privacy Policy -->
        <template v-if="isPrivacy">
          <h1 class="legal-title">Privacy Policy</h1>
          <p class="legal-updated">Last updated: April 21, 2026</p>

          <section class="legal-section">
            <h2>1. Introduction</h2>
            <p>Stead ("we", "us", "our") operates the Stead household management application (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using Stead, you consent to the practices described in this policy.</p>
          </section>

          <section class="legal-section">
            <h2>2. Information We Collect</h2>
            <p><strong>Account Information.</strong> When you create an account, we collect your email address and password (stored as a cryptographic hash — we never store plaintext passwords). You may optionally provide your name, date of birth, phone number, and timezone.</p>
            <p><strong>Household Data.</strong> All content you create within Stead — including tasks, expenses, journal entries, calendar events, notes, contacts, documents, and other household information — is stored in our database and associated with your household.</p>
            <p><strong>Device and Usage Data.</strong> If you opt in to usage analytics, we collect anonymous, aggregated data about how the Service is used (e.g., feature usage frequency, page views). This data cannot be used to identify you personally. We do not collect IP addresses, device fingerprints, or location data for analytics purposes.</p>
            <p><strong>Local Cache.</strong> If you enable local caching, a copy of your household data is stored in your browser's IndexedDB storage on your device. This data never leaves your device and is solely used to enable offline access and improve performance.</p>
          </section>

          <section class="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and maintain the Service</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Enforce household-level access controls and data isolation</li>
              <li>Improve and optimize the Service (only with anonymous analytics data, when you have opted in)</li>
              <li>Communicate with you regarding account security, service updates, or support</li>
            </ul>
            <p>We do <strong>not</strong> use your data for advertising, profiling, automated decision-making, or any purpose unrelated to operating the Service.</p>
          </section>

          <section class="legal-section">
            <h2>4. Data Storage and Security</h2>
            <p>Your data is stored on Supabase-managed PostgreSQL databases with infrastructure hosted by Amazon Web Services (AWS). All data is encrypted in transit using TLS 1.2 or higher. At rest, data is encrypted using AES-256 encryption.</p>
            <p>Row Level Security (RLS) is enforced at the database level, ensuring that every query is scoped to your household. No user can access data belonging to another household, even in the event of an application-level vulnerability.</p>
            <p>Authentication is handled via industry-standard JSON Web Tokens (JWT) issued by Supabase Auth. Passwords are hashed using bcrypt with a minimum cost factor of 10.</p>
          </section>

          <section class="legal-section">
            <h2>5. Data Sharing and Disclosure</h2>
            <p>We do <strong>not</strong> sell, rent, license, or trade your personal information to any third party for any reason.</p>
            <p>We may share data only in the following limited circumstances:</p>
            <ul>
              <li><strong>Infrastructure Providers.</strong> Supabase (database hosting) and Cloudflare (content delivery and DDoS protection) process your data as part of service delivery. These providers are bound by their own privacy policies and data processing agreements.</li>
              <li><strong>Legal Requirements.</strong> We may disclose information if required to do so by law, court order, or governmental regulation, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
              <li><strong>Household Members.</strong> Data you mark as "household" scope is visible to all members of your household. Data you mark as "personal" scope is visible only to you, unless you explicitly share it with specific members.</li>
            </ul>
          </section>

          <section class="legal-section">
            <h2>6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, all associated personal data and household data (where you are the sole owner) will be permanently deleted within 30 days. Shared household data will be retained for remaining household members.</p>
            <p>Anonymized analytics data (if previously collected with your consent) may be retained indefinitely as it cannot be traced back to any individual.</p>
          </section>

          <section class="legal-section">
            <h2>7. Cookies and Tracking</h2>
            <p>Stead does <strong>not</strong> use cookies for tracking or advertising. We use a single authentication token stored in your browser's local storage solely to maintain your login session. No third-party tracking scripts, pixels, or beacons are loaded by the Service.</p>
          </section>

          <section class="legal-section">
            <h2>8. Children's Privacy</h2>
            <p>Stead is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will delete it.</p>
          </section>

          <section class="legal-section">
            <h2>9. International Data Transfers</h2>
            <p>Your data may be processed in countries outside your country of residence, including the United States, where our infrastructure providers operate. We ensure that any such transfer is protected by appropriate safeguards, including standard contractual clauses where applicable.</p>
          </section>

          <section class="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy within the Service and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.</p>
          </section>
        </template>

        <!-- Terms of Service -->
        <template v-else-if="isTerms">
          <h1 class="legal-title">Terms of Service</h1>
          <p class="legal-updated">Last updated: April 21, 2026</p>

          <section class="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using Stead ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must not use the Service. These Terms constitute a legally binding agreement between you and Stead.</p>
          </section>

          <section class="legal-section">
            <h2>2. Description of Service</h2>
            <p>Stead is a household management application that allows users to organize tasks, expenses, calendars, journals, and other household-related information. The Service is provided as a web application accessible via modern web browsers.</p>
          </section>

          <section class="legal-section">
            <h2>3. Accounts and Households</h2>
            <p>To use the Service, you must create an account with a valid email address and password. You are responsible for maintaining the confidentiality of your credentials and for all activities conducted under your account.</p>
            <p>Each account is associated with one household. Household administrators may invite other users to join. You are responsible for ensuring that all members of your household comply with these Terms.</p>
          </section>

          <section class="legal-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
              <li>Attempt to gain unauthorized access to any part of the Service, other user accounts, or associated systems</li>
              <li>Transmit malware, viruses, or any other malicious code</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated scripts, bots, or scrapers to access the Service</li>
              <li>Impersonate another person or misrepresent your affiliation with any entity</li>
            </ul>
          </section>

          <section class="legal-section">
            <h2>5. Intellectual Property</h2>
            <p>The Service, including its design, code, logos, and documentation, is owned by Stead and protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose.</p>
            <p>You retain full ownership of all content you create within the Service. We do not claim any intellectual property rights over your household data.</p>
          </section>

          <section class="legal-section">
            <h2>6. Data and Privacy</h2>
            <p>Your use of the Service is also governed by our <button type="button" class="legal-link-btn" @click="emit('switch-doc', 'privacy')">Privacy Policy</button>, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.</p>
          </section>

          <section class="legal-section">
            <h2>7. Service Availability</h2>
            <p>We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may suspend or discontinue the Service (or any part thereof) at any time for maintenance, updates, or other operational reasons. We will make reasonable efforts to provide advance notice of planned downtime.</p>
          </section>

          <section class="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, STEAD AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, REGARDLESS OF THE THEORY OF LIABILITY.</p>
            <p>Our total aggregate liability for any claims arising from or related to the Service shall not exceed the amount you have paid us (if any) in the twelve (12) months preceding the claim.</p>
          </section>

          <section class="legal-section">
            <h2>9. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          </section>

          <section class="legal-section">
            <h2>10. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Stead and its operators from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your violation of these Terms or misuse of the Service.</p>
          </section>

          <section class="legal-section">
            <h2>11. Termination</h2>
            <p>We may suspend or terminate your access to the Service at any time if you violate these Terms, with or without prior notice. Upon termination, your right to use the Service ceases immediately. You may delete your account at any time through your Account settings.</p>
          </section>

          <section class="legal-section">
            <h2>12. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Stead operates, without regard to conflict-of-law principles. Any disputes arising from these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.</p>
          </section>

          <section class="legal-section">
            <h2>13. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated through the Service. Your continued use after such changes constitutes acceptance of the updated Terms.</p>
          </section>
        </template>

        <!-- Fallback -->
        <template v-else>
          <h1 class="legal-title">Document not found</h1>
          <p>The legal document you're looking for doesn't exist.</p>
        </template>
      </main>
    </div>
  </div>
  </Transition>
</template>

<style scoped>
/* ── Overlay backdrop ── */
.legal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: var(--space-xl);
}

/* ── Panel ── */
.legal-panel {
  width: 100%;
  max-width: 680px;
  max-height: 85dvh;
  background: var(--color-bg-primary);
  border-radius: var(--radius-l);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header ── */
.legal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-m) var(--space-l);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.legal-header__left {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.legal-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-bold);
  font-size: 12px;
  font-family: var(--font-family);
  border-radius: var(--radius-s);
}

.legal-brand-name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-wide);
}

.legal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-s);
  color: var(--color-fg-secondary);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard);
}

.legal-close:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-fg-primary);
}

.legal-close .material-symbols-rounded {
  font-size: 20px;
}

/* ── Scrollable content ── */
.legal-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-l) var(--space-xl) var(--space-xl);
  overscroll-behavior: contain;
}

.legal-title {
  font: var(--text-title-1);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
  margin-bottom: var(--space-2xs);
}

.legal-updated {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-bottom: var(--space-xl);
}

.legal-section {
  margin-bottom: var(--space-l);
}

.legal-section h2 {
  font: var(--text-title-2);
  color: var(--color-fg-primary);
  margin-bottom: var(--space-s);
}

.legal-section p {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-s);
}

.legal-section p:last-child {
  margin-bottom: 0;
}

.legal-section ul {
  padding-left: var(--space-l);
  margin-bottom: var(--space-s);
}

.legal-section li {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-xs);
}

.legal-section li:last-child {
  margin-bottom: 0;
}

.legal-section a {
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: color var(--duration-fast) var(--easing-standard);
}

.legal-section a:hover {
  color: var(--color-brand-hover);
  text-decoration: underline;
}

.legal-section strong {
  font-weight: var(--font-weight-semibold);
  color: var(--color-fg-primary);
}

.legal-link-btn {
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

.legal-link-btn:hover {
  color: var(--color-brand-hover);
  text-decoration: underline;
}

/* ── Overlay enter/leave transitions ── */
.overlay-enter-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.overlay-leave-active {
  transition: opacity 0.22s ease-in;
}

.overlay-enter-active .legal-panel {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.overlay-leave-active .legal-panel {
  transition: transform 0.22s ease-in,
    opacity 0.18s ease-in;
}

.overlay-enter-from {
  opacity: 0;
}

.overlay-enter-from .legal-panel {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}

.overlay-leave-to {
  opacity: 0;
}

.overlay-leave-to .legal-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .legal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .legal-panel {
    max-width: none;
    max-height: 92dvh;
    border-radius: var(--radius-l) var(--radius-l) 0 0;
  }

  .legal-content {
    padding: var(--space-m) var(--space-l) var(--space-xl);
  }

  .legal-title {
    font: var(--text-title-2);
  }

  /* Mobile: slide up from bottom */
  .overlay-enter-from .legal-panel {
    opacity: 1;
    transform: translateY(100%);
  }

  .overlay-enter-active .legal-panel {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .overlay-leave-to .legal-panel {
    opacity: 1;
    transform: translateY(100%);
  }

  .overlay-leave-active .legal-panel {
    transition: transform 0.3s ease-in,
      opacity 0.3s ease-in;
  }
}
</style>
