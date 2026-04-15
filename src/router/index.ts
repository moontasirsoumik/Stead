import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  /* ── Public ── */
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/features/auth/SignupPage.vue'),
    meta: { public: true },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/features/auth/OnboardingPage.vue'),
  },

  /* ── App Shell ── */
  {
    path: '/',
    component: () => import('@/components/layout/AppShell.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/features/dashboard/DashboardPage.vue'),
      },

      /* Money */
      {
        path: 'money',
        component: () => import('@/features/money/MoneyLayout.vue'),
        redirect: '/money/expenses',
        children: [
          {
            path: 'expenses',
            name: 'expenses',
            component: () => import('@/features/money/pages/ExpensesPage.vue'),
          },
          {
            path: 'income',
            name: 'income',
            component: () => import('@/features/money/pages/IncomePage.vue'),
          },
          {
            path: 'bills',
            name: 'bills',
            component: () => import('@/features/money/pages/BillsPage.vue'),
          },
          {
            path: 'budgets',
            name: 'budgets',
            component: () => import('@/features/money/pages/BudgetsPage.vue'),
          },
          {
            path: 'savings',
            name: 'savings',
            component: () => import('@/features/money/pages/SavingsPage.vue'),
          },
        ],
      },

      /* Tasks */
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/features/tasks/TasksPage.vue'),
      },

      /* Shopping */
      {
        path: 'shopping',
        name: 'shopping',
        component: () => import('@/features/shopping/ShoppingPage.vue'),
      },

      /* Inventory */
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/features/inventory/InventoryPage.vue'),
      },

      /* Reminders */
      {
        path: 'reminders',
        name: 'reminders',
        component: () => import('@/features/reminders/RemindersPage.vue'),
      },

      /* Notes */
      {
        path: 'notes',
        name: 'notes',
        component: () => import('@/features/notes/NotesPage.vue'),
      },

      /* Maintenance */
      {
        path: 'maintenance',
        name: 'maintenance',
        component: () => import('@/features/maintenance/MaintenancePage.vue'),
      },

      /* Settings */
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/features/settings/SettingsPage.vue'),
      },
    ],
  },

  /* ── Catch-all ── */
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

/* Auth guard is set up in main.ts via setupAuthGuard() */

export default router
