# Stead — Implementation Progress Tracker

> **Last updated:** 2026-04-15
> **Current Phase:** P0 — Project Scaffold

---

## Progress Overview

| Phase | Name | Status | Started | Completed | Notes |
|---|---|---|---|---|---|
| P0 | Project Scaffold | 🟡 In Progress | 2026-04-15 | — | plan.md, progress.md, folders, agents |
| P1 | Design System Foundation | ⬜ Not Started | — | — | |
| P2 | Supabase Setup + Auth | ⬜ Not Started | — | — | |
| P3 | App Shell + Routing | ⬜ Not Started | — | — | |
| P4 | Core Data Infrastructure | ⬜ Not Started | — | — | |
| P5 | Household + Members | ⬜ Not Started | — | — | |
| P6 | Money Module | ⬜ Not Started | — | — | |
| P7 | Tasks Module | ⬜ Not Started | — | — | |
| P8 | Shopping Module | ⬜ Not Started | — | — | |
| P9 | Inventory Module | ⬜ Not Started | — | — | |
| P10 | Reminders Module | ⬜ Not Started | — | — | |
| P11 | Notes Module | ⬜ Not Started | — | — | |
| P12 | Dashboard | ⬜ Not Started | — | — | |
| P13 | Maintenance Module | ⬜ Deferred | — | — | |
| P14 | Polish + Deploy | ⬜ Not Started | — | — | |

---

## Phase 0 — Project Scaffold

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P0-01 | Create plan.md | ✅ Done | `plan.md` |
| P0-02 | Create progress.md | ✅ Done | `progress.md` |
| P0-03 | Create folder structure | ✅ Done | All directories |
| P0-04 | Create agent definitions | ✅ Done | `.github/agents/*.agent.md` |
| P0-05 | Initialize Vite + Vue 3 + TS project | ⬜ Not Started | `package.json`, `vite.config.ts`, etc. |
| P0-06 | Install dependencies | ⬜ Not Started | `package.json` |
| P0-07 | Configure TypeScript (strict) | ⬜ Not Started | `tsconfig.json`, `tsconfig.node.json` |
| P0-08 | Configure ESLint (flat config) | ⬜ Not Started | `eslint.config.js` |
| P0-09 | Configure Prettier | ⬜ Not Started | `.prettierrc`, `.prettierignore` |
| P0-10 | Configure Vitest | ⬜ Not Started | `vite.config.ts` |
| P0-11 | Create .env.example | ⬜ Not Started | `.env.example` |
| P0-12 | Create .gitignore | ⬜ Not Started | `.gitignore` |
| P0-13 | Create index.html | ⬜ Not Started | `index.html` |
| P0-14 | Create README.md | ⬜ Not Started | `README.md` |
| P0-15 | Create token CSS stubs | ⬜ Not Started | `src/tokens/*.css` |
| P0-16 | Create style stubs | ⬜ Not Started | `src/styles/*.css` |
| P0-17 | Create main.ts + App.vue stubs | ⬜ Not Started | `src/main.ts`, `src/App.vue` |
| P0-18 | Verify build succeeds | ⬜ Not Started | — |

---

