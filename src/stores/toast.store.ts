import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  tone: ToastTone
  title: string
  message?: string
  timeout: number
}

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<ToastMessage[]>([])

  function push(toast: Omit<ToastMessage, 'id' | 'timeout'> & { timeout?: number }) {
    const id = crypto.randomUUID()
    const timeout = toast.timeout ?? 4200
    toasts.value.push({ ...toast, id, timeout })

    window.setTimeout(() => dismiss(id), timeout)
    return id
  }

  function success(title: string, message?: string) {
    return push({ tone: 'success', title, message })
  }

  function error(title: string, message?: string) {
    return push({ tone: 'error', title, message, timeout: 6500 })
  }

  function info(title: string, message?: string) {
    return push({ tone: 'info', title, message })
  }

  function warning(title: string, message?: string) {
    return push({ tone: 'warning', title, message, timeout: 5200 })
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts,
    push,
    success,
    error,
    info,
    warning,
    dismiss,
  }
})
