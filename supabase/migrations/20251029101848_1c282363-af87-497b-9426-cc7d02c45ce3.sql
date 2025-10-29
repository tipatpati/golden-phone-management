-- Improve get_user_current_store_id() with better fallback logic
CREATE OR REPLACE FUNCTION public.get_user_current_store_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_store uuid;
BEGIN
  -- First, try to get from session variable
  current_store := current_setting('app.current_store_id', true)::uuid;
  
  -- If session variable not set, try to get default store for this user
  IF current_store IS NULL THEN
    SELECT store_id INTO current_store
    FROM user_stores
    WHERE user_id = auth.uid()
      AND is_default = true
    LIMIT 1;
  END IF;
  
  -- If still null and user has ANY stores, return first one
  IF current_store IS NULL THEN
    SELECT store_id INTO current_store
    FROM user_stores
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN current_store;
END;
$$;