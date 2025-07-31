-- Permanently set benbekhtiamir@gmail.com as super_admin
UPDATE public.profiles 
SET role = 'super_admin'::app_role 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'benbekhtiamir@gmail.com'
);

-- Also update the user_roles table
UPDATE public.user_roles 
SET role = 'super_admin'::app_role 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'benbekhtiamir@gmail.com'
);

-- Log this permanent role assignment
INSERT INTO public.security_audit_log (
  user_id, 
  event_type, 
  event_data
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'benbekhtiamir@gmail.com'),
  'permanent_super_admin_assignment',
  jsonb_build_object(
    'email', 'benbekhtiamir@gmail.com',
    'assigned_role', 'super_admin',
    'assignment_type', 'permanent',
    'timestamp', now()
  )
);