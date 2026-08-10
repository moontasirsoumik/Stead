-- ============================================================
-- Stead: external participants in expense splits
-- ============================================================

ALTER TABLE expense_splits
  ADD COLUMN IF NOT EXISTS participant_type text NOT NULL DEFAULT 'member'
    CHECK (participant_type IN ('member', 'external')),
  ADD COLUMN IF NOT EXISTS participant_name text;

UPDATE expense_splits
SET participant_type = 'member'
WHERE participant_type IS NULL;

ALTER TABLE expense_splits
  ALTER COLUMN member_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expense_splits_participant_shape'
      AND conrelid = 'expense_splits'::regclass
  ) THEN
    ALTER TABLE expense_splits
      ADD CONSTRAINT expense_splits_participant_shape CHECK (
        (participant_type = 'member' AND member_id IS NOT NULL)
        OR
        (participant_type = 'external' AND member_id IS NULL AND nullif(trim(participant_name), '') IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expense_splits_participant_type
  ON expense_splits(participant_type);
