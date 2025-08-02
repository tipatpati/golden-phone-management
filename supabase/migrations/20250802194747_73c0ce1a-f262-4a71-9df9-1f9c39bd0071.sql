-- Fix the user role issue for the current user
-- This user exists in profiles but not in user_roles table
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  p.id,
  p.role,
  p.id -- self-assigned for existing users
FROM public.profiles p
WHERE p.id = 'cd301924-accd-45c1-aeb5-72f62729effb'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id 
  AND ur.role = p.role
);