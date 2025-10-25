-- Fix search_path warnings by updating remaining functions
-- These functions are missing the SET search_path = public directive

-- Update can_view_salary function
CREATE OR REPLACE FUNCTION public.can_view_salary(target_employee_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF get_current_user_role() = 'super_admin' THEN
    RETURN true;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = target_employee_id AND profile_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Update log_purchase_price_access_attempt function
CREATE OR REPLACE FUNCTION public.log_purchase_price_access_attempt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT can_view_purchase_price() THEN
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_data,
      ip_address
    ) VALUES (
      auth.uid(),
      'unauthorized_purchase_price_access',
      jsonb_build_object(
        'user_role', get_current_user_role(),
        'timestamp', now(),
        'severity', 'medium'
      ),
      COALESCE(inet_client_addr(), '0.0.0.0'::inet)
    );
  END IF;
END;
$function$;

-- Update monitor_auth_attempts function
CREATE OR REPLACE FUNCTION public.monitor_auth_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  client_ip inet;
  recent_failures integer;
BEGIN
  client_ip := COALESCE(inet_client_addr(), '0.0.0.0'::inet);
  
  SELECT COUNT(*) INTO recent_failures
  FROM public.security_audit_log
  WHERE ip_address = client_ip
    AND event_type = 'failed_auth_attempt'
    AND created_at > (now() - INTERVAL '5 minutes');
    
  IF recent_failures >= 3 THEN
    PERFORM auto_block_suspicious_ip(client_ip);
    
    INSERT INTO public.security_audit_log (
      event_type,
      event_data,
      ip_address
    ) VALUES (
      'auto_ip_block',
      jsonb_build_object(
        'reason', 'excessive_failed_auth',
        'failure_count', recent_failures,
        'block_duration', '1 hour',
        'timestamp', now()
      ),
      client_ip
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Move pg_trgm extension from public to extensions schema (if it exists)
-- This fixes the "Extension in Public" warning
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    CREATE SCHEMA IF NOT EXISTS extensions;
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;