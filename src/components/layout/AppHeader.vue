<script setup lang="ts">
import SIconButton from '@/components/ui/SIconButton.vue'
import SAvatar from '@/components/ui/SAvatar.vue'

defineEmits<{
  'toggle-nav': []
}>()
</script>

<template>
  <header class="header">
    <div class="header__left">
      <SIconButton label="Toggle navigation" class="header__menu-btn" @click="$emit('toggle-nav')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </SIconButton>

      <RouterLink to="/" class="header__brand">
        <span class="header__logo" aria-hidden="true">S</span>
        <span class="header__title">Stead</span>
      </RouterLink>
    </div>

    <div class="header__right">
      <SIconButton label="Notifications">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C7.24 2 5 4.24 5 7V11L3 13V14H17V13L15 11V7C15 4.24 12.76 2 10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M8 14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </SIconButton>

      <button class="header__user" aria-label="User menu">
        <SAvatar name="User" size="sm" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--height-header);
  padding: 0 var(--space-l);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border-subtle);
}

.header__left {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}

.header__menu-btn {
  display: none;
}

@media (max-width: 1024px) {
  .header__menu-btn {
    display: inline-flex;
  }
}

.header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-brand-primary);
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  border-radius: var(--radius-m);
}

.header__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.header__right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.header__user {
  display: flex;
  align-items: center;
  padding: var(--space-2xs);
  border-radius: var(--radius-circle);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.header__user:hover {
  background: var(--color-bg-tertiary);
}
</style>
