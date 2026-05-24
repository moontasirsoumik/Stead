-- Migration 017: Dynamic Trackers
-- Adds general-purpose tracker system with typed entries for analytics

-- ==========================================
-- 1. Create trackers table
-- ==========================================

CREATE TABLE IF NOT EXISTS trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES members(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'personal' CHECK (scope IN ('household', 'personal')),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN ('numeric', 'boolean', 'category', 'duration', 'counter')),
  unit TEXT,
  categories TEXT,
  target_value NUMERIC,
  target_direction TEXT CHECK (target_direction IN ('increase', 'decrease', 'maintain')),
  is_cyclic BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES members(id),
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. Create tracker_entries table
-- ==========================================

CREATE TABLE IF NOT EXISTS tracker_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  tracker_id UUID NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  numeric_value NUMERIC,
  text_value TEXT,
  boolean_value BOOLEAN,
  notes TEXT,
  tags TEXT,
  updated_by UUID REFERENCES members(id),
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. Indexes
-- ==========================================

CREATE INDEX idx_trackers_household ON trackers(household_id);
CREATE INDEX idx_trackers_owner ON trackers(owner_id);
CREATE INDEX idx_trackers_scope ON trackers(household_id, scope);
CREATE INDEX idx_tracker_entries_tracker ON tracker_entries(tracker_id);
CREATE INDEX idx_tracker_entries_date ON tracker_entries(tracker_id, entry_date DESC);
CREATE INDEX idx_tracker_entries_household ON tracker_entries(household_id);

-- ==========================================
-- 4. Enable RLS
-- ==========================================

ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_entries ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. RLS policies for trackers (dual-scope)
-- ==========================================

CREATE POLICY trackers_select ON trackers FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
  AND deleted = false
);

CREATE POLICY trackers_insert ON trackers FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY trackers_update ON trackers FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY trackers_delete ON trackers FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

-- ==========================================
-- 6. RLS policies for tracker_entries
-- ==========================================

CREATE POLICY tracker_entries_select ON tracker_entries FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
  AND deleted = false
);

CREATE POLICY tracker_entries_insert ON tracker_entries FOR INSERT WITH CHECK (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY tracker_entries_update ON tracker_entries FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

CREATE POLICY tracker_entries_delete ON tracker_entries FOR DELETE USING (
  household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
  )
);

-- ==========================================
-- 7. Triggers for updated_at
-- ==========================================

CREATE TRIGGER set_trackers_updated_at
  BEFORE UPDATE ON trackers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_tracker_entries_updated_at
  BEFORE UPDATE ON tracker_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
