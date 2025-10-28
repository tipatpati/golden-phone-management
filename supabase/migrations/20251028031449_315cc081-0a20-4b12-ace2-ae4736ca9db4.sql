-- Restore secure get_current_user_role function
-- CRITICAL: Roles MUST be read from user_roles table, NOT profiles table
-- Reading from profiles table violates security best practices and enables privilege escalation

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_role app_role;
BEGIN
    -- Require authentication; unauthenticated users have no role
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get the primary role from user_roles table (authoritative source)
    -- Prioritize: super_admin > admin > manager > inventory_manager > technician > salesperson
    SELECT role INTO user_role
    FROM public.user_roles 
    WHERE user_id = auth.uid()
    ORDER BY 
      CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'manager' THEN 3
        WHEN 'inventory_manager' THEN 4
        WHEN 'technician' THEN 5
        WHEN 'salesperson' THEN 6
        ELSE 7
      END
    LIMIT 1;
    
    -- Return NULL if no role found (no default)
    RETURN user_role;
END;
$function$;