<script setup lang="ts">
import { useToastStore, type ToastTone } from '@/stores/toast.store'

const toastStore = useToastStore()

const icons: Record<ToastTone, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-viewport" aria-live="polite" aria-relevant="additions">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.tone}`]"
          role="status"
        >
          <span class="toast__icon material-symbols-rounded" aria-hidden="true">{{ icons[toast.tone] }}</span>
          <div class="toast__copy">
            <strong class="toast__title">{{ toast.title }}</strong>
            <span v-if="toast.message" class="toast__message">{{ toast.message }}</span>
          </div>
          <button class="toast__close" type="button" aria-label="Dismiss" @click="toastStore.dismiss(toast.id)">
            <span class="material-symbols-rounded" aria-hidden="true">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-viewport {
  position: fixed;
  right: var(--space-l);
  bottom: var(--space-l);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: min(360px, calc(100vw - var(--space-l) * 2));
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: grid;
  grid-template-columns: 22px 1fr 28px;
  align-items: start;
  gap: var(--space-s);
  padding: var(--space-m);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-m);
  background: var(--color-surface-dialog);
  box-shadow: var(--shadow-dialog);
  color: var(--color-fg-primary);
}

.toast__icon {
  font-size: 21px;
  line-height: 1;
}

.toast__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast__title {
  font: var(--text-label-lg);
  color: var(--color-fg-primary);
}

.toast__message {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.toast__close {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--color-fg-tertiary);
  cursor: pointer;
}

.toast__close:hover {
  background: var(--color-surface-container-low);
  color: var(--color-fg-primary);
}

.toast__close .material-symbols-rounded {
  font-size: 17px;
}

.toast--success .toast__icon { color: var(--color-success); }
.toast--error .toast__icon { color: var(--color-error); }
.toast--warning .toast__icon { color: var(--color-warning); }
.toast--info .toast__icon { color: var(--color-brand-primary); }

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-normal) var(--easing-out),
    transform var(--duration-normal) var(--easing-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.toast-move {
  transition: transform var(--duration-normal) var(--easing-out);
}

@media (max-width: 640px) {
  .toast-viewport {
    right: var(--space-s);
    bottom: calc(var(--space-s) + 68px);
    width: calc(100vw - var(--space-s) * 2);
  }
}
</style>
