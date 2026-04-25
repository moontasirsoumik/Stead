# Stead — Implementation Progress Tracker

> **Last updated:** 2026-04-21
> **Current Phase:** P31 — Privacy & Sharing (frontend complete, migration pending)

---

## Progress Overview

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| P0 | Project Scaffold | ✅ Done | 2026-04-15 | 2025-07-24 | All configs, deps, entry files |
| P1 | Design System Foundation | ✅ Done | 2025-07-24 | 2025-07-24 | Tokens, styles, 33 components |
| P2 | Supabase Setup + Auth | ✅ Done | 2025-07-24 | 2025-07-24 | Migrations, auth store, guards, pages |
| P3 | App Shell + Routing | ✅ Done | 2025-07-24 | 2025-07-24 | Router, pages, transitions |
| P4 | Core Data Infrastructure | ✅ Done | 2025-07-24 | 2026-04-15 | Models, Zod, Dexie, repositories, data services, stores, utils |
| P5 | Household + Members | ✅ Done | 2026-04-15 | 2026-04-15 | Household store, data services, SettingsPage |
| P6 | Money Module | ✅ Done | 2026-04-15 | 2026-04-15 | Stores, pages, MoneyLayout, MonthSummary |
| P7 | Tasks Module | ✅ Done | 2026-04-15 | 2026-04-15 | Store, page, subtasks, status transitions |
| P8 | Shopping Module | ✅ Done | 2026-04-15 | 2026-04-15 | Store, page, quick-add, status cycling |
| P9 | Inventory Module | ✅ Done | 2026-04-15 | 2026-04-15 | Store, page, stock status badges |
| P10 | Reminders Module | ✅ Done | 2026-04-15 | 2026-04-15 | Store, page, snooze/dismiss/done |
| P11 | Notes Module | ✅ Done | 2026-04-15 | 2026-04-15 | Store, page, pin toggle, card grid |
| P12 | Dashboard | ✅ Done | 2026-04-15 | 2026-04-15 | Widget grid, stats bar, all modules |
| P13 | Maintenance Module | ✅ Done | 2026-04-16 | 2026-04-16 | Store, page, dashboard widget |
| P14 | Polish + Deploy | 🟡 In Progress | 2026-04-16 | — | CI workflow done; Material 3 migration in progress |
| P15 | Merge Tasks + Maintenance | ✅ Done | 2026-04-16 | 2026-04-16 | Unified Tasks module with task_type discriminator |
| P16 | Merge Shopping + Inventory → Pantry | ✅ Done | 2026-04-16 | 2026-04-16 | Tabbed Pantry module, restock integration |
| P17 | Personal Scope | ✅ Done | 2026-04-16 | 2026-04-16 | scope + owner_id on 7 tables, SScopeToggle, personal dashboard |
| P18 | Global Scope Switcher | ✅ Done | 2026-04-16 | 2026-04-16 | Global scope in sidebar, scope-aware nav + dashboard |
| P19 | Wishlist (Personal) | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P20 | Subscriptions (Personal) | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P21 | Personal Journal | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P22 | Habit Tracker (Personal) | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P23 | Contacts / Service Providers | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P24 | Documents / Warranties | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P25 | Meal Planning | ✅ Done | 2026-04-16 | 2026-04-16 | Model, schema, store, page, route |
| P26 | Chore Rotation | ✅ Done | 2026-04-16 | 2026-04-16 | Rotation fields added to tasks model + schema + migration |
| P27 | Settings Customization | ✅ Done | 2026-04-16 | 2026-04-16 | 11 settings groups, 30+ preferences, accent colors, font scaling, compact mode |
| P28 | Full UI Redesign | ✅ Done | 2026-04-17 | 2026-04-17 | Flat design, icon rail, dense layouts, Plus Jakarta Sans, no shadows |
| P28b | UI Refinement Round 1 | ✅ Done | 2026-04-17 | 2026-04-17 | Font size bumps, softer radii, grid alignment on expenses/income/tasks/reminders, dashboard uniformity |
| P28c | UI Refinement Round 2 | ✅ Done | 2026-04-17 | 2026-04-17 | Unified chip design, column-aligned tables (expenses/bills/savings), avatar contrast fix, notes card sizing, settings widgets redesign, meals week picker |
| P28d | UI Refinement Round 3 | ✅ Done | 2026-04-17 | 2026-04-17 | Universal grid table standardization (all list pages), expandable sidebar, account dropdown, always-visible actions, dashboard bordered tables |
| P28e | UI Fixes Round 4 | ✅ Done | 2026-04-18 | 2026-04-18 | Reminders layout fix, sidebar scope toggle removal, mobile nav changes (sidebar-only), emoji→Material Symbols replacement |
| P29 | Calendar Feature | ✅ Done | 2026-04-18 | 2026-04-18 | Full calendar page with month grid, aggregates tasks/reminders/bills, standalone event CRUD, day detail panel, DB migration applied |
| P30 | Settings Wiring | ✅ Done | 2026-04-18 | 2026-04-18 | Wired 22 orphaned settings to feature pages — see details below |
| P31 | Privacy & Sharing | 🟡 In Progress | 2026-04-20 | — | Frontend complete, DB migration pending — see details below |

