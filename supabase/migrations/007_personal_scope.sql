-- Migration 007: Add personal scope support
-- Adds scope and owner_id to tables that support personal data.
-- scope = 'household' (default, visible to all members) or 'personal' (only visible to owner).

-- Expenses
ALTER TABLE expenses ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE expenses ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE expenses ADD CONSTRAINT expenses_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Income
ALTER TABLE income ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE income ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE income ADD CONSTRAINT income_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Budgets
ALTER TABLE budgets ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE budgets ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE budgets ADD CONSTRAINT budgets_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Savings Goals
ALTER TABLE savings_goals ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE savings_goals ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Goal Contributions
ALTER TABLE goal_contributions ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE goal_contributions ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE goal_contributions ADD CONSTRAINT goal_contributions_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Notes
ALTER TABLE notes ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE notes ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE notes ADD CONSTRAINT notes_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Tasks
ALTER TABLE tasks ADD COLUMN scope text NOT NULL DEFAULT 'household'
  CHECK (scope IN ('household', 'personal'));
ALTER TABLE tasks ADD COLUMN owner_id uuid REFERENCES members(id);
ALTER TABLE tasks ADD CONSTRAINT tasks_personal_owner
  CHECK (scope = 'household' OR owner_id IS NOT NULL);

-- Indexes for personal scope queries
CREATE INDEX idx_expenses_scope_owner ON expenses (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX idx_income_scope_owner ON income (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX idx_budgets_scope_owner ON budgets (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX idx_savings_goals_scope_owner ON savings_goals (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX idx_goal_contributions_scope_owner ON goal_contributions (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX idx_notes_scope_owner ON notes (scope, owner_id) WHERE scope = 'personal';
CREATE INDEX idx_tasks_scope_owner ON tasks (scope, owner_id) WHERE scope = 'personal';
