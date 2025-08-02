-- Phase 1: Fix missing user_roles entries and create synchronization
-- First, insert missing user_roles entries for users who have profiles but no user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL AND p.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to keep roles synchronized
CREATE OR REPLACE FUNCTION public.sync_profile_and_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- For INSERT on profiles, ensure user_roles entry exists
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'profiles' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  END IF;
  
  -- For UPDATE on profiles, sync the role change
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'profiles' AND OLD.role != NEW.role THEN
    -- Remove old role
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = OLD.role;
    -- Add new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  END IF;
  
  -- For INSERT/UPDATE on user_roles, sync to profiles
  IF TG_TABLE_NAME = 'user_roles' THEN
    UPDATE public.profiles 
    SET role = NEW.role 
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers to maintain synchronization
DROP TRIGGER IF EXISTS sync_profile_to_user_roles ON public.profiles;
CREATE TRIGGER sync_profile_to_user_roles
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_and_user_roles();

DROP TRIGGER IF EXISTS sync_user_roles_to_profile ON public.user_roles;
CREATE TRIGGER sync_user_roles_to_profile
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_and_user_roles();