-- Fix missing profile and role assignment for admin@gpms.com user
-- This will enable the store selector dropdown to appear

-- Step 1: Insert profile record for admin user
INSERT INTO profiles (id, username, role, is_system_user)
VALUES (
  'a6377b61-79af-435e-ac13-a157dee8ef2c',
  'admin',
  'super_admin'::app_role,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert user role assignment
INSERT INTO user_roles (user_id, role, assigned_at)
VALUES (
  'a6377b61-79af-435e-ac13-a157dee8ef2c',
  'super_admin'::app_role,
  NOW()
)
ON CONFLICT (user_id, role) DO NOTHING;