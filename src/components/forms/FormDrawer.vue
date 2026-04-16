<script setup lang="ts">
import SButton from '@/components/ui/SButton.vue'
import SIconButton from '@/components/ui/SIconButton.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    submitLabel?: string
    loading?: boolean
    wide?: boolean
  }>(),
  {
    submitLabel: 'Save',
    loading: false,
    wide: false,
  },
)

defineEmits<{
  close: []
  submit: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-overlay" @click.self="$emit('close')">
        <aside
          :class="['drawer', { 'drawer--wide': wide }]"
          role="dialog"
          :aria-label="title"
          aria-modal="true"
        >
          <div class="drawer__header">
            <h2 class="drawer__title">{{ title }}</h2>
            <SIconButton label="Close" size="sm" @click="$emit('close')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </SIconButton>
          </div>

          <div class="drawer__body">
            <slot />
          </div>

          <div class="drawer__footer">
            <SButton variant="secondary" @click="$emit('close')">Cancel</SButton>
            <SButton :loading="loading" @click="$emit('submit')">
              {{ submitLabel }}
            </SButton>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  background: var(--color-bg-overlay);
}

.drawer {
  display: flex;
  flex-direction: column;
  width: var(--width-drawer);
  max-width: 100vw;
  height: 100%;
  background: var(--color-surface-dialog);
  box-shadow: var(--shadow-28);
}

.drawer--wide {
  width: 580px;
}

.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-l) var(--space-xl);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.drawer__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-xl);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-s);
  padding: var(--space-l) var(--space-xl);
  border-top: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.drawer-enter-active {
  transition: opacity var(--duration-normal) var(--easing-decelerate);
}

.drawer-enter-active .drawer {
  transition: transform var(--duration-normal) var(--easing-decelerate);
}

.drawer-leave-active {
  transition: opacity var(--duration-fast) var(--easing-accelerate);
}

.drawer-leave-active .drawer {
  transition: transform var(--duration-fast) var(--easing-accelerate);
}

.drawer-enter-from {
  opacity: 0;
}

.drawer-enter-from .drawer {
  transform: translateX(100%);
}

.drawer-leave-to {
  opacity: 0;
}

.drawer-leave-to .drawer {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .drawer {
    width: 100vw;
  }
}
</style>
