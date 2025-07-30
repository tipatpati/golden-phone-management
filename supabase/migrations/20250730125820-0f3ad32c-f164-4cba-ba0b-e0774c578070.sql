-- Enhanced security configuration for authentication
-- Reduce OTP expiry and add security constraints

-- Update auth settings for better security
UPDATE auth.config SET 
  password_min_length = 8,
  password_requirements = 'letters,numbers,symbols',
  verification_token_lifetime = 600; -- 10 minutes

-- Create enhanced security audit triggers
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
      'timestamp', now()
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add security triggers to sensitive tables
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

CREATE TRIGGER audit_profiles_role_changes
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operations();

-- Enhanced function for checking failed authentication attempts
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

-- Function to block suspicious IPs
CREATE OR REPLACE FUNCTION public.is_ip_blocked(client_ip inet)
RETURNS boolean AS $$
DECLARE
  suspicious_count integer;
BEGIN
  SELECT COUNT(*) INTO suspicious_count
  FROM public.security_audit_log
  WHERE ip_address = client_ip
    AND event_type IN ('failed_auth_attempt', 'suspicious_activity')
    AND created_at > (now() - INTERVAL '1 hour');
    
  RETURN suspicious_count > 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policy for security audit log with IP filtering
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
CREATE POLICY "System can insert audit logs with validation" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (
  NOT public.is_ip_blocked(inet_client_addr())
);

-- Create index for better security log performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_performance 
ON public.security_audit_log (event_type, created_at, ip_address);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_events 
ON public.security_audit_log (user_id, event_type, created_at);

-- Add security check function for role changes
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role app_role;
  change_count integer;
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation trigger for role changes
CREATE TRIGGER validate_role_changes
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_change();