---

## Phase 0 — Project Scaffold

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P0-01 | Create plan.md | ✅ Done | `plan.md` |
| P0-02 | Create progress.md | ✅ Done | `progress.md` |
| P0-03 | Create folder structure | ✅ Done | All directories |
| P0-04 | Create agent definitions | ✅ Done | `.github/agents/*.agent.md` |
| P0-05 | Initialize Vite + Vue 3 + TS project | ✅ Done | `package.json`, `vite.config.ts` |
| P0-06 | Install dependencies | ✅ Done | `package.json` (305 packages) |
| P0-07 | Configure TypeScript (strict) | ✅ Done | `tsconfig.json`, `tsconfig.node.json` |
| P0-08 | Configure ESLint (flat config) | ✅ Done | `eslint.config.js` |
| P0-09 | Configure Prettier | ✅ Done | `.prettierrc`, `.prettierignore` |
| P0-10 | Configure Vitest | ✅ Done | `vite.config.ts` |
| P0-11 | Create .env.example | ✅ Done | `.env.example` |
| P0-12 | Create .gitignore | ✅ Done | `.gitignore` |
| P0-13 | Create index.html | ✅ Done | `index.html` |
| P0-14 | Create README.md | ⬜ Not Started | `README.md` |
| P0-15 | Create token CSS stubs | ✅ Done | `src/tokens/*.css` |
| P0-16 | Create style stubs | ✅ Done | `src/styles/*.css` |
| P0-17 | Create main.ts + App.vue stubs | ✅ Done | `src/main.ts`, `src/App.vue` |
| P0-18 | Verify build succeeds | ✅ Done | vue-tsc + vite build pass |

---

