import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

export function setupAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    // Wait for initial auth check to complete
    if (auth.loading) {
      await auth.initialize()
    }

    // Public routes don't require auth
    if (to.meta.public) return true

    // Not authenticated → go to login
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // Authenticated but no household → go to onboarding
    if (!auth.hasHousehold && to.name !== 'onboarding') {
      return { name: 'onboarding' }
    }

    return true
  })
}