## Phase 1 — Design System Foundation

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P1-01 | Implement color tokens | ⬜ Not Started | `src/tokens/colors.css` |
| P1-02 | Implement typography tokens | ⬜ Not Started | `src/tokens/typography.css` |
| P1-03 | Implement spacing tokens | ⬜ Not Started | `src/tokens/spacing.css` |
| P1-04 | Implement radius tokens | ⬜ Not Started | `src/tokens/radius.css` |
| P1-05 | Implement shadow tokens | ⬜ Not Started | `src/tokens/shadows.css` |
| P1-06 | Implement motion tokens | ⬜ Not Started | `src/tokens/motion.css` |
| P1-07 | Create CSS reset | ⬜ Not Started | `src/styles/reset.css` |
| P1-08 | Create global styles | ⬜ Not Started | `src/styles/global.css` |
| P1-09 | Create utility classes | ⬜ Not Started | `src/styles/utilities.css` |
| P1-10 | Build SButton | ⬜ Not Started | `src/components/ui/SButton.vue` |
| P1-11 | Build SIconButton | ⬜ Not Started | `src/components/ui/SIconButton.vue` |
| P1-12 | Build SInput | ⬜ Not Started | `src/components/ui/SInput.vue` |
| P1-13 | Build STextarea | ⬜ Not Started | `src/components/ui/STextarea.vue` |
| P1-14 | Build SSelect | ⬜ Not Started | `src/components/ui/SSelect.vue` |
| P1-15 | Build SCheckbox | ⬜ Not Started | `src/components/ui/SCheckbox.vue` |
| P1-16 | Build SSearch | ⬜ Not Started | `src/components/ui/SSearch.vue` |
| P1-17 | Build SBadge | ⬜ Not Started | `src/components/ui/SBadge.vue` |
| P1-18 | Build SAvatar | ⬜ Not Started | `src/components/ui/SAvatar.vue` |
| P1-19 | Build SToggle | ⬜ Not Started | `src/components/ui/SToggle.vue` |
| P1-20 | Build STooltip | ⬜ Not Started | `src/components/ui/STooltip.vue` |
| P1-21 | Build AppShell | ⬜ Not Started | `src/components/layout/AppShell.vue` |
| P1-22 | Build AppHeader | ⬜ Not Started | `src/components/layout/AppHeader.vue` |
| P1-23 | Build NavRail | ⬜ Not Started | `src/components/layout/NavRail.vue` |
| P1-24 | Build NavItem | ⬜ Not Started | `src/components/layout/NavItem.vue` |
| P1-25 | Build MobileNav | ⬜ Not Started | `src/components/layout/MobileNav.vue` |
| P1-26 | Build PageHeader | ⬜ Not Started | `src/components/layout/PageHeader.vue` |
| P1-27 | Build PageContainer | ⬜ Not Started | `src/components/layout/PageContainer.vue` |
| P1-28 | Build ContentCard | ⬜ Not Started | `src/components/layout/ContentCard.vue` |
| P1-29 | Build EmptyState | ⬜ Not Started | `src/components/feedback/EmptyState.vue` |
| P1-30 | Build LoadingSkeleton | ⬜ Not Started | `src/components/feedback/LoadingSkeleton.vue` |
| P1-31 | Build StatusBadge | ⬜ Not Started | `src/components/feedback/StatusBadge.vue` |
| P1-32 | Build ErrorBanner | ⬜ Not Started | `src/components/feedback/ErrorBanner.vue` |
| P1-33 | Build ConfirmDialog | ⬜ Not Started | `src/components/feedback/ConfirmDialog.vue` |
| P1-34 | Build FilterBar | ⬜ Not Started | `src/components/data/FilterBar.vue` |
| P1-35 | Build SortMenu | ⬜ Not Started | `src/components/data/SortMenu.vue` |
| P1-36 | Build DataList | ⬜ Not Started | `src/components/data/DataList.vue` |
| P1-37 | Build InlineStat | ⬜ Not Started | `src/components/data/InlineStat.vue` |
| P1-38 | Build SectionHeader | ⬜ Not Started | `src/components/data/SectionHeader.vue` |
| P1-39 | Build FormSection | ⬜ Not Started | `src/components/forms/FormSection.vue` |
| P1-40 | Build FormField | ⬜ Not Started | `src/components/forms/FormField.vue` |
| P1-41 | Build FormDrawer | ⬜ Not Started | `src/components/forms/FormDrawer.vue` |
| P1-42 | Build QuickAddBar | ⬜ Not Started | `src/components/forms/QuickAddBar.vue` |

---

## Phase 2 — Supabase Setup + Auth

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P2-01 | Create Supabase project | ⬜ Not Started | Supabase dashboard |
| P2-02 | Write initial schema migration | ⬜ Not Started | `supabase/migrations/001_initial_schema.sql` |
| P2-03 | Write RLS policies migration | ⬜ Not Started | `supabase/migrations/002_rls_policies.sql` |
| P2-04 | Write indexes migration | ⬜ Not Started | `supabase/migrations/003_indexes.sql` |
| P2-05 | Write triggers migration | ⬜ Not Started | `supabase/migrations/004_triggers.sql` |
| P2-06 | Run migrations in Supabase | ⬜ Not Started | — |
| P2-07 | Create Supabase client singleton | ⬜ Not Started | `src/lib/supabase.ts` |
| P2-08 | Install @supabase/supabase-js | ⬜ Not Started | `package.json` |
| P2-09 | Implement auth store | ⬜ Not Started | `src/stores/auth.store.ts` |
| P2-10 | Implement useAuth composable | ⬜ Not Started | `src/composables/useAuth.ts` |
| P2-11 | Build LoginPage | ⬜ Not Started | `src/features/auth/LoginPage.vue` |
| P2-12 | Build SignupPage | ⬜ Not Started | `src/features/auth/SignupPage.vue` |
| P2-13 | Build OnboardingPage | ⬜ Not Started | `src/features/auth/OnboardingPage.vue` |
| P2-14 | Implement auth route guards | ⬜ Not Started | `src/router/guards.ts` |
| P2-15 | Configure .env with Supabase credentials | ⬜ Not Started | `.env.example`, `.env.local` |

