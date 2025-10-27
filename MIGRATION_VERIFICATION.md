# Migration Verification and Application Guide

## Step 1: Verify Current Database State

Run this query in your **Supabase SQL Editor**:

```sql
-- Check if stores table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'stores'
) as stores_table_exists;
```

**Expected Results:**
- If returns `true`: Migrations already applied ✅
- If returns `false`: Need to apply migrations ⚠️

---

## Step 2: Apply Migrations (If Needed)

### Method A: Using Supabase CLI (Recommended)

1. Make sure you're logged in to Supabase CLI:
```bash
supabase login
```

2. Link your project (if not already linked):
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

3. Push migrations to database:
```bash
supabase db push
```

This will apply all pending migrations in order.

---

### Method B: Manual Application via SQL Editor

If CLI doesn't work, you can apply migrations manually by running each SQL file in order in the Supabase SQL Editor:

#### Migration 1: Store Foundation
**File:** `supabase/migrations/20251026042105_add_multi_tenant_stores.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the ENTIRE contents of the file
4. Paste into SQL Editor
5. Click "Run"
6. Verify success (should say "Success. No rows returned")

#### Migration 2: Add store_id to Tables
**File:** `supabase/migrations/20251026042106_add_store_id_to_core_tables.sql`

1. Create another new query
2. Copy the ENTIRE contents of the file
3. Paste and run
4. This will take 10-30 seconds (adding columns to 18 tables)

#### Migration 3: Update RLS Policies
**File:** `supabase/migrations/20251026042107_update_rls_policies_for_stores.sql`

1. Create another new query
2. Copy the ENTIRE contents
3. Paste and run
4. Verify success

---

## Step 3: Verify Migrations Applied Successfully

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Check stores table exists and has default store
SELECT id, name, code, is_active FROM stores;
-- Expected: Should return "Main Store" with code "MAIN"

-- 2. Check user_stores table exists
SELECT COUNT(*) as user_count FROM user_stores;
-- Expected: Should return count of your existing users

-- 3. Check store_id added to sales table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'store_id';
-- Expected: Should return one row showing store_id column

-- 4. Check RLS policies updated
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'sales' AND policyname LIKE '%store%';
-- Expected: Should return policies with "store" in the name
```

---

## Step 4: Test Multi-Store Setup

Once migrations are confirmed, run this to create a second store:

```sql
-- Create second store
INSERT INTO stores (name, code, address, phone, is_active)
VALUES ('Branch Store', 'BRANCH-01', '123 Test Street', '+1234567890', true)
RETURNING *;

-- Assign yourself to the new store
INSERT INTO user_stores (user_id, store_id, is_default)
SELECT
  id,
  (SELECT id FROM stores WHERE code = 'BRANCH-01'),
  false  -- Not default, so you stay on Main Store
FROM profiles
WHERE id = auth.uid();
```

**Expected Result:**
- Refresh your app
- You should see a store selector dropdown in the header
- Dropdown should show "Main Store" and "Branch Store"
- You can switch between them

---

## Troubleshooting

### Error: "relation stores does not exist"
**Cause:** Migrations not applied yet
**Fix:** Follow Method A or Method B above

### Error: "permission denied for table stores"
**Cause:** RLS policies not created yet
**Fix:** Run Migration 1 again, ensure RLS policies are created

### Error: "duplicate key value violates unique constraint"
**Cause:** Trying to run migrations twice
**Fix:** Migrations already applied, skip to Step 3 verification

### Store selector not showing
**Cause:** You only have one store
**Fix:** Expected behavior - run Step 4 to create second store

---

## Quick Status Check

Run this comprehensive check:

```sql
-- All-in-one status check
SELECT
  'stores_table' as check_name,
  EXISTS(SELECT FROM pg_tables WHERE tablename = 'stores')::text as status
UNION ALL
SELECT
  'user_stores_table',
  EXISTS(SELECT FROM pg_tables WHERE tablename = 'user_stores')::text
UNION ALL
SELECT
  'sales_has_store_id',
  EXISTS(
    SELECT FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'store_id'
  )::text
UNION ALL
SELECT
  'default_store_exists',
  EXISTS(SELECT FROM stores WHERE code = 'MAIN')::text
UNION ALL
SELECT
  'user_assigned_to_store',
  EXISTS(SELECT FROM user_stores WHERE user_id = auth.uid())::text;
```

**Expected Output (if migrations applied successfully):**
```
check_name                | status
--------------------------+--------
stores_table              | true
user_stores_table         | true
sales_has_store_id        | true
default_store_exists      | true
user_assigned_to_store    | true
```

If ALL show `true`, you're ready to test multi-store functionality!

---

**Next Steps After Verification:**
1. ✅ Confirm all checks return `true`
2. ✅ Create second store (Step 4)
3. ✅ Refresh app and test store switching
4. ✅ Create test sale in Branch Store
5. ✅ Verify data isolation between stores
