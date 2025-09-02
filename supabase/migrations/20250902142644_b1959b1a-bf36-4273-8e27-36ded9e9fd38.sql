-- Ensure benbekhtiamir@gmail.com is super_admin and profile is synced
DO $$
DECLARE
  uid uuid;
BEGIN
  -- Find the user id by email
  SELECT id INTO uid FROM auth.users WHERE email = 'benbekhtiamir@gmail.com';

  IF uid IS NULL THEN
    RAISE NOTICE 'No user found for email %', 'benbekhtiamir@gmail.com';
  ELSE
    -- Grant super_admin role if not already present
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Ensure profile exists and is set to super_admin
    INSERT INTO public.profiles (id, username, role)
    VALUES (
      uid,
      split_part((SELECT email FROM auth.users WHERE id = uid), '@', 1),
      'super_admin'
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

    -- Audit log
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (
      uid,
      'role_enforced',
      jsonb_build_object(
        'email', 'benbekhtiamir@gmail.com',
        'enforced_role', 'super_admin',
        'by', 'migration',
        'timestamp', now()
      )
    );
  END IF;
END $$;