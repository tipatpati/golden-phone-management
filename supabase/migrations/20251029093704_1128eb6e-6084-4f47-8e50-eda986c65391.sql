-- Assign super_admin role to current authenticated user
-- This enables the store selector dropdown for multi-store management

INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'super_admin'::app_role
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;