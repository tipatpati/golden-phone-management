-- Fix missing user role for this specific user
INSERT INTO public.user_roles (user_id, role)
VALUES ('cd301924-accd-45c1-aeb5-72f62729effb', 'salesperson'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;