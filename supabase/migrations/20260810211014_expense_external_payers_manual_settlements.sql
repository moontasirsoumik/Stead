-- ============================================================
-- Stead: external expense payers + manual settlements
-- ============================================================

-- Expenses can now be paid by a household member or by someone external.
-- Existing rows remain member-paid.
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS paid_by_type text NOT NULL DEFAULT 'member'
    CHECK (paid_by_type IN ('member', 'external')),
  ADD COLUMN IF NOT EXISTS paid_by_name text;

ALTER TABLE expenses
  ALTER COLUMN paid_by DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_payer_shape'
      AND conrelid = 'expenses'::regclass
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_payer_shape CHECK (
        (paid_by_type = 'member' AND paid_by IS NOT NULL)
        OR
        (paid_by_type = 'external' AND paid_by IS NULL AND nullif(trim(paid_by_name), '') IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_type ON expenses (paid_by_type);

-- Manual settlements cover ad-hoc debts/credits, both within and outside the household.
CREATE TABLE IF NOT EXISTS manual_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  direction text NOT NULL CHECK (direction IN ('i_owe', 'owed_to_me')),
  counterparty_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  counterparty_name text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT current_date,
  description text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'settled')),
  settled_at timestamptz,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);

ALTER TABLE manual_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manual_settlements_select ON manual_settlements;
DROP POLICY IF EXISTS manual_settlements_insert ON manual_settlements;
DROP POLICY IF EXISTS manual_settlements_update ON manual_settlements;
DROP POLICY IF EXISTS manual_settlements_delete ON manual_settlements;

CREATE POLICY manual_settlements_select ON manual_settlements FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true)
    AND (
      visibility = 'public'
      OR owner_id IN (SELECT id FROM members WHERE user_id = auth.uid() AND active = true)
    )
  );

CREATE POLICY manual_settlements_insert ON manual_settlements FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true)
    AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid() AND active = true)
  );

CREATE POLICY manual_settlements_update ON manual_settlements FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true)
    AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid() AND active = true)
  )
  WITH CHECK (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true)
    AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid() AND active = true)
  );

CREATE POLICY manual_settlements_delete ON manual_settlements FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true)
    AND owner_id IN (SELECT id FROM members WHERE user_id = auth.uid() AND active = true)
  );

CREATE INDEX IF NOT EXISTS idx_manual_settlements_household_visibility
  ON manual_settlements (household_id, visibility);
CREATE INDEX IF NOT EXISTS idx_manual_settlements_owner
  ON manual_settlements (owner_id);
CREATE INDEX IF NOT EXISTS idx_manual_settlements_counterparty
  ON manual_settlements (counterparty_member_id);
CREATE INDEX IF NOT EXISTS idx_manual_settlements_status
  ON manual_settlements (status) WHERE deleted = false;

DROP TRIGGER IF EXISTS set_updated_at ON manual_settlements;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON manual_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
