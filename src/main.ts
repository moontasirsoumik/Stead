import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { setupAuthGuard } from './router/guards'
import { useAuthStore } from './stores/auth.store'
import { useAppStore } from './stores/app.store'
import { APP_VERSION } from './version'
import { db } from './services/cache/db'
import App from './App.vue'

import './styles/index.css'

// Bust local Dexie cache when the app version changes
const storedVersion = localStorage.getItem('stead-app-version')
if (storedVersion !== APP_VERSION) {
  db.delete().then(() => {
    localStorage.setItem('stead-app-version', APP_VERSION)
    window.location.reload()
  })
} else {
  bootstrap()
}

function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  const appStore = useAppStore(pinia)

  app.use(pinia)
  app.use(router)

  app.config.errorHandler = (err, instance, info) => {
    console.error('Uncaught error:', err, info)
  }

  // Initialize auth before first navigation
  const auth = useAuthStore(pinia)
  appStore.initializePreferences()
  setupAuthGuard(router)
  auth.initialize().then(() => {
    app.mount('#app')
  })
}