## Phase 1 — Design System Foundation

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P1-01 | Implement color tokens | ✅ Done | `src/tokens/colors.css` |
| P1-02 | Implement typography tokens | ✅ Done | `src/tokens/typography.css` |
| P1-03 | Implement spacing tokens | ✅ Done | `src/tokens/spacing.css` |
| P1-04 | Implement radius tokens | ✅ Done | `src/tokens/radius.css` |
| P1-05 | Implement shadow tokens | ✅ Done | `src/tokens/shadows.css` |
| P1-06 | Implement motion tokens | ✅ Done | `src/tokens/motion.css` |
| P1-07 | Create CSS reset | ✅ Done | `src/styles/reset.css` |
| P1-08 | Create global styles | ✅ Done | `src/styles/global.css` |
| P1-09 | Create utility classes | ✅ Done | `src/styles/utilities.css` |
| P1-10 | Build SButton | ✅ Done | `src/components/ui/SButton.vue` |
| P1-11 | Build SIconButton | ✅ Done | `src/components/ui/SIconButton.vue` |
| P1-12 | Build SInput | ✅ Done | `src/components/ui/SInput.vue` |
| P1-13 | Build STextarea | ✅ Done | `src/components/ui/STextarea.vue` |
| P1-14 | Build SSelect | ✅ Done | `src/components/ui/SSelect.vue` |
| P1-15 | Build SCheckbox | ✅ Done | `src/components/ui/SCheckbox.vue` |
| P1-16 | Build SSearch | ✅ Done | `src/components/ui/SSearch.vue` |
| P1-17 | Build SBadge | ✅ Done | `src/components/ui/SBadge.vue` |
| P1-18 | Build SAvatar | ✅ Done | `src/components/ui/SAvatar.vue` |
| P1-19 | Build SToggle | ✅ Done | `src/components/ui/SToggle.vue` |
| P1-20 | Build STooltip | ✅ Done | `src/components/ui/STooltip.vue` |
| P1-21 | Build AppShell | ✅ Done | `src/components/layout/AppShell.vue` |
| P1-22 | Build AppHeader | ✅ Done | `src/components/layout/AppHeader.vue` |
| P1-23 | Build NavRail | ✅ Done | `src/components/layout/NavRail.vue` |
| P1-24 | Build NavItem | ✅ Done | `src/components/layout/NavItem.vue` |
| P1-25 | Build MobileNav | ✅ Done | `src/components/layout/MobileNav.vue` |
| P1-26 | Build PageHeader | ✅ Done | `src/components/layout/PageHeader.vue` |
| P1-27 | Build PageContainer | ✅ Done | `src/components/layout/PageContainer.vue` |
| P1-28 | Build ContentCard | ✅ Done | `src/components/layout/ContentCard.vue` |
| P1-29 | Build EmptyState | ✅ Done | `src/components/feedback/EmptyState.vue` |
| P1-30 | Build LoadingSkeleton | ✅ Done | `src/components/feedback/LoadingSkeleton.vue` |
| P1-31 | Build StatusBadge | ✅ Done | `src/components/feedback/StatusBadge.vue` |
| P1-32 | Build ErrorBanner | ✅ Done | `src/components/feedback/ErrorBanner.vue` |
| P1-33 | Build ConfirmDialog | ✅ Done | `src/components/feedback/ConfirmDialog.vue` |
| P1-34 | Build FilterBar | ✅ Done | `src/components/data/FilterBar.vue` |
| P1-35 | Build SortMenu | ✅ Done | `src/components/data/SortMenu.vue` |
| P1-36 | Build DataList | ✅ Done | `src/components/data/DataList.vue` |
| P1-37 | Build InlineStat | ✅ Done | `src/components/data/InlineStat.vue` |
| P1-38 | Build SectionHeader | ✅ Done | `src/components/data/SectionHeader.vue` |
| P1-39 | Build FormSection | ✅ Done | `src/components/forms/FormSection.vue` |
| P1-40 | Build FormField | ✅ Done | `src/components/forms/FormField.vue` |
| P1-41 | Build FormDrawer | ✅ Done | `src/components/forms/FormDrawer.vue` |
| P1-42 | Build QuickAddBar | ✅ Done | `src/components/forms/QuickAddBar.vue` |

---

## Phase 2 — Supabase Setup + Auth

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P2-01 | Create Supabase project | ✅ Done | Supabase dashboard (ssznueavbhpkpepdxvrm) |
| P2-02 | Write initial schema migration | ✅ Done | `supabase/migrations/001_initial_schema.sql` |
| P2-03 | Write RLS policies migration | ✅ Done | `supabase/migrations/002_rls_policies.sql` |
| P2-04 | Write indexes migration | ✅ Done | `supabase/migrations/003_indexes.sql` |
| P2-05 | Write triggers migration | ✅ Done | `supabase/migrations/004_triggers.sql` |
| P2-06 | Run migrations in Supabase | ✅ Done | All 4 migrations applied via CLI |
| P2-07 | Create Supabase client singleton | ✅ Done | `src/lib/supabase.ts` |
| P2-08 | Install @supabase/supabase-js | ✅ Done | `package.json` |
| P2-09 | Implement auth store | ✅ Done | `src/stores/auth.store.ts` |
| P2-10 | Implement useAuth composable | ✅ Done | `src/composables/useAuth.ts` |
| P2-11 | Build LoginPage | ✅ Done | `src/features/auth/LoginPage.vue` |
| P2-12 | Build SignupPage | ✅ Done | `src/features/auth/SignupPage.vue` |
| P2-13 | Build OnboardingPage | ✅ Done | `src/features/auth/OnboardingPage.vue` |
| P2-14 | Implement auth route guards | ✅ Done | `src/router/guards.ts` |
| P2-15 | Configure .env with Supabase credentials | ✅ Done | `.env.example`, `.env.local` |

