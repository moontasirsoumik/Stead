import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarExpanded = ref(true)
  const mobileSidebarOpen = ref(false)
  const isOnline = ref(navigator.onLine)

  function toggleSidebar() {
    sidebarExpanded.value = !sidebarExpanded.value
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  return {
    sidebarExpanded,
    mobileSidebarOpen,
    isOnline,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
  }
})
