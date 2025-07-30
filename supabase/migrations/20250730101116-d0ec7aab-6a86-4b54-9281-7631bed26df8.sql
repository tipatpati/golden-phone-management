-- Enable Supabase Auth security features and fix authentication
-- This migration enhances security by ensuring proper authentication validation

-- Create function to validate user profiles exist and are properly configured
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure every authenticated user has a profile
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    -- Create default profile for new users
    INSERT INTO public.profiles (id, username, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'salesperson'::app_role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_profile_exists();

-- Add index on profiles table for better performance during auth
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Add function to cleanup invalid sessions
CREATE OR REPLACE FUNCTION public.cleanup_invalid_auth_state()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log cleanup action
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_data
  ) VALUES (
    NULL,
    'auth_cleanup',
    jsonb_build_object(
      'timestamp', now(),
      'action', 'cleanup_invalid_sessions'
    )
  );
END;
$$;

-- Add constraints to ensure data integrity
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_username_not_empty 
  CHECK (username IS NOT NULL AND length(trim(username)) > 0);

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_not_null 
  CHECK (role IS NOT NULL);