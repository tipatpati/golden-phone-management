-- ============================================
-- MULTI-TENANT MIGRATION VERIFICATION & SETUP
-- ============================================
-- Run this in Supabase SQL Editor to check status and get next steps
--
-- Project: joiwowvlujajwbarpsuc
-- Date: October 27, 2025
-- ============================================

-- STEP 1: Check if migrations are already applied
-- ============================================
DO $$
DECLARE
  v_stores_exists boolean;
  v_user_stores_exists boolean;
  v_sales_has_store_id boolean;
  v_default_store_exists boolean;
  v_user_assigned boolean;
BEGIN
  -- Check stores table
  SELECT EXISTS (
    SELECT FROM pg_tables WHERE tablename = 'stores'
  ) INTO v_stores_exists;

  -- Check user_stores table
  SELECT EXISTS (
    SELECT FROM pg_tables WHERE tablename = 'user_stores'
  ) INTO v_user_stores_exists;

  -- Check if sales has store_id
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'store_id'
  ) INTO v_sales_has_store_id;

  -- Check default store
  IF v_stores_exists THEN
    SELECT EXISTS (
      SELECT FROM stores WHERE code = 'MAIN'
    ) INTO v_default_store_exists;
  ELSE
    v_default_store_exists := false;
  END IF;

  -- Check user assignment
  IF v_user_stores_exists THEN
    SELECT EXISTS (
      SELECT FROM user_stores WHERE user_id = auth.uid()
    ) INTO v_user_assigned;
  ELSE
    v_user_assigned := false;
  END IF;

  -- Display results
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'MIGRATION STATUS CHECK';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'stores table exists:        %', v_stores_exists;
  RAISE NOTICE 'user_stores table exists:   %', v_user_stores_exists;
  RAISE NOTICE 'sales.store_id exists:      %', v_sales_has_store_id;
  RAISE NOTICE 'default store exists:       %', v_default_store_exists;
  RAISE NOTICE 'user assigned to store:     %', v_user_assigned;
  RAISE NOTICE '===========================================';

  IF v_stores_exists AND v_user_stores_exists AND v_sales_has_store_id THEN
    RAISE NOTICE '✅ STATUS: Migrations ALREADY APPLIED';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Skip to creating second store';
    RAISE NOTICE '2. See MIGRATION_VERIFICATION.md Step 4';
  ELSE
    RAISE NOTICE '⚠️  STATUS: Migrations NOT YET APPLIED';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Apply migrations using one of these methods:';
    RAISE NOTICE '   Method A: Run each migration file in Supabase SQL Editor';
    RAISE NOTICE '   Method B: Copy migration SQL directly (see below)';
    RAISE NOTICE '';
    RAISE NOTICE '2. Files to run in order:';
    RAISE NOTICE '   - 20251026042105_add_multi_tenant_stores.sql';
    RAISE NOTICE '   - 20251026042106_add_store_id_to_core_tables.sql';
    RAISE NOTICE '   - 20251026042107_update_rls_policies_for_stores.sql';
  END IF;
  RAISE NOTICE '===========================================';
END $$;

-- STEP 2: View migration files location
-- ============================================
-- Your migration files are located at:
-- /home/user/golden-phone-management/supabase/migrations/
--
-- You need to run them in this order:
-- 1. 20251026042105_add_multi_tenant_stores.sql      (Store foundation)
-- 2. 20251026042106_add_store_id_to_core_tables.sql  (Add store_id columns)
-- 3. 20251026042107_update_rls_policies_for_stores.sql (Update RLS policies)

-- STEP 3: Quick store count (if already applied)
-- ============================================
-- Uncomment below to see your stores (only works if migrations applied)
-- SELECT id, name, code, is_active, created_at FROM stores ORDER BY created_at;

-- STEP 4: Quick user-store assignments (if already applied)
-- ============================================
-- Uncomment below to see user assignments (only works if migrations applied)
-- SELECT
--   us.user_id,
--   s.name as store_name,
--   s.code as store_code,
--   us.is_default
-- FROM user_stores us
-- JOIN stores s ON s.id = us.store_id
-- WHERE us.user_id = auth.uid();
