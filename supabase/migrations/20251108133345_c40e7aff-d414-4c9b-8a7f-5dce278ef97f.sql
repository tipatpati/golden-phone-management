
-- Assign nader@gmail.com to Main store
-- This is a data migration to fix the missing store assignment

DO $$
DECLARE
  v_user_id uuid;
  v_store_id uuid;
BEGIN
  -- Get user ID for nader@gmail.com
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'nader@gmail.com';
  
  -- Get store ID for Main store
  SELECT id INTO v_store_id FROM stores WHERE name = 'Main' OR code = 'MAIN' LIMIT 1;
  
  -- Assign user to store
  INSERT INTO user_stores (user_id, store_id, is_default)
  VALUES (v_user_id, v_store_id, true)
  ON CONFLICT (user_id, store_id) 
  DO UPDATE SET is_default = true;
  
  RAISE NOTICE 'Successfully assigned user % to store %', v_user_id, v_store_id;
END $$;
