# Role Fetching Diagnostic Guide

## Issue Summary
Store selector not appearing even though profile exists with super_admin role.

## Root Cause Investigation

### Architecture Analysis:
1. **StoreContext** (line 26): Checks `userRole === 'super_admin'`
2. **AuthContext** (useAuthState.ts line 27): Calls `supabase.rpc('get_current_user_role')`
3. **Database Function**: `get_current_user_role()` returns role from `profiles` table
4. **Your Profile**: EXISTS with `super_admin` role ✅

### The Problem:
The `get_current_user_role()` RPC call might be failing silently, causing auth to default to `'salesperson'`.

---

## Diagnostic Steps

### Step 1: Test in Browser Console

1. Open your application in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Run this JavaScript:

```javascript
// Import Supabase client
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

// Your Supabase credentials (get from .env or config)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User ID:', session?.user?.id);

// Test 2: Call get_current_user_role()
const { data: role, error: roleError } = await supabase.rpc('get_current_user_role');
console.log('Role from RPC:', role);
console.log('Role Error:', roleError);

// Test 3: Query profiles table directly
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, username, role')
  .eq('id', session?.user?.id)
  .single();
console.log('Profile from table:', profile);
console.log('Profile Error:', profileError);
```

**Expected Results:**
- Session should show your user
- Role from RPC should be `'super_admin'`
- Profile from table should show `role: 'super_admin'`

---

### Step 2: Check React DevTools

1. Install React DevTools extension if not already installed
2. Open React DevTools (F12 → Components tab)
3. Find `AuthProvider` component
4. Look at its state/hooks
5. Check the value of `userRole`

**Expected:** `userRole` should be `'super_admin'`
**If it's:** `'salesperson'` → RPC call is failing

---

### Step 3: Check Network Tab

1. Open Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Refresh the page
4. Look for request to `/rest/v1/rpc/get_current_user_role`

**Check:**
- Status code (should be 200)
- Response body (should be `"super_admin"`)
- If missing or 404 → Function doesn't exist in database

---

## Common Issues & Fixes

### Issue 1: RPC Function Doesn't Exist
**Symptom:** Network tab shows 404 for `get_current_user_role`

**Fix:** Run this migration to create/update the function:
```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'salesperson'::app_role
  )
$function$;
```

---

### Issue 2: RPC Call Returns NULL
**Symptom:** RPC returns `null` or empty

**Check:**
1. Does `auth.uid()` work in the function context?
2. Is there a profile for your user ID?

**Fix:** Ensure RLS policies allow profile access:
```sql
-- Check RLS policies on profiles table
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Ensure users can read own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);
```

---

### Issue 3: RLS Blocking Profile Access
**Symptom:** Direct profile query works in SQL Editor but fails in app

**Check:** RLS policies might be too restrictive

**Temporary Debug Fix:**
```sql
-- Temporarily disable RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test app, then re-enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

### Issue 4: Function Uses Wrong Table
**Symptom:** Function exists but returns wrong value

**Check which table the function queries:**
```sql
-- View function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_current_user_role';
```

**Should contain:** `SELECT role FROM public.profiles WHERE id = auth.uid()`

**If it says** `user_roles` table → Function needs update (run Issue 1 fix)

---

## Quick Fix Script

If all else fails, run this in Supabase SQL Editor:

```sql
-- 1. Recreate the function
DROP FUNCTION IF EXISTS get_current_user_role();

CREATE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'salesperson'::app_role
  )
$$;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- 3. Ensure profile RLS allows self-read
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

---

## Verification

After applying fixes:

1. **Log out** of your application
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Log back in**
4. **Open Console** and run:
```javascript
// Quick verification
const { data, error } = await supabase.rpc('get_current_user_role');
console.log('My role:', data);
```

**Expected:** `My role: super_admin`

5. **Check for Store Selector** in header

---

## Contact Points

If store selector still doesn't appear after all fixes:

1. Share browser console logs (especially lines with `[StoreContext]` or `[AuthState]`)
2. Share Network tab screenshot of `get_current_user_role` request
3. Share React DevTools screenshot of AuthProvider state
