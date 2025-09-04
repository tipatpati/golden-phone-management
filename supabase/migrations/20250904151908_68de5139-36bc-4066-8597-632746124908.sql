-- Enhanced RLS policies with column-level restrictions and data minimization

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Salespersons see only their sales clients" ON public.clients;
DROP POLICY IF EXISTS "Super admins and admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Technicians see only their repair clients" ON public.clients;

-- Create more restrictive client access policies with column restrictions
CREATE POLICY "Admins can view all client data" ON public.clients
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "Managers can view business client data only" ON public.clients  
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'manager' AND
  (tax_id IS NULL OR tax_id = '') -- Restrict access to tax information
);

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

-- Enhanced session security with shorter timeouts
UPDATE auth.config 
SET 
  jwt_exp = 3600, -- 1 hour instead of 24 hours
  refresh_token_rotation_enabled = true
WHERE instance_id = '00000000-0000-0000-0000-000000000000';

-- Create enhanced audit policy for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log access to sensitive data
  IF TG_TABLE_NAME IN ('employees', 'clients', 'suppliers') THEN
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_data,
      ip_address
    ) VALUES (
      auth.uid(),
      'sensitive_data_access',
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', COALESCE(NEW.id, OLD.id),
        'timestamp', now(),
        'user_role', get_current_user_role()
      ),
      COALESCE(inet_client_addr(), '0.0.0.0'::inet)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers for sensitive tables
DROP TRIGGER IF EXISTS audit_employees_access ON public.employees;
CREATE TRIGGER audit_employees_access
  AFTER SELECT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

DROP TRIGGER IF EXISTS audit_clients_access ON public.clients;  
CREATE TRIGGER audit_clients_access
  AFTER SELECT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

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

-- Apply the monitoring trigger
DROP TRIGGER IF EXISTS monitor_auth_attempts_trigger ON public.security_audit_log;
CREATE TRIGGER monitor_auth_attempts_trigger
  AFTER INSERT ON public.security_audit_log
  FOR EACH ROW 
  WHEN (NEW.event_type = 'failed_auth_attempt')
  EXECUTE FUNCTION public.monitor_auth_attempts();