---

## Phase 3 — App Shell + Routing

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P3-01 | Configure Vue Router with all routes | ✅ Done | `src/router/index.ts` |
| P3-02 | Wire auth guards to router | ✅ Done | `src/router/guards.ts`, `src/main.ts` |
| P3-03 | Wire AppShell with NavRail + routing | ✅ Done | `src/App.vue`, layout components |
| P3-04 | Implement responsive nav behavior | ✅ Done | NavRail, MobileNav |
| P3-05 | Add route transition animations | ✅ Done | AppShell / router |
| P3-06 | Create placeholder pages for all routes | ✅ Done | `src/features/*/` (14 pages) |
| P3-07 | Wire QuickAddBar stub in header | ✅ Done | AppHeader |
| P3-08 | Wire user menu in header | ✅ Done | AppHeader |

---

## Phase 4 — Core Data Infrastructure

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P4-01 | Define all TypeScript models | ✅ Done | `src/models/*.model.ts` (17 entities) |
| P4-02 | Define enums | ✅ Done | `src/models/enums.ts` (12 string unions) |
| P4-03 | Define base model types | ✅ Done | `src/models/base.model.ts` |
| P4-04 | Create Zod schemas | ✅ Done | `src/schemas/*.schema.ts` (17 schemas + base) |
| P4-05 | Implement Dexie database (cache) | ✅ Done | `src/services/cache/db.ts` (14 tables) |
| P4-06 | Implement DB migrations | ✅ Done | Dexie v1 schema defined |
| P4-07 | Implement BaseRepository | ✅ Done | `src/repositories/base.repository.ts` |
| P4-08 | Implement entity repositories | ⬜ Skipped | Repos accessed via data services instead |
| P4-09 | Implement base data service | ✅ Done | `src/services/data/base.data.ts` |
| P4-10 | Implement entity data services | ✅ Done | `src/services/data/*.data.ts` (15 services) |
| P4-11 | Implement app.store.ts | ✅ Done | `src/stores/app.store.ts` |
| P4-12 | Implement useOnline composable | ✅ Done | `src/composables/useOnline.ts` |
| P4-13 | Implement utility functions | ✅ Done | `src/utils/format.ts` |
| P4-14 | Define constants | ✅ Done | `src/constants/categories.ts` |

---

## Phase 5 — Household + Members

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P5-01 | Implement household store | ✅ Done | `src/stores/household.store.ts` |
| P5-02 | Implement members data service | ✅ Done | `src/services/data/members.data.ts` |
| P5-03 | Implement household data service | ✅ Done | `src/services/data/household.data.ts` |
| P5-04 | Complete OnboardingPage (create household + member) | ✅ Done | Already wired via RPC in auth.store.ts |
| P5-05 | Build SettingsPage | ✅ Done | `src/features/settings/SettingsPage.vue` |
| P5-06 | Build member management UI | ✅ Done | Integrated in SettingsPage (add/edit drawer) |

---

## Phase 6 — Money Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P6-01 | Implement Expenses data service + store | ✅ Done | `src/stores/expenses.store.ts` |
| P6-02 | Implement Income data service + store | ✅ Done | `src/stores/income.store.ts` |
| P6-03 | Implement Bills data service + store | ✅ Done | `src/stores/bills.store.ts` |
| P6-04 | Implement Budgets data service + store | ✅ Done | `src/stores/budgets.store.ts` |
| P6-05 | Implement SavingsGoals data service + store | ✅ Done | `src/stores/savings.store.ts` |
| P6-06 | Implement GoalContributions data service + store | ✅ Done | Combined in savings.store.ts |
| P6-07 | Build MoneyLayout with sub-nav tabs | ✅ Done | `src/features/money/MoneyLayout.vue` |
| P6-08 | Build ExpensesPage | ✅ Done | Full page with filter, grouped list, add/edit drawer |
| P6-09 | Build IncomePage | ✅ Done | Full page with stats, list, add/edit drawer |
| P6-10 | Build BillsPage | ✅ Done | Full page with status badges, actions, drawer |
| P6-11 | Build BudgetsPage | ✅ Done | Grid with progress bars, month picker, drawer |
| P6-12 | Build SavingsPage | ✅ Done | Goal cards, inline contributions, dual drawers |
| P6-13 | Build SavingsDetailPage | ✅ Done | Inline in SavingsPage (expandable) |
| P6-14 | Build MonthSummary component | ✅ Done | `src/features/money/components/MonthSummary.vue` |

