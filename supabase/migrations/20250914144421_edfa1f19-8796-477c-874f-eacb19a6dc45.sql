-- Create employee records for existing users (excluding admin/super_admin)
-- and improve data structure for employee-user consistency

-- First, make profile_id NOT NULL and add proper constraints
ALTER TABLE public.employees 
ALTER COLUMN profile_id SET NOT NULL;

-- Add unique constraint to ensure one employee per user
ALTER TABLE public.employees 
ADD CONSTRAINT employees_profile_id_unique UNIQUE (profile_id);

-- Create employee records for existing users (excluding admin/super_admin roles)
INSERT INTO public.employees (
  profile_id,
  first_name,
  last_name,
  email,
  phone,
  department,
  position,
  hire_date,
  status
)
SELECT 
  p.id,
  COALESCE(SPLIT_PART(p.username, '.', 1), 'First'),
  COALESCE(SPLIT_PART(p.username, '.', 2), 'Last'),
  au.email,
  NULL, -- default phone
  CASE 
    WHEN ur.role = 'inventory_manager' THEN 'Inventario'
    WHEN ur.role = 'salesperson' THEN 'Vendite'
    WHEN ur.role = 'technician' THEN 'Riparazioni'
    WHEN ur.role = 'manager' THEN 'Amministrazione'
    ELSE 'Vendite'
  END,
  CASE 
    WHEN ur.role = 'inventory_manager' THEN 'Responsabile Inventario'
    WHEN ur.role = 'salesperson' THEN 'Venditore'
    WHEN ur.role = 'technician' THEN 'Tecnico Riparazioni'
    WHEN ur.role = 'manager' THEN 'Manager Vendite'
    ELSE 'Venditore'
  END,
  au.created_at::date, -- use account creation date as hire date
  'active'
FROM auth.users au
JOIN profiles p ON au.id = p.id
JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN employees e ON au.id = e.profile_id
WHERE e.id IS NULL -- only for users without employee records
  AND ur.role NOT IN ('admin', 'super_admin'); -- exclude admin/super_admin

-- Add a system_user flag to profiles to distinguish between employees and system users
ALTER TABLE public.profiles 
ADD COLUMN is_system_user BOOLEAN DEFAULT false;

-- Mark admin and super_admin as system users
UPDATE public.profiles 
SET is_system_user = true 
WHERE role IN ('admin', 'super_admin');

-- Create trigger to automatically create employee records for new non-system users
CREATE OR REPLACE FUNCTION public.auto_create_employee_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create employee record for non-system users
  IF NEW.role NOT IN ('admin', 'super_admin') AND NOT NEW.is_system_user THEN
    INSERT INTO public.employees (
      profile_id,
      first_name,
      last_name,
      email,
      department,
      position,
      hire_date,
      status
    ) VALUES (
      NEW.id,
      COALESCE(SPLIT_PART(NEW.username, '.', 1), 'First'),
      COALESCE(SPLIT_PART(NEW.username, '.', 2), 'Last'),
      (SELECT email FROM auth.users WHERE id = NEW.id),
      CASE 
        WHEN NEW.role = 'inventory_manager' THEN 'Inventario'
        WHEN NEW.role = 'salesperson' THEN 'Vendite'
        WHEN NEW.role = 'technician' THEN 'Riparazioni'
        WHEN NEW.role = 'manager' THEN 'Amministrazione'
        ELSE 'Vendite'
      END,
      CASE 
        WHEN NEW.role = 'inventory_manager' THEN 'Responsabile Inventario'
        WHEN NEW.role = 'salesperson' THEN 'Venditore'
        WHEN NEW.role = 'technician' THEN 'Tecnico Riparazioni'
        WHEN NEW.role = 'manager' THEN 'Manager Vendite'
        ELSE 'Venditore'
      END,
      CURRENT_DATE,
      'active'
    ) ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile inserts
CREATE TRIGGER trigger_auto_create_employee
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_employee_record();

-- Create trigger for profile updates (role changes)
CREATE TRIGGER trigger_auto_create_employee_on_role_change
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.auto_create_employee_record();