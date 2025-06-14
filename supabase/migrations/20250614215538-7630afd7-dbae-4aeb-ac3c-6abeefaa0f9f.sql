
-- Create a table for employee management with additional fields
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary NUMERIC(10,2),
  department TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for employee management
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Only admins can view all employees
CREATE POLICY "Admins can view all employees" ON public.employees
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Only admins can insert employees
CREATE POLICY "Admins can create employees" ON public.employees
  FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');

-- Only admins can update employees
CREATE POLICY "Admins can update employees" ON public.employees
  FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- Only admins can delete employees
CREATE POLICY "Admins can delete employees" ON public.employees
  FOR DELETE USING (public.get_current_user_role() = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
