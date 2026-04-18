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
          {
            path: 'balances',
            name: 'balances',
            component: () => import('@/features/money/pages/BalancesPage.vue'),
          },
        ],
      },

      /* Tasks */
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/features/tasks/TasksPage.vue'),
      },

      /* Calendar */
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/features/calendar/CalendarPage.vue'),
      },

      /* Pantry (Shopping + Inventory) */
      {
        path: 'pantry',
        component: () => import('@/features/pantry/PantryLayout.vue'),
        redirect: '/pantry/shopping',
        children: [
          {
            path: 'shopping',
            name: 'shopping',
            component: () => import('@/features/pantry/pages/ShoppingPage.vue'),
          },
          {
            path: 'inventory',
            name: 'inventory',
            component: () => import('@/features/pantry/pages/InventoryPage.vue'),
          },
        ],
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

      /* Wishlist (personal) */
      {
        path: 'wishlist',
        name: 'wishlist',
        component: () => import('@/features/wishlist/WishlistPage.vue'),
      },

      /* Subscriptions (personal) */
      {
        path: 'subscriptions',
        name: 'subscriptions',
        component: () => import('@/features/subscriptions/SubscriptionsPage.vue'),
      },

      /* Journal (personal) */
      {
        path: 'journal',
        name: 'journal',
        component: () => import('@/features/journal/JournalPage.vue'),
      },

      /* Habits (personal) */
      {
        path: 'habits',
        name: 'habits',
        component: () => import('@/features/habits/HabitsPage.vue'),
      },

      /* Contacts (household) */
      {
        path: 'contacts',
        name: 'contacts',
        component: () => import('@/features/contacts/ContactsPage.vue'),
      },

      /* Documents (household) */
      {
        path: 'documents',
        name: 'documents',
        component: () => import('@/features/documents/DocumentsPage.vue'),
      },

      /* Meals (household) */
      {
        path: 'meals',
        name: 'meals',
        component: () => import('@/features/meals/MealsPage.vue'),
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
