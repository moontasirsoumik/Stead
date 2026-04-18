-- Calendar Events table for personal and shared schedules
CREATE TABLE calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  start_time time,
  end_date date,
  end_time time,
  all_day boolean DEFAULT true,
  category text,
  assigned_to uuid REFERENCES members(id),
  scope text NOT NULL DEFAULT 'household' CHECK (scope IN ('household', 'personal')),
  owner_id uuid REFERENCES members(id),
  recurring_rule text,
  color text,
  note text,
  deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES members(id)
);

-- Indexes
CREATE INDEX idx_calendar_events_household ON calendar_events(household_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_scope ON calendar_events(scope, owner_id);

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_select" ON calendar_events
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_events_insert" ON calendar_events
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_events_update" ON calendar_events
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_events_delete" ON calendar_events
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_updated_at_calendar_events
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
