-- Add super_admin role to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Update the admin_update_user_role function to allow super_admin role changes
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role app_role;
  old_roles app_role[];
BEGIN
  -- Check if current user is admin or super_admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can change user roles';
  END IF;
  
  -- Only super_admin can assign super_admin role
  IF new_role = 'super_admin' AND current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super admins can assign super admin role';
  END IF;
  
  -- Get old roles for audit
  SELECT get_user_roles(target_user_id) INTO old_roles;
  
  -- Clear existing roles and set new primary role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role, assigned_by) 
  VALUES (target_user_id, new_role, auth.uid());
  
  -- Update profiles table for backward compatibility
  UPDATE public.profiles 
  SET role = new_role
  WHERE id = target_user_id;
  
  -- Log the role change
  INSERT INTO public.security_audit_log (
    user_id, 
    event_type, 
    event_data
  ) VALUES (
    auth.uid(),
    'role_change',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_roles', old_roles,
      'new_role', new_role
    )
  );
  
  RETURN TRUE;
END;
$function$;

-- Update admin_add_user_role function with super_admin restrictions
CREATE OR REPLACE FUNCTION public.admin_add_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if current user is admin or super_admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can assign user roles';
  END IF;
  
  -- Only super_admin can assign super_admin role
  IF new_role = 'super_admin' AND current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super admins can assign super admin role';
  END IF;
  
  -- Add new role
  INSERT INTO public.user_roles (user_id, role, assigned_by) 
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the role addition
  INSERT INTO public.security_audit_log (
    user_id, 
    event_type, 
    event_data
  ) VALUES (
    auth.uid(),
    'role_added',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_role', new_role
    )
  );
  
  RETURN TRUE;
END;
$function$;