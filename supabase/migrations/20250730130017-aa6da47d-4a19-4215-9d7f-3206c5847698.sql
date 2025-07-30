-- Enhanced security database fixes (avoiding auth.config)
-- Create enhanced security audit triggers and policies

-- Enhanced function for checking failed authentication attempts with progressive blocking
CREATE OR REPLACE FUNCTION public.check_failed_auth_attempts(user_email text)
RETURNS integer AS $$
DECLARE
  failure_count integer;
BEGIN
  SELECT COUNT(*) INTO failure_count
  FROM public.security_audit_log
  WHERE event_type = 'failed_auth_attempt'
    AND event_data->>'email' = user_email
    AND created_at > (now() - INTERVAL '15 minutes');
    
  RETURN failure_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block suspicious IPs with enhanced detection
CREATE OR REPLACE FUNCTION public.is_ip_blocked(client_ip inet)
RETURNS boolean AS $$
DECLARE
  suspicious_count integer;
  recent_violations integer;
BEGIN
  -- Check for suspicious activities in the last hour
  SELECT COUNT(*) INTO suspicious_count
  FROM public.security_audit_log
  WHERE ip_address = client_ip
    AND event_type IN ('failed_auth_attempt', 'suspicious_activity')
    AND created_at > (now() - INTERVAL '1 hour');
  
  -- Check for security violations in the last 10 minutes
  SELECT COUNT(*) INTO recent_violations
  FROM public.security_audit_log
  WHERE ip_address = client_ip
    AND event_type = 'suspicious_activity'
    AND event_data->>'severity' = 'high'
    AND created_at > (now() - INTERVAL '10 minutes');
    
  RETURN suspicious_count > 10 OR recent_violations > 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policy for security audit log with IP filtering
DROP POLICY IF EXISTS "System can insert audit logs with validation" ON public.security_audit_log;
CREATE POLICY "System can insert audit logs with validation" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (
  NOT public.is_ip_blocked(COALESCE(inet_client_addr(), '0.0.0.0'::inet))
);

-- Create index for better security log performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_performance 
ON public.security_audit_log (event_type, created_at, ip_address);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_events 
ON public.security_audit_log (user_id, event_type, created_at);

-- Enhanced security check function for role changes
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
  change_count integer;
  admin_count integer;
BEGIN
  -- Get current user role
  SELECT get_current_user_role() INTO current_user_role;
  
  -- Only admins can change roles
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Only administrators can modify user roles';
  END IF;
  
  -- Check for suspicious role change patterns
  SELECT COUNT(*) INTO change_count
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type LIKE '%role%'
    AND created_at > (now() - INTERVAL '1 hour');
    
  IF change_count > 5 THEN
    RAISE EXCEPTION 'Too many role changes in the last hour. Please contact security.';
  END IF;
  
  -- Prevent creating too many admin accounts
  IF NEW.role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';
    
    IF admin_count >= 3 THEN
      RAISE EXCEPTION 'Maximum number of admin accounts reached. Please contact system administrator.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation trigger for role changes
DROP TRIGGER IF EXISTS validate_role_changes ON public.user_roles;
CREATE TRIGGER validate_role_changes
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_change();

-- Enhanced logging function for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all role changes, deletions, and sensitive updates
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_data,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP || '_' || TG_TABLE_NAME,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'old_data', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
      'new_data', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
      'timestamp', now(),
      'session_id', COALESCE(current_setting('request.jwt.claims', true)::json->>'session_id', 'unknown')
    ),
    COALESCE(inet_client_addr(), '0.0.0.0'::inet)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add security triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

DROP TRIGGER IF EXISTS audit_profiles_role_changes ON public.profiles;
CREATE TRIGGER audit_profiles_role_changes
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

-- Function to clean up old security logs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  -- Keep only last 90 days of logs
  DELETE FROM public.security_audit_log
  WHERE created_at < (now() - INTERVAL '90 days');
  
  -- Log cleanup activity
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_data
  ) VALUES (
    NULL,
    'security_log_cleanup',
    jsonb_build_object(
      'cleanup_date', now(),
      'retention_days', 90
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to detect concurrent sessions
CREATE OR REPLACE FUNCTION public.detect_concurrent_sessions(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  session_count integer;
BEGIN
  -- Count active sessions in the last 10 minutes
  SELECT COUNT(DISTINCT event_data->>'session_id') INTO session_count
  FROM public.security_audit_log
  WHERE user_id = user_uuid
    AND event_type = 'session_activity'
    AND event_data->>'activity' = 'login'
    AND created_at > (now() - INTERVAL '10 minutes');
    
  RETURN session_count > 2; -- Allow max 2 concurrent sessions
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;