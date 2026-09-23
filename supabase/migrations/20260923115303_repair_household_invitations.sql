-- Repair production projects where migration 012 was recorded as applied but
-- its invitation objects were not created.

CREATE TABLE IF NOT EXISTS public.household_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid REFERENCES public.households(id) NOT NULL,
  invited_by uuid REFERENCES public.members(id) NOT NULL,
  invite_code text NOT NULL UNIQUE,
  email text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_household
  ON public.household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code
  ON public.household_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status
  ON public.household_invitations(status);

ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view household invitations"
  ON public.household_invitations;
CREATE POLICY "Members can view household invitations"
  ON public.household_invitations FOR SELECT
  TO authenticated
  USING (private.is_household_member(household_id));

CREATE OR REPLACE FUNCTION private.is_household_admin(h_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE household_id = h_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND active = true
  );
$$;

REVOKE ALL ON FUNCTION private.is_household_admin(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_household_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins can create invitations"
  ON public.household_invitations;
CREATE POLICY "Admins can create invitations"
  ON public.household_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    private.is_household_admin(household_id)
    AND invited_by IN (
      SELECT id
      FROM public.members
      WHERE user_id = auth.uid()
        AND household_id = household_invitations.household_id
        AND active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update invitations"
  ON public.household_invitations;
CREATE POLICY "Admins can update invitations"
  ON public.household_invitations FOR UPDATE
  TO authenticated
  USING (private.is_household_admin(household_id))
  WITH CHECK (private.is_household_admin(household_id));

GRANT SELECT, INSERT, UPDATE ON public.household_invitations TO authenticated;
REVOKE ALL ON public.household_invitations FROM anon;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  SELECT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

REVOKE ALL ON FUNCTION public.generate_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_invite_code() TO authenticated;

-- Keep privileged invitation acceptance outside the exposed public schema.
CREATE OR REPLACE FUNCTION private.accept_invitation(invite_code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation public.household_invitations%ROWTYPE;
  new_member_id uuid;
  caller_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = auth.uid() AND active = true
  ) THEN
    RAISE EXCEPTION 'You already belong to a household';
  END IF;

  SELECT *
  INTO invitation
  FROM public.household_invitations
  WHERE invite_code = upper(trim(invite_code_input))
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  IF coalesce(invitation.email, '') <> '' AND
     lower(invitation.email) <> lower((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  SELECT coalesce(raw_user_meta_data->>'full_name', email)
  INTO caller_name
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.members (household_id, user_id, name, role, color, active)
  VALUES (
    invitation.household_id,
    auth.uid(),
    caller_name,
    invitation.role,
    '#' || lpad(to_hex((random() * 16777215)::int), 6, '0'),
    true
  )
  RETURNING id INTO new_member_id;

  UPDATE public.household_invitations
  SET status = 'accepted', accepted_by = auth.uid()
  WHERE id = invitation.id;

  RETURN json_build_object(
    'household_id', invitation.household_id,
    'member_id', new_member_id
  );
END;
$$;

REVOKE ALL ON FUNCTION private.accept_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.accept_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_invitation(code text)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.accept_invitation(code);
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
