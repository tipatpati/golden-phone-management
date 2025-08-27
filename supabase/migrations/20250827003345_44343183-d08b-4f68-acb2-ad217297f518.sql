-- PHASE 1: CRITICAL DATA PROTECTION - Fix public data exposure
-- Remove public access from brands, models, and categories tables

-- Drop existing permissive policies on brands
DROP POLICY IF EXISTS "Brands are viewable by everyone" ON public.brands;

-- Create secure policy for brands - require authentication
CREATE POLICY "Authenticated users can view brands" 
ON public.brands 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

-- Drop existing permissive policies on models  
DROP POLICY IF EXISTS "Models are viewable by everyone" ON public.models;

-- Create secure policy for models - require authentication
CREATE POLICY "Authenticated users can view models" 
ON public.models 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

-- Drop existing permissive policies on categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

-- Create secure policy for categories - require authentication  
CREATE POLICY "Authenticated users can view categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

-- PHASE 2: ROLE SECURITY - Add server-side role validation and audit logging
-- Create enhanced role change validation function
CREATE OR REPLACE FUNCTION public.validate_role_change_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role app_role;
  change_count integer;
  admin_count integer;
  is_self_modification boolean;
BEGIN
  -- Allow system migrations to bypass validation
  IF current_setting('session_replication_role', true) = 'replica' THEN
    RETURN NEW;
  END IF;
  
  -- Allow if no current user (system operation)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user is trying to modify their own role
  is_self_modification := (NEW.user_id = auth.uid());
  
  -- Prevent users from modifying their own roles
  IF is_self_modification AND TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'Security violation: Users cannot modify their own role assignments';
  END IF;
  
  -- Get current user role
  SELECT get_current_user_role() INTO current_user_role;
  
  -- Only admins can change roles
  IF current_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Only administrators can modify user roles';
  END IF;
  
  -- Only super_admin can assign super_admin role
  IF NEW.role = 'super_admin' AND current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only super administrators can assign super admin role';
  END IF;
  
  -- Rate limiting: Check for too many role changes
  SELECT COUNT(*) INTO change_count
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type LIKE '%role%'
    AND created_at > (now() - INTERVAL '1 hour');
    
  IF change_count > 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many role changes in the last hour';
  END IF;
  
  -- Prevent creating too many admin accounts
  IF NEW.role = 'admin' AND TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    IF admin_count >= 5 THEN
      RAISE EXCEPTION 'Security limit: Maximum number of admin accounts reached';
    END IF;
  END IF;
  
  -- Log the role change with enhanced details
  INSERT INTO public.security_audit_log (
    user_id, 
    event_type, 
    event_data,
    ip_address
  ) VALUES (
    auth.uid(),
    'enhanced_role_change',
    jsonb_build_object(
      'target_user_id', NEW.user_id,
      'old_role', CASE WHEN TG_OP = 'UPDATE' THEN OLD.role ELSE NULL END,
      'new_role', NEW.role,
      'operation', TG_OP,
      'is_self_modification', is_self_modification,
      'admin_role', current_user_role,
      'timestamp', now()
    ),
    COALESCE(inet_client_addr(), '0.0.0.0'::inet)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for enhanced role validation
DROP TRIGGER IF EXISTS validate_role_change_enhanced_trigger ON public.user_roles;
CREATE TRIGGER validate_role_change_enhanced_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change_enhanced();

-- PHASE 3: SESSION SECURITY - Enhanced session monitoring
-- Create function to detect suspicious session activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_session_activity(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  concurrent_sessions integer;
  rapid_logins integer;
  different_ips integer;
BEGIN
  -- Check for too many concurrent sessions
  SELECT COUNT(DISTINCT event_data->>'session_id') INTO concurrent_sessions
  FROM public.security_audit_log
  WHERE user_id = target_user_id
    AND event_type = 'session_activity'
    AND event_data->>'activity' = 'login'
    AND created_at > (now() - INTERVAL '10 minutes');
    
  -- Check for rapid successive logins
  SELECT COUNT(*) INTO rapid_logins
  FROM public.security_audit_log
  WHERE user_id = target_user_id
    AND event_type = 'session_activity'
    AND event_data->>'activity' = 'login'
    AND created_at > (now() - INTERVAL '5 minutes');
    
  -- Check for logins from different IP addresses
  SELECT COUNT(DISTINCT ip_address) INTO different_ips
  FROM public.security_audit_log
  WHERE user_id = target_user_id
    AND event_type = 'session_activity'
    AND created_at > (now() - INTERVAL '30 minutes');
    
  -- Flag as suspicious if any threshold is exceeded
  IF concurrent_sessions > 3 OR rapid_logins > 5 OR different_ips > 3 THEN
    -- Log suspicious activity
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_data,
      ip_address
    ) VALUES (
      target_user_id,
      'suspicious_session_activity',
      jsonb_build_object(
        'concurrent_sessions', concurrent_sessions,
        'rapid_logins', rapid_logins,
        'different_ips', different_ips,
        'severity', 'high',
        'auto_detected', true,
        'timestamp', now()
      ),
      COALESCE(inet_client_addr(), '0.0.0.0'::inet)
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- PHASE 4: INPUT VALIDATION - Create server-side validation functions
-- Enhanced input sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_and_validate_input(
  input_text text,
  input_type text,
  max_length integer DEFAULT 255
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sanitized_text text;
  is_valid boolean := true;
  errors text[] := '{}';
  xss_patterns text[] := ARRAY[
    '<script', '</script>', 'javascript:', 'onclick=', 'onload=', 'onerror=',
    'eval(', 'alert(', 'document.cookie', 'window.location', '<iframe'
  ];
  pattern text;
BEGIN
  -- Basic sanitization
  sanitized_text := trim(input_text);
  
  -- Length validation
  IF length(sanitized_text) > max_length THEN
    is_valid := false;
    errors := array_append(errors, format('Input exceeds maximum length of %s characters', max_length));
  END IF;
  
  -- XSS detection
  FOREACH pattern IN ARRAY xss_patterns
  LOOP
    IF lower(sanitized_text) LIKE '%' || lower(pattern) || '%' THEN
      is_valid := false;
      errors := array_append(errors, 'Potentially malicious content detected');
      
      -- Log XSS attempt
      INSERT INTO public.security_audit_log (
        user_id,
        event_type,
        event_data,
        ip_address
      ) VALUES (
        auth.uid(),
        'xss_attempt',
        jsonb_build_object(
          'input_type', input_type,
          'detected_pattern', pattern,
          'input_preview', left(sanitized_text, 100),
          'severity', 'high',
          'timestamp', now()
        ),
        COALESCE(inet_client_addr(), '0.0.0.0'::inet)
      );
      
      EXIT; -- Stop checking once XSS is detected
    END IF;
  END LOOP;
  
  -- Type-specific validation
  CASE input_type
    WHEN 'email' THEN
      IF NOT sanitized_text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        is_valid := false;
        errors := array_append(errors, 'Invalid email format');
      END IF;
    WHEN 'phone' THEN
      IF NOT sanitized_text ~* '^\+?[1-9]\d{1,14}$' THEN
        is_valid := false;
        errors := array_append(errors, 'Invalid phone number format');
      END IF;
    WHEN 'alphanumeric' THEN
      IF NOT sanitized_text ~* '^[A-Za-z0-9\s]+$' THEN
        is_valid := false;
        errors := array_append(errors, 'Only alphanumeric characters and spaces allowed');
      END IF;
  END CASE;
  
  RETURN jsonb_build_object(
    'sanitized_text', sanitized_text,
    'is_valid', is_valid,
    'errors', errors
  );
END;
$function$;

-- Create rate limiting table for failed attempts
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  user_email text,
  attempt_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone
);

-- Enable RLS on rate limiting table
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limiting table
CREATE POLICY "System can manage rate limit attempts"
ON public.rate_limit_attempts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_type_created 
ON public.rate_limit_attempts (ip_address, attempt_type, created_at);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  client_ip inet,
  attempt_type text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count integer;
  is_blocked boolean := false;
  blocked_until_time timestamp with time zone;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (window_minutes || ' minutes')::interval;
  
  -- Clean up old attempts
  DELETE FROM public.rate_limit_attempts 
  WHERE created_at < window_start AND blocked_until < now();
  
  -- Check current attempts in window
  SELECT COUNT(*) INTO attempt_count
  FROM public.rate_limit_attempts
  WHERE ip_address = client_ip
    AND attempt_type = check_rate_limit.attempt_type
    AND created_at > window_start;
  
  -- Check if IP is currently blocked
  SELECT blocked_until INTO blocked_until_time
  FROM public.rate_limit_attempts
  WHERE ip_address = client_ip
    AND attempt_type = check_rate_limit.attempt_type
    AND blocked_until > now()
  ORDER BY blocked_until DESC
  LIMIT 1;
  
  IF blocked_until_time IS NOT NULL THEN
    is_blocked := true;
  ELSIF attempt_count >= max_attempts THEN
    is_blocked := true;
    blocked_until_time := now() + (window_minutes * 2 || ' minutes')::interval;
    
    -- Insert block record
    INSERT INTO public.rate_limit_attempts (
      ip_address, 
      attempt_type, 
      blocked_until
    ) VALUES (
      client_ip, 
      check_rate_limit.attempt_type, 
      blocked_until_time
    );
    
    -- Log rate limit exceeded
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_data,
      ip_address
    ) VALUES (
      NULL,
      'rate_limit_exceeded',
      jsonb_build_object(
        'attempt_type', check_rate_limit.attempt_type,
        'attempt_count', attempt_count,
        'max_attempts', max_attempts,
        'blocked_until', blocked_until_time,
        'severity', 'medium'
      ),
      client_ip
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', NOT is_blocked,
    'attempts_remaining', GREATEST(0, max_attempts - attempt_count),
    'blocked_until', blocked_until_time,
    'window_minutes', window_minutes
  );
END;
$function$;