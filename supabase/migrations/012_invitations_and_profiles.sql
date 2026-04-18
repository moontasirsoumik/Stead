-- ============================================================
-- Stead — 012: Invitations & Profile Support
-- Adds household_invitations table, RLS, and RPCs
-- ============================================================

-- ---------- Table ----------

CREATE TABLE household_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES households(id) NOT NULL,
  invited_by uuid REFERENCES members(id) NOT NULL,
  invite_code text NOT NULL UNIQUE,
  email text,  -- optional pre-specified invitee email
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ---------- Indexes ----------

CREATE INDEX idx_invitations_household ON household_invitations(household_id);
CREATE INDEX idx_invitations_code ON household_invitations(invite_code);
CREATE INDEX idx_invitations_status ON household_invitations(status);

-- ---------- RLS ----------

ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Members can see their household's invitations
CREATE POLICY "Members can view household invitations"
  ON household_invitations FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid() AND active = true
    )
  );

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON household_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid()
      AND household_id = household_invitations.household_id
      AND role = 'admin'
      AND active = true
    )
  );

-- Only admins can update (revoke) invitations
CREATE POLICY "Admins can update invitations"
  ON household_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid()
      AND household_id = household_invitations.household_id
      AND role = 'admin'
      AND active = true
    )
  );

-- No DELETE policy — use status changes instead

-- ---------- RPC: generate_invite_code ----------

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE sql
AS $$
  SELECT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

-- ---------- RPC: accept_invitation ----------

CREATE OR REPLACE FUNCTION public.accept_invitation(code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  new_member_id uuid;
  caller_name text;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already belong to a household
  IF EXISTS (
    SELECT 1 FROM members WHERE user_id = auth.uid() AND active = true
  ) THEN
    RAISE EXCEPTION 'You already belong to a household';
  END IF;

  -- Find the invitation
  SELECT * INTO inv FROM household_invitations
  WHERE invite_code = code AND status = 'pending' AND expires_at > now();

  IF inv IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  -- If email was specified, verify it matches
  IF inv.email IS NOT NULL AND inv.email != '' THEN
    IF inv.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
      RAISE EXCEPTION 'This invitation was sent to a different email address';
    END IF;
  END IF;

  -- Get caller's name from user metadata
  SELECT COALESCE(
    raw_user_meta_data->>'full_name',
    email
  ) INTO caller_name
  FROM auth.users WHERE id = auth.uid();

  -- Create member record
  INSERT INTO members (household_id, user_id, name, role, color, active)
  VALUES (
    inv.household_id,
    auth.uid(),
    caller_name,
    inv.role,
    '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),  -- random color
    true
  )
  RETURNING id INTO new_member_id;

  -- Mark invitation as accepted
  UPDATE household_invitations
  SET status = 'accepted', accepted_by = auth.uid()
  WHERE id = inv.id;

  RETURN json_build_object(
    'household_id', inv.household_id,
    'member_id', new_member_id
  );
END;
$$;
