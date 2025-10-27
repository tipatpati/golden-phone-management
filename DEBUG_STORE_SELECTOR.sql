-- ============================================
-- DEBUG: Store Selector Not Showing
-- ============================================
-- Run these queries one by one in Supabase SQL Editor
-- to diagnose why the store selector isn't appearing
-- ============================================

-- Query 1: Check if stores exist
-- ============================================
SELECT
  id,
  name,
  code,
  is_active,
  created_at
FROM stores
ORDER BY created_at;

-- Expected: You should see at least 2 stores (Main Store and Branch Store)
-- If you see 0 or 1 stores, that's the problem!


-- Query 2: Check your user profile and role
-- ============================================
SELECT
  id,
  email,
  role as user_role,
  username,
  created_at
FROM profiles
WHERE id = auth.uid();

-- Expected: role should be 'super_admin'
-- If role is NULL or different, that's the problem!


-- Query 3: Check what get_current_user_role() returns
-- ============================================
SELECT get_current_user_role() as current_role;

-- Expected: Should return 'super_admin'
-- This is what the app uses to determine your role


-- Query 4: Test if you can see stores via RLS policies
-- ============================================
SELECT
  id,
  name,
  code,
  is_active
FROM stores
WHERE is_active = true;

-- Expected: You should see all active stores
-- If you see nothing, there's an RLS policy issue


-- Query 5: Check user_stores assignments (should be empty for super admin)
-- ============================================
SELECT
  us.user_id,
  s.name as store_name,
  s.code as store_code,
  us.is_default
FROM user_stores us
JOIN stores s ON s.id = us.store_id
WHERE us.user_id = auth.uid();

-- Expected: Empty result (super admin doesn't need assignments)
-- If you see assignments, that's OK but not required


-- ============================================
-- DIAGNOSIS
-- ============================================

-- If Query 1 shows 0-1 stores:
--   → Problem: Not enough stores created
--   → Solution: Create second store (see CREATE_SECOND_STORE.sql)

-- If Query 2 shows role != 'super_admin':
--   → Problem: Your user role is not set correctly
--   → Solution: Update your role (query below)

-- If Query 3 shows NULL or wrong role:
--   → Problem: Role function not returning correct value
--   → Solution: Check profiles table role column

-- If Query 4 shows no stores:
--   → Problem: RLS policies blocking access
--   → Solution: Check RLS policies on stores table


-- ============================================
-- FIX: Update your role to super_admin
-- ============================================
-- If you found that your role is NOT 'super_admin', run this:

-- UPDATE profiles
-- SET role = 'super_admin'
-- WHERE id = auth.uid();

-- SELECT role FROM profiles WHERE id = auth.uid();


-- ============================================
-- BROWSER CONSOLE DEBUGGING
-- ============================================
-- After running the SQL queries above, check your browser:
--
-- 1. Open your app
-- 2. Press F12 to open Developer Tools
-- 3. Click "Console" tab
-- 4. Look for messages that start with "[StoreContext]"
-- 5. You should see logs like:
--    - "Super admin mode: showing all stores"
--    - "Super admin: setting first store as default"
--
-- If you see errors or different messages, copy them and share them!
