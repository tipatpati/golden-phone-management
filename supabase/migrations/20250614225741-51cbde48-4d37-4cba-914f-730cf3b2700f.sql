
-- First, let's ensure we have proper constraints and relationships for the employee-profile linking
-- Add a unique constraint to ensure one employee per profile
ALTER TABLE public.employees 
ADD CONSTRAINT employees_profile_id_unique UNIQUE (profile_id);

-- Update the handle_new_user function to better handle admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'salesperson'::public.app_role)
  );
  RETURN NEW;
END;
$$;

-- Create a trigger for the handle_new_user function if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Add RLS policies for employee-profile relationships
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all employees
CREATE POLICY "Admins can manage all employees" ON public.employees
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Policy for employees to view their own record
CREATE POLICY "Employees can view own record" ON public.employees
  FOR SELECT USING (profile_id = auth.uid());