---

## Phase 7 — Tasks Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P7-01 | Implement Tasks data service + store | ✅ Done | `src/stores/tasks.store.ts` |
| P7-02 | Implement Subtasks data service + store | ✅ Done | Subtask map in tasks.store.ts |
| P7-03 | Build TasksPage | ✅ Done | Full page with filters, status groups, inline subtasks |
| P7-04 | Build TaskDetailPage | ✅ Done | Inline expansion in TasksPage |
| P7-05 | Implement status transitions | ✅ Done | Quick status actions + completed_at |

---

## Phase 8 — Shopping Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P8-01 | Implement Groceries data service + store | ✅ Done | `src/stores/shopping.store.ts` |
| P8-02 | Build ShoppingPage | ✅ Done | Full page with category groups, status toggle |
| P8-03 | Implement quick-add | ✅ Done | Inline quick-add bar in ShoppingPage |

---

## Phase 9 — Inventory Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P9-01 | Implement Inventory data service + store | ✅ Done | `src/stores/inventory.store.ts` |
| P9-02 | Build InventoryPage | ✅ Done | Full page with stock badges, quick update |
| P9-03 | Build StockBadge component | ✅ Done | Inline in InventoryPage |

---

## Phase 10 — Reminders Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P10-01 | Implement Reminders data service + store | ✅ Done | `src/stores/reminders.store.ts` |
| P10-02 | Build RemindersPage | ✅ Done | Full page with overdue highlight, actions |
| P10-03 | Implement linked entity display | ✅ Done | Type badge in RemindersPage |

---

## Phase 11 — Notes Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P11-01 | Implement Notes data service + store | ✅ Done | `src/stores/notes.store.ts` |
| P11-02 | Build NotesPage | ✅ Done | Card grid with pinned section, content preview |
| P11-03 | Build NoteDetailPage | ✅ Done | Edit drawer in NotesPage |

---

## Phase 12 — Dashboard

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P12-01 | Build DashboardPage | ✅ Done | Full widget grid, greeting, stats bar |
| P12-02 | Build TasksDueCard | ✅ Done | Inline widget in DashboardPage |
| P12-03 | Build UpcomingBillsCard | ✅ Done | Inline widget in DashboardPage |
| P12-04 | Build RecentExpensesCard | ✅ Done | Inline widget in DashboardPage |
| P12-05 | Build SavingsProgressCard | ✅ Done | Inline widget with progress bars |
| P12-06 | Build LowStockCard | ✅ Done | Inline widget in DashboardPage |
| P12-07 | Build RemindersCard | ✅ Done | Inline widget in DashboardPage |
| P12-08 | Build PinnedNotesCard | ✅ Done | Inline widget in DashboardPage |

---

## Phase 13 — Maintenance Module (Deferred)

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P13-01 | Implement Maintenance data service + store | ✅ Done | `src/stores/maintenance.store.ts` |
| P13-02 | Build MaintenancePage | ✅ Done | Full page with filters, actions, drawer |

---

## Phase 14 — Polish + Deploy

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P14-01 | Write unit tests (data services, stores, utils) | ✅ Done | `src/utils/__tests__/format.test.ts`, `src/services/data/__tests__/base.data.test.ts` |
| P14-02 | Write E2E tests (critical flows) | ⬜ Not Started | `tests/e2e/` |
| P14-03 | Accessibility audit | ✅ Done | SButton, SIconButton, SInput a11y fixes |
| P14-LP-01 | Tighten landing prototype logo lockup | ✅ Done | `logo-origami.html` |

---

## Phase 30 — Settings Wiring

Wired 22 previously orphaned settings from `app.store.ts` to their feature pages.

### Settings Now Active

