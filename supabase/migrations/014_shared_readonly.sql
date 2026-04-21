-- ============================================================
-- Stead — 014: Shared = Read-Only
-- Ensures shared events (and notes, tasks, wishlists) are
-- read-only for recipients. Only the owner can UPDATE/DELETE
-- personal-scope items.
-- Also cleans up stale SELECT policies left from migration 013.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. CALENDAR EVENTS — owner-only UPDATE/DELETE for personal
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS calendar_events_update ON calendar_events;
DROP POLICY IF EXISTS calendar_events_delete ON calendar_events;

-- UPDATE: household events = any member; personal events = owner only
CREATE POLICY calendar_events_update ON calendar_events FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    )
  );

-- DELETE: same logic
CREATE POLICY calendar_events_delete ON calendar_events FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    )
  );

-- ────────────────────────────────────────────────────────────
-- 2. NOTES — owner-only UPDATE/DELETE for personal
-- ────────────────────────────────────────────────────────────

-- Clean up stale SELECT policy (013 created notes_select_v2 but didn't drop notes_select)
DROP POLICY IF EXISTS notes_select ON notes;

DROP POLICY IF EXISTS notes_update ON notes;
DROP POLICY IF EXISTS notes_delete ON notes;

CREATE POLICY notes_update ON notes FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    )
  );

CREATE POLICY notes_delete ON notes FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    )
  );

-- ────────────────────────────────────────────────────────────
-- 3. TASKS — owner-only UPDATE/DELETE for personal
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tasks_select ON tasks;

DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;

CREATE POLICY tasks_update ON tasks FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    )
  );

CREATE POLICY tasks_delete ON tasks FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND (
      scope = 'household'
      OR (scope = 'personal' AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid()))
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. WISHLISTS — owner-only UPDATE/DELETE (always personal)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS wishlists_update ON wishlists;
DROP POLICY IF EXISTS wishlists_delete ON wishlists;

CREATE POLICY wishlists_update ON wishlists FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY wishlists_delete ON wishlists FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid())
    AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );
