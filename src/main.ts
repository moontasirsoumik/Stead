import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { setupAuthGuard } from './router/guards'
import { useAuthStore } from './stores/auth.store'
import App from './App.vue'

import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.config.errorHandler = (err, instance, info) => {
  console.error('Uncaught error:', err, info)
}

// Initialize auth before first navigation
const auth = useAuthStore(pinia)
setupAuthGuard(router)
auth.initialize().then(() => {
  app.mount('#app')
})
