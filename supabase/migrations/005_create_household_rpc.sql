-- ============================================================
-- Stead — 005: Onboarding RPC
-- Atomically creates a household + first admin member.
-- Runs as SECURITY DEFINER to bypass RLS chicken-and-egg:
-- INSERT needs a member row that doesn't exist yet.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_household_with_member(
  household_name text,
  member_name text,
  member_color text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id uuid;
  new_member_id uuid;
BEGIN
  -- Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent creating multiple households
  IF EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid() AND active = true
  ) THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  INSERT INTO households (name)
  VALUES (household_name)
  RETURNING id INTO new_household_id;

  INSERT INTO members (household_id, user_id, name, role, color)
  VALUES (new_household_id, auth.uid(), member_name, 'admin', member_color)
  RETURNING id INTO new_member_id;

  RETURN json_build_object(
    'household_id', new_household_id,
    'member_id', new_member_id
  );
END;
$$;
