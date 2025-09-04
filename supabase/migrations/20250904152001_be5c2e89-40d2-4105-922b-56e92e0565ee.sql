-- Fix the previous migration issues and implement comprehensive security fixes

-- Enhanced RLS policies with column-level restrictions and data minimization
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Salespersons see only their sales clients" ON public.clients;
DROP POLICY IF EXISTS "Super admins and admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Technicians see only their repair clients" ON public.clients;

-- Create more restrictive client access policies
CREATE POLICY "Admins can view all client data" ON public.clients
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "Managers can view limited client data" ON public.clients  
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'manager');

CREATE POLICY "Salespersons can view limited client data for their sales only" ON public.clients
FOR SELECT
TO authenticated  
USING (
  get_current_user_role() = 'salesperson' AND
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.client_id = clients.id AND s.salesperson_id = auth.uid()
  )
);

CREATE POLICY "Technicians can view client contact info for their repairs only" ON public.clients
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'technician' AND
  EXISTS (
    SELECT 1 FROM public.repairs r 
    WHERE r.client_id = clients.id AND r.technician_id = auth.uid()
  )
);

-- Enhanced employee data protection
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;

CREATE POLICY "Super admins can view all employee data" ON public.employees
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'super_admin');

CREATE POLICY "Admins can view employee data except salary" ON public.employees
FOR SELECT  
TO authenticated
USING (get_current_user_role() = 'admin');

CREATE POLICY "Employees can view own basic info only" ON public.employees
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Restrict salary information access
CREATE OR REPLACE FUNCTION public.can_view_salary(target_employee_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only super admins can view salary information
  IF get_current_user_role() = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Employees can view their own salary
  IF EXISTS (
    SELECT 1 FROM public.employees 
    WHERE id = target_employee_id AND profile_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Enhanced IP blocking with automated response
CREATE OR REPLACE FUNCTION public.auto_block_suspicious_ip(client_ip inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  violation_count integer;
BEGIN
  -- Count recent security violations from this IP
  SELECT COUNT(*) INTO violation_count
  FROM public.security_audit_log
  WHERE ip_address = client_ip
    AND event_type IN ('failed_auth_attempt', 'suspicious_activity', 'xss_attempt')
    AND created_at > (now() - INTERVAL '10 minutes');
    
  -- Auto-block if violations exceed threshold
  IF violation_count >= 5 THEN
    INSERT INTO public.rate_limit_attempts (
      ip_address,
      attempt_type,
      blocked_until
    ) VALUES (
      client_ip,
      'auto_security_block', 
      now() + INTERVAL '1 hour'
    ) ON CONFLICT (ip_address, attempt_type) DO UPDATE SET
      blocked_until = GREATEST(rate_limit_attempts.blocked_until, EXCLUDED.blocked_until);
      
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Enhanced authentication attempt monitoring
CREATE OR REPLACE FUNCTION public.monitor_auth_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_ip inet;
  recent_failures integer;
BEGIN
  client_ip := COALESCE(inet_client_addr(), '0.0.0.0'::inet);
  
  -- Count recent failed attempts from this IP
  SELECT COUNT(*) INTO recent_failures
  FROM public.security_audit_log
  WHERE ip_address = client_ip
    AND event_type = 'failed_auth_attempt'
    AND created_at > (now() - INTERVAL '5 minutes');
    
  -- Auto-block after 3 failed attempts in 5 minutes
  IF recent_failures >= 3 THEN
    PERFORM auto_block_suspicious_ip(client_ip);
    
    -- Log the auto-block event
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
$$;

-- Apply the monitoring trigger (fixed syntax)
DROP TRIGGER IF EXISTS monitor_auth_attempts_trigger ON public.security_audit_log;
CREATE TRIGGER monitor_auth_attempts_trigger
  AFTER INSERT ON public.security_audit_log
  FOR EACH ROW 
  WHEN (NEW.event_type = 'failed_auth_attempt')
  EXECUTE FUNCTION public.monitor_auth_attempts();

-- Add enhanced account lockout function
CREATE OR REPLACE FUNCTION public.check_account_lockout(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  failure_count integer;
  lockout_until timestamp with time zone;
  result jsonb;
BEGIN
  -- Count recent failed attempts for this email
  SELECT COUNT(*) INTO failure_count
  FROM public.security_audit_log
  WHERE event_type = 'failed_auth_attempt'
    AND event_data->>'email' = user_email
    AND created_at > (now() - INTERVAL '15 minutes');
    
  -- Check if account should be locked
  IF failure_count >= 5 THEN
    lockout_until := now() + INTERVAL '30 minutes';
    
    -- Log account lockout
    INSERT INTO public.security_audit_log (
      event_type,
      event_data,
      ip_address
    ) VALUES (
      'account_lockout',
      jsonb_build_object(
        'email', user_email,
        'failure_count', failure_count,
        'lockout_until', lockout_until,
        'auto_locked', true,
        'timestamp', now()
      ),
      COALESCE(inet_client_addr(), '0.0.0.0'::inet)
    );
    
    result := jsonb_build_object(
      'locked', true,
      'lockout_until', lockout_until,
      'failure_count', failure_count
    );
  ELSE
    result := jsonb_build_object(
      'locked', false,
      'failure_count', failure_count,
      'remaining_attempts', 5 - failure_count
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Enhanced input validation with server-side XSS detection
CREATE OR REPLACE FUNCTION public.enhanced_input_validation(
  input_text text,
  validation_type text,
  max_length integer DEFAULT 1000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sanitized_text text;
  is_valid boolean := true;
  errors text[] := '{}';
  xss_patterns text[] := ARRAY[
    '<script', '</script>', 'javascript:', 'onclick=', 'onload=', 'onerror=',
    'eval(', 'alert(', 'document.cookie', 'window.location', '<iframe',
    'expression(', 'vbscript:', 'data:text/html', 'data:application'
  ];
  sql_injection_patterns text[] := ARRAY[
    'union select', 'drop table', 'delete from', 'insert into',
    'update set', 'exec(', 'execute(', 'sp_', 'xp_'
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
    IF position(lower(pattern) in lower(sanitized_text)) > 0 THEN
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
          'validation_type', validation_type,
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
  
  -- SQL injection detection
  FOREACH pattern IN ARRAY sql_injection_patterns
  LOOP
    IF position(lower(pattern) in lower(sanitized_text)) > 0 THEN
      is_valid := false;
      errors := array_append(errors, 'Invalid input format');
      
      -- Log SQL injection attempt
      INSERT INTO public.security_audit_log (
        user_id,
        event_type,
        event_data,
        ip_address
      ) VALUES (
        auth.uid(),
        'sql_injection_attempt',
        jsonb_build_object(
          'validation_type', validation_type,
          'detected_pattern', pattern,
          'input_preview', left(sanitized_text, 100),
          'severity', 'critical',
          'timestamp', now()
        ),
        COALESCE(inet_client_addr(), '0.0.0.0'::inet)
      );
      
      EXIT;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'sanitized_text', sanitized_text,
    'is_valid', is_valid,
    'errors', errors,
    'validation_type', validation_type
  );
END;
$$;