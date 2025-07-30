-- Clean up duplicate admin accounts for 'imad'
-- First, identify and remove duplicate user_roles entries
WITH duplicate_roles AS (
  SELECT ur.id, 
         ROW_NUMBER() OVER (PARTITION BY ur.user_id, ur.role ORDER BY ur.created_at) as rn
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE p.username = 'imad' AND ur.role = 'admin'
)
DELETE FROM public.user_roles 
WHERE id IN (
  SELECT id FROM duplicate_roles WHERE rn > 1
);

-- Log the cleanup action
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_data
) VALUES (
  NULL,
  'admin_cleanup',
  jsonb_build_object(
    'action', 'removed_duplicate_admin_roles',
    'username', 'imad',
    'timestamp', now()
  )
);