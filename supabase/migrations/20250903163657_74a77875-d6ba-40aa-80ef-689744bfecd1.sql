-- Fix the security definer view issue by removing it and using proper RLS policies instead
DROP VIEW IF EXISTS public.clients_basic;

-- Remove the view grant
-- REVOKE SELECT ON public.clients_basic FROM authenticated; -- No longer needed

-- The RLS policies are already in place and will handle the data access restrictions properly
-- No additional changes needed - the existing policies will enforce role-based access