| Setting | Feature Page | What it does |
|---|---|---|
| `currency` | All money displays via `formatCents()` | Locale-aware currency formatting (USD, EUR, GBP, BDT, INR, CAD, AUD, JPY) |
| `showCents` | All money displays via `formatCents()` | Show/hide decimal places in currency |
| `dateFormat` | All date displays via `formatDate()` | MDY, DMY, YMD, ISO date formats |
| `showDashboardGreeting` | DashboardPage | Show/hide "Good morning, Name" greeting |
| `dashboardWidgets` | DashboardPage | Toggle visibility of each widget section (tasks, money, pantry, reminders, notes, habits, meals, subscriptions, wishlist) |
| `dashboardDensity` | DashboardPage | Comfortable/compact/spacious spacing |
| `defaultTaskPriority` | TasksPage | New task form default priority |
| `showCompletedTasks` | TasksPage | Filter out done/skipped tasks from list |
| `confirmBeforeDelete` | ALL pages with delete | Skip/show confirm dialog before deletion (Tasks, Notes, Reminders, Contacts, Documents, Habits, Wishlist, Subscriptions, Inventory) |
| `weekStart` | CalendarPage | Sunday/Monday/Saturday week start — changes grid layout and day headers |
| `defaultNoteView` | NotesPage | Grid or list layout with toggle button |
| `journalPromptEnabled` | JournalPage | Show/hide "How's your day going?" CTA |
| `defaultServings` | MealsPage | Default servings in new meal form |
| `defaultGrocerySort` | ShoppingPage | Sort by name, category, or status |
| `showStockIndicators` | InventoryPage | Show/hide stock status badges |

### Settings Not Wired (no feature exists yet)

| Setting | Reason |
|---|---|
| `autoArchiveDays` | Would need a background cron/cleanup service |
| `autoAddRestock` | Would need inventory-to-shopping automation logic |
| `defaultSnoozeMinutes` | Snooze is status-based, not time-based — needs model change |
| `reminderSound` | No browser notification system exists |
| `showMealCalendar` | Meal calendar view not implemented |
| `defaultTaskView` | Task view modes (list/board) not implemented |
| `cacheEnabled` | Would need data service layer changes |
| `analyticsOptIn` | No analytics system exists |
| `showMonthlyComparison` | Monthly comparison widget not implemented |
| `defaultBudgetPeriod` | Budget period selector not implemented |
| P14-04 | Performance audit | ✅ Done | Vite vendor chunk splitting |
| P14-05 | Configure CI (lint + typecheck + build) | ✅ Done | `.github/workflows/ci.yml` |
| P14-06 | Set up Cloudflare Pages deployment | ✅ Done | `public/_redirects`, `public/_headers` |
| P14-07 | Write deployment docs | ⬜ Not Started | `docs/deployment.md` |
| P14-08 | Final visual polish pass | 🟡 In Progress | Material 3 migration, shell cleanup, theme controls |

---

## Change Log

| Date | Change |
|---|---|
| 2026-04-15 | Initial plan.md, progress.md, folder structure, agent definitions created (P0-01 through P0-04) |
| 2026-04-15 | Migrated architecture from Google Sheets + Apps Script to Supabase. Updated plan.md, progress.md, agents, directory structure. |
| 2026-04-16 | Switched design guidance from Fluent-inspired direction to Material Design 3, added shell/navigation quality rules, and began app-wide M3 migration. |
| 2026-04-16 | Planned P15 (merge Tasks+Maintenance), P16 (merge Shopping+Inventory→Pantry), P17 (personal scope). Updated plan.md §25 and progress.md. |
| 2026-04-17 | **Database seeding & RLS fix**: Seeded 206+ rows across 23 tables (both household + personal scope). Fixed member `active=false` bug blocking RLS. Applied RLS policies for 10 new feature tables (wishlists, subscriptions, journal_entries, habits, habit_logs, contacts, documents, meal_plans, meals, expense_splits). Deleted duplicate empty household/member. All data now accessible via authenticated user. |
| 2026-04-20 | **Phase 31 — Privacy & Sharing**: Frontend complete, DB migration pending. See Phase 31 details below. |
| 2026-04-21 | **Deploy tooling**: Migrated package management and CI from npm to Bun, replaced `package-lock.json` with `bun.lock`, and documented a build-only production branch strategy. |
| 2026-04-21 | **Deploy branch sync**: Updated `origin/deploy` to the current production-only Bun app tree, excluded docs/scripts/tests/migrations, and verified the stripped branch still passes `bun run build`. |
| 2026-04-21 | **Auth dark mode fix deployed**: Implemented CSS token-based solution for auth panel contrast in dark mode. Synced to deploy branch and verified build passes (exit code 0). Ready for Cloudflare Pages deployment. |

