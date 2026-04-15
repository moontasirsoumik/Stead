-- ============================================================
-- Stead — 001: Initial Schema
-- Creates all tables for the Stead household management app
-- ============================================================

-- ── Households ──
CREATE TABLE households (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Members ──
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

-- ── Expenses ──
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

-- ── Income ──
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

-- ── Bills ──
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

-- ── Budgets ──
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

-- ── Savings Goals ──
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

-- ── Goal Contributions ──
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

-- ── Tasks ──
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

-- ── Subtasks ──
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

-- ── Groceries ──
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

-- ── Inventory ──
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

-- ── Reminders ──
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

-- ── Notes ──
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

-- ── Maintenance ──
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

-- ── Settings ──
CREATE TABLE settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(household_id, key)
);

-- ── Activity Log ──
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
