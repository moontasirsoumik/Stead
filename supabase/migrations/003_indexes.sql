-- ============================================================
-- Stead — 003: Indexes
-- Based on actual query patterns defined in plan.md
-- ============================================================

-- Members: lookup by household, user
CREATE INDEX idx_members_household ON members (household_id);
CREATE INDEX idx_members_user ON members (user_id);

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

-- Activity Log: list by household, time
CREATE INDEX idx_activity_log_household ON activity_log (household_id, timestamp DESC);

-- Settings: lookup by household
CREATE INDEX idx_settings_household ON settings (household_id);
