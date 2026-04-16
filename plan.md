# Stead — Household Management App: Master Plan

> **Last updated:** 2026-04-15
> **Status:** Phase 0 — Scaffold

---

## Table of Contents

1. [Mission](#1-mission)
2. [Final Stack](#2-final-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Auth Strategy](#4-auth-strategy)
5. [Local-First Cache & Sync](#5-local-first-cache--sync)
6. [Postgres Schema Design](#6-postgres-schema-design)
7. [Row Level Security Strategy](#7-row-level-security-strategy)
8. [Index Strategy](#8-index-strategy)
9. [Supabase Free-Tier Protection Plan](#9-supabase-free-tier-protection-plan)
10. [Design System Specification](#10-design-system-specification)
11. [Route Map](#11-route-map)
12. [Folder Structure](#12-folder-structure)
13. [Domain Models](#13-domain-models)
14. [Frontend Service & Repository Structure](#14-frontend-service--repository-structure)
15. [Frontend State Management](#15-frontend-state-management)
16. [UI Component Inventory](#16-ui-component-inventory)
17. [MVP Milestone Plan](#17-mvp-milestone-plan)
18. [Agent Workflow & Delegation](#18-agent-workflow--delegation)
19. [Git & Repo Governance](#19-git--repo-governance)
20. [Code Review Rules](#20-code-review-rules)
21. [Risks & Simplifications](#21-risks--simplifications)
22. [Naming Conventions](#22-naming-conventions)
23. [Environment Variables](#23-environment-variables)
24. [Migration Notes](#24-migration-notes)

---

## 1. Mission

Build a modern, polished, local-first household management SPA for a family. Deployed on Cloudflare Pages free tier. Supabase (free tier) provides Postgres database, authentication, and row-level security.

### Modules

1. **Dashboard** — at-a-glance household overview
2. **Money** — income, expenses, bills, budgets, savings goals, contributions
3. **Tasks** — chores with subtasks, assignees, priorities, recurrence
4. **Shopping** — grocery list with categories, priorities, status
5. **Inventory** — household stock tracking with human-readable statuses
6. **Reminders** — date-based alerts linked to entities
7. **Notes** — freeform notes with categories and pinning
8. **Maintenance** — home/vehicle maintenance tracking (deferred to Phase 13)

### Non-Negotiable Constraints

- Static SPA on Cloudflare Pages free tier
- No traditional backend server
- Supabase (free tier) for Postgres, Auth, and RLS — no paid infrastructure
- All data access through `@supabase/supabase-js` typed client
- Local-first: cached IndexedDB data loads first, then stale-while-revalidate sync
- No OCR, image upload, file storage, AI/ML, bank integrations, barcode scanning, voice, push notifications, or Supabase Realtime (MVP)
- All monetary values stored as integer cents (no floating-point)

---

## 2. Final Stack

| Layer | Choice | Justification |
|---|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) | Lightweight, excellent TS support, ideal for SPA |
| Language | TypeScript (strict mode) | Type safety across models, stores, API contracts |
| Build tool | Vite 6 | Fast dev, native TS/Vue support, optimal for CF Pages |
| Router | Vue Router 4 | Standard Vue routing, lazy-loaded routes |
| State | Pinia | Official Vue state, typed stores, devtools |
| Local DB | Dexie.js 4 | Typed IndexedDB wrapper, migrations, ergonomic API |
| Design | Material Design 3-inspired custom tokens + Vue components | Full control with a coherent system language and custom brand execution |
| Validation | Zod | Runtime schema validation for API responses and forms |
| Dates | date-fns | Tree-shakeable, modern |
| Icons | Lucide outline icons | Modern outline style with broad coverage and consistent stroke language |
| Linting | ESLint 9 (flat config) + @typescript-eslint | Code quality |
| Formatting | Prettier | Consistent style |
| Unit tests | Vitest | Vite-native, fast |
| E2E tests | Playwright | Cross-browser, critical flows |
| Hosting | Cloudflare Pages (free tier) | Static hosting, GitHub auto-deploy |
| Database | Supabase Postgres (free tier) | Managed Postgres, 500 MB, row-level security |
| Auth | Supabase Auth | Email/password, JWT, session management |
| API | Supabase PostgREST (via @supabase/supabase-js) | Auto-generated typed REST API over Postgres |
| Client SDK | @supabase/supabase-js v2 | Typed client for auth + data + realtime (future) |

### Explicitly NOT used

Next.js, Nuxt, Vercel, Axios, Vuetify/Quasar/PrimeVue, Firebase, Google Sheets, Google Apps Script, Moment.js, native `fetch` for data, Supabase Realtime (MVP), Supabase Edge Functions (MVP), vanilla JS architecture.

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                Cloudflare Pages (Static SPA)              │
│                                                            │
│  Vue Components → Pinia Stores → Dexie.js (IndexedDB)     │
│                        ↕                                   │
│                  Data Service                              │
│              (stale-while-revalidate)                      │
└────────────────────────┬───────────────────────────────────┘
                         │ HTTPS (@supabase/supabase-js)
                         ↓
              ┌──────────────────────────┐
              │        Supabase          │
              │  ┌────────────────────┐  │
              │  │   Supabase Auth    │  │
              │  │  (JWT, sessions)   │  │
              │  └────────────────────┘  │
              │  ┌────────────────────┐  │
              │  │   PostgREST API    │  │
              │  │  (auto-generated)  │  │
              │  └────────────────────┘  │
              │  ┌────────────────────┐  │
              │  │     Postgres       │  │
              │  │  (RLS-protected)   │  │
              │  └────────────────────┘  │
              └──────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Vue Components | Pure UI rendering, user input, emit events upward |
| Pinia Stores | Reactive state, computed derivations, actions call data service |
| Data Service | Stale-while-revalidate: serve from IDB cache, fetch from Supabase in background, update cache |
| Dexie.js | IndexedDB wrapper; persistent local cache for all entities |
| Supabase Client | Typed SDK for auth, queries, inserts, updates, deletes via PostgREST |
| Supabase Auth | Email/password authentication, JWT session, user identity |
| Postgres + RLS | Source of truth; row-level security enforces household data isolation |

### Key Architectural Rules

- UI components NEVER call Supabase directly
- Pinia stores NEVER access IndexedDB directly (go through data service / repositories)
- Data service handles cache-first reads and write-through to Supabase
- All remote data validated with Zod before entering local state
- All entity IDs are UUIDs generated server-side by Postgres (`gen_random_uuid()`)
- All dates are ISO 8601 strings (YYYY-MM-DD for dates, full ISO for timestamps)
- All monetary amounts are integer cents (never floating-point)
- Auth guards protect all routes except `/login` and `/signup`

---

## 4. Auth Strategy

### Authentication Flow

Supabase Auth with email/password. No social login for MVP.

```
1. User opens app → check Supabase session
2. No session → redirect to /login
3. User signs up → create Supabase user → redirect to /onboarding
4. Onboarding → create household + add user as admin member
5. Authenticated → load household data → render app
```

### Session Management

- `@supabase/supabase-js` manages JWT refresh automatically
- Session stored in localStorage by the SDK
- `onAuthStateChange` listener updates auth store reactively
- Token expiry handled by SDK (auto-refresh before 401)

### Auth Guard

```typescript
// src/router/guards.ts
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login' }
  }
})
```

Public routes: `/login`, `/signup`
Protected routes: everything else

### Household Onboarding

After first sign-up:
1. Create a `households` row (user becomes admin)
2. Create a `members` row linked to auth user + household
3. Redirect to dashboard

Joining an existing household: admin shares an invite code (future feature). MVP: single-household, manual member creation by admin.

### Auth Store

```typescript
// src/stores/auth.store.ts
defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const householdId = ref<string | null>(null)
  const memberId = ref<string | null>(null)
  const isAuthenticated = computed(() => !!session.value)

  async function signIn(email: string, password: string) { ... }
  async function signUp(email: string, password: string) { ... }
  async function signOut() { ... }
  async function loadSession() { ... }
})
```

---

## 5. Local-First Cache & Sync

### Strategy: Stale-While-Revalidate

No sync queue. No reconciler. Simplified from the original GAS-based architecture.

```
Read:
1. Return data from IDB cache immediately (stale)
2. Fetch fresh data from Supabase in background
3. Validate with Zod
4. Update IDB cache + Pinia store (revalidate)

Write:
1. Write to Supabase directly (await response)
2. On success → update IDB cache + Pinia store
3. On failure → show error, do NOT cache optimistically
```

### Why No Optimistic Writes

Supabase PostgREST responses are fast (~50-200ms). The complexity of a sync queue + reconciler is not justified. Writes go directly to Supabase; the UI shows a loading state during the write. On success, local cache is updated.

### Startup Sequence

1. App boots → check Supabase auth session
2. No session → redirect to `/login`
3. Session valid → load household/member identity
4. Read all entity tables from IDB into Pinia stores
5. **Render full UI from cached data** (fast, no network)
6. Kick off background revalidation: fetch from Supabase per-entity
7. Validate responses with Zod schemas
8. Update Pinia stores + write to IDB
9. Update `meta.lastFetchedAt`

### Cache Store Schema

```typescript
interface AppMeta {
  key: string               // 'meta' (singleton)
  lastFetchedAt: string     // ISO timestamp
  schemaVersion: number     // for IDB migrations
  appVersion: string
}
```

### Dexie.js Database

Database name: `stead-db`, version: 1.

| Store | Indexes |
|---|---|
| members | id, household_id |
| expenses | id, household_id, date, category |
| income | id, household_id, date |
| bills | id, household_id, status |
| budgets | id, household_id, month |
| savings_goals | id, household_id, status |
| goal_contributions | id, goal_id |
| tasks | id, household_id, status, due_date, assignee |
| subtasks | id, task_id |
| groceries | id, household_id, status, category |
| inventory | id, household_id, stock_status |
| reminders | id, household_id, due_date, status |
| notes | id, household_id, pinned |
| maintenance | id, household_id, status, next_due_date |
| meta | key |

No `syncQueue` table. No `syncStatus` field on entities.

---

## 6. Postgres Schema Design

### Conventions

- All table and column names: `snake_case`
- All primary keys: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
- All timestamps: `timestamptz` with `DEFAULT now()`
- All money: `integer` (cents, not dollars — e.g., `1599` = $15.99)
- Soft deletes: `deleted boolean DEFAULT false`
- Every data table has `household_id uuid REFERENCES households(id)` for RLS

### Tables

#### households

```sql
CREATE TABLE households (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### members

```sql
CREATE TABLE members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  color text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### expenses

```sql
CREATE TABLE expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  date date NOT NULL,
  amount integer NOT NULL,
  category text NOT NULL,
  subcategory text,
  description text NOT NULL,
  paid_by uuid REFERENCES members(id) NOT NULL,
  shared boolean DEFAULT false,
  tags text[],
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### income

```sql
CREATE TABLE income (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  date date NOT NULL,
  amount integer NOT NULL,
  source text NOT NULL,
  category text NOT NULL,
  received_by uuid REFERENCES members(id) NOT NULL,
  recurring boolean DEFAULT false,
  recurring_rule text,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### bills

```sql
CREATE TABLE bills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  name text NOT NULL,
  amount integer NOT NULL,
  category text NOT NULL,
  due_day integer NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'custom')),
  auto_pay boolean DEFAULT false,
  paid_by uuid REFERENCES members(id),
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'paid', 'overdue', 'skipped')),
  last_paid_date date,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### budgets

```sql
CREATE TABLE budgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  month text NOT NULL,
  category text NOT NULL,
  budget_amount integer NOT NULL,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### savings_goals

```sql
CREATE TABLE savings_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  name text NOT NULL,
  target_amount integer NOT NULL,
  current_amount integer DEFAULT 0,
  deadline date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reached', 'paused', 'cancelled')),
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### goal_contributions

```sql
CREATE TABLE goal_contributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  goal_id uuid REFERENCES savings_goals(id) NOT NULL,
  amount integer NOT NULL,
  date date NOT NULL,
  contributed_by uuid REFERENCES members(id) NOT NULL,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### tasks

```sql
CREATE TABLE tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  title text NOT NULL,
  description text,
  assignee uuid REFERENCES members(id),
  room text,
  category text,
  due_date date,
  recurring_rule text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done', 'skipped', 'overdue')),
  completed_at timestamptz,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### subtasks

```sql
CREATE TABLE subtasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  task_id uuid REFERENCES tasks(id) NOT NULL,
  title text NOT NULL,
  done boolean DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### groceries

```sql
CREATE TABLE groceries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  name text NOT NULL,
  quantity integer DEFAULT 1,
  unit text,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  assigned_to uuid REFERENCES members(id),
  status text NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'in_cart', 'bought', 'skipped')),
  preferred_store text,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### inventory

```sql
CREATE TABLE inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  stock_status text NOT NULL DEFAULT 'enough' CHECK (stock_status IN ('out', 'almost_finished', 'low', 'enough', 'extra_stock')),
  target_level text NOT NULL DEFAULT 'keep_1' CHECK (target_level IN ('keep_1', 'keep_2', 'keep_3_plus', 'weekly_item', 'monthly_item')),
  restock_needed boolean DEFAULT false,
  last_checked_date date,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### reminders

```sql
CREATE TABLE reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  linked_entity_type text,
  linked_entity_id uuid,
  due_date date NOT NULL,
  repeat_rule text,
  assigned_to uuid REFERENCES members(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'snoozed', 'dismissed', 'done')),
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### notes

```sql
CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  title text NOT NULL,
  category text,
  content text NOT NULL DEFAULT '',
  pinned boolean DEFAULT false,
  linked_type text,
  linked_id uuid,
  created_by uuid REFERENCES members(id) NOT NULL,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### maintenance

```sql
CREATE TABLE maintenance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  item text NOT NULL,
  type text NOT NULL,
  last_done_date date,
  next_due_date date,
  recurring_rule text,
  estimated_cost integer,
  assigned_to uuid REFERENCES members(id),
  vendor text,
  contact text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'overdue', 'done', 'skipped')),
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);
```

#### settings

```sql
CREATE TABLE settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(household_id, key)
);
```

#### activity_log

```sql
CREATE TABLE activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  timestamp timestamptz DEFAULT now(),
  actor_id uuid REFERENCES members(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  summary text
);
```

### Updated-At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every data table:
CREATE TRIGGER set_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repeat for all tables)
```

---

## 7. Row Level Security Strategy

### Principle

Every data table is protected by RLS policies that restrict access to rows belonging to the user's household. The user's household membership is verified via a helper function.

### Helper Function

```sql
CREATE OR REPLACE FUNCTION is_household_member(h_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE household_id = h_id
    AND user_id = auth.uid()
    AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Policy Pattern (applied to every data table)

```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household expenses"
  ON expenses FOR SELECT
  USING (is_household_member(household_id));

CREATE POLICY "Users can insert own household expenses"
  ON expenses FOR INSERT
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can update own household expenses"
  ON expenses FOR UPDATE
  USING (is_household_member(household_id))
  WITH CHECK (is_household_member(household_id));

CREATE POLICY "Users can delete own household expenses"
  ON expenses FOR DELETE
  USING (is_household_member(household_id));
```

The same four policies are applied to every data table (members, income, bills, budgets, savings_goals, goal_contributions, tasks, subtasks, groceries, inventory, reminders, notes, maintenance, settings, activity_log).

### Households Table Policy

```sql
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household"
  ON households FOR SELECT
  USING (is_household_member(id));

CREATE POLICY "Admins can update own household"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE household_id = id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND active = true
    )
  );
```

### Members Table — Self-Insert for Onboarding

```sql
CREATE POLICY "Users can create their own member record"
  ON members FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

---

## 8. Index Strategy

Indexes based on actual query patterns. Only add indexes that support real queries.

```sql
-- Expenses: list by date range, filter by category
CREATE INDEX idx_expenses_household_date ON expenses (household_id, date DESC);
CREATE INDEX idx_expenses_household_category ON expenses (household_id, category);

-- Income: list by date
CREATE INDEX idx_income_household_date ON income (household_id, date DESC);

-- Bills: filter by status
CREATE INDEX idx_bills_household_status ON bills (household_id, status);

-- Budgets: filter by month
CREATE INDEX idx_budgets_household_month ON budgets (household_id, month);

-- Savings Goals: filter by status
CREATE INDEX idx_savings_goals_household_status ON savings_goals (household_id, status);

-- Goal Contributions: list by goal
CREATE INDEX idx_goal_contributions_goal ON goal_contributions (goal_id);

-- Tasks: filter by status, assignee, due date
CREATE INDEX idx_tasks_household_status ON tasks (household_id, status);
CREATE INDEX idx_tasks_household_due ON tasks (household_id, due_date);
CREATE INDEX idx_tasks_household_assignee ON tasks (household_id, assignee);

-- Subtasks: list by task
CREATE INDEX idx_subtasks_task ON subtasks (task_id);

-- Groceries: filter by status, category
CREATE INDEX idx_groceries_household_status ON groceries (household_id, status);

-- Inventory: filter by stock status
CREATE INDEX idx_inventory_household_stock ON inventory (household_id, stock_status);

-- Reminders: filter by due date, status
CREATE INDEX idx_reminders_household_due ON reminders (household_id, due_date);
CREATE INDEX idx_reminders_household_status ON reminders (household_id, status);

-- Notes: filter by pinned
CREATE INDEX idx_notes_household_pinned ON notes (household_id, pinned);

-- Maintenance: filter by status, next due date
CREATE INDEX idx_maintenance_household_status ON maintenance (household_id, status);
CREATE INDEX idx_maintenance_household_due ON maintenance (household_id, next_due_date);

-- Members: lookup by household, user
CREATE INDEX idx_members_household ON members (household_id);
CREATE INDEX idx_members_user ON members (user_id);

-- Activity Log: list by household, time
CREATE INDEX idx_activity_log_household ON activity_log (household_id, timestamp DESC);

-- Settings: lookup by household + key
CREATE INDEX idx_settings_household ON settings (household_id);
```

---

## 9. Supabase Free-Tier Protection Plan

The Supabase free tier allows: 500 MB database, 1 GB file storage, 50k monthly active users, 2 GB bandwidth, 500k Edge Function invocations. Stead is a family app—traffic is tiny—but these rules prevent accidental waste.

### Rules

1. **No Supabase Realtime for MVP** — Realtime channels consume bandwidth even when idle. Use manual refresh + stale-while-revalidate instead.
2. **No Supabase Edge Functions for MVP** — All logic runs client-side. No need for serverless functions.
3. **No Supabase Storage** — No file/image uploads. All data is text in Postgres.
4. **Cache-first reads** — Always serve from IDB cache first. Only fetch from Supabase on background revalidation or explicit refresh.
5. **Paginate large tables** — Expenses and activity_log queries use `LIMIT 100` + cursor-based pagination. Never `SELECT *` unbounded.
6. **Filter at the database, not client** — Use Supabase query filters (`.eq()`, `.gte()`, `.order()`) instead of fetching all rows and filtering in JS.
7. **Batch writes where possible** — Use Supabase's `.upsert()` for bulk operations instead of individual inserts.
8. **Select only needed columns** — Use `.select('id, name, amount, date')` instead of `.select('*')` for list views. Full record only on detail views.
9. **Minimize auth token refresh** — SDK handles this automatically; don't add custom refresh logic.
10. **Monitor usage** — Check Supabase dashboard monthly. Set up alerts if available.

### Bandwidth Budget (rough estimate)

- 4 family members, ~10 syncs/day each = 40 fetches/day
- Average response: ~5 KB per entity table × 15 tables = 75 KB per full sync
- Daily: 40 × 75 KB = 3 MB/day
- Monthly: ~90 MB — well under 2 GB limit

---

## 10. Design System Specification

### 10.0 Design Philosophy — "Quiet Confidence"

Stead's visual identity is built on the principle of **quiet confidence**: an interface that communicates quality through restraint, craft, and intentional detail — not through flashiness or visual noise.

**Core Aesthetic Direction:**
- **Warm professionalism** — not sterile enterprise, not playful toy-app. Think: a carefully tuned Material 3 product adapted for family routines.
- **Material 3 as system foundation** — we use Material 3 concepts for surface roles, elevation, navigation families, and state layers, then tailor them to Stead's tone and information density.
- **Depth and layering** — surfaces feel intentional even on pure white and pure black foundations. Cards, drawers, and bars must read as distinct container levels.
- **Typography does the heavy lifting** — hierarchy should come first from weight, size, rhythm, and contrast. Decorative styling is secondary.
- **Structural clarity across breakpoints** — desktop, tablet, and phone each get one primary navigation pattern with explicit affordances and no overlap.
- **Motion as communication** — animations confirm change, entry, and focus. Staggered page entry remains the signature Stead pattern.
- **Sparse brand color** — brand color appears with purpose for action, focus, active state, and emphasis. Containers and neutrals carry the bulk of the interface.

**Visual Quality Gates (every page/component must pass):**
1. Can you identify the most important element within 0.5 seconds?
2. Are there 3+ distinct levels of typographic hierarchy?
3. Do interactive elements respond visually to hover, focus, and press?
4. Does the page load with a staggered entry animation, not an instant flash?
5. Is there generous whitespace creating calm, not padding creating uniformity?
6. Does every card/surface have subtle depth (shadow, border, or bg contrast)?
7. Would a designer mistake this for AI-generated scaffolding? (If yes, iterate.)

**Anti-Patterns to NEVER produce:**
- Flat rectangles with a color theme and no shadow/depth
- Uniform padding/margin everywhere (identical spacing signals laziness)
- "No data found" empty states with no illustration, context, or CTA
- Linear easing on any transition (always use decelerate or standard curves)
- Every card looking identical (visual monotony kills perceived quality)
- Pages that feel like spreadsheets — if it's tabular, add visual breaks
- Cookie-cutter component grids with zero spatial personality
- Collapsible navigation with no visible way to expand it again
- Phone layouts showing both drawer/sidebar navigation and bottom navigation simultaneously

### 10.1 Color Tokens (Light Theme)

```css
/* Brand */
--color-brand-primary: #0F6CBD;
--color-brand-hover: #115EA3;
--color-brand-pressed: #0C3B5E;
--color-brand-selected: #EBF3FC;
--color-brand-subtle: #CFE4FA;

/* Neutral Backgrounds */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #FAFAFA;
--color-bg-tertiary: #F0F0F0;
--color-bg-elevated: #FFFFFF;
--color-bg-overlay: rgba(0, 0, 0, 0.4);

/* Neutral Foregrounds */
--color-fg-primary: #242424;
--color-fg-secondary: #616161;
--color-fg-tertiary: #9E9E9E;
--color-fg-disabled: #BDBDBD;
--color-fg-on-brand: #FFFFFF;

/* Semantic */
--color-success: #0E7A0D;
--color-success-bg: #DFF6DD;
--color-warning: #D48C00;
--color-warning-bg: #FFF1CC;
--color-error: #C4314B;
--color-error-bg: #FDE7E9;
--color-info: #0078D4;
--color-info-bg: #E1F5FE;

/* Borders */
--color-border-default: #E0E0E0;
--color-border-strong: #D1D1D1;
--color-border-subtle: #F0F0F0;
--color-border-brand: #0F6CBD;

/* Surfaces */
--color-surface-card: #FFFFFF;
--color-surface-dialog: #FFFFFF;
--color-surface-nav: #FAFAFA;
```

Dark theme: same token names, different values under `:root[data-theme="dark"]`. Deferred for MVP.

### 10.2 Spacing Scale

```css
--space-2xs: 2px;
--space-xs: 4px;
--space-s: 8px;
--space-m: 12px;
--space-l: 16px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 48px;
--space-4xl: 64px;
```

### 10.3 Typography

```css
--font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;

--text-display: 600 28px/36px var(--font-family);
--text-title-1: 600 24px/32px var(--font-family);
--text-title-2: 600 20px/28px var(--font-family);
--text-title-3: 600 16px/22px var(--font-family);
--text-body-1: 400 14px/20px var(--font-family);
--text-body-1-strong: 600 14px/20px var(--font-family);
--text-body-2: 400 12px/16px var(--font-family);
--text-caption: 400 11px/14px var(--font-family);
```

Weight rules: 400 for body, 600 for headings/emphasis. Never use 300 or 800+.

### 10.4 Border Radius

```css
--radius-s: 4px;
--radius-m: 8px;
--radius-l: 12px;
--radius-xl: 16px;
--radius-circle: 50%;
```

### 10.5 Shadows

```css
--shadow-2: 0 1px 2px rgba(0, 0, 0, 0.12);
--shadow-4: 0 2px 4px rgba(0, 0, 0, 0.14);
--shadow-8: 0 4px 8px rgba(0, 0, 0, 0.14);
--shadow-16: 0 8px 16px rgba(0, 0, 0, 0.14);
--shadow-28: 0 14px 28px rgba(0, 0, 0, 0.14);
```

### 10.6 Motion

```css
--duration-ultra-fast: 50ms;
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-page: 250ms;

--easing-standard: cubic-bezier(0.33, 0, 0.67, 1);
--easing-decelerate: cubic-bezier(0, 0, 0, 1);
--easing-accelerate: cubic-bezier(1, 0, 1, 1);
```

Rules:
- Hover/focus transitions: `duration-fast` + `easing-standard`
- Drawer/panel slide: `duration-normal` + `easing-decelerate`
- Page transitions: `duration-page` + `easing-decelerate`
- Respect `prefers-reduced-motion`: disable all transitions except opacity

### 10.7 Breakpoints

```css
--bp-mobile: 640px;
--bp-tablet: 1024px;
--bp-desktop: 1280px;
--bp-wide: 1440px;
```

- Mobile: < 640px → stacked nav, full-width content
- Tablet: 640–1024px → collapsed nav rail (72px), fluid content
- Desktop: > 1024px → expanded nav rail (240px), max-width content (1200px)

### 10.8 Layout System

```
┌─────────────────────────────────────────────────┐
│ Header (48px)    [Logo] [QuickAdd] [User] [?]   │
├───────┬─────────────────────────────────────────┤
│ Nav   │ Page Content                             │
│ Rail  │ ┌───────────────────────────────────┐   │
│(72/   │ │ PageHeader                        │   │
│240px) │ │ FilterBar                         │   │
│       │ │ Content (list/cards/detail)        │   │
│       │ └───────────────────────────────────┘   │
└───────┴─────────────────────────────────────────┘
```

- Cards: `--radius-l`, `--shadow-2`, white bg
- Detail drawers: slide from right, 480px desktop, full-width mobile

### 10.9 Component Patterns

**Interactive states:** Default → Hover (bg shift + shadow lift, `duration-fast` + `easing-standard`) → Pressed (shadow reduction, subtle scale 0.98) → Focused (2px brand outline offset 2px, clearly visible). Disabled: 40% opacity, no pointer events, no hover.

**Depth hierarchy:**
- Page background: `--color-bg-secondary`
- Content cards: `--color-surface-card` + `--shadow-2`, hover → `--shadow-4`
- Elevated surfaces (dropdowns, tooltips): `--shadow-8`
- Modal drawers: `--shadow-16` + scrim overlay
- Dialogs: `--shadow-28` + scrim, centered

**Page entry animation (signature Stead pattern):**
```css
.page-enter {
  animation: fadeSlideUp var(--duration-normal) var(--easing-decelerate) backwards;
  animation-delay: calc(var(--stagger-index, 0) * 50ms);
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
}

@media (prefers-reduced-motion: reduce) {
  .page-enter { animation: fadeOnly var(--duration-normal) backwards; }
  @keyframes fadeOnly { from { opacity: 0; } }
}
```
Apply `--stagger-index: 0` to PageHeader, `1` to FilterBar, `2` to content, etc.

**Forms:** Labels above inputs, 36px input height, `--radius-m`, inner shadow on inputs for inset feel. Red border + error text on invalid. Sections grouped with titles and separated by `--space-2xl`. Submit button in a sticky footer on mobile.

**Lists:** 48px row min-height, hover `--color-bg-secondary` + slight shadow lift, 1px subtle dividers between items. Sticky section headers. List items animate in with staggered translateY on first load.

**Cards:** `--radius-l` + `--shadow-2` + `--color-surface-card`. Hover: shadow increases to `--shadow-4`. Never use border as the only depth indicator — always pair with shadow.

**Empty states:** Centered area with a contextual icon/illustration (not generic), a title explaining the state ("No expenses this month"), a subtitle with guidance ("Add your first expense to start tracking"), and a prominent CTA button. Every empty state should feel designed for its specific context.

**Loading:** Skeleton shimmer that mirrors the actual content layout (e.g., skeleton rows match data row proportions, skeleton cards match card dimensions). Never use a single centered spinner for page-level loading.

**Errors:** Inline banner with `--color-error-bg` background, clear error description, and a retry action button. Never show raw error messages to users.

---

## 11. Route Map

```
/login                     → LoginPage (public)
/signup                    → SignupPage (public)
/onboarding                → OnboardingPage (authenticated, no household)
/                          → DashboardPage
/money                     → MoneyLayout (redirect → /money/expenses)
/money/expenses            → ExpensesPage
/money/income              → IncomePage
/money/bills               → BillsPage
/money/budgets             → BudgetsPage
/money/savings             → SavingsPage
/money/savings/:goalId     → SavingsDetailPage
/tasks                     → TasksPage
/tasks/:taskId             → TaskDetailPage
/shopping                  → ShoppingPage
/inventory                 → InventoryPage
/reminders                 → RemindersPage
/notes                     → NotesPage
/notes/:noteId             → NoteDetailPage
/maintenance               → MaintenancePage
/settings                  → SettingsPage
```

All routes lazy-loaded. Auth guard redirects unauthenticated users to `/login`. `MoneyLayout` provides sub-nav tabs.

---

## 12. Folder Structure

```
stead/
├── .github/
│   ├── agents/                       # VS Code Copilot agent definitions
│   │   ├── supervisor.agent.md
│   │   ├── architect.agent.md
│   │   ├── design-system.agent.md
│   │   ├── frontend.agent.md
│   │   ├── data-model.agent.md
│   │   ├── supabase.agent.md
│   │   ├── sync-storage.agent.md
│   │   ├── qa.agent.md
│   │   ├── code-review.agent.md
│   │   └── documentation.agent.md
│   ├── copilot-instructions.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_indexes.sql
│       └── 004_triggers.sql
├── docs/
│   ├── architecture.md
│   ├── design-system.md
│   ├── local-first-cache.md
│   ├── supabase-schema.md
│   ├── deployment.md
│   ├── coding-standards.md
│   └── adr/
│       ├── 001-tech-stack.md
│       ├── 002-local-first-cache.md
│       ├── 003-design-system.md
│       └── 004-sheets-to-supabase.md
├── public/
│   ├── favicon.svg
│   └── manifest.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── env.d.ts
│   ├── lib/
│   │   └── supabase.ts              # Supabase client singleton
│   ├── components/
│   │   ├── ui/          (SButton, SInput, SSelect, STextarea, SCheckbox, etc.)
│   │   ├── layout/      (AppShell, AppHeader, NavRail, NavItem, etc.)
│   │   ├── feedback/    (EmptyState, LoadingSkeleton, StatusBadge, etc.)
│   │   ├── data/        (FilterBar, SortMenu, DataList, InlineStat, etc.)
│   │   └── forms/       (FormSection, FormField, FormDrawer, QuickAddBar)
│   ├── features/
│   │   ├── auth/        (LoginPage, SignupPage, OnboardingPage)
│   │   ├── dashboard/
│   │   ├── money/
│   │   ├── tasks/
│   │   ├── shopping/
│   │   ├── inventory/
│   │   ├── reminders/
│   │   ├── notes/
│   │   ├── maintenance/
│   │   └── settings/
│   ├── stores/
│   ├── services/
│   │   ├── cache/       (Dexie database, cache utilities)
│   │   └── data/        (per-entity data services: fetch, create, update, delete via Supabase + cache)
│   ├── repositories/
│   ├── models/
│   ├── schemas/
│   ├── composables/
│   ├── router/
│   ├── utils/
│   ├── styles/
│   ├── tokens/
│   └── constants/
├── tests/
│   ├── unit/
│   └── e2e/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
├── .gitignore
├── .env.example
├── package.json
├── plan.md
├── progress.md
└── README.md
```

---

## 13. Domain Models

### 13.1 Base Types

```typescript
interface BaseEntity {
  id: string              // UUID, generated server-side by Postgres
  created_at: string      // ISO 8601 timestamptz
  updated_at: string      // ISO 8601 timestamptz
}

interface HouseholdEntity extends BaseEntity {
  household_id: string    // FK to households
  updated_by?: string     // member ID
  deleted: boolean        // soft delete flag
}
```

No `syncStatus` field. No `LocalEntity` type. Sync state is not tracked per-record.

### 13.2 Enums

```typescript
type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'skipped' | 'overdue'
type TaskPriority = 'high' | 'medium' | 'low'
type BillFrequency = 'monthly' | 'quarterly' | 'annual' | 'custom'
type BillStatus = 'upcoming' | 'paid' | 'overdue' | 'skipped'
type GoalStatus = 'active' | 'reached' | 'paused' | 'cancelled'
type GroceryStatus = 'needed' | 'in_cart' | 'bought' | 'skipped'
type StockStatus = 'out' | 'almost_finished' | 'low' | 'enough' | 'extra_stock'
type TargetLevel = 'keep_1' | 'keep_2' | 'keep_3_plus' | 'weekly_item' | 'monthly_item'
type ReminderStatus = 'active' | 'snoozed' | 'dismissed' | 'done'
type MaintenanceStatus = 'upcoming' | 'overdue' | 'done' | 'skipped'
type MemberRole = 'admin' | 'member'
```

No `SyncStatus` or `SyncOperation` types.

### 13.3 Entities

| Entity | Key Fields (beyond base) |
|---|---|
| **Household** | name |
| **Member** | household_id, user_id, name, role, color, active |
| **Expense** | household_id, date, amount (cents), category, subcategory?, description, paid_by, shared, tags?, note? |
| **Income** | household_id, date, amount (cents), source, category, received_by, recurring, recurring_rule?, note? |
| **Bill** | household_id, name, amount (cents), category, due_day, frequency, auto_pay, paid_by?, status, last_paid_date?, note? |
| **Budget** | household_id, month (YYYY-MM), category, budget_amount (cents) |
| **SavingsGoal** | household_id, name, target_amount (cents), current_amount (cents), deadline?, priority, status, note? |
| **GoalContribution** | household_id, goal_id, amount (cents), date, contributed_by, note? |
| **Task** | household_id, title, description?, assignee?, room?, category?, due_date?, recurring_rule?, priority, status, completed_at?, note? |
| **Subtask** | household_id, task_id, title, done, order |
| **GroceryItem** | household_id, name, quantity, unit?, category, priority, assigned_to?, status, preferred_store?, note? |
| **InventoryItem** | household_id, name, category, location, stock_status, target_level, restock_needed, last_checked_date?, note? |
| **Reminder** | household_id, title, type, linked_entity_type?, linked_entity_id?, due_date, repeat_rule?, assigned_to?, status, note? |
| **Note** | household_id, title, category?, content, pinned, linked_type?, linked_id?, created_by |
| **MaintenanceItem** | household_id, item, type, last_done_date?, next_due_date?, recurring_rule?, estimated_cost? (cents), assigned_to?, vendor?, contact?, status, note? |

> **Note:** All field names use `snake_case` to match Postgres column names. All monetary fields store integer cents.

---

## 14. Frontend Service & Repository Structure

### Data Service Pattern

Each entity has a data service that encapsulates Supabase queries + IDB cache management.

```typescript
// src/services/data/expenses.data.ts
import { supabase } from '@/lib/supabase'
import { db } from '@/services/cache/db'
import { expenseSchema } from '@/schemas/expense.schema'

export const expensesData = {
  async getAll(householdId: string) {
    // 1. Return cached data immediately
    const cached = await db.expenses.where('household_id').equals(householdId).toArray()

    // 2. Fetch fresh from Supabase
    const { data, error } = await supabase
      .from('expenses')
      .select('id, date, amount, category, description, paid_by, shared, note, created_at, updated_at')
      .eq('household_id', householdId)
      .eq('deleted', false)
      .order('date', { ascending: false })
      .limit(100)

    if (error) throw error

    // 3. Validate + cache
    const validated = data.map(row => expenseSchema.parse(row))
    await db.expenses.bulkPut(validated)

    return { cached, fresh: validated }
  },

  async create(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    if (error) throw error
    const validated = expenseSchema.parse(data)
    await db.expenses.put(validated)
    return validated
  },

  // update, softDelete follow similar patterns
}
```

### Repository Layer

Repositories provide IDB-only access for cache reads. Data services use repositories internally.

```typescript
// src/repositories/base.repository.ts
export class BaseRepository<T> {
  constructor(private table: Dexie.Table<T, string>) {}

  async getAll(): Promise<T[]> { return this.table.toArray() }
  async getById(id: string): Promise<T | undefined> { return this.table.get(id) }
  async put(entity: T): Promise<void> { await this.table.put(entity) }
  async putMany(entities: T[]): Promise<void> { await this.table.bulkPut(entities) }
  async remove(id: string): Promise<void> { await this.table.delete(id) }
  async clear(): Promise<void> { await this.table.clear() }
}
```

---

## 15. Frontend State Management

### Store Architecture

Each entity has a Pinia store:

```typescript
defineStore('expenses', () => {
  const items = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const itemById = computed(...)
  const filtered = computed(...)

  // Actions
  async function loadFromCache() { ... }       // IDB → state
  async function fetchFresh() { ... }          // Supabase → validate → IDB → state
  async function create(data) { ... }          // Supabase → IDB → state
  async function update(id, data) { ... }      // Supabase → IDB → state
  async function remove(id) { ... }            // Supabase soft-delete → IDB → state
})
```

### Special Stores

- **auth.store.ts**: user, session, householdId, memberId, isAuthenticated, signIn(), signUp(), signOut()
- **household.store.ts**: household details, members list
- **app.store.ts**: theme, sidebarExpanded, mobileSidebarOpen

### Data Flow

```
Write:
Component → Store Action → Data Service → Supabase → IDB Cache → Store State → Component

Read (startup):
IDB Cache → Store.loadFromCache() → Component renders (stale)
   ↓ (background)
Supabase → Data Service → Validate (Zod) → IDB Cache → Store State → Component re-renders (fresh)
```

---

## 16. UI Component Inventory

### Primitive (components/ui/)

| Component | Purpose | Key Props |
|---|---|---|
| SButton | Action button | variant, size, disabled, loading |
| SIconButton | Icon-only button | icon, ariaLabel, variant, size |
| SInput | Text input | label, modelValue, type, placeholder, error, hint |
| STextarea | Multi-line text | label, modelValue, rows, error |
| SSelect | Dropdown select | label, modelValue, options, placeholder, error |
| SCheckbox | Boolean toggle | label, modelValue |
| SSearch | Search input | modelValue, placeholder |
| SBadge | Label/tag | label, variant, size |
| SAvatar | Member avatar | name, color, size |
| SToggle | On/off switch | label, modelValue |
| STooltip | Hover info | content, position |

### Layout (components/layout/)

| Component | Purpose |
|---|---|
| AppShell | Root layout: header + nav + content |
| AppHeader | Top bar: logo, quick add, user menu |
| NavRail | Side navigation (collapsible) |
| NavItem | Single nav link |
| MobileNav | Bottom tab bar for mobile |
| PageHeader | Page title + primary action |
| PageContainer | Max-width content wrapper |
| ContentCard | Elevated card container |

### Feedback (components/feedback/)

| Component | Purpose |
|---|---|
| EmptyState | No-data placeholder with CTA |
| LoadingSkeleton | Shimmer placeholder |
| StatusBadge | Entity status display |
| ErrorBanner | Inline error with retry |
| ConfirmDialog | Destructive action confirmation |

### Data (components/data/)

| Component | Purpose |
|---|---|
| FilterBar | Filter controls container |
| SortMenu | Sort option dropdown |
| DataList | Generic list with empty/loading states |
| InlineStat | Key-value metric display |
| SectionHeader | Section divider with title |

### Forms (components/forms/)

| Component | Purpose |
|---|---|
| FormSection | Grouped form fields with title |
| FormField | Label + input + error wrapper |
| FormDrawer | Slide-out panel for create/edit |
| QuickAddBar | Command-bar style quick entry |

---

## 17. MVP Milestone Plan (Vertical Slices)

| Phase | Name | Depends On | Deliverable |
|---|---|---|---|
| **P0** | Project Scaffold | — | Vite+Vue+TS project, folders, tooling, plan.md, progress.md, agents |
| **P1** | Design System Foundation | P0 | All token CSS, all shared components, dev preview |
| **P2** | Supabase Setup + Auth | P0 | Supabase project, migrations, auth pages, auth store, route guards |
| **P3** | App Shell + Routing | P1, P2 | Navigable shell, NavRail, responsive mobile nav, placeholder pages |
| **P4** | Core Data Infrastructure | P2 | Dexie DB, models, schemas, data services, base repository |
| **P5** | Household + Members | P4 | Household creation, member management, onboarding flow |
| **P6** | Money Module | P3, P4, P5 | Full CRUD for expenses, income, bills, budgets, savings, contributions |
| **P7** | Tasks Module | P3, P4, P5 | Full tasks + subtasks with status transitions |
| **P8** | Shopping Module | P3, P4, P5 | Grocery list with quick-add, category grouping |
| **P9** | Inventory Module | P3, P4, P5 | Stock tracking with human-readable statuses |
| **P10** | Reminders Module | P3, P4, P5 | Reminders sorted by due date, linked entities |
| **P11** | Notes Module | P3, P4, P5 | Note cards, pinning, detail view |
| **P12** | Dashboard | P6–P11 | Aggregation cards from all entity stores |
| **P13** | Maintenance Module | P3, P4 | Deferred — same pipeline |
| **P14** | Polish + Deploy | P0–P12 | Tests, accessibility, CI, Cloudflare Pages deployment |

Phases P6–P11 are independent and can be built in parallel.

---

## 18. Agent Workflow & Delegation

### Agent Roles

| Agent | Mission | Scope |
|---|---|---|
| **Supervisor** | Plan, sequence, delegate, review, enforce standards | Full project; does NOT write feature code directly |
| **Architect** | Architecture decisions, layer enforcement | Structure, patterns, boundaries |
| **Design System** | Visual consistency, token enforcement | `tokens/`, `styles/`, `components/ui/`, `components/layout/` |
| **Frontend** | Build feature pages and components | `features/`, feature composables, store integration |
| **Data Model** | Schema integrity | `models/`, `schemas/`, Postgres column definitions |
| **Supabase** | Database, auth, RLS, migrations | `supabase/migrations/`, `src/lib/supabase.ts`, RLS policies |
| **Sync/Storage** | Local cache infrastructure | `services/cache/`, `services/data/`, `repositories/`, Dexie DB |
| **QA** | Quality assurance | `tests/`, accessibility, manual verification |
| **Code Review** | Quality gate | Reviews all output against full checklist |
| **Documentation** | Docs accuracy | `docs/`, `plan.md`, `progress.md`, `README.md` |

### Task Format

Each task specifies: Task ID, Title, Assigned Agent, Dependencies, Input, Output, Acceptance Criteria, Files to create/modify.

### Review Checklist

Every output must pass:
- [ ] Correct folder placement
- [ ] Naming matches conventions
- [ ] TypeScript strict — no `any`
- [ ] Uses design tokens — no hardcoded colors/spacing
- [ ] Uses shared components — no duplication
- [ ] Store actions go through data service
- [ ] No Supabase calls in UI components
- [ ] Responsive at all breakpoints
- [ ] Empty/loading/error states handled
- [ ] Auth-aware (guards, household scoping)
- [ ] Accessible: focusable, aria labels, contrast
- [ ] No dead code

---

## 19. Git & Repo Governance

### Repository

- **Remote**: `https://github.com/moontasirsoumik/Stead.git`
- **Hosting**: Cloudflare Pages (connected to `deploy` branch)

### Branching Strategy

```
local (working tree)
  │
  ▼  git push
main ─────────────── full project: plans, docs, agents, tests, source
  │
  ▼  selective merge (source + config only)
preview ─────────── build-ready subset → Cloudflare Pages preview environment
  │
  ▼  fast-forward merge (identical content)
deploy ──────────── build-ready subset → Cloudflare Pages production
```

| Branch | Purpose | Contents | Cloudflare |
|---|---|---|---|
| `main` | Development trunk | Everything: plan.md, progress.md, docs/, .github/, tests/, src/, supabase/, etc. | — |
| `preview` | Pre-production preview | Only files needed to build: src/, public/, supabase/, package.json, vite.config.ts, tsconfig.json, index.html, .env.example | Preview environment |
| `deploy` | Production | Same as `preview` — fast-forward merge only | Production environment |

### What goes on `preview`/`deploy` (build-essential only)

```
src/
public/
supabase/
index.html
package.json
package-lock.json
vite.config.ts
tsconfig.json
tsconfig.node.json
.env.example
.gitignore
```

### What stays on `main` only (NOT on preview/deploy)

```
plan.md
progress.md
docs/
.github/
.agents/
.vscode/
tests/
eslint.config.js
.prettierrc
README.md
```

### Branch Rules

- **NEVER** push secrets (`.env`, `.env.local`, API keys) to any branch
- **NEVER** force-push to `preview` or `deploy`
- `main` ← feature branches merge via PR or direct push
- `preview` ← cherry-pick or selective merge from `main` (build files only)
- `deploy` ← fast-forward merge from `preview` only (never direct commits)
- All pushes require explicit user approval — agents must NOT push autonomously

### Branch Naming (feature branches off main)

- `feature/P{phase}-{name}` — e.g., `feature/P2-supabase-auth`
- `fix/{name}` — bug fixes
- `docs/{name}` — documentation only

### Commit Messages

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `build`

Scopes: `shell`, `auth`, `money`, `tasks`, `shopping`, `inventory`, `reminders`, `notes`, `maintenance`, `cache`, `db`, `supabase`, `tokens`, `components`

### Definition of Done

- Feature works end-to-end (UI → store → data service → Supabase)
- Handles empty, loading, error states
- Responsive at mobile + desktop
- Follows design tokens
- TypeScript strict — no errors
- Unit tests for business logic
- Data scoped to household via RLS
- No secrets in committed files

---

## 20. Code Review Rules

Review every output for:
- Visual consistency with design system
- Type safety (strict, no any)
- Correct folder placement per conventions
- Naming consistency
- Accessibility basics
- State management hygiene
- No duplication or dead code
- Supabase query efficiency (select specific columns, use filters, paginate)
- RLS correctness (household_id present on all data queries)
- Local cache hygiene (IDB updated after successful Supabase operations)
- Auth awareness (guards in place, household scoping correct)
- Responsive behavior
- Performance sanity (no unnecessary re-renders, no unbounded queries)
- Monetary values in integer cents — never floating point in DB or state
- Maintainability

Be direct and specific. Reject shortcuts that harm consistency.

---

## 21. Risks & Simplifications

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Supabase free tier limits | Low | Family-scale data is tiny (~90 MB/month bandwidth), cache-first reads |
| Supabase outage | Low | IDB cache provides full offline read access to last-fetched data |
| Auth token expiry | Low | SDK auto-refreshes; `onAuthStateChange` listener handles edge cases |
| RLS misconfiguration | Medium | Test RLS policies; helper function centralizes logic |
| Floating-point money errors | Eliminated | Integer cents throughout; display-only conversion to dollars |
| Concurrent family edits | Low | Supabase handles concurrent writes; `updated_at` trigger prevents stale data |
| IndexedDB storage limits | Low | Text data only, no media |
| Migration complexity | Low | Clean migration — new project, no existing data to convert |

### Deliberate MVP Simplifications

1. No Supabase Realtime — manual refresh + stale-while-revalidate
2. No Supabase Edge Functions — all logic client-side
3. No Supabase Storage — no file uploads
4. No optimistic writes — wait for Supabase response before updating local state
5. No recurring task auto-creation — manual
6. No dark theme — tokens defined, deferred
7. Maintenance module deferred (Phase 13)
8. No push notifications
9. No invite system — admin manually creates members (MVP)
10. ActivityLog: append-only, no browse UI
11. No delta sync — fetch full entity lists on revalidation (family-scale data is small)

---

## 22. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase.vue | `SButton.vue`, `ExpenseRow.vue` |
| Composable files | camelCase.ts | `useFilters.ts`, `useAuth.ts` |
| Store files | kebab.store.ts | `expenses.store.ts`, `auth.store.ts` |
| Model files | kebab.model.ts | `expense.model.ts` |
| Repository files | kebab.repository.ts | `expenses.repository.ts` |
| Schema files | kebab.schema.ts | `expense.schema.ts` |
| Data service files | kebab.data.ts | `expenses.data.ts` |
| CSS tokens | --{category}-{name} | `--color-brand-primary` |
| Component prefix | S (shared) | `SButton`, `SBadge` |
| Routes | kebab-case | `/money/savings` |
| Store IDs | entity name | `'expenses'`, `'auth'` |
| Enum values | snake_case | `'not_started'` |
| Postgres tables | snake_case, plural | `savings_goals`, `goal_contributions` |
| Postgres columns | snake_case | `household_id`, `due_date`, `paid_by` |
| TS interface fields | snake_case | Match Postgres columns — no camelCase conversion |
| IDs | UUID v4 | Server-generated via `gen_random_uuid()` |
| Dates | ISO 8601 | `2026-04-15` |
| Money | integer cents | `1599` (= $15.99) |

---

## 23. Environment Variables

### Local Development

Create `.env.local` (git-ignored, never committed):
```
VITE_SUPABASE_URL=https://ssznueavbhpkpepdxvrm.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Cloudflare Pages Secrets

Add these as **encrypted environment variables** in the Cloudflare Pages dashboard (Settings → Environment Variables → Production/Preview):

| Variable | Value | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://ssznueavbhpkpepdxvrm.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (long JWT string) | Supabase Dashboard → Settings → API → `anon` `public` key |

> **Note:** The anon key is designed to be public (RLS protects data), but we still set it as a Cloudflare secret so it's injected at build time and not hardcoded in the repo.

### Variables NOT needed in Cloudflare

- `SUPABASE_SERVICE_ROLE_KEY` — never used in the SPA (only for server-side admin access)
- `SUPABASE_DB_PASSWORD` — never used in the SPA (direct DB connection is server-side only)

### Security Rules

- **NEVER** commit `.env` or `.env.local` to git
- **NEVER** use the service role key in frontend code
- `.env.example` is committed with placeholder values only
- Vite embeds `VITE_*` variables at build time — they appear in the JS bundle, which is fine for the anon key since RLS is enforced

---

## 24. Migration Notes

### What Changed (Sheets → Supabase)

| Aspect | Before (Google Sheets) | After (Supabase) |
|---|---|---|
| Database | Private Google Spreadsheet (16 tabs) | Supabase Postgres (17 tables) |
| API layer | Google Apps Script (doGet/doPost) | PostgREST via @supabase/supabase-js |
| Auth | Trust-based member selection | Supabase Auth (email/password, JWT) |
| Security | API key in query param | RLS policies per table + JWT |
| IDs | Client-generated `crypto.randomUUID()` | Server-generated `gen_random_uuid()` |
| Money | Floating-point numbers | Integer cents |
| Sync | Full sync queue + reconciler + optimistic writes | Stale-while-revalidate, direct writes |
| Column naming | camelCase (JS convention) | snake_case (Postgres convention) |
| TS field naming | camelCase | snake_case (match Postgres, no mapping) |
| Entities | No household concept | Every entity belongs to a household |
| Deleted files | `apps-script/`, `src/api/`, `src/services/sync/`, `src/services/remote/` | `supabase/migrations/`, `src/lib/`, `src/services/cache/`, `src/services/data/`, `src/features/auth/` |

### Why Supabase

1. **Proper auth** — email/password, JWT, no trust-based member selection
2. **RLS** — row-level security isolates household data without custom API logic
3. **Typed client** — `@supabase/supabase-js` provides typed queries, no manual fetch wrappers
4. **Simplified sync** — no sync queue, no reconciler, no optimistic writes — Supabase is fast enough for direct writes
5. **SQL power** — proper indexes, constraints, triggers, foreign keys
6. **Free tier** — 500 MB database, sufficient for years of family data
7. **Future-proof** — Realtime subscriptions, Edge Functions, Storage available when needed
