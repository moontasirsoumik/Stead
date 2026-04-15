-- ============================================================
-- Stead — 002: Row Level Security Policies
-- Every table restricted to household members via helper function
-- ============================================================

-- ── Helper function (private schema to avoid public exposure) ──
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_household_member(h_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE household_id = h_id
    AND user_id = auth.uid()
    AND active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Households ──
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household"
  ON households FOR SELECT
  USING (private.is_household_member(id));

-- Users can create a household (onboarding)
CREATE POLICY "Authenticated users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update own household"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE household_id = id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND active = true
    )
  );

-- ── Members ──
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own household members"
  ON members FOR SELECT
  USING (private.is_household_member(household_id));

-- Self-insert for onboarding (user creating their own member record)
CREATE POLICY "Users can create their own member record"
  ON members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own household members"
  ON members FOR UPDATE
  USING (private.is_household_member(household_id))
  WITH CHECK (private.is_household_member(household_id));

CREATE POLICY "Users can delete own household members"
  ON members FOR DELETE
  USING (private.is_household_member(household_id));

-- ── Macro: standard CRUD policies for household-scoped data tables ──
-- Applied to: expenses, income, bills, budgets, savings_goals,
-- goal_contributions, tasks, subtasks, groceries, inventory,
-- reminders, notes, maintenance, settings, activity_log

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (private.is_household_member(household_id));

-- income
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_select" ON income FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "income_insert" ON income FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "income_update" ON income FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "income_delete" ON income FOR DELETE USING (private.is_household_member(household_id));

-- bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bills_select" ON bills FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "bills_insert" ON bills FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "bills_update" ON bills FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "bills_delete" ON bills FOR DELETE USING (private.is_household_member(household_id));

-- budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (private.is_household_member(household_id));

-- savings_goals
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "savings_goals_select" ON savings_goals FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "savings_goals_insert" ON savings_goals FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "savings_goals_update" ON savings_goals FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "savings_goals_delete" ON savings_goals FOR DELETE USING (private.is_household_member(household_id));

-- goal_contributions
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goal_contributions_select" ON goal_contributions FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "goal_contributions_insert" ON goal_contributions FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "goal_contributions_update" ON goal_contributions FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "goal_contributions_delete" ON goal_contributions FOR DELETE USING (private.is_household_member(household_id));

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (private.is_household_member(household_id));

-- subtasks
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subtasks_select" ON subtasks FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "subtasks_insert" ON subtasks FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "subtasks_update" ON subtasks FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "subtasks_delete" ON subtasks FOR DELETE USING (private.is_household_member(household_id));

-- groceries
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groceries_select" ON groceries FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "groceries_insert" ON groceries FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "groceries_update" ON groceries FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "groceries_delete" ON groceries FOR DELETE USING (private.is_household_member(household_id));

-- inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_select" ON inventory FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "inventory_insert" ON inventory FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "inventory_update" ON inventory FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "inventory_delete" ON inventory FOR DELETE USING (private.is_household_member(household_id));

-- reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_select" ON reminders FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "reminders_insert" ON reminders FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "reminders_update" ON reminders FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "reminders_delete" ON reminders FOR DELETE USING (private.is_household_member(household_id));

-- notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_select" ON notes FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "notes_insert" ON notes FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "notes_update" ON notes FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "notes_delete" ON notes FOR DELETE USING (private.is_household_member(household_id));

-- maintenance
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_select" ON maintenance FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "maintenance_insert" ON maintenance FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "maintenance_update" ON maintenance FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "maintenance_delete" ON maintenance FOR DELETE USING (private.is_household_member(household_id));

-- settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON settings FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "settings_insert" ON settings FOR INSERT WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "settings_update" ON settings FOR UPDATE USING (private.is_household_member(household_id)) WITH CHECK (private.is_household_member(household_id));
CREATE POLICY "settings_delete" ON settings FOR DELETE USING (private.is_household_member(household_id));

-- activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log_select" ON activity_log FOR SELECT USING (private.is_household_member(household_id));
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT WITH CHECK (private.is_household_member(household_id));
