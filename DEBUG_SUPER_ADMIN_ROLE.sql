-- Debug query to check super admin role and store assignments
-- Run this in Supabase SQL editor to diagnose the issue

SELECT
  'User Profile' as check_type,
  p.id as user_id,
  p.username,
  p.role as profile_role,
  p.created_at
FROM profiles p
WHERE p.id = auth.uid();

SELECT
  'User Roles Table' as check_type,
  ur.user_id,
  ur.role,
  ur.created_at
FROM user_roles ur
WHERE ur.user_id = auth.uid();

SELECT
  'Function Result' as check_type,
  get_current_user_role() as current_role;

SELECT
  'User Store Assignments' as check_type,
  us.user_id,
  us.store_id,
  us.is_default,
  s.name as store_name,
  s.code as store_code
FROM user_stores us
LEFT JOIN stores s ON s.id = us.store_id
WHERE us.user_id = auth.uid();

SELECT
  'All Active Stores' as check_type,
  s.id,
  s.name,
  s.code,
  s.is_active
FROM stores s
WHERE s.is_active = true
ORDER BY s.name;