---

## Phase 31 — Privacy & Sharing Features

### Overview
Privacy-centric feature set adding visibility controls and private debt view:
- **Expense split privacy** — RLS-enforced: you only see your own debts and credits
- **Calendar event sharing** — share personal events with specific members or entire household
- **Notes sharing** — share personal notes with specific members
- **Tasks sharing** — share personal tasks with specific members
- **Wishlist sharing** — share wishlist items (e.g., gift hints) with specific members
- **Settlements view** — renamed Balances tab with private debt subtitle
- **Dummy members** — 4 test members added for multi-user testing

### Files Created
| File | Purpose |
|---|---|
| `supabase/migrations/013_privacy_sharing.sql` | DB migration: visibility columns, entity_shares table, RLS updates, dummy members |
| `scripts/apply-migration-013.mjs` | Script to apply migration via Supabase Management API |
| `src/models/entity-share.model.ts` | EntityShare TypeScript interface |
| `src/schemas/entity-share.schema.ts` | EntityShare Zod schema |
| `src/services/data/entity-shares.data.ts` | Data service for entity sharing (CRUD + cache) |
| `src/components/ui/SVisibilityPicker.vue` | Reusable visibility selector (private/shared/household) |
| `src/components/ui/SMemberPicker.vue` | Reusable member multi-select for sharing |

### Files Modified
| File | Change |
|---|---|
| `src/models/enums.ts` | Added `Visibility` type |
| `src/models/calendar-event.model.ts` | Added `visibility: Visibility` |
| `src/models/note.model.ts` | Added `visibility: Visibility` |
| `src/models/task.model.ts` | Added `visibility: Visibility` |
| `src/models/wishlist.model.ts` | Added `visibility: Visibility` |
| `src/schemas/calendar-event.schema.ts` | Added visibility enum validation |
| `src/schemas/note.schema.ts` | Added visibility enum validation |
| `src/schemas/task.schema.ts` | Added visibility enum validation |
| `src/schemas/wishlist.schema.ts` | Added visibility enum validation |
| `src/services/cache/db.ts` | Dexie v7: entity_shares table + visibility indexes |
| `src/features/calendar/CalendarPage.vue` | Visibility picker + member sharing in event form |
| `src/features/notes/NotesPage.vue` | Visibility picker + member sharing in note form |
| `src/features/tasks/TasksPage.vue` | Visibility picker + member sharing in task form |
| `src/features/wishlist/WishlistPage.vue` | Visibility picker + member sharing in wishlist form |
| `src/features/money/components/MoneyTabs.vue` | Renamed Balances → Settlements |
| `src/features/money/pages/BalancesPage.vue` | Updated title/subtitle for private debt |

### Migration Status

⚠️ **PENDING**: Run the migration to apply DB changes:
```bash
node scripts/apply-migration-013.mjs <your_supabase_access_token>
```
Get token from: https://supabase.com/dashboard/account/tokens

### What the migration does:
1. Adds `visibility` column (default: 'private') to calendar_events, notes, tasks, wishlists
2. Creates `entity_shares` junction table for sharing with specific members
3. Updates `expense_splits` RLS to only show your own debts/credits (private debt view)
4. Updates calendar_events, notes, tasks, wishlists SELECT RLS for visibility awareness
5. Inserts 4 dummy household members (Alice Chen, Bob Rivera, Chloe Kim, Derek Patel)

---

