-- Migration 006: Merge maintenance into tasks
-- Adds maintenance-specific columns to tasks table and migrates existing maintenance data.

-- Add new columns to tasks
ALTER TABLE tasks ADD COLUMN task_type text NOT NULL DEFAULT 'regular'
  CHECK (task_type IN ('regular', 'maintenance'));
ALTER TABLE tasks ADD COLUMN created_by uuid REFERENCES members(id);
ALTER TABLE tasks ADD COLUMN last_done_date date;
ALTER TABLE tasks ADD COLUMN estimated_cost integer;
ALTER TABLE tasks ADD COLUMN vendor text;
ALTER TABLE tasks ADD COLUMN contact text;

-- Migrate existing maintenance data into tasks
INSERT INTO tasks (
  household_id, title, description, task_type, assignee,
  room, category, due_date, recurring_rule, priority, status, completed_at,
  last_done_date, estimated_cost, vendor, contact, note, deleted,
  created_at, updated_at, updated_by
)
SELECT
  household_id, item, NULL, 'maintenance', assigned_to,
  NULL, type, next_due_date, recurring_rule, 'medium',
  CASE WHEN status = 'upcoming' THEN 'not_started' ELSE status END,
  CASE WHEN status = 'done' THEN updated_at ELSE NULL END,
  last_done_date, estimated_cost, vendor, contact, note, deleted,
  created_at, updated_at, updated_by
FROM maintenance;

-- Add indexes for the new columns
CREATE INDEX idx_tasks_household_type ON tasks (household_id, task_type);
