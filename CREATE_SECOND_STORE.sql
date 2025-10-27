-- ============================================
-- CREATE SECOND STORE FOR TESTING
-- ============================================
-- Run this in Supabase SQL Editor
--
-- As a super admin, you will see both stores without
-- needing to be assigned to them via user_stores table.
-- ============================================

-- Step 1: Create a second store
INSERT INTO stores (name, code, address, phone, email, is_active, settings)
VALUES (
  'Branch Store',
  'BRANCH-01',
  '456 Branch Avenue, Downtown',
  '+1234567890',
  'branch@yourstore.com',
  true,
  '{}'::jsonb
)
RETURNING id, name, code, is_active, created_at;

-- The above query will return the new store details
-- You should see something like:
-- id                                  | name          | code      | is_active | created_at
-- ----------------------------------- | ------------- | --------- | --------- | ----------
-- xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | Branch Store  | BRANCH-01 | true      | 2025-10-27...


-- ============================================
-- Step 2: OPTIONAL - Assign an employee to Branch Store
-- ============================================
-- If you want to test employee access (users who are NOT super admin),
-- you can assign a specific employee to this store:
--
-- Uncomment and modify the lines below:
--
-- INSERT INTO user_stores (user_id, store_id, is_default)
-- SELECT
--   'EMPLOYEE_USER_ID_HERE',  -- Replace with actual employee user ID
--   (SELECT id FROM stores WHERE code = 'BRANCH-01'),
--   true  -- Make this their default store
-- ON CONFLICT (user_id, store_id) DO UPDATE
--   SET is_default = EXCLUDED.is_default;


-- ============================================
-- Step 3: Verify stores
-- ============================================
-- View all stores in your system:
SELECT
  id,
  name,
  code,
  address,
  phone,
  is_active,
  created_at
FROM stores
ORDER BY created_at;

-- Expected output: You should see both "Main Store" and "Branch Store"


-- ============================================
-- SUPER ADMIN NOTE
-- ============================================
-- As a super admin, you do NOT need to be assigned to stores
-- via the user_stores table. The RLS policies check your role
-- and automatically grant access to all stores.
--
-- After creating the second store:
-- 1. Refresh your application
-- 2. Look for the Store Selector dropdown in the header
-- 3. You should see both "Main Store" and "Branch Store"
-- 4. Click the dropdown to switch between stores
-- 5. All data (sales, products, etc.) will filter by selected store
--
-- EMPLOYEE TESTING:
-- If you want to test employee restrictions:
-- 1. Create a test employee user with role 'salesperson' or 'manager'
-- 2. Assign them to ONLY one store using user_stores
-- 3. Log in as that employee
-- 4. They should only see data from their assigned store
-- ============================================