## Phase 15 — Merge Tasks + Maintenance

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P15-01 | Write migration 006 (add maintenance fields to tasks, migrate data) | ⬜ Not Started | `supabase/migrations/006_merge_tasks_maintenance.sql` |
| P15-02 | Update Task model + add TaskType enum | ⬜ Not Started | `src/models/task.model.ts`, `src/models/enums.ts` |
| P15-03 | Update task Zod schema | ⬜ Not Started | `src/schemas/task.schema.ts` |
| P15-04 | Update Dexie DB (remove maintenance table, update tasks) | ⬜ Not Started | `src/services/cache/db.ts` |
| P15-05 | Update tasks data service | ⬜ Not Started | `src/services/data/tasks.data.ts` |
| P15-06 | Merge maintenance store logic into tasks store | ⬜ Not Started | `src/stores/tasks.store.ts` |
| P15-07 | Update TasksPage (type filter, conditional maintenance fields) | ⬜ Not Started | `src/features/tasks/TasksPage.vue` |
| P15-08 | Update DashboardPage (remove maintenance store, integrate) | ⬜ Not Started | `src/features/dashboard/DashboardPage.vue` |
| P15-09 | Update NavRail + MobileNav (remove maintenance item) | ⬜ Not Started | `src/components/layout/NavRail.vue`, `MobileNav.vue` |
| P15-10 | Update router (remove /maintenance route) | ⬜ Not Started | `src/router/index.ts` |
| P15-11 | Remove maintenance module files | ⬜ Not Started | Delete: `maintenance.model.ts`, `maintenance.schema.ts`, `maintenance.data.ts`, `maintenance.store.ts`, `MaintenancePage.vue` |
| P15-12 | Update model/schema index exports | ⬜ Not Started | `src/models/index.ts`, `src/schemas/index.ts` |
| P15-13 | Verify build + type-check | ⬜ Not Started | `bun run build` |

---

## Phase 16 — Merge Shopping + Inventory → Pantry

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P16-01 | Create PantryLayout with tabs | ⬜ Not Started | `src/features/pantry/PantryLayout.vue` |
| P16-02 | Move ShoppingPage to pantry module | ⬜ Not Started | `src/features/pantry/pages/ShoppingPage.vue` |
| P16-03 | Move InventoryPage to pantry module | ⬜ Not Started | `src/features/pantry/pages/InventoryPage.vue` |
| P16-04 | Add "Add to Shopping List" action on inventory items | ⬜ Not Started | `src/features/pantry/pages/InventoryPage.vue` |
| P16-05 | Update router (pantry routes, remove old routes) | ⬜ Not Started | `src/router/index.ts` |
| P16-06 | Update NavRail + MobileNav (Pantry replaces Shopping+Inventory) | ⬜ Not Started | `NavRail.vue`, `MobileNav.vue` |
| P16-07 | Update DashboardPage imports | ⬜ Not Started | `src/features/dashboard/DashboardPage.vue` |
| P16-08 | Remove old feature folders | ⬜ Not Started | `src/features/shopping/`, `src/features/inventory/` |
| P16-09 | Verify build + type-check | ⬜ Not Started | `bun run build` |

---

## Phase 17 — Personal Scope

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P17-01 | Write migration 007 (add scope + owner_id to 7 tables) | ⬜ Not Started | `supabase/migrations/007_personal_scope.sql` |
| P17-02 | Write migration 008 (update RLS policies for personal scope) | ⬜ Not Started | `supabase/migrations/008_personal_rls.sql` |
| P17-03 | Add DataScope enum + update affected models | ⬜ Not Started | `src/models/enums.ts`, affected `.model.ts` files |
| P17-04 | Update Zod schemas for affected entities | ⬜ Not Started | Affected `.schema.ts` files |
| P17-05 | Build SScopeToggle component | ⬜ Not Started | `src/components/ui/SScopeToggle.vue` |
| P17-06 | Update data services for scope-aware queries | ⬜ Not Started | Affected `.data.ts` files |
| P17-07 | Update stores with scope filtering | ⬜ Not Started | Affected `.store.ts` files |
| P17-08 | Update Money pages with scope toggle | ⬜ Not Started | Expenses, Income, Budgets, Savings pages |
| P17-09 | Update TasksPage with scope toggle | ⬜ Not Started | `TasksPage.vue` |
| P17-10 | Update NotesPage with scope toggle | ⬜ Not Started | `NotesPage.vue` |
| P17-11 | Update DashboardPage with personal section | ⬜ Not Started | `DashboardPage.vue` |
| P17-12 | Update Dexie DB indexes for scope | ⬜ Not Started | `src/services/cache/db.ts` |
| P17-13 | Verify build + type-check | ⬜ Not Started | `bun run build` |
