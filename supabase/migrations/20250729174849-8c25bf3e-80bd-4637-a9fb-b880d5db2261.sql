-- Fix remaining database functions to have proper search_path
-- This addresses the remaining function security warnings

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'salesperson'::app_role)
  );
  RETURN NEW;
END;
$$;

-- Fix set_repair_number function
CREATE OR REPLACE FUNCTION set_repair_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.repair_number IS NULL OR NEW.repair_number = '' THEN
    NEW.repair_number := generate_repair_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_sale_number function
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix set_transaction_number function
CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := generate_transaction_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix admin_update_user_role function
CREATE OR REPLACE FUNCTION admin_update_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role app_role;
  old_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can change user roles';
  END IF;
  
  -- Get old role for audit
  SELECT role INTO old_role FROM profiles WHERE id = target_user_id;
  
  -- Update the role
  UPDATE profiles 
  SET role = new_role
  WHERE id = target_user_id;
  
  -- Log the role change
  INSERT INTO security_audit_log (
    user_id, 
    event_type, 
    event_data
  ) VALUES (
    auth.uid(),
    'role_change',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role,
      'new_role', new_role
    )
  );
  
  RETURN TRUE;
END;
$$;