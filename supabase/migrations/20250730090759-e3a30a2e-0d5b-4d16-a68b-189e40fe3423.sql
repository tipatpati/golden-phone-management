-- Add technician to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';

-- Create user_roles table for flexible role assignment
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer functions for role management
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role app_role;
BEGIN
    -- Get the primary role (first one found, prioritizing admin > manager > others)
    SELECT role INTO user_role
    FROM public.user_roles 
    WHERE user_id = auth.uid()
    ORDER BY 
      CASE role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'inventory_manager' THEN 3
        WHEN 'technician' THEN 4
        WHEN 'salesperson' THEN 5
        ELSE 6
      END
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'salesperson'::app_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ARRAY_AGG(role ORDER BY role) 
  FROM public.user_roles 
  WHERE user_id = _user_id;
$$;

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT id, role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create RLS policies for user_roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Update admin_update_user_role function
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role app_role;
  old_roles app_role[];
BEGIN
  -- Check if current user is admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can change user roles';
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
$$;

-- Create function to add additional roles
CREATE OR REPLACE FUNCTION public.admin_add_user_role(target_user_id uuid, new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can assign user roles';
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
$$;

-- Create function to remove roles
CREATE OR REPLACE FUNCTION public.admin_remove_user_role(target_user_id uuid, remove_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can remove user roles';
  END IF;
  
  -- Remove role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = remove_role;
  
  -- Log the role removal
  INSERT INTO public.security_audit_log (
    user_id, 
    event_type, 
    event_data
  ) VALUES (
    auth.uid(),
    'role_removed',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'removed_role', remove_role
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Update handle_new_user function to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata or default to salesperson
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'salesperson'::app_role);
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    user_role
  );
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();