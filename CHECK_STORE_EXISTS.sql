-- ============================================
-- CHECK IF STORE ALREADY EXISTS
-- ============================================
-- Run this first to check if the store already exists
-- ============================================

SELECT
  id,
  name,
  code,
  address,
  phone,
  email,
  is_active,
  created_at
FROM stores
WHERE code = 'BRANCH-01';

-- If this returns a row, the store already exists!
-- You don't need to run CREATE_SECOND_STORE.sql again.
--
-- If this returns no rows, you can proceed to create the store
-- using CREATE_SECOND_STORE.sql
