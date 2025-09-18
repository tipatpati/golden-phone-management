-- Revert overly broad condition update and apply targeted fix

-- 1. Revert the bulk update by restoring original conditions where appropriate
-- We'll be more conservative and only ensure new acquisitions default to 'new'
UPDATE public.product_units 
SET condition = 'used', updated_at = now()
WHERE condition = 'new' 
  AND supplier_id IS NOT NULL 
  AND purchase_date < '2024-12-01'  -- Revert older units that were likely legitimately used
  AND created_at < '2024-12-01';

-- 2. Keep the default as 'new' for future units (this part was correct)
-- Already done in previous migration

-- 3. Log the revert
INSERT INTO public.security_audit_log (
  event_type,
  event_data
) VALUES (
  'product_condition_revert',
  jsonb_build_object(
    'reason', 'revert_overly_broad_update',
    'reverted_units_before', '2024-12-01',
    'timestamp', now()
  )
);