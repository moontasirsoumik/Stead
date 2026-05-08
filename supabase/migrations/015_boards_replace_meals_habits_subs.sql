-- Migration 015: Replace Meals, Habits, and Subscriptions with general-purpose Boards
-- This migration drops the old specific tables and creates the new boards/board_items tables.

-- ==========================================
-- 1. Drop old tables (cascade drops dependents)
-- ==========================================

DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- ==========================================
-- 2. Create boards table
-- ==========================================

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES members(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'household' CHECK (scope IN ('household', 'personal')),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES members(id),
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. Create board_items table
-- ==========================================

CREATE TABLE IF NOT EXISTS board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  group_name TEXT,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES members(id),
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 4. Enable RLS
-- ==========================================

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. RLS policies for boards
-- ==========================================

-- Household-scope boards: all active members can see
CREATE POLICY boards_select ON boards FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
  AND deleted = false
);

CREATE POLICY boards_insert ON boards FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY boards_update ON boards FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY boards_delete ON boards FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

-- ==========================================
-- 6. RLS policies for board_items
-- ==========================================

CREATE POLICY board_items_select ON board_items FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
  AND deleted = false
);

CREATE POLICY board_items_insert ON board_items FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY board_items_update ON board_items FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY board_items_delete ON board_items FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

-- ==========================================
-- 7. Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_boards_household ON boards (household_id);
CREATE INDEX IF NOT EXISTS idx_boards_household_owner ON boards (household_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_scope ON boards (household_id, scope);
CREATE INDEX IF NOT EXISTS idx_board_items_board ON board_items (board_id);
CREATE INDEX IF NOT EXISTS idx_board_items_household ON board_items (household_id);
CREATE INDEX IF NOT EXISTS idx_board_items_group ON board_items (board_id, group_name);

-- ==========================================
-- 8. Updated_at trigger
-- ==========================================

CREATE TRIGGER set_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_board_items_updated_at
  BEFORE UPDATE ON board_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