---

## Phase 3 — App Shell + Routing

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P3-01 | Configure Vue Router with all routes | ⬜ Not Started | `src/router/index.ts` |
| P3-02 | Wire auth guards to router | ⬜ Not Started | `src/router/guards.ts` |
| P3-03 | Wire AppShell with NavRail + routing | ⬜ Not Started | `src/App.vue`, layout components |
| P3-04 | Implement responsive nav behavior | ⬜ Not Started | NavRail, MobileNav |
| P3-05 | Add route transition animations | ⬜ Not Started | AppShell / router |
| P3-06 | Create placeholder pages for all routes | ⬜ Not Started | `src/features/*/` |
| P3-07 | Wire QuickAddBar stub in header | ⬜ Not Started | AppHeader |
| P3-08 | Wire user menu in header | ⬜ Not Started | AppHeader |

---

## Phase 4 — Core Data Infrastructure

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P4-01 | Define all TypeScript models | ⬜ Not Started | `src/models/*.model.ts` |
| P4-02 | Define enums | ⬜ Not Started | `src/models/enums.ts` |
| P4-03 | Define base model types | ⬜ Not Started | `src/models/base.model.ts` |
| P4-04 | Create Zod schemas | ⬜ Not Started | `src/schemas/*.schema.ts` |
| P4-05 | Implement Dexie database (cache) | ⬜ Not Started | `src/services/cache/db.ts` |
| P4-06 | Implement DB migrations | ⬜ Not Started | `src/services/cache/migrations.ts` |
| P4-07 | Implement BaseRepository | ⬜ Not Started | `src/repositories/base.repository.ts` |
| P4-08 | Implement entity repositories | ⬜ Not Started | `src/repositories/*.repository.ts` |
| P4-09 | Implement base data service | ⬜ Not Started | `src/services/data/base.data.ts` |
| P4-10 | Implement entity data services | ⬜ Not Started | `src/services/data/*.data.ts` |
| P4-11 | Implement app.store.ts | ⬜ Not Started | `src/stores/app.store.ts` |
| P4-12 | Implement useOnline composable | ⬜ Not Started | `src/composables/useOnline.ts` |
| P4-13 | Implement utility functions | ⬜ Not Started | `src/utils/*.ts` |
| P4-14 | Define constants | ⬜ Not Started | `src/constants/*.ts` |

---

## Phase 5 — Household + Members

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P5-01 | Implement household store | ⬜ Not Started | `src/stores/household.store.ts` |
| P5-02 | Implement members data service | ⬜ Not Started | `src/services/data/members.data.ts` |
| P5-03 | Implement household data service | ⬜ Not Started | `src/services/data/household.data.ts` |
| P5-04 | Complete OnboardingPage (create household + member) | ⬜ Not Started | `src/features/auth/OnboardingPage.vue` |
| P5-05 | Build SettingsPage | ⬜ Not Started | `src/features/settings/SettingsPage.vue` |
| P5-06 | Build member management UI | ⬜ Not Started | `src/features/settings/` |

---

## Phase 6 — Money Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P6-01 | Implement Expenses data service + store | ⬜ Not Started | Data service + store |
| P6-02 | Implement Income data service + store | ⬜ Not Started | Data service + store |
| P6-03 | Implement Bills data service + store | ⬜ Not Started | Data service + store |
| P6-04 | Implement Budgets data service + store | ⬜ Not Started | Data service + store |
| P6-05 | Implement SavingsGoals data service + store | ⬜ Not Started | Data service + store |
| P6-06 | Implement GoalContributions data service + store | ⬜ Not Started | Data service + store |
| P6-07 | Build MoneyLayout with sub-nav tabs | ⬜ Not Started | `src/features/money/MoneyLayout.vue` |
| P6-08 | Build ExpensesPage | ⬜ Not Started | Page + components |
| P6-09 | Build IncomePage | ⬜ Not Started | Page + components |
| P6-10 | Build BillsPage | ⬜ Not Started | Page + components |
| P6-11 | Build BudgetsPage | ⬜ Not Started | Page + components |
| P6-12 | Build SavingsPage | ⬜ Not Started | Page + components |
| P6-13 | Build SavingsDetailPage | ⬜ Not Started | Page + components |
| P6-14 | Build MonthSummary component | ⬜ Not Started | Component |

