-- Migration: 010_expense_splits.sql
-- Creates the expense_splits table with RLS policies

CREATE TABLE IF NOT EXISTS expense_splits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id    UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL CHECK (amount >= 0),
  settled       BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household members can manage splits"
  ON expense_splits
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE auth_user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id    ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id     ON expense_splits(member_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_household_id  ON expense_splits(household_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_settled       ON expense_splits(settled) WHERE settled = FALSE;

-- Keep updated_at current
CREATE TRIGGER trg_expense_splits_updated_at
  BEFORE UPDATE ON expense_splits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
