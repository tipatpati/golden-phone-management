-- Fix database function security issues
-- Set search_path for all custom functions to prevent SQL injection

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
BEGIN
    SELECT role INTO user_role
    FROM profiles 
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'salesperson'::app_role);
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add security headers function
CREATE OR REPLACE FUNCTION add_security_headers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log data access for security monitoring
    INSERT INTO security_audit_log (event_type, event_data, user_id)
    VALUES (
        'data_access',
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', now()
        ),
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update auth configuration for better security
UPDATE auth.config SET
    password_min_length = 12,
    password_require_special = true,
    password_require_numbers = true,
    password_require_uppercase = true,
    password_require_lowercase = true
WHERE TRUE;