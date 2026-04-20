-- ============================================================
-- Stead — 013: Privacy & Sharing Features
-- Adds visibility controls, entity sharing, private debt view,
-- and dummy household members for testing.
-- ============================================================

-- ============================================================
-- 1. VISIBILITY COLUMN — personal-scope entities
-- ============================================================
-- 'private'   = only owner (default, current behavior)
-- 'shared'    = owner + specific members (via entity_shares)
-- 'household' = visible to everyone in the household

ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'shared', 'household'));

ALTER TABLE notes ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'shared', 'household'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'shared', 'household'));

ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'shared', 'household'));

-- ============================================================
-- 2. ENTITY_SHARES — generic junction for sharing
-- ============================================================

CREATE TABLE IF NOT EXISTS entity_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  shared_with uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_entity_shares_entity ON entity_shares(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_shares_member ON entity_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_entity_shares_household ON entity_shares(household_id);

-- RLS
ALTER TABLE entity_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entity_shares_select ON entity_shares;
DROP POLICY IF EXISTS entity_shares_insert ON entity_shares;
DROP POLICY IF EXISTS entity_shares_delete ON entity_shares;

CREATE POLICY entity_shares_select ON entity_shares FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  ));

CREATE POLICY entity_shares_insert ON entity_shares FOR INSERT
  WITH CHECK (household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  ));

CREATE POLICY entity_shares_delete ON entity_shares FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  ));

-- ============================================================
-- 3. EXPENSE SPLITS — private debt RLS
-- Only see splits where you're the debtor OR the creditor
-- ============================================================

DROP POLICY IF EXISTS "household members can manage splits" ON expense_splits;
DROP POLICY IF EXISTS expense_splits_select ON expense_splits;
DROP POLICY IF EXISTS expense_splits_insert ON expense_splits;
DROP POLICY IF EXISTS expense_splits_update ON expense_splits;
DROP POLICY IF EXISTS expense_splits_delete ON expense_splits;

CREATE POLICY expense_splits_select ON expense_splits FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR expense_id IN (
      SELECT id FROM expenses WHERE paid_by IN (
        SELECT id FROM members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY expense_splits_insert ON expense_splits FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY expense_splits_update ON expense_splits FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY expense_splits_delete ON expense_splits FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
  );

-- ============================================================
-- 4. CALENDAR EVENTS — visibility-aware RLS
-- ============================================================

DROP POLICY IF EXISTS "calendar_events_select" ON calendar_events;
DROP POLICY IF EXISTS calendar_events_select ON calendar_events;

CREATE POLICY calendar_events_select ON calendar_events FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
      OR (scope = 'personal' AND visibility = 'household')
      OR (scope = 'personal' AND visibility = 'shared' AND EXISTS (
        SELECT 1 FROM entity_shares es
        WHERE es.entity_type = 'calendar_event' AND es.entity_id = calendar_events.id
        AND es.shared_with IN (SELECT id FROM members WHERE user_id = auth.uid())
      ))
    )
  );

-- ============================================================
-- 5. NOTES — visibility-aware RLS
-- ============================================================

DROP POLICY IF EXISTS "Users can view household or personal notes" ON notes;
DROP POLICY IF EXISTS notes_select_v2 ON notes;

CREATE POLICY notes_select_v2 ON notes FOR SELECT
  USING (
    (scope = 'household' AND household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()))
    OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    OR (scope = 'personal' AND visibility = 'household' AND household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()))
    OR (scope = 'personal' AND visibility = 'shared' AND household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()) AND EXISTS (
      SELECT 1 FROM entity_shares es
      WHERE es.entity_type = 'note' AND es.entity_id = notes.id
      AND es.shared_with IN (SELECT id FROM members WHERE user_id = auth.uid())
    ))
  );

-- ============================================================
-- 6. TASKS — visibility-aware RLS
-- ============================================================

DROP POLICY IF EXISTS "Users can view household or personal tasks" ON tasks;
DROP POLICY IF EXISTS tasks_select_v2 ON tasks;

CREATE POLICY tasks_select_v2 ON tasks FOR SELECT
  USING (
    (scope = 'household' AND household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()))
    OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    OR (scope = 'personal' AND visibility = 'household' AND household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()))
    OR (scope = 'personal' AND visibility = 'shared' AND household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()) AND EXISTS (
      SELECT 1 FROM entity_shares es
      WHERE es.entity_type = 'task' AND es.entity_id = tasks.id
      AND es.shared_with IN (SELECT id FROM members WHERE user_id = auth.uid())
    ))
  );

-- ============================================================
-- 7. WISHLISTS — visibility-aware RLS
-- Wishlists are always personal. Add shared/household visibility.
-- ============================================================

DROP POLICY IF EXISTS wishlists_select ON wishlists;
DROP POLICY IF EXISTS wishlists_select_v2 ON wishlists;

CREATE POLICY wishlists_select_v2 ON wishlists FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      owner_id IN (SELECT id FROM members WHERE user_id = auth.uid())
      OR visibility = 'household'
      OR (visibility = 'shared' AND EXISTS (
        SELECT 1 FROM entity_shares es
        WHERE es.entity_type = 'wishlist' AND es.entity_id = wishlists.id
        AND es.shared_with IN (SELECT id FROM members WHERE user_id = auth.uid())
      ))
    )
  );

-- ============================================================
-- 8. DUMMY MEMBERS for testing
-- Inserts 4 members into the first household found
-- ============================================================

INSERT INTO members (household_id, name, role, color, active)
SELECT h.id, 'Alice Chen', 'member', '#E57373', true
FROM households h LIMIT 1;

INSERT INTO members (household_id, name, role, color, active)
SELECT h.id, 'Bob Rivera', 'member', '#64B5F6', true
FROM households h LIMIT 1;

INSERT INTO members (household_id, name, role, color, active)
SELECT h.id, 'Chloe Kim', 'member', '#81C784', true
FROM households h LIMIT 1;

INSERT INTO members (household_id, name, role, color, active)
SELECT h.id, 'Derek Patel', 'member', '#FFB74D', true
FROM households h LIMIT 1;
