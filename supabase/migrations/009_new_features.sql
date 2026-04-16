-- ============================================================
-- 009_new_features.sql
-- New feature tables: wishlists, subscriptions, journal,
-- habits, contacts, documents, meal planning, chore rotation
-- ============================================================

-- ============================================================
-- 1. TABLES — Personal (owner-scoped)
-- ============================================================

-- Wishlists
CREATE TABLE wishlists (
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
CREATE TABLE subscriptions (
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
CREATE TABLE journal_entries (
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
CREATE TABLE habits (
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
CREATE TABLE habit_logs (
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

-- ============================================================
-- 2. TABLES — Household-scoped
-- ============================================================

-- Contacts
CREATE TABLE contacts (
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
CREATE TABLE documents (
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
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  week_start DATE NOT NULL,
  note TEXT DEFAULT '',
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meals (child of meal_plans)
CREATE TABLE meals (
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

-- ============================================================
-- 3. ALTER — Chore rotation on tasks
-- ============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rotation_members TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rotation_index INTEGER DEFAULT 0;

-- ============================================================
-- 4. RLS — Personal tables (owner-scoped)
-- ============================================================

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Helper expression used in all personal policies:
--   owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())

-- ---- Wishlists ----

CREATE POLICY wishlists_select ON wishlists FOR SELECT
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY wishlists_insert ON wishlists FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY wishlists_update ON wishlists FOR UPDATE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY wishlists_delete ON wishlists FOR DELETE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

-- ---- Subscriptions ----

CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY subscriptions_delete ON subscriptions FOR DELETE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

-- ---- Journal entries ----

CREATE POLICY journal_entries_select ON journal_entries FOR SELECT
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY journal_entries_insert ON journal_entries FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY journal_entries_update ON journal_entries FOR UPDATE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY journal_entries_delete ON journal_entries FOR DELETE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

-- ---- Habits ----

CREATE POLICY habits_select ON habits FOR SELECT
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY habits_insert ON habits FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY habits_update ON habits FOR UPDATE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY habits_delete ON habits FOR DELETE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

-- ---- Habit logs ----

CREATE POLICY habit_logs_select ON habit_logs FOR SELECT
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY habit_logs_insert ON habit_logs FOR INSERT
  WITH CHECK (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY habit_logs_update ON habit_logs FOR UPDATE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

CREATE POLICY habit_logs_delete ON habit_logs FOR DELETE
  USING (
    household_id = get_my_household_id()
    AND owner_id = (SELECT id FROM members WHERE user_id = auth.uid() AND household_id = get_my_household_id())
  );

-- ============================================================
-- 5. RLS — Household-scoped tables
-- ============================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- ---- Contacts ----

CREATE POLICY contacts_select ON contacts FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY contacts_insert ON contacts FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY contacts_update ON contacts FOR UPDATE
  USING (household_id = get_my_household_id());

CREATE POLICY contacts_delete ON contacts FOR DELETE
  USING (household_id = get_my_household_id());

-- ---- Documents ----

CREATE POLICY documents_select ON documents FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY documents_insert ON documents FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY documents_update ON documents FOR UPDATE
  USING (household_id = get_my_household_id());

CREATE POLICY documents_delete ON documents FOR DELETE
  USING (household_id = get_my_household_id());

-- ---- Meal plans ----

CREATE POLICY meal_plans_select ON meal_plans FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY meal_plans_insert ON meal_plans FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY meal_plans_update ON meal_plans FOR UPDATE
  USING (household_id = get_my_household_id());

CREATE POLICY meal_plans_delete ON meal_plans FOR DELETE
  USING (household_id = get_my_household_id());

-- ---- Meals ----

CREATE POLICY meals_select ON meals FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY meals_insert ON meals FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY meals_update ON meals FOR UPDATE
  USING (household_id = get_my_household_id());

CREATE POLICY meals_delete ON meals FOR DELETE
  USING (household_id = get_my_household_id());

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX idx_wishlists_household_owner ON wishlists (household_id, owner_id);
CREATE INDEX idx_subscriptions_household_owner ON subscriptions (household_id, owner_id);
CREATE INDEX idx_journal_household_owner_date ON journal_entries (household_id, owner_id, entry_date DESC);
CREATE INDEX idx_habits_household_owner ON habits (household_id, owner_id);
CREATE INDEX idx_habit_logs_habit_date ON habit_logs (habit_id, log_date);
CREATE INDEX idx_contacts_household ON contacts (household_id);
CREATE INDEX idx_documents_household ON documents (household_id);
CREATE INDEX idx_meal_plans_household_week ON meal_plans (household_id, week_start);
CREATE INDEX idx_meals_plan ON meals (meal_plan_id);
