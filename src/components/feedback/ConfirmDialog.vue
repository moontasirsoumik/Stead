<script setup lang="ts">
import { ref } from 'vue'
import SButton from '@/components/ui/SButton.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'danger'
  }>(),
  {
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const loading = ref(false)

async function handleConfirm() {
  loading.value = true
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-overlay" @click.self="emit('cancel')">
        <div
          class="dialog"
          role="alertdialog"
          :aria-label="title"
          aria-modal="true"
        >
          <h2 class="dialog__title">{{ title }}</h2>
          <p class="dialog__message">{{ message }}</p>

          <div class="dialog__actions">
            <SButton variant="secondary" @click="emit('cancel')">
              {{ cancelLabel }}
            </SButton>
            <SButton
              :variant="variant === 'danger' ? 'danger' : 'primary'"
              :loading="loading"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </SButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-overlay);
  padding: var(--space-xl);
}

.dialog {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border-default);
  padding: var(--space-xl);
  max-width: 380px;
  width: 100%;
}

.dialog__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
  margin-bottom: var(--space-xs);
}

.dialog__message {
  font: var(--text-body-1);
  color: var(--color-fg-secondary);
  margin-bottom: var(--space-xl);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-s);
}

.dialog-enter-active {
  transition: opacity var(--duration-normal) var(--easing-decelerate);
}

.dialog-enter-active .dialog {
  transition: transform var(--duration-normal) var(--easing-decelerate),
    opacity var(--duration-normal) var(--easing-decelerate);
}

.dialog-leave-active {
  transition: opacity var(--duration-fast) var(--easing-accelerate);
}

.dialog-enter-from {
  opacity: 0;
}

.dialog-enter-from .dialog {
  opacity: 0;
  transform: scale(0.98);
}

.dialog-leave-to {
  opacity: 0;
}
</style>