---

## Phase 7 — Tasks Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P7-01 | Implement Tasks data service + store | ⬜ Not Started | Data service + store |
| P7-02 | Implement Subtasks data service + store | ⬜ Not Started | Data service + store |
| P7-03 | Build TasksPage | ⬜ Not Started | Page + components |
| P7-04 | Build TaskDetailPage | ⬜ Not Started | Page + components |
| P7-05 | Implement status transitions | ⬜ Not Started | Store logic |

---

## Phase 8 — Shopping Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P8-01 | Implement Groceries data service + store | ⬜ Not Started | Data service + store |
| P8-02 | Build ShoppingPage | ⬜ Not Started | Page + components |
| P8-03 | Implement quick-add | ⬜ Not Started | Component |

---

## Phase 9 — Inventory Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P9-01 | Implement Inventory data service + store | ⬜ Not Started | Data service + store |
| P9-02 | Build InventoryPage | ⬜ Not Started | Page + components |
| P9-03 | Build StockBadge component | ⬜ Not Started | Component |

---

## Phase 10 — Reminders Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P10-01 | Implement Reminders data service + store | ⬜ Not Started | Data service + store |
| P10-02 | Build RemindersPage | ⬜ Not Started | Page + components |
| P10-03 | Implement linked entity display | ⬜ Not Started | Component logic |

---

## Phase 11 — Notes Module

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P11-01 | Implement Notes data service + store | ⬜ Not Started | Data service + store |
| P11-02 | Build NotesPage | ⬜ Not Started | Page + components |
| P11-03 | Build NoteDetailPage | ⬜ Not Started | Page + components |

---

## Phase 12 — Dashboard

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P12-01 | Build DashboardPage | ⬜ Not Started | `src/features/dashboard/DashboardPage.vue` |
| P12-02 | Build TasksDueCard | ⬜ Not Started | Component |
| P12-03 | Build UpcomingBillsCard | ⬜ Not Started | Component |
| P12-04 | Build RecentExpensesCard | ⬜ Not Started | Component |
| P12-05 | Build SavingsProgressCard | ⬜ Not Started | Component |
| P12-06 | Build LowStockCard | ⬜ Not Started | Component |
| P12-07 | Build RemindersCard | ⬜ Not Started | Component |
| P12-08 | Build PinnedNotesCard | ⬜ Not Started | Component |

---

## Phase 13 — Maintenance Module (Deferred)

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P13-01 | Implement Maintenance data service + store | ⬜ Deferred | Data service + store |
| P13-02 | Build MaintenancePage | ⬜ Deferred | Page + components |

---

## Phase 14 — Polish + Deploy

### Tasks

| ID | Task | Status | Files |
|---|---|---|---|
| P14-01 | Write unit tests (data services, stores, utils) | ⬜ Not Started | `tests/unit/` |
| P14-02 | Write E2E tests (critical flows) | ⬜ Not Started | `tests/e2e/` |
| P14-03 | Accessibility audit | ⬜ Not Started | — |
| P14-04 | Performance audit | ⬜ Not Started | — |
| P14-05 | Configure CI (lint + typecheck + test + build) | ⬜ Not Started | `.github/workflows/ci.yml` |
| P14-06 | Set up Cloudflare Pages deployment | ⬜ Not Started | — |
| P14-07 | Write deployment docs | ⬜ Not Started | `docs/deployment.md` |
| P14-08 | Final visual polish pass | ⬜ Not Started | — |

---

## Change Log

| Date | Change |
|---|---|
| 2026-04-15 | Initial plan.md, progress.md, folder structure, agent definitions created (P0-01 through P0-04) |
| 2026-04-15 | Migrated architecture from Google Sheets + Apps Script to Supabase. Updated plan.md, progress.md, agents, directory structure. |
