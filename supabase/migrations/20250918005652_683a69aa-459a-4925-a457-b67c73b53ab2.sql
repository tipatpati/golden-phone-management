-- Fix product condition bug: Change default from 'used' to 'new' and correct existing data

-- 1. Update the default value for condition column to 'new'
ALTER TABLE public.product_units 
ALTER COLUMN condition SET DEFAULT 'new';

-- 2. Update existing units from supplier transactions to 'new' condition
-- This is a safer approach - update all units that came from suppliers to 'new'
UPDATE public.product_units 
SET condition = 'new', updated_at = now()
WHERE condition = 'used' 
  AND supplier_id IS NOT NULL 
  AND purchase_date >= '2024-01-01';

-- 3. Log the change for audit
INSERT INTO public.security_audit_log (
  event_type,
  event_data
) VALUES (
  'product_condition_bulk_update',
  jsonb_build_object(
    'reason', 'fix_condition_bug',
    'changed_from', 'used',
    'changed_to', 'new',
    'timestamp', now()
  )
);