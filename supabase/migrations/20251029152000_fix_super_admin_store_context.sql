-- Fix get_user_current_store_id() to properly fall back to user_session_preferences for super admins
-- This fixes the issue where super admins couldn't create sales because the function returned NULL
-- when the session variable wasn't set (session variables don't persist across RPC calls)

CREATE OR REPLACE FUNCTION public.get_user_current_store_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_store uuid;
  user_role app_role;
BEGIN
  -- Get the user's role
  SELECT get_current_user_role() INTO user_role;

  -- Try session variable first (performance optimization for same-connection calls)
  BEGIN
    current_store := current_setting('app.current_store_id', true)::uuid;
    IF current_store IS NOT NULL THEN
      RETURN current_store;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    current_store := NULL;
  END;

  -- Fallback to persisted preference (works across connections)
  IF current_store IS NULL THEN
    SELECT last_selected_store_id INTO current_store
    FROM user_session_preferences
    WHERE user_id = auth.uid();
  END IF;

  -- Fallback to default store assignment (for regular users)
  IF current_store IS NULL THEN
    SELECT store_id INTO current_store
    FROM user_stores
    WHERE user_id = auth.uid() AND is_default = true
    LIMIT 1;
  END IF;

  -- Last resort: any assigned store (for regular users)
  IF current_store IS NULL THEN
    SELECT store_id INTO current_store
    FROM user_stores
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;

  -- For super admins, if still no store is set, they MUST explicitly select one
  -- before performing operations that require a store context
  -- Returning NULL will trigger a user-friendly error message

  RETURN current_store;
END;
$$;

COMMENT ON FUNCTION public.get_user_current_store_id() IS
'Gets the current store ID for the authenticated user.
For super admins: checks session variable, then user_session_preferences, then any assigned store.
For regular users: checks session variable, then user_session_preferences, then default store, then any assigned store.
Returns NULL if no store context is set, which will trigger an error in operations requiring store context.';
