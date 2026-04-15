import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app.store'

export function useOnline() {
  const appStore = useAppStore()
  const isOnline = ref(navigator.onLine)

  function handleOnline() {
    isOnline.value = true
    appStore.isOnline = true
  }

  function handleOffline() {
    isOnline.value = false
    appStore.isOnline = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline }
}
