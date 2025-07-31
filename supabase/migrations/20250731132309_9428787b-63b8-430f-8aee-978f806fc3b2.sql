-- Remove the battery_level column from products table as it's no longer needed
ALTER TABLE public.products DROP COLUMN IF EXISTS battery_level;

-- Log the column removal
INSERT INTO public.security_audit_log (
  event_type, 
  event_data
) VALUES (
  'schema_change',
  jsonb_build_object(
    'action', 'removed_battery_level_column',
    'table', 'products',
    'timestamp', now(),
    'description', 'Removed battery_level column from products table as per user request'
  )
);