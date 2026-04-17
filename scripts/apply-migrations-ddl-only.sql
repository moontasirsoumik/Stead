-- ============================================================
-- STEAD — Simplified DDL-only migrations 006-010
-- Creates new columns and tables WITHOUT RLS policies
-- (RLS policies can be fixed and applied separately later)
-- ============================================================

BEGIN;

-- ============================================================
-- 006: Merge maintenance into tasks
-- ============================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'regular';
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('regular', 'maintenance'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES members(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_done_date date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_cost integer;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS vendor text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contact text;

CREATE INDEX IF NOT EXISTS idx_tasks_household_type ON tasks (household_id, task_type);

-- ============================================================
-- 007: Add personal scope support (columns only)
-- ============================================================

DO $$ BEGIN ALTER TABLE expenses ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE expenses ADD CONSTRAINT expenses_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE expenses ADD CONSTRAINT expenses_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE income ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE income ADD CONSTRAINT income_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE income ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE income ADD CONSTRAINT income_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE budgets ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE budgets ADD CONSTRAINT budgets_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE budgets ADD CONSTRAINT budgets_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE savings_goals ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE goal_contributions ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE goal_contributions ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE notes ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE notes ADD CONSTRAINT notes_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE notes ADD CONSTRAINT notes_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE tasks ADD COLUMN scope text NOT NULL DEFAULT 'household'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE tasks ADD CONSTRAINT tasks_scope_check CHECK (scope IN ('household', 'personal')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN ALTER TABLE tasks ADD CONSTRAINT tasks_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Personal scope indexes
CREATE INDEX IF NOT EXISTS idx_expenses_scope_owner ON expenses (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_income_scope_owner ON income (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_budgets_scope_owner ON budgets (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_savings_goals_scope_owner ON savings_goals (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_goal_contributions_scope_owner ON goal_contributions (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_notes_scope_owner ON notes (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_tasks_scope_owner ON tasks (scope, owner_id) WHERE scope = 'personal';

-- ============================================================
-- 008: is_personal_owner function (needed for future RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION is_personal_owner(m_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE id = m_id
    AND user_id = auth.uid()
    AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Also create get_my_household_id if it doesn't exist
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS uuid AS $$
  SELECT household_id FROM members
  WHERE user_id = auth.uid() AND active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 009: New feature tables (DDL only, no RLS policies)
-- ============================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  owner_id UUID NOT NULL REFERENCES members(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  price INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'wanted' CHECK (status IN ('wanted', 'saving', 'bought', 'dropped')),
  saved_amount INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  note TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  owner_id UUID NOT NULL REFERENCES members(id),
  name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  category TEXT DEFAULT '',
  next_billing_date DATE,
  auto_renew BOOLEAN DEFAULT TRUE,
  url TEXT DEFAULT '',
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  owner_id UUID NOT NULL REFERENCES members(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL DEFAULT '',
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  tags TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  owner_id UUID NOT NULL REFERENCES members(id),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekends', 'custom')),
  target_days TEXT DEFAULT '',
  color TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id),
  owner_id UUID NOT NULL REFERENCES members(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT TRUE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  company TEXT DEFAULT '',
  note TEXT DEFAULT '',
  category TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'other' CHECK (doc_type IN ('warranty', 'insurance', 'lease', 'contract', 'receipt', 'manual', 'other')),
  description TEXT DEFAULT '',
  issuer TEXT DEFAULT '',
  issue_date DATE,
  expiry_date DATE,
  reference_number TEXT DEFAULT '',
  note TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  week_start DATE NOT NULL,
  note TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL,
  recipe_notes TEXT DEFAULT '',
  servings INTEGER DEFAULT 1,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chore rotation columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rotation_members TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rotation_index INTEGER DEFAULT 0;

-- Enable RLS on new tables (policies will be added in a separate migration)
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_wishlists_household_owner ON wishlists (household_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_household_owner ON subscriptions (household_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_journal_household_owner_date ON journal_entries (household_id, owner_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_habits_household_owner ON habits (household_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs (habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_contacts_household ON contacts (household_id);
CREATE INDEX IF NOT EXISTS idx_documents_household ON documents (household_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_household_week ON meal_plans (household_id, week_start);
CREATE INDEX IF NOT EXISTS idx_meals_plan ON meals (meal_plan_id);

-- ============================================================
-- 010: Expense splits
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON expense_splits(member_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_household_id ON expense_splits(household_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_settled ON expense_splits(settled) WHERE settled = FALSE;

COMMIT;
