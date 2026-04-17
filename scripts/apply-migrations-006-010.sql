-- ============================================================
-- STEAD — Combined Migrations 006-010
-- Paste this ENTIRE file into the Supabase Dashboard SQL Editor and run it.
-- URL: https://supabase.com/dashboard/project/ssznueavbhpkpepdxvrm/sql/new
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
-- 007: Add personal scope support
-- ============================================================

DO $$ BEGIN
  ALTER TABLE expenses ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE expenses ADD CONSTRAINT expenses_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE expenses ADD CONSTRAINT expenses_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE income ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE income ADD CONSTRAINT income_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE income ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE income ADD CONSTRAINT income_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE budgets ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE budgets ADD CONSTRAINT budgets_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE budgets ADD CONSTRAINT budgets_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE savings_goals ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE goal_contributions ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE goal_contributions ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notes ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE notes ADD CONSTRAINT notes_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE notes ADD CONSTRAINT notes_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN scope text NOT NULL DEFAULT 'household';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT tasks_scope_check CHECK (scope IN ('household', 'personal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES members(id);
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT tasks_personal_owner CHECK (scope = 'household' OR owner_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for personal scope queries
CREATE INDEX IF NOT EXISTS idx_expenses_scope_owner ON expenses (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_income_scope_owner ON income (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_budgets_scope_owner ON budgets (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_savings_goals_scope_owner ON savings_goals (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_goal_contributions_scope_owner ON goal_contributions (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_notes_scope_owner ON notes (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX IF NOT EXISTS idx_tasks_scope_owner ON tasks (scope, owner_id) WHERE scope = 'personal';

-- ============================================================
-- 008: Update RLS policies for personal scope
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

-- Expenses
DROP POLICY IF EXISTS "Users can view own household expenses" ON expenses;
CREATE POLICY "Users can view household or personal expenses"
  ON expenses FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household expenses" ON expenses;
CREATE POLICY "Users can insert household or personal expenses"
  ON expenses FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household expenses" ON expenses;
CREATE POLICY "Users can update household or personal expenses"
  ON expenses FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household expenses" ON expenses;
CREATE POLICY "Users can delete household or personal expenses"
  ON expenses FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- Income
DROP POLICY IF EXISTS "Users can view own household income" ON income;
CREATE POLICY "Users can view household or personal income"
  ON income FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household income" ON income;
CREATE POLICY "Users can insert household or personal income"
  ON income FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household income" ON income;
CREATE POLICY "Users can update household or personal income"
  ON income FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household income" ON income;
CREATE POLICY "Users can delete household or personal income"
  ON income FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- Budgets
DROP POLICY IF EXISTS "Users can view own household budgets" ON budgets;
CREATE POLICY "Users can view household or personal budgets"
  ON budgets FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household budgets" ON budgets;
CREATE POLICY "Users can insert household or personal budgets"
  ON budgets FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household budgets" ON budgets;
CREATE POLICY "Users can update household or personal budgets"
  ON budgets FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household budgets" ON budgets;
CREATE POLICY "Users can delete household or personal budgets"
  ON budgets FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- Savings Goals
DROP POLICY IF EXISTS "Users can view own household savings_goals" ON savings_goals;
CREATE POLICY "Users can view household or personal savings_goals"
  ON savings_goals FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household savings_goals" ON savings_goals;
CREATE POLICY "Users can insert household or personal savings_goals"
  ON savings_goals FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household savings_goals" ON savings_goals;
CREATE POLICY "Users can update household or personal savings_goals"
  ON savings_goals FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household savings_goals" ON savings_goals;
CREATE POLICY "Users can delete household or personal savings_goals"
  ON savings_goals FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- Goal Contributions
DROP POLICY IF EXISTS "Users can view own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can view household or personal goal_contributions"
  ON goal_contributions FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can insert household or personal goal_contributions"
  ON goal_contributions FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can update household or personal goal_contributions"
  ON goal_contributions FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can delete household or personal goal_contributions"
  ON goal_contributions FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- Notes
DROP POLICY IF EXISTS "Users can view own household notes" ON notes;
CREATE POLICY "Users can view household or personal notes"
  ON notes FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household notes" ON notes;
CREATE POLICY "Users can insert household or personal notes"
  ON notes FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household notes" ON notes;
CREATE POLICY "Users can update household or personal notes"
  ON notes FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household notes" ON notes;
CREATE POLICY "Users can delete household or personal notes"
  ON notes FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- Tasks
DROP POLICY IF EXISTS "Users can view own household tasks" ON tasks;
CREATE POLICY "Users can view household or personal tasks"
  ON tasks FOR SELECT USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can insert own household tasks" ON tasks;
CREATE POLICY "Users can insert household or personal tasks"
  ON tasks FOR INSERT WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
DROP POLICY IF EXISTS "Users can update own household tasks" ON tasks;
CREATE POLICY "Users can update household or personal tasks"
  ON tasks FOR UPDATE
  USING ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)))
  WITH CHECK ((scope = 'household' AND is_household_member(household_id)) OR (scope = 'personal' AND is_personal_owner(owner_id)));
DROP POLICY IF EXISTS "Users can delete own household tasks" ON tasks;
CREATE POLICY "Users can delete household or personal tasks"
  ON tasks FOR DELETE USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ============================================================
-- 009: New feature tables
-- ============================================================

-- Wishlists
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

-- Subscriptions
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

-- Journal entries
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

-- Habits
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

-- Habit logs
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

-- Contacts
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

-- Documents
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

-- Meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  week_start DATE NOT NULL,
  note TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meals
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

-- Chore rotation on tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rotation_members TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rotation_index INTEGER DEFAULT 0;

-- RLS on personal tables
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Personal table policies (owner-scoped)
DO $$ BEGIN
CREATE POLICY wishlists_select ON wishlists FOR SELECT USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY wishlists_insert ON wishlists FOR INSERT WITH CHECK (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY wishlists_update ON wishlists FOR UPDATE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY wishlists_delete ON wishlists FOR DELETE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT WITH CHECK (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY subscriptions_delete ON subscriptions FOR DELETE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY journal_entries_select ON journal_entries FOR SELECT USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY journal_entries_insert ON journal_entries FOR INSERT WITH CHECK (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY journal_entries_update ON journal_entries FOR UPDATE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY journal_entries_delete ON journal_entries FOR DELETE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY habits_select ON habits FOR SELECT USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY habits_insert ON habits FOR INSERT WITH CHECK (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY habits_update ON habits FOR UPDATE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY habits_delete ON habits FOR DELETE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY habit_logs_select ON habit_logs FOR SELECT USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY habit_logs_insert ON habit_logs FOR INSERT WITH CHECK (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY habit_logs_update ON habit_logs FOR UPDATE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
CREATE POLICY habit_logs_delete ON habit_logs FOR DELETE USING (household_id = get_my_household_id() AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Household-scoped table policies
DO $$ BEGIN CREATE POLICY contacts_select ON contacts FOR SELECT USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY contacts_update ON contacts FOR UPDATE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY contacts_delete ON contacts FOR DELETE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY documents_select ON documents FOR SELECT USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY documents_update ON documents FOR UPDATE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY documents_delete ON documents FOR DELETE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY meal_plans_select ON meal_plans FOR SELECT USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY meal_plans_insert ON meal_plans FOR INSERT WITH CHECK (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY meal_plans_update ON meal_plans FOR UPDATE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY meal_plans_delete ON meal_plans FOR DELETE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY meals_select ON meals FOR SELECT USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY meals_insert ON meals FOR INSERT WITH CHECK (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY meals_update ON meals FOR UPDATE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY meals_delete ON meals FOR DELETE USING (household_id = get_my_household_id()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
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

DO $$ BEGIN
CREATE POLICY "household members can manage splits" ON expense_splits FOR ALL
  USING (household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON expense_splits(member_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_household_id ON expense_splits(household_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_settled ON expense_splits(settled) WHERE settled = FALSE;

COMMIT;
