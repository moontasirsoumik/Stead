-- Migration 008: Update RLS policies to support personal scope
-- Personal items are only visible to the owning member.
-- Household items are visible to all household members (unchanged behavior).

-- Helper function to check if user owns a personal item
CREATE OR REPLACE FUNCTION is_personal_owner(m_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE id = m_id
    AND user_id = auth.uid()
    AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Expenses ──
DROP POLICY IF EXISTS "Users can view own household expenses" ON expenses;
CREATE POLICY "Users can view household or personal expenses"
  ON expenses FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household expenses" ON expenses;
CREATE POLICY "Users can insert household or personal expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household expenses" ON expenses;
CREATE POLICY "Users can update household or personal expenses"
  ON expenses FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household expenses" ON expenses;
CREATE POLICY "Users can delete household or personal expenses"
  ON expenses FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ── Income ──
DROP POLICY IF EXISTS "Users can view own household income" ON income;
CREATE POLICY "Users can view household or personal income"
  ON income FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household income" ON income;
CREATE POLICY "Users can insert household or personal income"
  ON income FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household income" ON income;
CREATE POLICY "Users can update household or personal income"
  ON income FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household income" ON income;
CREATE POLICY "Users can delete household or personal income"
  ON income FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ── Budgets ──
DROP POLICY IF EXISTS "Users can view own household budgets" ON budgets;
CREATE POLICY "Users can view household or personal budgets"
  ON budgets FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household budgets" ON budgets;
CREATE POLICY "Users can insert household or personal budgets"
  ON budgets FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household budgets" ON budgets;
CREATE POLICY "Users can update household or personal budgets"
  ON budgets FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household budgets" ON budgets;
CREATE POLICY "Users can delete household or personal budgets"
  ON budgets FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ── Savings Goals ──
DROP POLICY IF EXISTS "Users can view own household savings_goals" ON savings_goals;
CREATE POLICY "Users can view household or personal savings_goals"
  ON savings_goals FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household savings_goals" ON savings_goals;
CREATE POLICY "Users can insert household or personal savings_goals"
  ON savings_goals FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household savings_goals" ON savings_goals;
CREATE POLICY "Users can update household or personal savings_goals"
  ON savings_goals FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household savings_goals" ON savings_goals;
CREATE POLICY "Users can delete household or personal savings_goals"
  ON savings_goals FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ── Goal Contributions ──
DROP POLICY IF EXISTS "Users can view own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can view household or personal goal_contributions"
  ON goal_contributions FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can insert household or personal goal_contributions"
  ON goal_contributions FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can update household or personal goal_contributions"
  ON goal_contributions FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household goal_contributions" ON goal_contributions;
CREATE POLICY "Users can delete household or personal goal_contributions"
  ON goal_contributions FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ── Notes ──
DROP POLICY IF EXISTS "Users can view own household notes" ON notes;
CREATE POLICY "Users can view household or personal notes"
  ON notes FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household notes" ON notes;
CREATE POLICY "Users can insert household or personal notes"
  ON notes FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household notes" ON notes;
CREATE POLICY "Users can update household or personal notes"
  ON notes FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household notes" ON notes;
CREATE POLICY "Users can delete household or personal notes"
  ON notes FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

-- ── Tasks ──
DROP POLICY IF EXISTS "Users can view own household tasks" ON tasks;
CREATE POLICY "Users can view household or personal tasks"
  ON tasks FOR SELECT
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can insert own household tasks" ON tasks;
CREATE POLICY "Users can insert household or personal tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can update own household tasks" ON tasks;
CREATE POLICY "Users can update household or personal tasks"
  ON tasks FOR UPDATE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  )
  WITH CHECK (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );

DROP POLICY IF EXISTS "Users can delete own household tasks" ON tasks;
CREATE POLICY "Users can delete household or personal tasks"
  ON tasks FOR DELETE
  USING (
    (scope = 'household' AND is_household_member(household_id))
    OR (scope = 'personal' AND is_personal_owner(owner_id))
  );
