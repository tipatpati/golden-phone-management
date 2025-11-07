-- Disable automatic employee record creation trigger
-- The employee record will be created explicitly by the application with proper store_id

DROP TRIGGER IF EXISTS trigger_auto_create_employee ON public.profiles;
DROP TRIGGER IF EXISTS trigger_auto_create_employee_on_role_change ON public.profiles;

-- Keep the function for potential future use but don't trigger it automatically
COMMENT ON FUNCTION public.auto_create_employee_record() IS 
  'Disabled: Employee records are now created explicitly by the application to ensure proper store_id assignment';